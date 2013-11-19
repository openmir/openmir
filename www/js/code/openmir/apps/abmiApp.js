//
// abmiApp - Experimental app to develop features for ABMI project
//
// sness@sness.net (c) 2013 GPLv3
//

$(document).ready(function () {

    //
    // The main model that loads the recording from the server and
    // coordinates all the actions between different UI elements.
    //
    RecordingModel = Backbone.Model.extend({
        urlRoot: '/api/v1/recordings',

        defaults : {
            audioState : '0',
            audioSegmentLengthSec: 5,
        },

        initialize: function() {
            this.bind('audio:toggle', this.playPauseAudio);
            this.bind('change', this.doChange);
            this.bind('change:id', this.doChangeId);
            this.bind('change:audioFilename', this.doChangeAudioFilename);
            this.bind('sync', this.doSync);
            // this.bind('change:currentTimeSec', this.doChangeCurrentTimeSec);
            this.bind('change:lengthSec', this.doChangeLengthSec);
            this.bind('all', this.doAll);

            var that = this;
            vent.on('extents:change', function(n){
                that.set({ 'startSec': n.startSec, 'endSec' : n.endSec});
            });

            vent.on('audio:toggle', function(n) {
                that.playPauseAudio();
            });

            vent.on('recording:seekSecEvent', function(seekSec) {
                // console.log("recordingModel recording:seekSecEvent=",seekSec);
                that.pauseAudio();
                that.audio.currentTime = seekSec;
                that.playAudio();
            });

            var that = this;
            window.setInterval(function(){
                var audioState = that.get('audioState');
                if (audioState == '1') {
                    // that.set('currentTimeSec', that.audio.currentTime);
                    vent.trigger('recording:currentTimeSec',that.audio.currentTime);

                    // var currentTime = that.audio.currentTime;
                    // var duration = that.audio.duration;
                    // var buffered = that.audio.buffered.end(that.audio.buffered.length-1);
                    // var readyState = that.audio.readyState;
                    // var seekable = that.audio.seekable;
                    // console.log("currentTime=", currentTime, " duration=", duration, " buffered=", buffered, " readyState=", readyState, " seekable=", seekable);

                }

            },100);

            $(window).on('keypress', function(e) {
                if (e.charCode == 32) {
                    that.playPauseAudio();
                }
                e.preventDefault();
            });


        },

        doChangeLengthSec: function(e) {
        },

        doChange: function(e) {
        },

        doChangeAudioFilename: function(e) {
            this.loadAudio();
        },

        doSync: function(e) {
        },

        doAll: function(e) {
        },

        doChangeId: function(e) {
            if (this.get('id')) {
            }
        },

        loadAudio: function(e) {
            var audioFilename = this.get('audioFilename');

            // TODO(sness) - Temporary? mp3 file support.
            audioFilename = "mp3/" + audioFilename.slice(0,-4) + ".mp3"

            var audioPath = 'http://data.orchive.net/' + audioFilename;
            // console.log('loadAudio audioPath=' + audioPath);

            
            
            this.audio = new Audio();
            // TODO(sness) - For debugging
            window._audio = this.audio;
            this.audio.setAttribute('src',audioPath);
            // this.audio.setAttribute('controls',true);
            // $('#test').append(this.audio);
            this.audio.load();
        },

        // doChangeCurrentTimeSec: function() {
        //     var currentTimeSec = this.get('currentTimeSec');
        //     vent.trigger('recording:currentTimeSec',currentTimeSec);
        // },

        // seek: function(newTimeSec) {
        //     this.audio.currentTime = newTimeSec;
        //     var audioState = this.get('audioState');
        // },

        parse: function(response) {
            vent.trigger('recording:parse', this);
            // this.audio.setAttribute('src',response.url);
            // this.audio.load();
            return response;
        },

        pauseAudio: function() {
            this.set('audioState', '0');
            this.audio.pause();
        },

        playAudio: function() {
            this.set('audioState', '1');
            // var currentTimeSec = this.get('currentTimeSec');
            // this.audio.currentTime = currentTimeSec;
            this.audio.play();
        },

        playPauseAudio: function() {
            var audioState = this.get('audioState');
            if (audioState == '1') {
                this.pauseAudio();
            } else {
                this.playAudio();
            }
        },

    });


    //
    // The audio player
    //
    AudioModel = Backbone.Model.extend({
    });

    AudioView = Backbone.View.extend({
    });


    //
    // The shuttle controls
    //

    ShuttleModel = Backbone.Model.extend({

        defaults: {
            isPlaying : false
        },

        initialize: function() {
            var that = this;

            vent.on('recording:parse', function(recording){
                that.set('recording', recording);
            });

        },
    });
    
    ShuttleView = Backbone.View.extend({
        el: $('#shuttle'),

        events: { 
            'click #playPause': 'clickPlayPause',
            'click #pageForward': 'clickPageForward',
            'click #pageBackward': 'clickPageBackward',
        },

        initialize: function() {
            this.model.bind('change:recording', this.render, this);
            this.model.bind('change:isPlaying', this.changeIsPlaying, this);
        },

        changeIsPlaying: function() {
        },

        clickPlayPause: function() {
            vent.trigger("audio:toggle");
        },

        clickPageForward: function() {
        },

        clickPageBackward: function() {
        },

        render: function(){
            $(this.el).empty();
            var template = _.template($('#shuttleTemplate').html());
            var html = template();
            $(this.el).append(html);
        }

    });

    AbmiSpectrogramModel = Backbone.Model.extend({
        defaults : {
            winSize : 1024
        },

        initialize: function() {
            var that = this;
            vent.on('recording:parse', function(recording){
                that.set('recording', recording);
            });

            vent.on('recording:currentTimeSec', function(currentTimeSec){
                that.set('currentTimeSec', currentTimeSec);
            });

            vent.on('clips:load', function(clips){
                that.set('clips', clips);
            });
        },
    });

    AbmiSpectrogramView = Backbone.View.extend({
        el: $('#spectrogram'),

        initialize: function() {
            var that = this;
            this.model.bind('change:recording', this.render, this);
            this.model.bind('change:clips', this.loadClips, this);
            this.model.bind('change:currentTimeSec', this.doCurrentTimeSec, this);

            vent.on('catalogClip:update', function(clip){
                that.$el.trigger('catalogClip:update', clip.toJSON());
            });

            vent.on('predictions:load', function(predictionFilename){
                that.$el.trigger('predictions:load', predictionFilename);
            });

            vent.on('extents:change', function(n){
                that.$el.trigger('extents:change', n);
            });

        },

        events:{
            'seekSecEvent': 'seekSecEvent',
            'scrollEvent': 'scrollEvent',
            'saveEvent': 'saveEvent',
            'draggerEvent': 'draggerEvent',
            'keypressEvent': 'keypressEvent'
        },

        seekSecEvent: function(e,newTimeSec) {
            vent.trigger('recording:seekSecEvent', newTimeSec);
        },

        doCurrentTimeSec: function() {
            this.$el.trigger('recording:currentTimeSec', this.model.get('currentTimeSec'));
        },

        scrollEvent: function(e, startSec, endSec) {
            vent.trigger('extents:change', { 'startSec' : startSec, 'endSec' : endSec});
        },

        loadClips: function() {
            this.$el.trigger('clips:load', [this.model.get('clips')]);
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
            var template = _.template($('#spectrogramControlsTemplate').html());
            var html = template(this.model.toJSON());
            $('#spectrogramControlsContainer').append(html);

            var spectrogramUrl = '/visualizations/spectrogram/' + this.model.get('recording').get('id');
            this.$el.abmiSpectrogramPlugin({
                recordingId : this.model.get('recording').id,
                spectrogramUrl : spectrogramUrl,
                recordingLengthSec : this.model.get('recording').get('lengthSec'),
                winSize : this.model.get('winSize'),
                startSec : this.model.get('recording').get('startSec'),
                endSec : this.model.get('recording').get('endSec')
            });

        }
        
    });

    WaveformModel = Backbone.Model.extend({
        defaults : {
        },

        initialize: function() {
            var that = this;

            vent.on('recording:parse', function(recording){
                that.set('recording', recording);
            });
        },
    });

    WaveformView = Backbone.View.extend({
        el: $('#waveformContainer'),

        initialize: function() {
            this.model.bind('change:recording', this.render, this);
        },

        events:{
        },

        render: function() {
            var waveformUrl = '/visualizations/waveform/' + this.model.get('recording').get('id');
            $('#waveform').waveformPlugin({
                recordingId : this.model.get('recording').id,
                waveformUrl : waveformUrl,
                recordingLengthSec : this.model.get('recording').get('lengthSec'),
            });

        }
        
    });

    //
    // The data viewer
    //

    DataViewerModel = Backbone.Model.extend({
        defaults : {
        },

        initialize: function() {
            var that = this;

            vent.on('recording:parse', function(recording){
                that.set('recording', recording);
            });
        },
    });

    DataViewerView = Backbone.View.extend({
        el: $('#dataviewer'),

        initialize: function() {
            var that = this;

            if (that.$el.length > 0) {
                this.model.bind('change:recording', this.render, this);
                
                vent.on('data:load', function(dataFilename){
                    that.$el.trigger('data:load', dataFilename);
                });

                vent.on('extents:change', function(n){
                    that.$el.trigger('extents:change', n);
                });
                
            }
        },

        events:{
            'scrollEvent': 'scrollEvent',
        },

        scrollEvent: function(e, startSec, endSec) {
            vent.trigger('extents:change', { 'startSec' : startSec, 'endSec' : endSec});
        },

        render: function() {
            var dataUrl = '/visualizations/data/' + this.model.get('recording').get('id');
            this.$el.dataViewerPlugin({
                recordingId : this.model.get('recording').id,
                dataUrl : dataUrl,
                recordingLengthSec : this.model.get('recording').get('lengthSec'),
                startSec : this.model.get('recording').get('startSec'),
                endSec : this.model.get('recording').get('endSec')
            });

        }
        
    });

    //
    // The data we can display
    //
    DataModel = Backbone.Model.extend({
    });
    
    DataCollection = Backbone.Collection.extend({
        model: DataModel,
        
    });

    DataView = Backbone.View.extend({
        events: {
            'click' : 'doClick'
        },
        
        doClick: function() {
            vent.trigger('data:load', this.model.get("filename"));
        },

        initialize: function() {
        },

        render: function() {
            var template = _.template( $('#dataTemplate').html(), this.model.toJSON() );
            $(this.el).append(template);
        }
    });

    DataListView = Backbone.View.extend({
        el: $('#dataListContainer'),

        initialize: function() {
            this.collection.bind('sync', this.render, this);
        },

        render: function() {
            $(this.el).empty();
            _.each(this.collection.models, function(n) {
                var model = this.collection.get(n);
                var dataView = new DataView({model: model});
                dataView.render();
                $(this.el).append(dataView.el);
            }, this);
        }
    });

    ClipModel = Backbone.Model.extend({
        urlRoot: '/api/v1/clips',
        
    });

    ClipCollection = Backbone.Collection.extend({
        model: ClipModel,

        initialize: function() {
            this.bind('sync', this.doSync);
            var that = this;

            vent.on('clips:update', function(clips){
                that.updateClips(clips);
            });
        },

        updateClips: function(changedClips) {
            var that = this;
            _.each(changedClips.clips, function(c) {
                var clip = new ClipModel(c);
                that.add(clip, {merge: true});
            });

            var that = this;
            this.each(function(clip) {
                if (!clip.get("recording")) {
                    clip.set("recording", window.recordingId);
                }

                // TODO(sness) - If we create a clip in the
                // recordingAnnotatorSpectrogramPlugin and then save it, propogate
                // the new id back to the recordingAnnotatorSpectrogramPlugin.
                if (clip.hasChanged()) {
                    clip.save();
                }
            });

        },

        doSync: function() {
            vent.trigger('clips:load', this.toJSON());
        }

    });

    CatalogModel = Backbone.Model.extend({
    });

    CatalogCollection = Backbone.Collection.extend({
        url: '/api/v1/catalogs',

        model: CatalogModel,

        initialize: function() {
        },

    });

    var catalogTemplate = _.template('<div class="catalog"><%= name %></div>');

    CatalogView = Backbone.View.extend({
        events: {
            'click' : 'doClick'
        },

        doClick: function() {
            vent.trigger('catalog:change', this.model.id);
        },

        initialize: function(){
        },

        render: function() {
            var html = catalogTemplate(this.model.toJSON());
            this.setElement(html);
            return this;
        }
    });


    CatalogsView = Backbone.View.extend({
        el: $('#catalogsContainer'),

        initialize: function() {
            this.collection.bind('sync', this.render, this);
        },

        events:{ 
        },

        renderOne: function(catalog) {
            var catalogView = new CatalogView({model:catalog});
            this.$el.append(catalogView.render().$el);
            return this;
        },

        render: function() {
            var that = this;
            this.$el.empty();

            this.collection.each(function(catalog) {
                that.renderOne(catalog)
            });
        }
        
    });

    CatalogClipModel = Backbone.Model.extend({
        urlRoot: '/api/v1/catalogClips',
    });

    CatalogClipsCollection = Backbone.Collection.extend({
        model: ClipModel,

        initialize: function() {
            var that = this;
            vent.on('catalog:change', function(catalogId){
                that.catalogId = catalogId;
                that.url = '/api/v1/catalogClips?catalog=' + catalogId;
                that.fetch();                
            });

            vent.on('spectrogram:keypress', function(charCode){
                // Trigger the first 9 clips with the keys 1-9
                if (charCode >= 49 && charCode <= 57) {
                    var catalogClipNum = charCode - 49;
                    
                    vent.trigger('catalogClip:update', that.at(catalogClipNum));
                    
                }
            });
        },

    });

    var catalogClipDetailTemplate = _.template(
        '<div class="detailClip">' +
            '<div class="image">' + 
            '<img src="/visualizations/spectrogram/<%= recording %>?startSec=<%= startSec %>&endSec=<%= endSec %>&height=100&highHz=8000"></div>' + 
            '<div class="name"><%= name %></div>' + 
            '</div>');

    CatalogClipDetailView = Backbone.View.extend({
        el: $('#catalogClipDetailContainer'),

        initialize: function(){

            this.model.bind('change', this.render, this);            

            var that = this;
            vent.on('catalogClip:update', function(clip){
                that.model.set(clip.attributes);
            });
        },

        render: function() {
            $(this.el).empty();
            var html = catalogClipDetailTemplate(this.model.toJSON());
            $(this.el).append(html);
            return this;
        }
    });


    var catalogClipTemplate = _.template(
        '<div class="clip">' +
            '<div class="image">' + 
            '<img src="/visualizations/spectrogram/<%= recording %>?startSec=<%= startSec %>&endSec=<%= endSec %>&height=100&highHz=8000"></div>' + 
            '<div class="name"><%= name %></div>' + 
            '</div>');

    CatalogClipView = Backbone.View.extend({
        events: {
            'click' : 'doClick'
        },

        doClick: function() {
            vent.trigger('catalogClip:update', this.model);
        },

        initialize: function(){
        },

        render: function() {
            var html = catalogClipTemplate(this.model.toJSON());
            this.setElement(html);
            return this;
        }
    });


    var newCatalogClipTemplate = _.template(
        'new catalog clip : <input type="text" class="newCatalogClipName" name="newCatalogClipName">' +
        '<button type="button" class="newCatalogClipButton">+</button>' +    
        '<br/>');


    CatalogClipsView = Backbone.View.extend({
        el: $('#catalogClipsContainer'),

        initialize: function() {
            this.collection.bind('sync', this.render, this);
        },

        events:{ 
            'click .newCatalogClipButton' : 'doNewCatalogClip'
        },
        
        doNewCatalogClip: function() {
            var name = this.$el.find(".newCatalogClipName").val();
            var startSec = this.spectrogramModel.get("draggerStartSec");
            var endSec = this.spectrogramModel.get("draggerEndSec");
            if (name && startSec) {
                var catalogClipModel = new CatalogClipModel({
                    'name' : name,
                    'startSec' : startSec,
                    'endSec' : endSec,
                    'catalog' : this.collection.catalogId,
                    'recording' : window.recordingId,
                });
                catalogClipModel.save();
                this.collection.add(catalogClipModel);
            }
        },

        renderOne: function(catalogClip) {
            var catalogClipView = new CatalogClipView({model:catalogClip});
            this.$el.append(catalogClipView.render().$el);
            return this;
        },

        render: function() {
            var that = this;
            this.$el.empty();

            var html = newCatalogClipTemplate();
            this.$el.append(html);

            this.collection.each(function(catalogClip) {
                that.renderOne(catalogClip)
            });
        }
        
    });

    //
    // Predictions
    //
    Prediction = Backbone.Model.extend({
    });
    
    PredictionCollection = Backbone.Collection.extend({
        model: Prediction,
        
    });

    PredictionView = Backbone.View.extend({
        events: {
            'click' : 'doClick'
        },
        
        doClick: function() {
            // Send an event to the SpectrogramView to load the
            // classifications for the currently visible region.
            vent.trigger('predictions:load', this.model.get("filename"));
        },

        initialize: function() {
        },

        render: function() {
            var template = _.template( $('#predictionTemplate').html(), this.model.toJSON() );
            $(this.el).append(template);
        }
    });

    PredictionsView = Backbone.View.extend({
        el: $('#predictions'),

        initialize: function() {
            this.collection.bind('sync', this.render, this);
        },

        render: function() {
            $(this.el).empty();
            _.each(this.collection.models, function(n) {
                var model = this.collection.get(n);
                var predictionView = new PredictionView({model: model});
                predictionView.render();
                $(this.el).append(predictionView.el);
            }, this);
        }
    });


    // Global event dispatcher
    vent = _.extend({}, Backbone.Events);

    var AppRouter = Backbone.Router.extend({

        initialize: function() {
            this.recordingModel = new RecordingModel({ id : window.recordingId, lengthSec : window.recordingLengthSec });
            this.recordingModel.fetch();

            // The spectrogram of a recording
            this.spectrogramModel = new SpectrogramModel();
            this.spectrogramView = new SpectrogramView({model : this.spectrogramModel});

            // The waveform of a recording
            this.waveformModel = new WaveformModel();
            this.waveformView = new WaveformView({model : this.waveformModel});

            // The oneDimensionData of a recording
            this.dataViewerModel = new DataViewerModel();
            this.dataViewerView = new DataViewerView({model : this.dataViewerModel});

            // Load the clips for this recording
            this.clipCollection = new ClipCollection();
            this.clipCollection.url = '/api/v1/clips?recording=' + window.recordingId;
            this.clipCollection.fetch();

            // Load the catalogClips for this recording
            this.catalogClipsCollection = new CatalogClipsCollection();
            this.catalogClipsCollection.url = '/api/v1/catalogClips?catalog=' + window.catalogId;
            this.catalogClipsCollection.catalogId = window.catalogId;
            this.catalogClipsCollection.fetch();
            this.catalogClipsView = new CatalogClipsView({collection : this.catalogClipsCollection});
            this.catalogClipsView.spectrogramModel = this.spectrogramModel;

            // The detail view for a catalog
            this.catalogClipDetailModel = new CatalogClipModel();
            this.catalogClipDetailView = new CatalogClipDetailView({model : this.catalogClipDetailModel});

            // The catalogs
            this.catalogCollection = new CatalogCollection();
            this.catalogCollection.fetch();
            this.catalogsView = new CatalogsView({collection : this.catalogCollection});

            // The predictions
            this.predictionCollection = new PredictionCollection();
            this.predictionCollection.url = '/predictions/recording/' + window.recordingId;
            this.predictionCollection.fetch();
            this.predictionsView = new PredictionsView({collection : this.predictionCollection});

            // Shuttle view
            this.shuttleModel = new ShuttleModel();
            this.shuttleView = new ShuttleView({model : this.shuttleModel});

            // The data
            // TODO(sness) - Is this the best way to tell if we should
            // be displaying data?  I guess it is the HTML page that
            // determines what the app should look like...
            if ($('#dataviewer').length > 0) {
                this.dataCollection = new DataCollection();
                this.dataCollection.url = '/data/recording/' + window.recordingId;
                this.dataCollection.fetch();
                this.dataListView = new DataListView({collection : this.dataCollection});
            };

            // TODO(sness) - Debugging
            window.recordingModel = this.recordingModel;
            window.spectrogramModel = this.spectrogramModel;
            window.waveformModel = this.waveformModel;
            window.clipCollection = this.clipCollection;
            window.catalogClipsCollection = this.catalogClipsCollection;
            window.predictionCollection = this.predictionCollection;
            window.dataCollection = this.dataCollection;

            this.updateNav = _.throttle(function(n) {
                var url = n.startSec.toFixed(2) + '/' + n.endSec.toFixed(2);
                app.navigate(url);
            }, 1000);
            
            var that = this;
            vent.on('extents:change', function(n){
                that.updateNav(n);
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
            // console.log("mainView startSec=" + startSec + " " + "endSec=" + endSec);
            this.recordingModel.set({'startSec' : parseFloat(startSec),  'endSec' : parseFloat(endSec)});
        }

    });
    
    // Instantiate the router
    app = new AppRouter;
    Backbone.history.start();


});
