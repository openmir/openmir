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
