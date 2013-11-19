//
// openmirEditor - A javascript app using backbone.js that uses
// several openMir 
//
// sness@sness.net (c) 2012 GPLv3
//

$(document).ready(function () {

    //
    // The main model that loads the recording from the server and
    // coordinates all the actions between different UI elements.
    //
    RecordingModel = Backbone.Model.extend({
        urlRoot: '/api/v1/recording',

        defaults : {
            audioState : '0',
        },

        initialize: function() {
            this.bind('playPause', this.playPauseAudio);
            this.bind('change', this.doChange);

            var that = this;
            vent.on('extents:change', function(n){
                that.set({ 'startSec': n.startSec, 'endSec' : n.endSec});
            });

            this.audio = new Audio();

            var that = this;
            window.setInterval(function(){
                var audioState = that.get('audioState');
                if (audioState == '1') {
                    that.set('currentTimeSec', that.audio.currentTime);
                }
            },100);
        },

        doChange: function(e) {
            vent.trigger('recording:change', this);
        },

        seek: function(newTimeSec) {
            this.audio.currentTime = newTimeSec;
            var audioState = this.get('audioState');
        },

        currentTimeSecChanged: function() {
            var currentTimeSec = this.get('currentTimeSec');
        },

        parse: function(response) {
            this.audio.setAttribute('src',response.url);
            // this.audio.load();
            return response;
        },

        playPauseAudio: function() {
            var audioState = this.get('audioState');
            if (audioState == '1') {
                this.set('audioState', '0');
                this.audio.pause();
            } else {
                this.set('audioState', '1');
                var currentTime = this.get('currentTimeSec');
                this.audio.currentTime = currentTime;
                this.audio.play();
            }
        },

    });

    //
    // The shuttle controls
    //
    ShuttleView = Backbone.View.extend({
        el: $('#shuttle'),

        events: { 
            'click #playPause': 'clickPlayPause',
            'click #pageForward': 'clickPageForward',
            'click #pageBackward': 'clickPageBackward',
        },

        clickPlayPause: function() {
            recording.trigger('playPause');
        },

        clickPageForward: function() {
            var lengthSec = this.model.get('endSec') - this.model.get('startSec');
            var newStartSec = this.model.get('startSec') + lengthSec;
            var newEndSec = this.model.get('endSec') + lengthSec;
            var url = newStartSec + '/' + newEndSec;
            app.navigate(url, {trigger : true});
        },

        clickPageBackward: function() {
            var lengthSec = this.model.get('endSec') - this.model.get('startSec');
            var newStartSec = this.model.get('startSec') - lengthSec;
            var newEndSec = this.model.get('endSec') - lengthSec;
            var url = newStartSec + '/' + newEndSec;
            app.navigate(url, {trigger : true});
        },

        render: function(){
            $(this.el).empty();
            var template = _.template($('#shuttleTemplate').html());
            var html = template();
            $(this.el).append(html);
        }

    });

    SpectrogramModel = Backbone.Model.extend({
        defaults : {
            winSize : 1024
        },

        initialize: function() {
            var that = this;
            vent.on('recording:change', function(recording){
                that.set('recording', recording);
            });

            vent.on('clips:load', function(clips){
                that.set('clips', clips);
            });
        },
    });

    SpectrogramView = Backbone.View.extend({
        el: $('#spectrogramContainer'),

        initialize: function() {
            this.model.bind('change:recording', this.render, this);
            this.model.bind('change:clips', this.loadClips, this);

            vent.on('catalogClip:update', function(clip){
                $('#spectrogram').trigger('catalogClip:update', clip.toJSON());
            });

            vent.on('predictions:load', function(predictionFilename){
                $('#spectrogram').trigger('predictions:load', predictionFilename);
            });


        },

        events:{
            'scrollEvent': 'scrollEvent',
            'saveEvent': 'saveEvent',
            'draggerEvent': 'draggerEvent',
            'keypressEvent': 'keypressEvent'
        },

        scrollEvent: function(e, startSec, endSec) {
            vent.trigger('extents:change', { 'startSec' : startSec, 'endSec' : endSec});
        },

        loadClips: function() {
            $('#spectrogram').trigger('clips:load', [this.model.get('clips')]);
        },

        saveEvent: function(e,changedClips) {
            vent.trigger('clips:update', changedClips);
        },

        draggerEvent: function(e,extents) {
            this.model.set('draggerStartSec', extents.draggerStartSec);
            this.model.set('draggerEndSec', extents.draggerEndSec);
        },

        keypressEvent: function(e,charCode) {
            vent.trigger('spectrogram:keypress', charCode);
        },

        render: function() {
            $('#spectrogramControlsContainer').empty();

            var spectrogramUrl = '/visualizations/spectrogram/' + this.model.get('recording').get('id');
            $('#spectrogram').recordingPlugin({
                recordingId : this.model.get('recording').id,
                spectrogramUrl : spectrogramUrl,
                recordingLengthSec : this.model.get('recording').get('lengthSec'),
                winSize : this.model.get('winSize'),
                startSec : this.model.get('recording').get('startSec'),
                endSec : this.model.get('recording').get('endSec')
            });

        }
        
    });


    // Global event dispatcher
    vent = _.extend({}, Backbone.Events);

    var AppRouter = Backbone.Router.extend({

        initialize: function() {
            this.recordingModel = new RecordingModel({ id : window.recordingId, lengthSec : window.recordingLengthSec });

            // The spectrogram of a recording
            this.spectrogramModel = new SpectrogramModel();
            this.spectrogramView = new SpectrogramView({model : this.spectrogramModel});

            // TODO(sness) - Debugging
            window.recordingModel = this.recordingModel;
            window.spectrogramModel = this.spectrogramModel;
 
            vent.on('extents:change', function(n){
                var url = n.startSec.toFixed(2) + '/' + n.endSec.toFixed(2);
                app.navigate(url);
            });

        },
        
        routes: {
            '': 'mainView',
            ':startSec/:endSec': 'mainView',
        },

        mainView: function(startSec, endSec) {
            if (!startSec) {
                startSec = 0;
                endSec = 20.000;
            }
            this.recordingModel.set({'startSec' : parseFloat(startSec),  'endSec' : parseFloat(endSec)});
        }

    });
    
    // Instantiate the router
    app = new AppRouter;
    Backbone.history.start();


});
