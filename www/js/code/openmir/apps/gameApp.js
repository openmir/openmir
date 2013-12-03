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

    // Contains global information about the game
    PlayModel = Backbone.Model.extend({
        defaults : {
            currentQuery : null,
            currentReference : null,
            currentLevel : null,
        },
        
    });
    
    ClipModel = Backbone.Model.extend({
        urlRoot: '/api/v1/clip/',
    });

    QueryClipModel = ClipModel.extend({
    });

    // A query call, located at the top of the screen
    QueryClipView = Backbone.View.extend({
        className: "query",
        
        events: {
            "mousedown .call": "mousedown",
            "mouseup .call": "mouseup",
        },
        
        mousedown: function(e){
            $(this.el).find('.image').addClass('click');
            playClick();

            var audioUrl = "/audio/" + this.model.get("recording") + "?startSec=" + this.model.get("startSec") + "&endSec=" + this.model.get("endSec");
            playAudio(audioUrl);

            recordUserEvent({
                'level' : 'interfaceEvent',
                'type' : 'query',
                'name' : 'click',
                'modelId' : this.model.id
            });

        },
        
        mouseup: function(e) {
            $('.image').removeClass('click');
        },
        
        initialize: function(){
        },
        
        render: function(){
            var template = _.template($("#queryClipTemplate").html());            
            var html = template(this.model.toJSON());
            $(this.el).append(html);

            return this;
        }
    });


    ReferenceClipModel = ClipModel.extend({
    });

    ReferenceClipCollection = Backbone.Collection.extend({
        model: ReferenceClipModel,

    });

    ReferenceClipView = Backbone.View.extend({
        tagName: "div",
        className: "reference",

        events: {
            "mousedown": "mousedown",
            "mouseup": "mouseup",
        },

        mousedown: function(e){
            this.options.playModel.set({currentReference : this.model});
            $('.call').removeClass('selected');

            this.$el.find('.call').addClass('selected');
            this.$el.find('.image').addClass('click');

            playClick();
            var audioUrl = "/audio/" + this.model.get("recording") + "?startSec=" + this.model.get("startSec") + "&endSec=" + this.model.get("endSec");
            playAudio(audioUrl);

            recordUserEvent({
                'level' : 'interfaceEvent',
                'type' : 'reference',
                'name' : 'click',
                'modelId' : this.model.id
            });

        },
        
        mouseup: function(e) {
            $('.image').removeClass('click');
        },

        
        render: function() {
            var template = _.template($("#referenceClipTemplate").html());            
            var html = template(this.model.toJSON());
            $(this.el).append(html);
            return this;
        },
    });

    ReferenceClipsView = Backbone.View.extend({
        tagName: "div",
        className: "referenceContainer",
        
        renderOne: function(clip) {
            var referenceClipView = new ReferenceClipView({model : clip, playModel : this.options.playModel});
            this.$el.append(referenceClipView.render().$el);
            return this;
        },

        render: function() {
            this.$el.empty();

            // Shuffle references
            var collectionArray = [];
            this.collection.each(function(clip) {
                collectionArray.push(clip);
            });

            var shuffledCollection = _.shuffle(collectionArray);

            // Render all levels
            var that = this;
            _.each(shuffledCollection, function(clip) {
                if (clip.get("startSec")) {
                    that.renderOne(clip);
                }
            });
            
            return this;
        },
    });
    
    //
    // The play start page of the application
    //
    PlayView = Backbone.View.extend({
        events: {
            "mouseup": "mouseup",

            "mouseup #guessButton" : "guessButtonUp",
            "mousedown #guessButton" : "guessButtonDown",

            "mousedown .tryAgainButton" : "tryAgainButtonDown",
            "mouseup .tryAgainButton" : "tryAgainButtonUp",

            "mousedown .guessMatchedNextButton" : "guessMatchedNextButtonDown",
            "mouseup .guessMatchedNextButton" : "guessMatchedNextButtonUp",

            "mousedown .guessDidntMatchNextButton" : "guessDidntMatchNextButtonDown",
            "mouseup .guessDidntMatchNextButton" : "guessDidntMatchNextButtonUp"
        },

        guessDidntMatchNextButtonDown: function() {
            $(this.el).find(".guessDidntMatchNextButton").addClass('pressed');
        },

        guessDidntMatchNextButtonUp: function() {
            $(this.el).find(".guessDidntMatchNextButton").removeClass('pressed');
            $("#guessDidntMatch").hide();
            this.doNextLevelOrNextGame();
        },

        guessMatchedNextButtonDown: function() {
            $(this.el).find(".guessMatchedNextButton").addClass('pressed');
        },

        doNextLevelOrNextGame: function() {

            if (this.model.get("currentReference") === null) {
                this.doGuessCurrentReferenceUndefined();
                return;
            }

            var currentLevel = parseInt(this.model.get("currentLevel"), 10);
            // Next level or next game
            currentLevel += 1;
            if (currentLevel < window.levels.length) {
                var url = "/play/" + currentLevel;
                app.navigate(url, {trigger: true});
            } else {
                app.navigate('done', {trigger : true});
            }
            
        },

        // The user has not yet chosen a reference call
        doGuessCurrentReferenceUndefined: function() {
            $("#currentReferenceUndefined").show();
        },

        guessMatchedNextButtonUp: function() {
            $(this.el).find(".guessMatchedNextButton").removeClass('pressed');
            this.doNextLevelOrNextGame();

        },

        tryAgainButtonDown: function(e) {
            $(this.el).find(".tryAgainButton").addClass('pressed');
        },

        tryAgainButtonUp: function(e) {
            $("#currentReferenceUndefined").hide();
            $(this.el).find(".tryAgainButton").removeClass('pressed');
        },

        guessButtonDown: function(e){
            $(this.el).find("#guessButton").addClass('pressed');
        },

        guessButtonUp: function() {
            $('#guessButton').removeClass('pressed');
            if (!this.model.get("currentReference")) {
                this.doGuessCurrentReferenceUndefined();
                return;
            }

            if (this.model.get("currentReference").get("title") == "correct") {
                var correct = 1;
            } else {
                var correct = 0;
            }

            // Send the classification to the server
            sendData({
                'query' : this.model.get("currentQuery").id,
                'reference' : this.model.get("currentReference").id,
                correct : correct
            });

            if (correct) {
                this.doGuessMatched();
            } else {
                this.doGuessDidntMatch();
            }
        },

        // The user has not yet chosen a reference call
        doGuessCurrentReferenceUndefined: function() {
            $("#currentReferenceUndefined").show();
        },


        doGuessMatched: function() {
            $("#guessMatched").show();

        },

        doGuessDidntMatch: function() {
            $("#guessDidntMatch").show();
        },


        initialize: function(){
        },

        render: function(){
            this.$el.empty();

            this.model.set("currentReference", null);

            var level = this.model.get("currentLevel");

            // Query
            var queryClipJson = window.levels[level].queryClip;
            var queryClipModel = new QueryClipModel(queryClipJson);
            var queryClipView = new QueryClipView({model : queryClipModel});
            this.$el.append(queryClipView.render().$el);

            this.model.set({currentQuery : queryClipModel});

            // References
            var referenceClipCollection = new ReferenceClipCollection(
                [(new ReferenceClipModel(window.levels[level].correctReferenceClip)), 
                 (new ReferenceClipModel(window.levels[level].otherReferenceClip1)), 
                 (new ReferenceClipModel(window.levels[level].otherReferenceClip2)), 
                 (new ReferenceClipModel(window.levels[level].otherReferenceClip3))]);
            var referenceClipsView = new ReferenceClipsView({collection : referenceClipCollection, playModel : this.model});
            this.$el.append(referenceClipsView.render().$el);

            $(this.el).append(_.template($("#guessButtonTemplate").html())());
            $(this.el).append(_.template($("#currentReferenceUndefinedTemplate").html())());
            $(this.el).append(_.template($("#guessMatched").html())());
            $(this.el).append(_.template($("#guessDidntMatch").html())());
            
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
            var url = "/play/0";
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
            // Turn the levels into backbone models
            levels = []
            _.each(window.levelsJson, (function(lj) {
                levels.push(lj);
            })); 

            window.levels = levels;
            
            window.mainView = new MainView({ el: $("#mainContainer") });
            window.doneView = new DoneView({ el: $("#doneContainer") });
            window.helpView = new HelpView({ el: $("#helpContainer") });

            // The main game board
            window.playModel = new PlayModel();
            window.playView = new PlayView({model : playModel, el: $("#playContainer") });
        },
        
        routes: {
            "": "mainView",
            "help/:screen" : "helpView",
            "play/:level" : "playView",
            "done" : "doneView",
        },

        mainView: function() {
            this.hideAll();
            $("#mainContainer").show();
            mainView.render();
        },

        playView: function(level) {
            playView.model.set("currentLevel",level);

            this.hideAll();
            $("#playContainer").show();
            playView.render();
        },

        doneView: function(level) {
            this.hideAll();
            $("#doneContainer").show();
            doneView.render();
        },

        helpView: function(screen) {
            this.hideAll();
            $("#helpContainer").show();
            helpView.render(screen);
        },

        hideAll: function() {
            $("#mainContainer").hide();
            $("#playContainer").hide();
            $("#doneContainer").hide();
            $("#helpContainer").hide();
        }


    });
    
    // Instantiate the router
    app = new AppRouter;
    Backbone.history.start();

    // Record all user events
    clearUserEvents();
    

});
