from django.shortcuts import render_to_response, render, redirect
from django.core.context_processors import csrf
from django.template import RequestContext

from django.utils import simplejson
from django.http import HttpResponse

from django.core import serializers

from classifiers.models import Classifier
from predictions.models import Prediction
from trainingsets.models import Trainingset,TrainingsetClipList
from clips.models import Clip,ClipList
from recordings.models import Recording

from django.core.servers.basehttp import FileWrapper

from classifiers.serializers import ClassifierSerializer
from rest_framework import viewsets
from rest_framework.decorators import link

#from celery import Celery
from celerytasks.tasks import celeryRunPrediction
from celerytasks.tasks import celeryTrainClassifier

from datetime import datetime

import os
import commands
import time
import simplejson as json
import csv
import StringIO
from django.conf import settings
import os
import shutil

def index(request):
    classifiers = Classifier.objects.all()
    trainingsets = Trainingset.objects.all()
    return render(request, 'classifiers/index.html', { 'classifiers' : classifiers, 'trainingsets' : trainingsets })

def new(request):
    if request.method == 'POST':
        print "classifiers/views.py new"
        doTrain = request.POST.get("train")        
        trainingset = Trainingset.objects.get(pk=request.POST.get("trainingset"))
        classifier = Classifier(name = request.POST.get("name"),
                                description = request.POST.get("description"),
                                options = request.POST.get("options"),
                                trainingset = trainingset,
                                catalog = trainingset.catalog)
        classifier.save()

        data = []
        for trainingsetClipList in classifier.trainingset.trainingsetcliplist_set.all():
            clipList = trainingsetClipList.clipList
            for clip in clipList.clips.all():
                data.append({'recordingName' : clip.recording.name,
                             'recordingId' : clip.recording.id,
                             'startSec' : clip.startSec,
                             'endSec' : clip.endSec,
                             'clipId' : clip.id,
                             'label' : trainingsetClipList.catalogClip.name
                             })

        classifierDirectory = os.path.join(settings.OPENMIR_FILE_PATH, "classifiers", classifier.name)
        if os.path.exists(classifierDirectory):
            shutil.rmtree(classifierDirectory)
        os.makedirs(classifierDirectory)

        # clipsDirectory = "/global/scratch/sness/openmir/clips"
        clipsDirectory = os.path.join(settings.OPENMIR_FILE_PATH, "clips")

        print "classifierDirectory=%s" % classifierDirectory
        print "clipsDirectory=%s" % clipsDirectory

        print "data="
        print data
        
        # Add a name for the output file that will be generated
        for item in data:
            # newAudioFile = item['recordingName'].replace("/","_")
            print item
            newAudioFile = "%i_%s" % (item['clipId'], item['label'])
            # item['inputFile'] = "/global/scratch/sness/openmir/audio/%s.wav" % (item['recordingName'])
            item['inputFile'] = os.path.join(settings.OPENMIR_FILE_PATH, "audio", ("%s.wav" % item['recordingName']))

            recordingDirectory = os.path.join(clipsDirectory, str(item['recordingId']))
            if os.path.exists(recordingDirectory):
                shutil.rmtree(recordingDirectory)
            os.makedirs(recordingDirectory)
            
            item['outputFile'] = "%s/%s/%s-%s-%s.wav" % (clipsDirectory, item['recordingId'], newAudioFile, item['startSec'], item['endSec'])


        # Run sox on each input file
        for item in data:
            startSec = float(item['startSec'])
            endSec = float(item['endSec'])
            lengthSec = endSec - startSec
            command = "sox -R %s -c 1 %s trim %f %f" % (item['inputFile'], (os.path.join(clipsDirectory, item['outputFile'])), startSec, lengthSec)
            print command
            a = commands.getoutput(command)
            print a

        # Make .mf file
        mfFilename = "%s/bextract.mf" % (classifierDirectory)
        mfFile = open(mfFilename, "w")
        for item in data:
            mfFile.write("%s\t%s\n" % (item['outputFile'], item['label']))
        mfFile.close()

        if doTrain:
            return redirect("/classifiers/train/%i" % classifier.id)
        else:
            return redirect("/classifiers")

def show(request, classifierId):
    classifier = Classifier.objects.get(pk=int(classifierId))
    return render(request, 'classifiers/show.html', {'classifier' : classifier})    


def train(request, classifierId):
    classifier = Classifier.objects.get(pk=int(classifierId))

    # Start a classifier job with celery
    task = celeryTrainClassifier.delay(classifier.id)
    classifier.celeryTaskId = task.id
    classifier.trainStartTime = datetime.now()
    classifier.trainEndTime = None
    classifier.trained = False
    classifier.save()

    return redirect("/classifiers")
    
class ClassifierViewSet(viewsets.ModelViewSet):
    queryset = Classifier.objects.all()
    serializer_class = ClassifierSerializer

