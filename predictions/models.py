from django.db import models
from django import forms
from django.contrib import admin
import sys

from recordings.models import Recording
from clips.models import ClipList,Catalog
from classifiers.models import Classifier

class Prediction(models.Model):
    classifier = models.ForeignKey(Classifier)
    recording = models.ForeignKey(Recording)
    celeryTaskId = models.CharField(max_length = 200, null = True, blank = True)
    predictStartTime = models.DateTimeField(null = True, blank =  True)
    predictEndTime = models.DateTimeField(null = True, blank = True)
    predicted = models.BooleanField(default = False)
    output = models.TextField(null = True, blank = True)
    
    def __unicode__(self):
        return self.name

class PredictionAdmin(admin.ModelAdmin):
    pass

admin.site.register(Prediction, PredictionAdmin)
    
