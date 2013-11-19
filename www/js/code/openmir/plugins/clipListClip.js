// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

    // Create the defaults once
    var pluginName = "clipListClip",
        defaults = {
            startSec : 0,
            endSec : 1.000,
            clipWidth : 100,
            clipHeight : 100,
            spectrogramXOffset : 0,
            spectrogramYOffset : 0,
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            console.log('test');
            this.createCanvas();
            this.loadAudio();
            this.loadPitches();

            // When a currentTimeSecEvent is received, change slider position
            $(this.element).on('testEvent', function(event, testVal) {
                console.log("clipListClip.js testEvent" + testVal);
            });

        },

        createCanvas: function() {
            // Create the canvas
            this._canvas = document.createElement('canvas');
            this._canvas.width = 100;
            this._canvas.height = 100;
            this._ctx = this._canvas.getContext("2d");

            // Add the canvas to this element
            this.element.appendChild(this._canvas);
        },

        loadAudio: function() {
            var recordingId = this.options.recordingId;
            var startSec = this.options.startSec;
            var endSec = this.options.endSec;
            
            var url = "http://openmir.sness.net:8888/audio/" + recordingId + "?startSec=" + startSec + "&endSec=" + endSec;

            this._audio = new Audio();
            this._audio.src = url;


            // Play the audio when this element is clicked
            var that = this;

            $(this.element).click(function(e) {
                console.log("play");
                that._audio.currentTime = 0;
                that._audio.pause();
                that._audio.play();
            });
        },

        loadPitches: function() {
            var recordingId = this.options.recordingId;
            var startSec = this.options.startSec;
            var endSec = this.options.endSec;

            var highHzCutoff = this.options.highHzCutoff;
            var lowHzCutoff = this.options.lowHzCutoff;
            var highHzWrap = this.options.highHzWrap;
            var lowHzWrap = this.options.lowHzWrap;
            var tolerance = this.options.tolerance;
            var energyCutoff = this.options.energyCutoff;
            var medianFilter = this.options.medianFilter;
            var histogramBins = this.options.histogramBins;

            var baseUrl = 'http://openmir.sness.net:8888/visualizations/yin/';
            var timing = "?startSec=" + startSec + "&endSec=" + endSec;
            var cutoff = "&highHzCutoff=" + highHzCutoff + "&lowHzCutoff=" + lowHzCutoff;
            var wrap = "&highHzWrap=" + highHzWrap + "&lowHzWrap=" + lowHzWrap;
            var tolerance = "&tolerance=" + tolerance;
            var energyCutoff = "&energyCutoff=" + energyCutoff;
            var medianFilter = "&medianFilter=" + medianFilter;
            var histogramBins = "&histogramBins=" + histogramBins;
            var url = baseUrl + recordingId + timing + cutoff + wrap + tolerance + energyCutoff + medianFilter + histogramBins;
            var that = this;
            $.ajax({
                url : url
            }).done(function(pitches) { 
                that._pitches = pitches;
                that.draw();
            });
        },

        draw: function() {
            this.options.lengthSec = this.options.endSec - this.options.startSec;
            this.options.lengthHz = this.options.highHzCutoff - this.options.lowHzCutoff;
            this.options.pixelsPerSec = (this.options.clipWidth - 1) / this.options.lengthSec;
            this.options.pixelsPerHz = (this.options.clipHeight - 1) / this.options.lengthHz;

            // this.drawSpectrogram();
            this.drawTitle();
            this.drawPitchContour();
        },

        drawTitle: function() {
            var ctx = this._ctx;

            ctx.fillStyle = "#AAAAAA"
            ctx.fillRect(0,0,100,15)
            ctx.fillStyle = "black"
            ctx.fillText(this.options.name,5,11);
        },

        drawPitchContour: function() {
            var startSec = this.options.startSec;
            var endSec = this.options.endSec;

            var lowHzCutoff = this.options.lowHzCutoff;
            var highHzCutoff = this.options.highHzCutoff;

            var pixelsPerSec = this.options.pixelsPerSec;
            var pixelsPerHz = this.options.pixelsPerHz;

            var ctx = this._ctx;            

            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            for (var i = 0; i < this._pitches.length; i++) {
                var x = ((this._pitches[i][0] - startSec) * pixelsPerSec) + 0.5;
                var y = ((highHzCutoff - this._pitches[i][1]) * pixelsPerHz) + 0.5;
                ctx.lineTo(x,y);
            }
            ctx.stroke();

        },

        drawSpectrogram: function() {
            var spectrogramUrl = "http://openmir.sness.net:8888/visualizations/spectrogram/" + this.options.recordingId;

            var startSec = this.options.startSec;
            var endSec = this.options.endSec;

            var lowHzCutoff = this.options.lowHzCutoff;
            var highHzCutoff = this.options.highHzCutoff;
            
            var contrast = "50";
            var spectrogramOptions = "?startSec=" + startSec + "&endSec=" + endSec + "&contrast=" + contrast;
            spectrogramOptions += "&spectrumtype=magnitude&width=100&height=100&lowHz=0&highHz=8000";

            var url = spectrogramUrl + spectrogramOptions;
            console.log("drawSpectrogram:url=" + url);

            var img = new Image();
            img.src = url;
            
            var ctx = this._ctx;       
            var that = this;
            
            img.onload = function(){
                ctx.drawImage(img,0,100);
            };
        },

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );
