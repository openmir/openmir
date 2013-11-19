from django.db import models
from django import forms
from django.contrib import admin
import sys

from recordings.models import Recording

class Catalog(models.Model):
    name = models.CharField(max_length = 200)

    def __unicode__(self):
        return self.name

class CatalogClip(models.Model):
    name = models.CharField(max_length = 200)
    catalog = models.ForeignKey(Catalog)
    recording = models.ForeignKey(Recording)
    startSec = models.FloatField()
    endSec = models.FloatField()

    def __unicode__(self):
        return self.name

class Clip(models.Model):
    recording = models.ForeignKey(Recording)
    catalogClip = models.ForeignKey(CatalogClip)
    comments = models.TextField()
    data = models.TextField()
    startSec = models.FloatField()
    endSec = models.FloatField()

    @property
    def name(self):
        return self.catalogClip.name
            
    def __unicode__(self):
        return self.name

class ClipList(models.Model):
    clips = models.ManyToManyField(Clip)
    
    def __unicode__(self):
        return self.name
    
class ClipAdmin(admin.ModelAdmin):
    pass

admin.site.register(Clip, ClipAdmin)
