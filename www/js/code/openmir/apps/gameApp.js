//
// gameBuilderApp
//
// sness@sness.net (c) 2013 GPLv3
//

$(document).ready(function () {


    ClipModel = Backbone.Model.extend({
        // urlRoot: '/api/v1/clip/',
    });

    ClipCollection = Backbone.Collection.extend({
        url : '/napi/v1/clips',

        model: ClipModel,
    });

    var clipTemplate = _.template(
        '<div class="clip">' +
            '<div class="image">' + 
            '<img src="/visualizations/spectrogram/<%= recording %>?startSec=<%= startSec %>&endSec=<%= endSec %>&height=100&highHz=8000"></div>' + 
            '<div class="name"><%= name %></div>' + 
            '</div>');

    ClipView = Backbone.View.extend({
        events: {
            "click" : "doClick"
        },

        initialize: function(){
        },

        doClick: function() {
        },
        
        render: function() {
            var html = clipTemplate(this.model.toJSON());
            this.setElement(html);
            $(this.el).draggable({ revert : "invalid", revertDuration: 1 });
            $(this.el).data("backboneView", this);
            $(this.el).data("clipType", "clip");
            return this;
        }
    });

    ClipCollectionView = Backbone.View.extend({
        el: $('#queryClips'),

        initialize: function() {
            this.collection.bind('sync', this.render, this);
        },

        events:{ 
            "click" : "doClick"
        },

        doClick: function() {
        },


        renderOne: function(clip) {
            var clipView = new ClipView({model:clip});
            this.$el.append(clipView.render().$el);
            return this;
        },

        render: function() {
            var that = this;
            this.$el.empty();
            this.collection.each(function(clip) {
                that.renderOne(clip)
            });
        }
        
    });


    CatalogModel = Backbone.Model.extend({
        
    });

    CatalogCollection = Backbone.Collection.extend({
        url: '/napi/v1/catalogs',

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
        urlRoot: '/napi/v1/catalogClip',
        
    });

    CatalogClipsCollection = Backbone.Collection.extend({
        model: ClipModel,

        initialize: function() {
            var that = this;
            vent.on('catalog:change', function(catalogId){
                that.url = '/napi/v1/catalogClips?catalog=' + catalogId;
                that.fetch();                
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

            $(this.el).draggable({ revert : "invalid", revertDuration: 1 });
            $(this.el).data("backboneView", this);
            $(this.el).data("clipType", "catalogClip");

            return this;
        }
    });


    CatalogClipsView = Backbone.View.extend({
        el: $('#catalogClips'),

        initialize: function() {
            this.collection.bind('sync', this.render, this);
        },

        events:{ 
            'click' : 'doClick'
        },

        renderOne: function(catalogClip) {
            var catalogClipView = new CatalogClipView({model:catalogClip});
            this.$el.append(catalogClipView.render().$el);
            return this;
        },

        render: function() {
            var that = this;
            this.$el.empty();
            this.collection.each(function(catalogClip) {
                that.renderOne(catalogClip)
            });
        }
        
    });

    GameModel = Backbone.Model.extend({
        urlRoot: '/napi/v1/games/',

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

                level.includeChild(queryClip);
                level.includeChild(correctReferenceClip);
                level.includeChild(otherReferenceClip1);
                level.includeChild(otherReferenceClip2);
                level.includeChild(otherReferenceClip3);

                levels.push(level);
            })); 
                

                

            this.levelCollection = new LevelCollection(levels);
            this.levelCollectionView = new LevelCollectionView({collection : this.levelCollection});
            this.levelCollectionView.render();

            // TODO(sness) - Debugging
            window.levelCollection = this.levelCollection;

            
        },
    });

    LevelQueryClipModel = Backbone.Model.extend({
    });

    LevelReferenceClipModel = Backbone.Model.extend({
    });

    LevelModel = Backbone.Model.extend({
        urlRoot: '/napi/v1/levels',

        includeChild: function (child) {
            child.bind('change', this.onChildChange, this);
        },
        
        onChildChange: function (child) {
            this.trigger('change', 'childChange');
        },

        toJSON: function(options) {
            var data = {'game' : this.get("game"), 
                        'queryClip' : this.get("queryClip").id, 
                        'correctReferenceClip' : this.get("correctReferenceClip").id, 
                        'otherReferenceClip1' : this.get("otherReferenceClip1").id, 
                        'otherReferenceClip2' : this.get("otherReferenceClip2").id, 
                        'otherReferenceClip3' : this.get("otherReferenceClip3").id, 
                       };
            return data
        },

        parse: function(data) {
            // TODO(sness) - We should probably parse this data and
            // add new LevelQueryClipModels and
            // LevelReferenceClipModels, but this seems to be
            // working...
        },
    });

    var levelQueryClipTemplate = _.template(
        '<div class="levelClip">' +
            '<div class="image">' + 
            '<img src="/visualizations/spectrogram/<%= recording %>?startSec=<%= startSec %>&endSec=<%= endSec %>&height=100&highHz=8000"></div>' + 
            '<div class="name"><%= name %></div>' + 
            '</div>');


    LevelQueryClipView = Backbone.View.extend({
        events: {
            "click" : "doClick"
        },

        render: function() {
            var html = levelQueryClipTemplate(this.model.toJSON());
            this.setElement(html);

            var that = this;

            $(this.el).droppable({
                drop: function(ev, ui){
                    var droppedClipType = $(ui.draggable).data("clipType");
                    ui.draggable.draggable('option','revert',true);
                    if (droppedClipType == "clip") {
                        var droppedModel = $(ui.draggable).data("backboneView").model;
                        that.model.set({id: droppedModel.get("id"), 
                                        catalogClip : droppedModel.get("catalogClip"), 
                                        name : droppedModel.get("name"), 
                                        startSec : droppedModel.get("startSec"), 
                                        endSec : droppedModel.get("endSec"),
                                        recording : droppedModel.get("recording")
                                       });
                    }
                }
            });

            return this;
        }
    });

    var levelReferenceClipTemplate = _.template(
        '<div class="levelClip">' +
            '<div class="image">' + 
            '<img src="/visualizations/spectrogram/<%= recording %>?startSec=<%= startSec %>&endSec=<%= endSec %>&height=100&highHz=8000"></div>' + 
            '<div class="name"><%= name %></div>' + 
            '</div>');

    LevelReferenceClipView = Backbone.View.extend({
        events: {
            "click" : "doClick"
        },

        render: function() {
            var html = levelReferenceClipTemplate(this.model.toJSON());
            this.setElement(html);

            var that = this;
            $(this.el).droppable({
                drop: function(ev, ui){
                    var dropClipType = $(ui.draggable).data("clipType");
                    ui.draggable.draggable('option','revert',true);
                    if (dropClipType == "catalogClip") {
                        var dropModel = $(ui.draggable).data("backboneView").model;
                        that.model.set({id: dropModel.get("id"), 
                                        name : dropModel.get("name"), 
                                        startSec : dropModel.get("startSec"), 
                                        endSec : dropModel.get("endSec"),
                                        recording : dropModel.get("recording")
                                       });
                    }
                }
            });
            return this;
        }
    });

    LevelCollection = Backbone.Collection.extend({
        model: LevelModel,

        initialize: function() {
            this.bind('add', this.doAdd, this);            
            this.bind('change', this.doChange, this);            
        },

        doAdd: function() {
        },

        doChange: function() {
            this.each(function(level) {
                if (level.get("queryClip").hasChanged() ||
                    level.get("correctReferenceClip").hasChanged() ||
                    level.get("otherReferenceClip1").hasChanged() ||
                    level.get("otherReferenceClip2").hasChanged() ||
                    level.get("otherReferenceClip3").hasChanged()) {
                    level.save(null, { 
                        success:function(a,b,c) { 
                            console.log("LevelCollection doChange success");
                        },
                        error:function(a,b,c) { 
                            console.log("LevelCollection doChange error");
                        }

                    });
                }
            });

        },
    });

    LevelView = Backbone.View.extend({
        events: {
            "click" : "doClick"
        },

        initialize: function() {
            this.model.bind('change', this.render, this);
        },

        doClick: function() {
        },
        
        render: function() {
            console.log("LevelView render");
            this.$el.empty();

            var queryClipView = new LevelQueryClipView({model: this.model.get("queryClip")});
            this.$el.append(queryClipView.render().$el);

            var correctReferenceClipView = new LevelReferenceClipView({model: this.model.get("correctReferenceClip")});
            this.$el.append(correctReferenceClipView.render().$el);

            var otherReferenceClip1View = new LevelReferenceClipView({model: this.model.get("otherReferenceClip1")});
            this.$el.append(otherReferenceClip1View.render().$el);

            var otherReferenceClip2View = new LevelReferenceClipView({model: this.model.get("otherReferenceClip2")});
            this.$el.append(otherReferenceClip2View.render().$el);

            var otherReferenceClip3View = new LevelReferenceClipView({model: this.model.get("otherReferenceClip3")});
            this.$el.append(otherReferenceClip3View.render().$el);

            return this;
        }
    });

    var levelCollectionAddTemplate = _.template('<button type="button" class="add">Add Level</button>');
    
    LevelCollectionView = Backbone.View.extend({
        el: $('#levelBuilder'),

        events:{ 
            "click .add" : "addLevel"
        },

        initialize: function() {
            // this.collection.bind('sync', this.buildLevelModels, this);
            this.collection.bind('all', this.doAll, this);
        },

        renderOne: function(level) {
            var levelView = new LevelView({model:level});
            this.$el.append(levelView.render().$el);
            return this;
        },

        render: function() {
            var that = this;
            this.collection.each(function(level) {
                that.renderOne(level)
            });

            return this;
        }
        
    });


    // Global event dispatcher
    vent = _.extend({}, Backbone.Events);

    var AppRouter = Backbone.Router.extend({

        initialize: function() {
            this.gameModel = new GameModel({ id : window.gameId});
            this.gameModel.fetch();

            // The query clips
            this.clipCollection = new ClipCollection();
            this.clipCollection.fetch();
            this.clipCollectionView = new ClipCollectionView({collection : this.clipCollection});

            // Load the catalogClips for this recording
            this.catalogClipCollection = new CatalogClipsCollection();
            this.catalogClipCollection.url = '/napi/v1/catalogClips?catalog=' + window.catalogId;
            this.catalogClipCollection.fetch();
            this.catalogClipView = new CatalogClipsView({collection : this.catalogClipCollection});

            // The catalogs
            this.catalogCollection = new CatalogCollection();
            this.catalogCollection.fetch();
            this.catalogsView = new CatalogsView({collection : this.catalogCollection});
            
            // TODO(sness) - Debugging
            window.gameModel = this.gameModel;
            window.clipCollection = this.clipCollection;
            window.catalogClipCollection = this.catalogClipCollection;


        },
        
        routes: {
            "": "mainView",
        },
        
        mainView: function() {
        }
        
    });
    
    // Instantiate the router
    app = new AppRouter;
    Backbone.history.start();


});
