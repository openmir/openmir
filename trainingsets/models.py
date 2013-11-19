from django.db import models
from django import forms
from django.contrib import admin
import sys
import datetime

from clips.models import ClipList,Catalog,CatalogClip

class Trainingset(models.Model):
    catalog = models.ForeignKey(Catalog)
    name = models.CharField(max_length = 200)
    
    def __unicode__(self):
        return self.name

class TrainingsetClipList(models.Model):
    catalogClip = models.ForeignKey(CatalogClip)
    trainingset = models.ForeignKey(Trainingset)
    clipList = models.ForeignKey(ClipList)

    def __unicode__(self):
        return str(self.id)

    
class TrainingsetAdmin(admin.ModelAdmin):
    pass

admin.site.register(Trainingset, TrainingsetAdmin)
    
