// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.

;(function ( $, window, document, undefined ) {

    // Create the defaults once
    var pluginName = 'dataViewerPlugin',
        defaults = {
            lowHz : 0,
            highHz : 8000,
            recordingLengthSec : 5,
            startSec : 0,
            endSec : 20,
            windowWidthPx : 950,
            windowHeightPx : 200,
            maxValue : 1000.0,
            minValue : 0.0,
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
        this._dataViewer = null;

        this._isMouseDown = false;

        this._scrollTimer = null;

        // Arrays of data
        this._clips = [];
        this.init();
    }

    Plugin.prototype = {

        init: function() {
            var that = this;
            this.update();

            this.$element = $(this.element);

            this.$element.append('<div class="yaxis"></div>');
            this.$element.append('<div class="graph"></div>');

            this.$yaxis = this.$element.find(".yaxis");
			this._yaxisPaper = Raphael(this.$yaxis[0], 50, 220);

            this.$graph = this.$element.find(".graph");
            this.$graph.css('overflow', 'auto');
            this.$graph.css('overflow-y', 'hidden');

			this._paper = Raphael(this.$graph[0], this.options.recordingWidthPx, 220);

            this.buildOneDimensionData();
            this.buildSlider();

            this.$graph.scroll($.throttle( 5, function(e) {
                clearTimeout(that._scrollTimer);
                that._scrollTimer = setTimeout(function() {
                    if (that._isMouseDown) {
                        that._isMouseDown = false;
                    }
                }, 500);
                if (that._isMouseDown) {
                    that.options.scrollLeftPx = that.$graph.scrollLeft();
                    that.options.startSec = that.options.windowSecPerPx * that.options.scrollLeftPx;
                    that.options.endSec = that.options.startSec + that.options.windowLengthSec;
                    $(that.element).trigger('scrollEvent', [that.options.startSec, that.options.endSec]);
                }
            }));

            $(this.element).on('extents:change', function(event, n) {
                if (that._isMouseDown == false) {
                    that.options.startSec = n.startSec;
                    that.options.endSec = n.endSec;
                    that.update();
                    that.$graph.scrollLeft(that.options.scrollLeftPx);
                }
            });



            $(this.element).on('currentTimeSec:change', function(event, currentTimeSec) {
            });

            $(this.element).on('clips:load', function(event, clips) {
            });

            $(this.element).on('data:load', function(event, dataFilename) {
                that._dataFilename = dataFilename;
                that.buildData();
            });
            
            $(this.element).dblclick(function(e) {
            });

            $(this.element).on('mouseup', function(e) {
                that._isMouseDown = false;
            });
            
            $(this.element).on('mousedown', function(e) {
                that._isMouseDown = true;
            });
            
            $(this.element).on('mousemove', function(e) {
            });
                
            $(this.element).on('keypress', function(e) {
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
            this._paper.clear();
            this._yaxisPaper.clear();
        },

        buildOneDimensionData: function() {
        },

        buildSlider: function() {
        },

        buildClips: function(clips) {
        },

        buildData: function() {
            // Load data from server for the data this prediction makes about this region
            var url = '/data/view?filename=' + this._dataFilename;
            var that = this;

            this.options.data = [];
            // this.draw();

            $.ajax({
                url : url,
                dataType: 'json'
            }).done(function(data) { 
                that.options.data = data;
                that.draw();
            });

        },

        draw: function() {
            this.clear();
            this.drawData();
            this.drawYAxis();
            this.drawXAxis();
        },

        drawYAxis: function() {
            var maxValueStr = String(this.options.maxValue.toFixed(0));
            var halfValueStr = String(((this.options.maxValue + this.options.minValue) / 2.0).toFixed(0));
            var minValueStr = String((this.options.minValue).toFixed(0));

            this._yaxisPaper.text(0,0,"Hertz").transform("t10 100r-90");

            this._yaxisPaper.text(45,10,maxValueStr).attr({'text-anchor': 'end'});
            this._yaxisPaper.text(45,100,halfValueStr).attr({'text-anchor': 'end'});
            this._yaxisPaper.text(45,200,minValueStr).attr({'text-anchor': 'end'});
            this._yaxisPaper.path("M49.5 10.5L49.5 200.5");
            this._yaxisPaper.path("M47.5 10.5L49.5 10.5");
            this._yaxisPaper.path("M47.5 100.5L49.5 100.5");
            this._yaxisPaper.path("M47.5 200.5L49.5 200.5");
        },

        drawXAxis: function() {
            this._paper.path("M0.5 200.5L1500.5 200.5");
            for (var startSec = 0; startSec < this.options.recordingLengthSec; startSec += 5) {
                var startPx = startSec * this.options.windowPxPerSec;
                var label = startSec + "s";
                var text = this._paper.text(startPx,215.5, label).attr({font: "12px Helvetica"});
                if (startSec == 0) {
                    text.attr({'text-anchor': 'start'});
                }
                var xAxisStartLabel = this._paper.path("M" + startPx + ",200.5L" + startPx + ",205.5");
                var xAxisEndLabel = this._paper.path("M" + startPx + ",200.5L" + (startPx + this._spectrogramWidthPx) + ",200.5");

            }
            // X-axis
            //var label = startSec + "s";
            //this.xAxisLine = this._paper.text(startPx,210.5  , label).attr({font: "12px Helvetica"});
            // if (startSec == 0) {
            //     this.xAxisLine.attr({'text-anchor': 'start'});
            // }
            // this.xAxisStartLabel = this._paper.path("M" + startPx + ",200.5L" + startPx + ",205.5");
            // this.xAxisEndLabel = this._paper.path("M" + startPx + ",200.5L" + (startPx + this._spectrogramWidthPx) + ",200.5");
            
            // this._paper.path(path);
        },


        drawClips: function() {
        },

        drawClip: function(that,clip) {
        },

        drawData: function() {
            if (this.options.data && this.options.data.length > 0) {
                var data = this.options.data;
            } else {
                return;
            }
            
            // Find max and min of data
            var max = Number.MIN_VALUE;
            var min = Number.MAX_VALUE;
            for (var i = 0; i < data.length; i++) {
                var datum = data[i];
                if (datum.value > max) {
                    max = datum.value;
                }
                if (datum.value < min) {
                    min = datum.value;
                }
            }

            this.options.maxValue = max;
            this.options.minValue = min;
            
            // Create path
            var path = "M0 0";
            for (var i = 0; i < data.length; i++) {
                var time = data[i].time;
                var value = data[i].value;
                var y = (1.0 - ((value - min) / (max - min))) * this.options.windowHeightPx;
                var x = time * this.options.windowPxPerSec;
                path += "L" + x  + " " + y;
            }            

            this._paper.path(path);
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
