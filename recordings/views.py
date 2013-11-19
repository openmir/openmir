from django.shortcuts import render_to_response, render
from django.core.context_processors import csrf
from django.template import RequestContext

from recordings.models import Recording
from clips.models import Clip,ClipList
from django.core import serializers

def index(request):
    recordings = Recording.objects.all()[:100]
    return render(request, 'recordings/index.html', {
            'recordings' : recordings,
            })

def show(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    return render(request, 'recordings/show.html', {'recording' : recording})    

def dataview(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    return render(request, 'recordings/dataview.html', {'recording' : recording})    

def abmiview(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    return render(request, 'recordings/abmiview.html', {'recording' : recording})    
