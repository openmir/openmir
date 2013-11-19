from django.shortcuts import render_to_response, redirect
from django.core.context_processors import csrf
from django.template import RequestContext

from django.utils import simplejson as json
from django.http import HttpResponse

from django.core import serializers

from recordings.models import Recording
from clips.models import Clip,ClipList
from classifiers.models import Classifier
from trainingsets.models import Trainingset,TrainingsetClipList
from oapi.trainingsetUtils import convertJsonToTrainingset,convertTrainingsetToJson

from games.models import Game,Level,UserClassification
from games.gameUtils import convertGameToJson

from django.core.servers.basehttp import FileWrapper
import random
from django.utils import simplejson

# def trainingset(request):
#     trainingsets = Trainingset.objects.all()
#     outTrainingsets = convertTrainingsetToJson(trainingsets)
#     return HttpResponse(json.dumps(outTrainingsets))

def trainingsetId(request, trainingsetId):
    trainingset = Trainingset.objects.get(pk=int(trainingsetId))
    
    if request.method == 'GET':
        outTrainingsetJson = convertTrainingsetToJson(trainingset)
        return HttpResponse(outTrainingsetJson, mimetype='application/json')
        
    if request.method == 'PUT':
        data = json.loads(request.raw_post_data)

        # Delete everything corresponding to this trainingset
        for trainingsetClipList in trainingset.trainingsetcliplist_set.all():
            for clipListItem in trainingsetClipList.clipList.cliplistitem_set.all():
                clipListItem.delete()
            trainingsetClipList.clipList.delete()
            trainingsetClipList.delete()

        # Recreate this trainingset from the data
        convertJsonToTrainingset(trainingset,data)

        return HttpResponse(json.dumps({"id" : trainingset.id}))
        
    return HttpResponse("OK")
