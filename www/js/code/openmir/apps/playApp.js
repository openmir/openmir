//
// openmirEditor - A javascript app using backbone.js that uses
// several openMir 
//
// sness@sness.net (c) 2012 GPLv3
//


$(document).ready(function () {

    soundManager.setup({
        url: '/www/js/lib/soundmanager2/swf',
        flashVersion: 9, 
        preferFlash: false,
    });

    // Has survey been taken?
    function surveyCookie() {
        var cookie = new jecookie('surveyDone');
        cookie.load();
        if (cookie.data.surveyDone === undefined) {
            cookie.data.surveyDone = 1;
            cookie.save();
            return false;
        }
        return true;
    }

    // GUID - Globally unique identifier for session
    function guidCookie() {
        var cookie = new jecookie('guid');
        cookie.load();
        if (cookie.data.guid === undefined) {
            cookie.data.guid = guidGenerator();
            cookie.save();
        }
        return cookie.data.guid;
    }
    
    function guidGenerator() {
        var S4 = function() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }

    var currentSoundNum = 0;
    function playAudio(filename) {
        var soundId = "sound" + currentSoundNum;
        soundManager.createSound({
            id: soundId,
            url: filename,
            autoLoad: true,
            autoPlay: false,
            onload: function() {
                soundManager.play(soundId);
            },
            volume: 50
        });

        currentSoundNum += 1;
    }

    function playClick() {
    }

    // Don't let user drag images
    $('img').on('dragstart', function(event) { event.preventDefault(); });

    // Send data to tell if it's an orca, background or voice selection
    // from the user
    function sendData(data) {

        $.post("/games/data", { 
            query: data['query'], 
            reference: data['reference'], 
            guid: guidCookie(),
            correct : data['correct'],
            userEvents : JSON.stringify(window.userEvents)
        });
        clearUserEvents();
    }

    function recordBaseUserEvent(eventType, e) {
        recordUserEvent({
            'level' : 'baseEvent',
            'name' : eventType,
            'pageX' : e.originalEvent.pageX,
            'pageY' : e.originalEvent.pageY,
        });
    }
    
    function recordUserEvent(event) {
        event['timestamp'] = ISODateString(new Date());
        window.userEvents.push(event);
    }

    function clearUserEvents() {
        window.userEvents = [];
    }

    //
    // Date and time functions
    //
    function ISODateString(d) {
        function pad(n){return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours() + - 8)+':' // Converted to PST
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z'
    }

    // Log all events
    $(document).bind('mousedown', function(e) {
        recordBaseUserEvent('mousedown',e);
    });

    $(document).bind('mouseup', function(e) {
        recordBaseUserEvent('mouseup',e);
    });

    LevelQueryClipModel = Backbone.Model.extend({
    });

    LevelQueryClipView = Backbone.View.extend({
        el: $('#levelQueryContainer'),
        
        render: function(){
            this.$el.empty();
            var template = _.template($("#levelQueryClipTemplate").html());            
            var html = template(this.model.toJSON());
            this.$el.append(html);

            return this;
        }
    });

    LevelReferenceClipModel = Backbone.Model.extend({
    });

    LevelReferenceClipsCollection = Backbone.Model.extend({
    });

    LevelReferenceClipView = Backbone.View.extend({
        render: function(){
            var template = _.template($("#levelReferenceClipTemplate").html());            
            var html = template(this.model.toJSON());
            return this;
        }
    });

    LevelReferenceClipsCollectionView = Backbone.View.extend({
        el: $('#levelReferenceContainer'),
        
        renderOne: function(clip) {
            var levelReferenceClipView = new LevelReferenceClipView({model : clip});
            this.$el.append(levelReferenceClipView.render().$el);
            return this;
        },

        render: function() {
            this.$el.empty();

            // Shuffle levelReferences
            var collectionArray = [];
            this.collection.each(function(clip) {
                collectionArray.push(clip);
            });

            var shuffledCollection = _.shuffle(collectionArray);

            // Render all levels
            var that = this;
            _.each(shuffledCollection, function(clip) {
                // TODO(sness) - Is there a better way to check if the
                // clip has downloaded than this?  I think this gets
                // set after the fetch(), but I think something was
                // weird here.
                if (clip.get("startSec")) {
                    that.renderOne(clip);
                }
            });
            
            return this;
        },
    });


    LevelModel = Backbone.Model.extend({
        urlRoot: '/napi/v1/levels',
    });

    LevelCollection = Backbone.Collection.extend({
        model: LevelModel,

        initialize: function() {
        },

    });

    // Contains global information about the game
    GameModel = Backbone.Model.extend({
        urlRoot: '/napi/v1/games/',

        defaults : {
            currentQuery : null,
            currentReference : null,
            currentLevel : 0,
        },

        initialize: function() {
            this.bind('sync', this.doSync);
        },

        doSync: function(e) {
            levelsJson = this.get("levels");
            levels = []
            _.each(levelsJson, (function(lj) {
                var queryClip = new LevelQueryClipModel(lj.queryClip);
                var correctReferenceClip = new LevelReferenceClipModel(lj.correctReferenceClip);
                var otherReferenceClip1 = new LevelReferenceClipModel(lj.otherReferenceClip1);
                var otherReferenceClip2 = new LevelReferenceClipModel(lj.otherReferenceClip2);
                var otherReferenceClip3 = new LevelReferenceClipModel(lj.otherReferenceClip3);

                var level = new LevelModel({
                    id : lj.id,
                    game : lj.game,
                    queryClip: queryClip,
                    correctReferenceClip: correctReferenceClip,
                    otherReferenceClip1: otherReferenceClip1,
                    otherReferenceClip2: otherReferenceClip2,
                    otherReferenceClip3: otherReferenceClip3
                });

                // level.includeChild(queryClip);
                // level.includeChild(correctReferenceClip);
                // level.includeChild(otherReferenceClip1);
                // level.includeChild(otherReferenceClip2);
                // level.includeChild(otherReferenceClip3);

                levels.push(level);
            })); 
                
            this.levelCollection = new LevelCollection(levels);

            // TODO(sness) - Debugging
            window.levelCollection = this.levelCollection;

            console.log("GameModel doSync");
        },

        
    });

    GameView = Backbone.View.extend({
        initialize: function() {
            this.model.bind('sync', this.render, this);
        },

        render: function(){
            this.$el.empty();
            console.log("GameView render");

            var level = this.model.levelCollection.at(0)
            var levelQueryClipModel = level.get("queryClip");
            var levelQueryClipView = new LevelQueryClipView({model : levelQueryClipModel});            
            levelQueryClipView.render();

            var correctReferenceClipModel = level.get("correctReferenceClip");
            var otherReferenceClip1Model = level.get("otherReferenceClip1");
            var otherReferenceClip2Model = level.get("otherReferenceClip2");
            var otherReferenceClip3Model = level.get("otherReferenceClip3");
            var levelReferenceClipsCollection = new LevelReferenceClipsCollection(
                [correctReferenceClipModel, otherReferenceClip1Model, otherReferenceClip2Model, otherReferenceClip3Model]);
            var levelReferenceClipsCollectionView = new LevelReferenceClipsCollectionView({collection : levelReferenceClipsCollection});
            levelReferenceClipsCollectionView.render();
            
            return this;
        },

    });
    
    //
    // The main start page of the application
    //
    MainView = Backbone.View.extend({
        events: {
            "mousedown #mainPlayButton": "mainPlayButtonDown",
            "mouseup" : "mouseup",
            "mouseup #mainPlayButton": "mainPlayButtonUp",
        },

        mainPlayButtonDown: function(e){
            $(this.el).find("#mainPlayButton").addClass('pressed');
        },

        mouseup : function(e) {
            $(this.el).find(".pressButton").removeClass('pressed');            
        },
        
        mainPlayButtonUp: function(e){
            app.navigate("help/0", {trigger: true});
        },

        initialize: function(){
            this.template = _.template($("#mainTemplate").html());
        },

        render: function(){
            $(this.el).empty();
            $(this.el).append(this.template());
        }

    });

    //
    // The done start page of the application
    //
    DoneView = Backbone.View.extend({
        events: {
            "mouseup" : "mouseup",
            "mousedown #doneNextButton": "doneNextButtonDown",
            "mouseup #doneNextButton": "doneNextButtonUp",
        },

        doneNextButtonDown: function(e){
            $(this.el).find("#doneNextButton").addClass('pressed');
        },

        mouseup : function(e) {
            $(this.el).find(".pressButton").removeClass('pressed');            
        },
        
        doneNextButtonUp: function(e){
            if (surveyCookie()) {
                window.location.href = '/games/next';            
            } else {
                window.location.href = '/surveyAbout';            
            }
        },

        initialize: function(){
            this.template = _.template($("#doneTemplate").html());
        },

        render: function(){
            $(this.el).empty();
            $(this.el).append(this.template());
        }

    });

    //
    // The help start page of the application
    //
    HelpView = Backbone.View.extend({
        events: {
            "mousedown #helpNextButton": "helpNextButtonDown",
            "mouseup": "helpNext",
        },

        helpNextButtonDown: function(e) {
            $(this.el).find("#helpNextButton").addClass('pressed');
        },

        helpNext: function(e){
            var url = "/0";
            app.navigate(url, {trigger: true});
        },

        initialize: function(){
            this.template = _.template($("#helpTemplate").html());
        },

        render: function(helpScreen){
            this.helpScreen = helpScreen;
            $(this.el).empty();
            $(this.el).append(this.template({ screen : helpScreen}));
        }

    });


    var AppRouter = Backbone.Router.extend({

        initialize: function() {

            this.gameModel = new GameModel({ id : window.gameId});
            this.gameView = new GameView({model : this.gameModel});
            this.gameModel.fetch();

            // TODO(sness) - Debugging
            window.gameModel = this.gameModel;

        },
        


    });
    
    // Instantiate the router
    app = new AppRouter;
    Backbone.history.start();

    // Record all user events
    clearUserEvents();
    

});
