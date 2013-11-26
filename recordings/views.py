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
