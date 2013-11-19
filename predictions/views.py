from django.shortcuts import render_to_response, render, redirect
from django.core.context_processors import csrf
from django.template import RequestContext

from django.utils import simplejson
from django.http import HttpResponse,HttpResponsePermanentRedirect

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

from celerytasks.tasks import *
# from celerytasks.tasks import celeryRunPrediction
# from celerytasks.tasks import celeryTrainClassifier

from datetime import datetime

import os
import commands
import time
import simplejson as json
import csv
import StringIO

import glob

def index(request):

    predictions = Prediction.objects.all()
    classifiers = Classifier.objects.all()
    recordings = Recording.objects.all()

    return render(request, 'predictions/index.html', {'predictions' : predictions,
                                                            'classifiers' : classifiers,
                                                            'recordings' : recordings})    

def new(request):
    if request.method == 'POST':
        classifier = Classifier.objects.get(pk=request.POST.get("classifier"))
        recording = Recording.objects.get(pk=request.POST.get("recording"))
        prediction = Prediction(classifier = classifier, recording = recording)
        prediction.save()

        # Start a prediction job with celery
        task = celeryRunPrediction.delay(prediction.id)
        prediction.celeryTaskId = task.id
        prediction.predictStartTime = datetime.now()
        prediction.predictEndTime = None
        prediction.predicted = False
        prediction.save()

        return redirect("/predictions", permanent=True)

def recording(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    filenames = glob.glob("%s/predictions/*" % (recording.resultsFilepath))
    data = []
    for filename in filenames:
        data.append({ 'name' : os.path.basename(filename),
                      'filename' : filename})
        
    return HttpResponse(json.dumps(data), content_type="application/json")

def view(request):
    filename = request.GET.get('filename')
    data = []
    with open(filename, 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter='\t', quotechar='"')
        for row in reader:
            if len(row) == 4:
                item = { 'name' : row[2],
                         'startSec' : float(row[0]),
                         'endSec' : float(row[1]),
                         'confidence' : float(row[3]) }
                data.append(item)

    return HttpResponse(simplejson.dumps(data))

