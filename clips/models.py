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
