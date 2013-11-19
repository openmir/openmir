//
// trainingsetBuilder - A javascript app using backbone.js that uses
//
// sness@sness.net (c) 2012 GPLv3
//

$(document).ready(function () {


    ClipModel = Backbone.Model.extend({
    });

    ClipCollection = Backbone.Collection.extend({
        url: '/api/v1/clips',

        model: ClipModel,
    });

    var clipTemplate = _.template(
        '<div class="clip">' +
            '<div class="image">' + 
            '<img src="/visualizations/spectrogram/<%= recording %>?startSec=<%= startSec %>&endSec=<%= endSec %>&height=100&highHz=8000"></div>' + 
            '<div class="id"><%= id %></div>' + 
            '<div class="name"><%= name %></div>' + 
            '</div>');

    ClipView = Backbone.View.extend({
        events: {
            "mousedown" : "doMousedown"
        },

        initialize: function(){
        },

        doMousedown: function(ev) {
            if ($(this.el).hasClass("selected")) {
                return false;
            }
            if (ev.shiftKey) {
                $(this.el).addClass("selected");
            } else {
                $(".selected").removeClass("selected");
                $(this.el).addClass("selected");
            }
            return false;
        },
        
        render: function() {
            var html = clipTemplate(this.model.toJSON());
            this.setElement(html);
            var that = this;
            $(this.el).draggable(
                { revert : "invalid", 
                  revertDuration: 1, 
                  drag: function(e, ui) {
                      $('.selected').css({
                          top : ui.position.top,
                          left: ui.position.left
                      });
                  }
                });
            $(this.el).data("backbone-view", this);
            $(this.el).data("left", $(this.el).position().left);
            $(this.el).data("top", $(this.el).position().top);
            $(this.el).data("name", this.model.get("name"));
            return this;
        }
    });

    ClipsView = Backbone.View.extend({
        initialize: function() {
            this.collection.bind('sync', this.render, this);
        },

        events:{ 
            "mousedown" : "doMousedown"
        },

        doMousedown: function() {
            $(".selected").removeClass("selected");
        },


        renderOne: function(clip) {
            var clipView = new ClipView({model:clip});
            this.$el.append(clipView.render().$el);
            return this;
        },

        render: function() {
            console.log("ClipsView render");
            var that = this;
            this.$el.empty();
            this.collection.each(function(clip) {
                that.renderOne(clip)
            });
        }
        
    });


    ControlsModel = Backbone.Model.extend({
        defaults : {
            recording : "",
            name : ""
        },

        initialize: function() {
            this.bind('change', this.doChange);
        },

        doChange: function() {
            console.log("ControlsModel doChange");
            console.log(this.attributes);
            var url = '/api/v1/clips?catalog=' + window.catalogId;
            var recording = this.get('recording');
            var name = this.get('name');
            if (recording) {
                url += '&recording=' + recording;
            }
            if (name) {
                url += '&name=' + name;
            }
            console.log('url=' + url);

            this.clipCollection.url = url;
            this.clipCollection.fetch();
            // $.getJSON(url, function(clipsJson) { 
            //     var clips = parseDjangoJsonClips(clipsJson)
            //     window.clips.reset(clips);
            // });
            
        }

    });
    
    ControlsView = Backbone.View.extend({
        events: { 
            'keyup input': 'doChange',
            'click .selectAll' : 'doSelectAll'
        },

        doSelectAll : function() {
            $("#clips .clip").addClass("selected");
        },

        doChange: function() {
            var recording = $('input:text[name=recording]').val();
            var name = $('input:text[name=name]').val();
            this.model.set({name: name, recording : recording});
        },

        render: function(){
            $(this.el).empty();
            var template = _.template($("#controlsTemplate").html());
            $(this.el).append(template(this.model.toJSON()));
        }

    });

    function parseDjangoJsonClips(clipsJson) {
        // Turn the clips into backbone models
        var clips = []
        _.each(clipsJson, (function(cj) {
            var c = {id : cj.pk}
            _.extend(c, cj.fields);
            var clip = new ClipModel(c);
            clips.push(clip);
        }));
        return clips;
    }

    TrainingSetClipModel = Backbone.Model.extend({
    });

    TrainingSetClipList = Backbone.Collection.extend({
        model: TrainingSetClipModel,
    });

    TrainingSetModel = Backbone.Model.extend({
        urlRoot: '/oapi/v1/trainingsets/',

        initialize: function() {
            this.bind('sync', this.doSync);
        },

        // Convert the raw clip lists from the server into backbone
        // collections.
        doSync: function(e) {
            var clipLists = this.get("rawClipLists");
            var tmpClipLists = []
            var that = this;
            _.each(clipLists, function(cl) {
                var clips = []
                _.each(cl.clips, function(c) {
                    var clip = new TrainingSetClipModel(c);
                    clips.push(clip);
                });
                trainingsetClipList = new TrainingSetClipList(clips);
                trainingsetClipList.name = cl.name;
                // that.addClipList(trainingsetClipList);
                tmpClipLists.push(trainingsetClipList);
            });
            this.set("clipLists", tmpClipLists);
        },
    });

    var trainingsetClipTemplate = _.template(
        '<div class="clip">' +
            '<div class="close"><p>X</p></div>' +
            '<div class="image">' + 
            '<img src="/visualizations/spectrogram/<%= recording %>?startSec=<%= startSec %>&endSec=<%= endSec %>&height=100&highHz=8000"></div>' + 
            '<div class="id"><%= id %></div>' + 
            '<div class="name"><%= name %></div>' + 
            '</div>');

    TrainingSetClipView = Backbone.View.extend({
        events: {
            "click .close" : "doCloseClick"
        },

        doCloseClick: function() {
            // this.model.destroy();
            this.model.collection.remove(this.model);
        },

        render: function() {
            var html = trainingsetClipTemplate(this.model.toJSON());
            this.setElement(html);
            return this;
        }

    });

    TrainingSetClipListView = Backbone.View.extend({
        className : "trainingsetClipList",

        initialize: function() {
            this.collection.bind('add', this.render, this);
            this.collection.bind('remove', this.testRemove, this);
        },

        testRemove: function() {
            this.render();
        },
        
        renderOne: function(clip) {
            var trainingsetClipView = new TrainingSetClipView({model:clip});
            this.$el.append(trainingsetClipView.render().$el);
            return this;
        },

        render: function() {
            this.$el.empty();

            this.collection.each(function(clip) {
                this.renderOne(clip);
            }, this);

            this.$el.append("<div>" + this.collection.name + "</div>");

            var that = this;
            $(this.el).droppable({
                drop: function(ev, ui){
                    var droppedClipName = $(ui.draggable).data("name");

                    var selected = $(".selected").each( function() {
                        $(this).draggable('option','revert',true);
                        
                        $(this).animate({
                            "left": $("#draggable").data("left"),
                            "top": $("#draggable").data("top")
                        }, 1);
                        
                        $(this).removeClass("selected");
                        
                        if (droppedClipName == that.collection.name) {
                            var model = $(this).data("backbone-view").model;
                            that.collection.add(model.clone());
                        } 
                    });
                },
            });

            return this;
        }
        
    });

    TrainingSetView = Backbone.View.extend({ 
        events: {
            "click .saveButton" : "doSave"
        },

        initialize: function() {
            this.model.bind('change', this.render, this);
        },
        
        doSave: function() {
            console.log("saving");
            this.model.save();
        },

        renderOne: function(clipList) {
            var trainingsetClipListView = new TrainingSetClipListView({ collection : clipList});
            var html = trainingsetClipListView.render().$el;
            return html;
        },

        render: function() {
            this.$el.empty();
            $(this.el).append(_.template($("#trainingsetView").html()));
            var clipListTemplate = _.template($("#clipListTemplate").html());
            var clipLists = this.model.get("clipLists");
            if (clipLists) {
                for (var i=0 ; i < clipLists.length; i++) {
                    this.$el.append(this.renderOne(clipLists[i]));
                }
            }
            
            return this;
        }
    });

    var AppRouter = Backbone.Router.extend({

        initialize: function() {
            this.trainingsetModel = new TrainingSetModel({id : window.trainingsetId});
            this.trainingsetModel.fetch();
            this.trainingsetView = new TrainingSetView({el : $('#trainingset'), model: this.trainingsetModel});

            this.clipCollection = new ClipCollection();
            this.clipCollection.url = '/api/v1/clips?catalog=' + window.catalogId;
            this.clipCollection.fetch();
            this.clipsView = new ClipsView({el : $('#clips'), collection : this.clipCollection});

            this.controls = new ControlsModel();
            this.controls.clipCollection = this.clipCollection;
            this.controlsView = new ControlsView({el : $("#controls"), model : this.controls});
            this.controlsView.render();

            // TODO(sness) - Debugging
            window.trainingsetModel = this.trainingsetModel;
            window.clipCollection = this.clipCollection;

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
