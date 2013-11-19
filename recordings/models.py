from django.db import models
from django import forms
from django.contrib import admin
import sys
import datetime

class Recording(models.Model):
    name = models.CharField(max_length = 200)
    audioFilename = models.CharField(max_length = 200)
    resultsFilepath = models.CharField(max_length = 200)
    lengthSec = models.FloatField()
    channels = models.IntegerField()
    sampleRate = models.FloatField()
    
    def __unicode__(self):
        return self.name
    
class RecordingAdmin(admin.ModelAdmin):
    pass

admin.site.register(Recording, RecordingAdmin)
