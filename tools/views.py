from django.shortcuts import render_to_response, render, redirect
from django.core.context_processors import csrf
from django.template import RequestContext

from django.utils import simplejson
from django.http import HttpResponse

from django.core import serializers

from recordings.models import Recording
from clips.models import Clip,ClipList,Catalog,CatalogClip
from classifiers.models import Classifier
from trainingSets.models import TrainingSet,TrainingSetClipList
from games.models import Game,Level,UserClassification

from django.core.servers.basehttp import FileWrapper
from django.contrib.auth.decorators import login_required

from celerytest.tasks import celeryTrainClassifier

from datetime import datetime

import csv

@login_required
def recordingAnnotator(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    return render(request, 'tools/recordingAnnotator.html', {'recording' : recording})    

@login_required
def trainingSetBuilder(request, trainingSetId):
    trainingSet = TrainingSet.objects.get(pk=int(trainingSetId))
    trainingSetJson = convertTrainingSetToJson(trainingSet)

    clips = Clip.objects.all()[0:10]
    clipsJson = serializers.serialize("json", clips.all())
    
    return render(request, 'tools/trainingSetBuilder.html', {
            "trainingSetJson" : trainingSetJson,
            "clipsJson" : clipsJson,
            })

@login_required
def recordingPitchViewer(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    return render(request, 'tools/recordingPitchViewer.html', {'recording' : recording})

@login_required
def recordingAuditoryImageViewer(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    return render(request, 'tools/recordingAuditoryImageViewer.html', {'recording' : recording})

@login_required
def gameBuilder(request, gameId):
    game = Game.objects.get(pk=int(gameId))
    return render(request, 'tools/gameBuilder.html', {"game" : game})

@login_required
def gamesViewer(request):
    games = Game.objects.all()[:3]

    data = []
    for game in games:
        for level in game.level_set.all():
            item = {}
            item['name'] = "Game %s : Level %s" % (game.id, level.id)
            item['gameName'] = "%s" % (game.name)
            item['queryClip'] = level.queryClip
            item['correctReferenceClip'] = level.correctReferenceClip
            item['numCorrectReferenceClip'] = len(UserClassification.objects.filter(level=level,reference=level.correctReferenceClip))
            item['otherReferenceClip1'] = level.otherReferenceClip1
            item['numOtherReferenceClip1'] = len(UserClassification.objects.filter(level=level,reference=level.otherReferenceClip1))
            item['otherReferenceClip2'] = level.otherReferenceClip2
            item['numOtherReferenceClip2'] = len(UserClassification.objects.filter(level=level,reference=level.otherReferenceClip2))
            item['otherReferenceClip3'] = level.otherReferenceClip3
            item['numOtherReferenceClip3'] = len(UserClassification.objects.filter(level=level,reference=level.otherReferenceClip3))
            
            data.append(item)
    
    return render(request, 'tools/gamesViewer.html', {"games" : games, "data" : data})

def buildTrainingSetFromGames(request):
    print "buildTrainingSetFromGames"
    buildType = ""
    gameList = []
    
    for k,v in request.GET.iteritems():
        if "buildType" in k:
            buildType = v
        if "gameId" in k:
            gameList.append(int(k.split("-")[1]))

    print "buildType=%s" % buildType
    print "gameList"
    print gameList
    
    return redirect("/classifiers")
    

