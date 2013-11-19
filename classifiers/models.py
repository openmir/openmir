from django.db import models
from django import forms
from django.contrib import admin
import sys

from recordings.models import Recording
from clips.models import ClipList,Catalog
from trainingsets.models import Trainingset

class Classifier(models.Model):
    name = models.CharField(max_length = 200)
    description = models.TextField(null = True, blank = True)
    options = models.CharField(max_length = 200)
    trainingset = models.ForeignKey(Trainingset)
    catalog = models.ForeignKey(Catalog)
    celeryTaskId = models.CharField(max_length = 200, null = True, blank = True)
    trainStartTime = models.DateTimeField(null = True, blank =  True)
    trainEndTime = models.DateTimeField(null = True, blank = True)
    trained = models.BooleanField(default = False)
    mplFilename = models.CharField(max_length = 200, null = True, blank = True)
    # filepath = models.CharField(max_length = 200)
    # mf = models.TextField(null = True, blank = True)
    # arff = models.TextField(null = True, blank = True)
    # mpl = models.TextField(null = True, blank = True)
    
    def __unicode__(self):
        return self.name

    
class ClassifierAdmin(admin.ModelAdmin):
    pass

admin.site.register(Classifier, ClassifierAdmin)
