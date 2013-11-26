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

from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.conf import settings

import marsyas
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import simplejson

from recordings.models import Recording
from clips.models import Clip
import commands
import os
import settings
from django.utils.encoding import smart_str


def play(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    audioFile = os.path.join(settings.OPENMIR_FILE_PATH, "audio", (str(recording.audioFilename)))
    startSec = float(request.GET.get('startSec', '0'))
    endSec = float(request.GET.get('endSec', str(recording.lengthSec)))
    lowHz = float(request.GET.get('lowHz', '0'))
    highHz = float(request.GET.get('highHz', '22050.'))
    lengthSec = endSec - startSec

    outFile = "/tmp/%s-%i-startSec%f-endSec%f-lowHz%f-highHz%f.mp3" % (os.path.basename(audioFile), recording.id, startSec, endSec, lowHz, highHz)
    
    # Create file with sox
    if lowHz == 0 and highHz == 22050:
        command = "sox %s %s trim %f %f" % (audioFile, outFile, startSec, lengthSec)
    else:
        centerHz = ((highHz - lowHz) / 2.) + lowHz
        widthHz = highHz - lowHz
        command = "sox %s %s bandpass %f %f trim %f %f" % (audioFile, outFile, centerHz, widthHz, startSec, lengthSec)

    out = commands.getoutput(command)

    if (settings.DEBUG):
        # Serve file from Django
        file = open(outFile)
        response = HttpResponse(file.read(), mimetype="audio/wav")
        response['Content-Length'] = os.path.getsize(outFile)
        response['Accept-Ranges'] = 'bytes'
        response['Content-disposition'] = 'attachment;filename=' + outFile;
    else:
        # Serve file from Apache
        response = HttpResponse(mimetype='audio/wav')
        response['Content-Disposition'] = 'attachment; filename=%s' % smart_str(outFile)
        response['Accept-Ranges'] = 'bytes'
        response['X-Sendfile'] = smart_str(outFile)
                                        
    # # Serve file from Django
    # file = open(outFile)
    # response = HttpResponse(file.read(), mimetype="audio/wav")
    # response['Content-Length'] = os.path.getsize(outFile)
    # response['Accept-Ranges'] = 'bytes'
    # response['Content-disposition'] = 'attachment;filename=' + outFile;
        
    return response
    
