# 
#  Copyright (C) 2012-2013 Steven Ness <sness@sness.net>
# 
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 3 of the License, or
#  (at your option) any later version.
# 
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
# 
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
# 

from django.db import models
from django import forms
from django.contrib import admin
import sys

from recordings.models import Recording
from clips.models import Clip,CatalogClip

class Game(models.Model):
    name = models.CharField(max_length = 200)

    def __unicode__(self):
        return self.name

class Level(models.Model):
    game = models.ForeignKey(Game, related_name='levels')
    queryClip = models.ForeignKey(Clip, related_name='queryClip', null=True, blank=True)
    correctReferenceClip = models.ForeignKey(CatalogClip, related_name='correctReferenceClip', null=True, blank=True)
    otherReferenceClip1 = models.ForeignKey(CatalogClip, related_name='otherReferenceClip1', null=True, blank=True)
    otherReferenceClip2 = models.ForeignKey(CatalogClip, related_name='otherReferenceClip2', null=True, blank=True)
    otherReferenceClip3 = models.ForeignKey(CatalogClip, related_name='otherReferenceClip3', null=True, blank=True)
        
    def __unicode__(self):
        return str(self.pk)

class UserClassification(models.Model):
    level = models.ForeignKey(Level, null=True)
    userEvents = models.TextField()
    query = models.ForeignKey(Clip, related_name='userQueryClip', null=True, blank=True)
    reference = models.ForeignKey(Clip, related_name='userReferenceClip', null=True, blank=True)
    remoteAddr = models.CharField(max_length = 50)
    origin = models.CharField(max_length = 200)
    userAgent = models.CharField(max_length = 200)
    guid = models.CharField(max_length = 200)
    correct = models.BooleanField()
    timestamp = models.DateTimeField(auto_now = True, auto_now_add = True)

    def __unicode__(self):
        return str(self.timestamp)

class GameAdmin(admin.ModelAdmin):
    list_display = ['id', 'name'] 

class LevelAdmin(admin.ModelAdmin):
    pass

class UserClassificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'correct', 'query', 'reference', 'origin', 'guid', 'timestamp'] 

admin.site.register(Game, GameAdmin)
admin.site.register(Level, LevelAdmin)
admin.site.register(UserClassification, UserClassificationAdmin)
