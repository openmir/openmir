// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

    // Create the defaults once
    var pluginName = 'spectrogramPlugin',
        defaults = {
            lowHz : 0,
            highHz : 8000,
            spectrogramLengthSec : 5,
            startSec : 0,
            endSec : 20,
            windowWidthPx : 950,
            windowHeightPx : 200,
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        // Raphael paper element
        this._paper = null;

        // UI elements
        this._slider = null;
        this._spectrogram = null;

        this._mousedown = false;
        

        // Arrays of data
        this._clips = [];
        this.init();
    }

    Plugin.prototype = {

        init: function() {
            var that = this;
            this.update();
            
            // TODO(sness) - This is to update the recordingApp
            // RecordingModel with the visible startSec and
            // endSec. The name of this event should probably now be
            // changed to extents.change
            $(that.element).trigger('scrollEvent', [that.options.startSec, that.options.endSec]);

            this._dragRectFill = {stroke : 'none', fill: '#337', 'fill-opacity': 0.3};

            this.$element = $(this.element);

            this.$element.append('<div class="yaxis"></div>');
            this.$element.append('<div class="graph"></div>');

            this.$yaxis = this.$element.find(".yaxis");
			this._yaxisPaper = Raphael(this.$yaxis[0], 50, 220);

            this.$graph = this.$element.find(".graph");
            this.$graph.css('overflow', 'auto');
            // this.$graph.css('overflow-y', 'hidden');
			this._paper = Raphael(this.$graph[0], this.options.recordingWidthPx, 220);
            window._paper = this._paper;

            this.buildSpectrogramArray();

            // this.$element.css('overflow', 'auto');
            // this.$element.css('overflow-y', 'hidden');
            // this.$element.scrollLeft(this.options.scrollLeftPx);
			// this._paper = Raphael(this.element, this.options.recordingWidthPx, 220);

            // Redraw the element on scroll
            this.$graph.scroll($.throttle( 500, function() {
                that.options.scrollLeftPx = that.$graph.scrollLeft();
                that.options.startSec = that.options.windowSecPerPx * that.options.scrollLeftPx;
                that.options.endSec = that.options.startSec + that.options.windowLengthSec;
                that.draw();
                // $(that.element).trigger('scrollEvent', [that.options.startSec, that.options.endSec]);
            }));

            // Send scroll events to other elements
            this.$graph.scroll($.throttle( 5, function() {
                if (that._mousedown) {
                    that.options.scrollLeftPx = that.$graph.scrollLeft();
                    that.options.startSec = that.options.windowSecPerPx * that.options.scrollLeftPx;
                    that.options.endSec = that.options.startSec + that.options.windowLengthSec;
                    $(that.element).trigger('scrollEvent', [that.options.startSec, that.options.endSec]);
                }
            }));


            $(this.element).on('recording:currentTimeSec', function(event, currentTimeSec) {
                that.options.currentSec = currentTimeSec;
                that.drawSlider();
            });

            $(this.element).on('extents:change', function(event, n) {
                if (that._mousedown == false) {
                    that.options.startSec = n.startSec;
                    that.options.endSec = n.endSec;
                    that.update();
                    that.$graph.scrollLeft(that.options.scrollLeftPx);
                }
            });

            $(this.element).on('winSize:change', function(event, winSize) {
                that.options.winSize = winSize;
                that.draw();
            });

            $(this.element).on('clips:load', function(event, clips) {
                that.buildClips(clips);
                that.clear();
                that.draw();
            });

            $(this.element).on('predictions:load', function(event, predictionFilename) {
                that._predictionFilename = predictionFilename;
                that.buildPredictions();
            });

            $(this.element).on('catalogClip:update', function(event, catalogClip) {
                var activeClip = _.findWhere(that._clips, {'active' : true});
                if (activeClip) {
                    activeClip.name = catalogClip.name;
                    activeClip.catalogClip = catalogClip.id;
                    that.drawClip(that,activeClip);
                    that.saveClips();
                    return;
                }
                // If we are currently dragging a selection window,
                // make a clip from the current selection extents.
                if (that._dragRect) {
                    var clip = {
                        startSec : that.options.draggerStartSec,
                        endSec : that.options.draggerEndSec,
                        lowHz : 0,
                        highHz : 22050,
                        name : catalogClip.name,
                        catalogClip : catalogClip.id
                    }
                    that._currentClip = clip;
                    that._currentClip.active = true;
                    that._clips.push(clip);
                    that.drawClip(that,that._currentClip);
                    that._dragRect.remove();
                    that._dragRect = false;
                    that.saveClips();
                    return;
                }
            });

            $(this.element).dblclick(function(e) {
                var x = e.offsetX;
                var y = e.offsetY;
                // var audioPosSec = ((that.options.lengthSec / (that.options.windowWidthPx)) * (x)) + that.options.startSec;
                // var audioPosSec = (that.options.lengthSec / (that.options.windowWidthPx)) * x;
                var audioPosSec = that.options.windowSecPerPx * x;
                $(that.element).trigger('seekSecEvent', [audioPosSec]);
                that.options.currentSec = audioPosSec;
                that.drawSlider();
            });

            $(this.element).on('mouseup', function(e) {
                that._clipAction = false;
                that._mousedown = false;
                // If a dragger stopped being dragged, save the clip
                // back to the backbone app.
                if (that._clipNeedsSaving) {
                    that.saveClips();
                }
                
                $(that.element).trigger('draggerEvent', {
                    'draggerStartSec' : that.options.draggerStartSec, 
                    'draggerEndSec' : that.options.draggerEndSec});

                that._dragging = false;

            });

            $(this.element).on('mousedown', function(e) {
                that._mousedown = true;
                if (that._currentClip && that._currentClip.active) {
                    that._currentClip.active = false
                    that.drawClip(that,that._currentClip);
                }

                // TODO(sness) - Hmm, this with the mousedown and
                // mousemove is getting complicated, there is probably
                // a better way to do it, now that we must have the
                // control key held down to make a selection.  (It
                // would be good also to figure out why we can't get a
                // click event when we make a new rect with Raphael,
                // but it would probably be best overall just to use
                // canvas.)
                if (!that._clipAction && e.ctrlKey) {
                    that._mousedragInitPx = e.offsetX;
                    that._mousedragInitSec = e.offsetX * that.options.windowSecPerPx;
                    that._dragging = true;
                }

                if (!e.ctrlKey) {
                    if (that._dragRect) {
                        that._dragRect.remove();
                    }
                    that._dragging = false;
                }

            });

            $(this.element).on('mousemove', function(e) {
                if (that._clipAction == 'leftDraggerMouseDown') {
                    var clip = that._currentClip;
                    var startSec = e.offsetX * that.options.windowSecPerPx;
                    clip.startSec = startSec;

                    if (clip.startSec > clip.endSec) {
                        clip.startSec = clip.endSec;
                    }
                    that.drawClip(that,clip);

                } else if (that._clipAction == 'rightDraggerMouseDown') {
                    var clip = that._currentClip;
                    var endSec = e.offsetX * that.options.windowSecPerPx;
                    clip.endSec = endSec;

                    if (clip.endSec < clip.startSec) {
                        clip.endSec = clip.startSec;
                    }

                    that.drawClip(that,clip);

                } else {
                    // If the mousebutton is down when doing a mousemove,
                    // then draw a selection rectangle.
                    if (e.which == 1 && that._dragging) {
                        // Deactivate current active clip if active.
                        if (that._currentClip) {
                            that._currentClip.active = false;
                            that.drawClip(that,that._currentClip);
                        }

                        // if (!that._mousedown) {
                        //     that._mousedragInitPx = e.offsetX;
                        //     that._mousedragInitSec = e.offsetX * that.options.windowSecPerPx;
                        //     that._mousedown = true;
                        // }
                        that._mousedragCurrPx = e.offsetX;
                        that._mousedragCurrSec = e.offsetX * that.options.windowSecPerPx;

                        // Calculate the start and end positions in
                        // seconds from the initial click and the
                        // current click of the user.
                        if (that._mousedragInitSec < that._mousedragCurrSec) {
                            that.options.draggerStartSec = that._mousedragInitSec;
                            that.options.draggerEndSec = that._mousedragCurrSec;
                        } else {
                            that.options.draggerStartSec = that._mousedragCurrSec;
                            that.options.draggerEndSec = that._mousedragInitSec;
                        }

                        var rectWidth = that._mousedragCurrPx - that._mousedragInitPx;

                        if (that._dragRect) {
                            that._dragRect.remove();
                        }

                        if (rectWidth > 0) {
                            that._dragRect = that._paper.rect(that._mousedragInitPx,0.5,rectWidth,199).attr(that._dragRectFill);
                        } else {
                            var rectWidth = that._mousedragInitPx - that._mousedragCurrPx;
                            that._dragRect = that._paper.rect(that._mousedragCurrPx,0.5,rectWidth,199).attr(that._dragRectFill);
                        }
                    }

                    if (e.which == 0) {
                        if (that._mousedown) {
                            that._mousedown = false;
                        }
                    }
                }
            });

            $(this.element).on('keypress', function(e) {
                $(that.element).trigger('keypressEvent', e.charCode);
            });

            this.draw();
            this.$graph.scrollLeft(this.options.scrollLeftPx);
        },

        update: function() {
            this.options.windowLengthSec = this.options.endSec - this.options.startSec;
            this.options.windowPxPerSec = this.options.windowWidthPx / this.options.windowLengthSec;
            this.options.windowSecPerPx = this.options.windowLengthSec / this.options.windowWidthPx;
            this.options.recordingWidthPx = this.options.windowPxPerSec * this.options.recordingLengthSec;
            this.options.spectrogramWidthPx = this.options.windowPxPerSec * this.options.spectrogramLengthSec;
            this.options.scrollLeftPx = this.options.startSec * this.options.windowPxPerSec;
            this.options.lengthSec = this.options.endSec - this.options.startSec;
            this.options.lengthHz = this.options.highHz - this.options.lowHz;
            this.options.pixelsPerSec = this.options.windowWidthPx / this.options.lengthSec;
            this.options.pixelsPerHz = this.options.windowHeightPx / this.options.lengthHz;
        },

        clear: function() {
            for (var i = 0; i < this._spectrograms.length; i++) {
                this._spectrograms[i].image = null;
            }

            for (var i = 0; i < this._clips.length; i++) {
                this._clips[i].drawn = null;
            }

            this._paper.clear();
            this._slider = null;
        },

        buildSpectrogramArray: function() {
            this._spectrograms = [];
            var currentStartSec = 0;
            var currentEndSec = currentStartSec + this.options.spectrogramLengthSec;
            
            while(currentEndSec <= this.options.recordingLengthSec) {
                var spectrogram = {
                    startSec : currentStartSec,
                    endSec : currentEndSec,
                    image : null
                }
                this._spectrograms.push(spectrogram);
                currentStartSec = currentEndSec;
                currentEndSec = currentEndSec + this.options.spectrogramLengthSec;
            }
        },

        buildClips: function(clips) {
            var that = this;
            this._clips = [];
            for (var i = 0; i < clips.length; i++) {
                var clip = clips[i];
                this.setOrigClipInfo(clip);
                this._clips.push(clip);
            };
        },

        buildPredictions: function() {
            if (!this._predictionFilename) {
                return;
            }

            // Load data from server for the predictions this prediction makes about this region
            var url = '/predictions/view?filename=' + this._predictionFilename;
            var that = this;

            this.options.predictions = [];
            this.clear();
            this.draw();

            $.ajax({
                url : url,
                dataType: 'json'
            }).done(function(predictions) { 
                that.options.predictions = predictions;
                that.draw();
            });
        },


        clipChanged: function(clip) {
            if ((clip.startSec == clip.origStartSec) &&
                (clip.endSec == clip.origEndSec) &&
                (clip.name == clip.origName)) {
                return false;
            } else {
                return true;
            }
        },

        setOrigClipInfo: function(clip) {
            clip.origStartSec = clip.startSec;
            clip.origEndSec = clip.endSec;
            clip.origName = clip.name;
        },

        draw: function() {
            this.update();
            this.drawSpectrograms();
            this.drawClips();
            this.drawPredictions();
            this.drawYAxis();
            this.drawSlider();
        },


        drawYAxis: function() {
            this._yaxisPaper.clear();
            var highHzStr = String(this.options.highHz.toFixed(0));
            var halfValueStr = String(((this.options.highHz + this.options.lowHz) / 2.0).toFixed(0));
            var lowHzStr = String((this.options.lowHz).toFixed(0));

            this._yaxisPaper.text(0,0,"Hertz").transform("t10 100r-90");

            this._yaxisPaper.text(42,10,highHzStr).attr({'text-anchor': 'end'});
            this._yaxisPaper.text(42,100,halfValueStr).attr({'text-anchor': 'end'});
            this._yaxisPaper.text(42,200,lowHzStr).attr({'text-anchor': 'end'});
            this._yaxisPaper.path("M49.5 10.5L49.5 200.5");
            this._yaxisPaper.path("M47.5 10.5L49.5 10.5");
            this._yaxisPaper.path("M47.5 100.5L49.5 100.5");
            this._yaxisPaper.path("M47.5 200.5L49.5 200.5");
        },

        drawSpectrograms: function() {
            var startIndex = Math.floor(this.options.startSec / this.options.spectrogramLengthSec);
            var endIndex = Math.floor(this.options.endSec / this.options.spectrogramLengthSec - 0.0001);

            for (var i = startIndex; i <= endIndex; i++) {
                if (this._spectrograms[i].image == null) {
                    this.drawSpectrogram(i);
                }
            }
        },

        drawSpectrogram: function(i) {
            var spectrogramUrl = this.options.spectrogramUrl
            var startSec = this._spectrograms[i].startSec;
            var endSec = this._spectrograms[i].endSec;
            var lowHz = this.options.lowHz;
            var highHz = this.options.highHz;
            var winSize = this.options.winSize;
            var contrast = '50';
            var spectrogramOptions = '?startSec=' + startSec + '&endSec=' + endSec + '&contrast=' + contrast;
            spectrogramOptions += '&spectrumtype=magnitude&width=500&height=200&lowHz=' + lowHz + '&highHz=' + highHz;
            spectrogramOptions += '&winSize=' + winSize;
            
            var url = spectrogramUrl + spectrogramOptions;
            var startPx = startSec * this.options.windowPxPerSec;
            this._spectrograms[i].image = this._paper.image(url,startPx,0,this.options.spectrogramWidthPx,this.options.windowHeightPx);

            // X-axis
            var label = startSec + 's';
            var a = this._paper.text(startPx,210.5  , label).attr({font: '12px Helvetica'});
            if (startSec == 0) {
                a.attr({'text-anchor': 'start'});
            }
            var a = this._paper.path('M' + startPx + ',200.5L' + startPx + ',205.5');
            var a = this._paper.path('M' + startPx + ',200.5L' + (startPx + this.options.spectrogramWidthPx) + ',200.5');

            // If we have loaded a spectrogram, redraw any clips that
            // we've drawn over.
            var that = this;
            for (var i = 0; i < that._clips.length; i++) {
                if (((that._clips[i].startSec > startSec) || (that._clips[i].endSec > startSec)) &&
                    ((that._clips[i].startSec < endSec) || (that._clips[i].endSec < endSec))) {
                    that._clips[i].drawn = null;
                }
            }

            if (that.options.predictions) {
                for (var i = 0; i < that.options.predictions.length; i++) {
                    if (((that.options.predictions[i].startSec >= startSec) || (that.options.predictions[i].endSec >= startSec)) &&
                        ((that.options.predictions[i].startSec <= endSec) || (that.options.predictions[i].endSec <= endSec))) {
                    that.options.predictions[i].drawn = null;
                    }
                }
            }

            // The slider gets hidden after new spectrograms are drawn
            this._slider = null;
        },
        
        drawSlider: function() {
            if (!this._slider) {
                this._slider = this._paper.path('M0.5,0.5L0.5,200.5').attr({stroke : '#00ff00'});
            }
            var startSec = this.options.startSec;
            var sliderPosition = Math.round((this.options.currentSec) * this.options.windowPxPerSec);
            if (this._slider) {
                this._slider.transform('t' + sliderPosition + ',0');
            }
        },

        drawClips: function() {
            var that = this;
            _.each(that._clips, function(clip) {
                if (((clip.startSec > that.options.startSec) || (clip.endSec > that.options.startSec)) &&
                    ((clip.startSec < that.options.endSec) || (clip.endSec < that.options.endSec))) {
                    if (!clip.drawn) {
                        that.drawClip(that,clip);
                    }
                }
            });
        },

        drawClip: function(that,clip) {
            var startX = clip.startSec * that.options.windowPxPerSec;
            var endX = clip.endSec * that.options.windowPxPerSec;
            var width = (clip.endSec - clip.startSec) * that.options.windowPxPerSec;
            startX = startX + 0.5;
            endX = endX + 0.5;
            var height = 199;

            // If we've already drawn the clip, remove the elements
            // first.
            if (clip.leftMarker) {
                clip.leftMarker.remove();
                clip.rightMarker.remove();
                clip.leftDragger.remove();
                clip.rightDragger.remove();
            }
            if (clip.bar) {
                clip.bar.remove();
                clip.label.remove();
                clip.labelBox.remove();
            }

            clip.leftMarker = that._paper.path('M ' + startX + ',0 L ' + startX +',' + height);
            clip.rightMarker = that._paper.path('M ' + endX + ',0 L ' + endX +',' + height);

            clip.leftDraggerPath = 'M ' + startX + ',93 L ' + (startX + 7) + ',100 L' + (startX) + ',107';
            clip.leftDragger = that._paper.path(clip.leftDraggerPath).attr({fill : '#ddf'});

            clip.rightDraggerPath = 'M ' + endX + ',93 L ' + (endX - 7) + ',100 L' + (endX) + ',107';
            clip.rightDragger = that._paper.path(clip.rightDraggerPath).attr({fill : '#ddf'});

            clip.leftDragger.mousedown(function(e) {
                // TODO(sness) - At about 3000 seconds, this mousedown
                // stops working.  Probably something happening in
                // Raphael.  We're probably switching to canvas
                // anyways, so just fix this then.  Also, all the
                // Orchive recordings are less than this, so it's only
                // a problem for the big concatenated recordings.
                that._clipAction = 'leftDraggerMouseDown';
                that._currentClip = clip;
                that._clipNeedsSaving = true;
            });

            clip.leftDragger.mouseup(function(e) {
                that._clipAction = false;
            });

            clip.rightDragger.mousedown(function(e) {
                that._clipAction = 'rightDraggerMouseDown';
                that._currentClip = clip;
                that._clipNeedsSaving = true;
            });

            clip.rightDragger.mouseup(function(e) {
                that._clipAction = false;
            });

            if (width-20 > 0) {
                clip.bar = that._paper.rect(startX+10,99.5,width-20,2).attr({fill : '#ddf'});
            }

            // Just draw the label in approximately the right place to get the bounding box.
            var labelStartX = startX + 20.5;
            var labelStartY = 90.5;
            clip.label = that._paper.text(0, 0, clip.name);
            var labelWidth = clip.label.getBBox().width;
            var labelHeight = clip.label.getBBox().height;
            clip.label.remove();

            // Calculate the correct position of the label and box and draw them.
            var labelStartX = startX + ((width - labelWidth) / 2);
            if (Math.floor(labelStartX) == labelStartX) {
                labelStartX += 0.5;
            }
            var labelStartY = 90.5;
            clip.labelBox = that._paper.rect(labelStartX - 5, labelStartY - 7, labelWidth + 10, labelHeight + 2)

            if (clip.active) {
                clip.labelBox.attr({fill : '#ff0'});
            } else {
                clip.labelBox.attr({fill : '#fff'});
            }

            clip.label = that._paper.text(labelStartX, labelStartY, clip.name).attr({'text-anchor':'start'});

            var labelClick = function(e) {
                // Unselect the last clip that was selected
                if (that._currentClip) {
                    that._lastClip = that._currentClip;
                    that._lastClip.active = false;
                }
                if (that._lastClip) {
                    that.drawClip(that,that._lastClip);
                }

                that._currentTypingName = clip.name;

                that._currentClip = clip;
                clip.active = true;
                that.drawClip(that,clip);

                e.stopPropagation();
            };

            clip.labelBox.mousedown(function(e) {
                labelClick(e);
            });

            clip.label.mousedown(function(e) {
                labelClick(e);
            });

            clip.drawn = true;
        },

        saveClips: function() {
            var that = this;
            var changedClips = [];
            _.each(this._clips, function(c) {
                if (that.clipChanged(c)) {
                    var clip = { startSec : c.startSec, endSec : c.endSec, id: c.id, name: c.name, catalogClip: c.catalogClip}
                    changedClips.push(clip);
                    that.setOrigClipInfo(c);
                }
            });
            $(this.element).trigger('saveEvent', {clips : changedClips});
            this._clipNeedsSaving = false;
        },

        drawPredictions: function() {
            if (this.options.predictions) {
                var predictions = this.options.predictions;
            } else {
                return;
            }

            var startSec = this.options.startSec;
            var endSec = this.options.endSec;
            var lengthSec = endSec - startSec;

            var lowHz = this.options.lowHz;
            var highHz = this.options.highHz;

            var pixelsPerSec = this.options.pixelsPerSec;

            for (var i = 0; i < predictions.length; i++) {
                var prediction = predictions[i];
                if ((prediction.drawn != true) && (prediction.startSec >= startSec) && (prediction.endSec <= endSec)) {
                    var x = ((prediction.startSec - startSec) * pixelsPerSec) + this.options.scrollLeftPx;
                    var y = 0.5;

                    var width = (prediction.endSec - prediction.startSec) * pixelsPerSec;
                    var height = this.options.windowHeightPx;
                    var opacity = prediction.confidence * 0.5;

                    // Hardcode the colors for now
                    var fill = '#ff0000';
                    if (prediction.name.charAt(0) == 'o') {
                        fill = '#00ff00';
                    }
                    if (prediction.name.charAt(0) == 'v') {
                        fill = '#0000ff';
                    }
                    // if (prediction.name.charAt(0) == 'b') {
                    //     fill = '#00ffff';
                    // }

                    if (prediction.name.charAt(0) != 'b') {
                        this._paper.rect(x,y,width,height).attr({stroke : '#33ffff', 'stroke-opacity' : 0, fill : fill, 'fill-opacity' : opacity }).translate(this.options.spectrogramXOffset,this.options.spectrogramYOffset);
                    }

                    prediction.drawn = true;
                }
            };

        },

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );
