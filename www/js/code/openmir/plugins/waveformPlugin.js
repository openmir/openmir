// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

    // Create the defaults once
    var pluginName = 'waveformPlugin',
        defaults = {
            lowHz : 0,
            highHz : 8000,
            recordingLengthSec : 5,
            startSec : 0,
            endSec : 20,
            windowWidthPx : 1000,
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
        this._waveform = null;

        // Arrays of data
        this._clips = [];
        this.init();
    }

    Plugin.prototype = {

        init: function() {
            var that = this;
            this.update();

			this._paper = Raphael(this.element, this.options.recordingWidthPx, 220);

            this.buildWaveform();
            this.buildSlider();

            this.$element = $(this.element);
            this.$element.css('overflow', 'auto');
            this.$element.css('overflow-y', 'hidden');

            $(this.element).on('currentTimeSec:change', function(event, currentTimeSec) {
                // console.log('currentTimeSec:change');
            });

            $(this.element).on('clips:load', function(event, clips) {
                // console.log('clips:load');
            });

            $(this.element).on('predictions:load', function(event, predictionFilename) {
                that._predictionFilename = predictionFilename;
                that.buildPredictions();
            });

            $(this.element).dblclick(function(e) {
                // console.log('dblclick');
            });

            $(this.element).on('mouseup', function(e) {
                // console.log('mouseup');
            });

            $(this.element).on('mousedown', function(e) {
                // console.log('mousedown');
            });

            $(this.element).on('mousemove', function(e) {
                // console.log('mousemove');
            });

            $(this.element).on('keypress', function(e) {
                // console.log('keypress');
            });

            this.draw();
        },

        update: function() {
        },

        clear: function() {
            // console.log('clear');
        },

        buildWaveform: function() {
            // console.log('buildWaveform');
        },

        buildSlider: function() {
            // console.log('buildSlider');
        },

        buildClips: function(clips) {
            // console.log('buildClips');
        },

        buildPredictions: function() {
            // console.log('buildPredictions');
        },

        draw: function() {
            // console.log('draw');
        },

        drawWaveforms: function() {
            // console.log('drawWaveform');
        },

        drawClips: function() {
            // console.log('drawClips');
        },

        drawClip: function(that,clip) {
            // console.log('drawClip');
        },

        drawPredictions: function() {
            // console.log('drawPredictions');
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
