from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext
from django.http import HttpResponse
from django.http import HttpResponseRedirect

import marsyas
import numpy as np
from scipy.misc import imresize, toimage
import matplotlib
import matplotlib.cbook
matplotlib.use('Agg')
import matplotlib.pyplot as plt
       
import simplejson
import os
import settings

from recordings.models import Recording
from clips.models import Clip

from median1 import medfilt1

from django.views.decorators.cache import cache_page

#
# Generate a spectrogram PNG
#
@cache_page(60 * 15)
def spectrogram(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    #    audioFile = "/global/scratch/sness/openmir/audio/%s.wav" % (str(recording.name))
    audioFile = os.path.join(settings.OPENMIR_FILE_PATH, "audio", (str(recording.audioFilename)))
    startSec = float(request.GET.get('startSec', '0'))
    endSec = float(request.GET.get('endSec', '1.000'))
    lowHz = int(request.GET.get('lowHz', '0'))
    highHz = int(request.GET.get('highHz', 44100 / 2))

    # Variables from request
    winSize = int(request.GET.get('winSize', '1024'))
    # TODO(sness) - Make hopSize work
    hopSize = winSize
    #    hopSize = int(request.GET.get('hopSize', '1024'))
    width = request.GET.get('width', 'native')
    height = request.GET.get('height', 'native')
    spectrumType = request.GET.get('spectrumType', 'decibels')
    #spectrumType = request.GET.get('spectrumType', 'magnitude')

    # Marsyas network
    mng = marsyas.MarSystemManager()

    net = mng.create("Series","series")
    net.addMarSystem(mng.create("SoundFileSource", "src"))
    # net.addMarSystem(mng.create("Stereo2Mono", "s2m"));
    net.addMarSystem(mng.create("ShiftInput", "si"));
    net.addMarSystem(mng.create("Windowing", "win"));
    net.addMarSystem(mng.create("Spectrum","spk"));
    net.addMarSystem(mng.create("PowerSpectrum","pspk"))

    # Update Marsyas controls
    net.updControl("PowerSpectrum/pspk/mrs_string/spectrumType",
                   marsyas.MarControlPtr.from_string(str(spectrumType)))
    net.updControl("SoundFileSource/src/mrs_string/filename",
                   marsyas.MarControlPtr.from_string(audioFile))
    net.updControl("SoundFileSource/src/mrs_natural/inSamples", hopSize)
    net.updControl("ShiftInput/si/mrs_natural/winSize", winSize)
    net.updControl("mrs_natural/inSamples", int(hopSize))

    # Sample rate and samples per tick
    networkSampleRate = net.getControl("mrs_real/osrate").to_real()
    soundFileSampleRate = net.getControl("SoundFileSource/src/mrs_real/osrate").to_real()
    insamples = net.getControl("SoundFileSource/src/mrs_natural/inSamples").to_natural()
    
    # Calculate values
    samplesToSkip = int(soundFileSampleRate * (startSec))
    durationSec = (endSec - startSec)
    ticksToRun = int(durationSec * networkSampleRate)
    _height = winSize / 2

    # Move to the correct position in the file
    net.updControl("SoundFileSource/src/mrs_natural/moveToSamplePos", samplesToSkip)

    # The array to be displayed to the user
    out = np.zeros( (_height,ticksToRun), dtype=np.double )

    # Tick the network until we are done
    for x in range(0,ticksToRun):
        net.tick()
        data = net.getControl("mrs_realvec/processedData").to_realvec()
        for y in range(0,_height):
            out[(_height - y - 1),x] = data[y]

    # Normalize and make black on white    
    out /= np.max(np.abs(out))
    out = 1.0 - out

    nyquist = 44100 / 2.;
    bins = out.shape[0]
    lowBin = int((bins / nyquist) * lowHz);
    highBin = int((bins / nyquist) * highHz);

    halfWinSize = int(hopSize / 2)
    out = out[halfWinSize - highBin:halfWinSize - lowBin, :]

    # Resize and convert the array to an image
    if (height == "native") and (width == "native"):
        height = winSize / 2
        width = hopSize * durationSec

    if (height != "native") and (width == "native"):
        pxPerItem = int(height) / float(winSize / 2.)
        # TODO(sness) - Why do we have to multiply this by 4?  Check the math above
        width = int(ticksToRun * pxPerItem) * 4

    # out = smp.imresize(out,(int(height),int(width)))
    # im = smp.toimage(out)
    resize = imresize(out,(int(height),int(width)))
    im = toimage(resize)
               

    # Output a png
    response = HttpResponse(mimetype="image/png")
    im.save(response, "PNG")

    return response

#
# The output of AubioYin
#
@cache_page(60 * 15)
def yin(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    # audioFile = "/global/scratch/sness/openmir/audio/%s.wav" % (str(recording.name))
    audioFile = os.path.join(settings.OPENMIR_FILE_PATH, "audio", (str(recording.audioFilename)))
    startSec = float(request.GET.get('startSec', '0'))
    endSec = float(request.GET.get('endSec', '1.000'))
    highHzCutoff = int(request.GET.get('highHzCutoff', '3000'))
    lowHzCutoff = int(request.GET.get('lowHzCutoff', '0'))
    highHzWrap = int(request.GET.get('highHzWrap', '3000'))
    lowHzWrap = int(request.GET.get('lowHzWrap', '0'))
    tolerance = float(request.GET.get('tolerance', '0.15'))
    energyCutoff = float(request.GET.get('energyCutoff', '0.'))
    medianFilter = float(request.GET.get('medianFilter', '1'))
    histogramBins = int(request.GET.get('histogramBins', '0'))

    # Variables from request
    winSize = int(request.GET.get('winSize', '1024'))
    hopSize = int(request.GET.get('hopSize', '1024'))

    # Create net
    mng = marsyas.MarSystemManager()
    net = mng.create("Series","series")

    # Add the MarSystems
    net.addMarSystem(mng.create("SoundFileSource", "src"))
    net.addMarSystem(mng.create("Stereo2Mono", "s2m"));
    net.addMarSystem(mng.create("ShiftInput", "si"));

    # Fanout for calculating both Yin and Rms
    fanout = mng.create("Fanout","fanout")
    fanout.addMarSystem(mng.create("AubioYin", "yin"));
    fanout.addMarSystem(mng.create("Rms", "rms"));
    net.addMarSystem(fanout)

    # Update Marsyas controls
    net.updControl("SoundFileSource/src/mrs_string/filename", marsyas.MarControlPtr.from_string(audioFile))
    net.updControl("ShiftInput/si/mrs_natural/winSize", winSize)
    net.updControl("mrs_natural/inSamples", int(hopSize))

    fanout.updControl("AubioYin/yin/mrs_real/tolerance", tolerance)

    # Calculate values
    soundFileSampleRate = net.getControl("SoundFileSource/src/mrs_real/osrate").to_real()
    samplesToSkip = int(soundFileSampleRate * (startSec))
    secPerTick = hopSize / soundFileSampleRate
    durationSec = endSec - startSec
    ticksToRun = int(durationSec / secPerTick)

    # Move to the correct position in the file
    net.updControl("SoundFileSource/src/mrs_natural/moveToSamplePos", samplesToSkip)

    outTimes = []
    outPitches = []
    for i in range(0,ticksToRun):
        currentTime = (i * secPerTick) + startSec
        pitch = net.getControl("mrs_realvec/processedData").to_realvec()[0]
        rms = net.getControl("mrs_realvec/processedData").to_realvec()[1]
        if pitch > highHzCutoff:
            pitch = highHzCutoff
        if pitch < lowHzCutoff:
            pitch = lowHzCutoff
        pitch = ((pitch - lowHzWrap) % (highHzWrap - lowHzWrap)) + lowHzWrap

        if rms < energyCutoff:
            pitch = -1.

        outTimes.append(currentTime)
        outPitches.append(pitch)
        net.tick()

    if medianFilter > 1:
        outPitches = medfilt1(outPitches,medianFilter)

    # if histogramBins > 1:
    #     for i in range(0, len(outPitches)):
    #         outPitches[i] = outPitches[i]
        
    outData = []
    for i in range(0, len(outTimes)):
        outData.append([outTimes[i], outPitches[i]])
        
    responseJson = simplejson.dumps(outData)
    return HttpResponse(responseJson, mimetype='application/json')

#
# The energy of the signal
#
@cache_page(60 * 15)
def energy(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    audioFile = os.path.join(settings.OPENMIR_FILE_PATH, "audio", (str(recording.audioFilename)))
    startSec = float(request.GET.get('startSec', '0'))
    endSec = float(request.GET.get('endSec', '1.000'))

    # Variables from request
    winSize = int(request.GET.get('winSize', '1024'))
    hopSize = int(request.GET.get('hopSize', '1024'))

    # Create net
    mng = marsyas.MarSystemManager()
    net = mng.create("Series","series")

    # Add the MarSystems
    net.addMarSystem(mng.create("SoundFileSource", "src"))
    net.addMarSystem(mng.create("Rms", "Rms"));

    # # Update Marsyas controls
    net.updControl("SoundFileSource/src/mrs_string/filename", marsyas.MarControlPtr.from_string(audioFile))

    # Calculate values
    soundFileSampleRate = net.getControl("SoundFileSource/src/mrs_real/osrate").to_real()
    samplesToSkip = int(soundFileSampleRate * (startSec))
    secPerTick = hopSize / soundFileSampleRate
    durationSec = endSec - startSec
    ticksToRun = int(durationSec / secPerTick)

    # Move to the correct position in the file
    net.updControl("SoundFileSource/src/mrs_natural/moveToSamplePos", samplesToSkip)
    net.updControl("mrs_natural/inSamples", hopSize)
    
    outData = []
    for i in range(0,ticksToRun):
        currentTime = (i * secPerTick) + startSec
        data = net.getControl("mrs_realvec/processedData").to_realvec()[0]
        outData.append([currentTime, data])
        net.tick()
        
    responseJson = simplejson.dumps(outData)
    return HttpResponse(responseJson, mimetype='application/json')


#
# Generate a waveform PNG
#
@cache_page(60 * 15)
def waveform(request, recordingId):
    recording = Recording.objects.get(pk=int(recordingId))
    audioFile = os.path.join(settings.OPENMIR_FILE_PATH, "audio", (str(recording.audioFilename)))
    startSec = float(request.GET.get('startSec', '0'))
    endSec = float(request.GET.get('endSec', '1.000'))
    lowHz = int(request.GET.get('lowHz', '0'))
    highHz = int(request.GET.get('highHz', 44100 / 2))

    # Variables from request
    winSize = int(request.GET.get('winSize', '1024'))
    hopSize = int(request.GET.get('hopSize', '1024'))
    width = request.GET.get('width', 'native')
    height = request.GET.get('height', 'native')

    # Marsyas network
    mng = marsyas.MarSystemManager()

    net = mng.create("Series","series")
    net.addMarSystem(mng.create("SoundFileSource", "src"))
    net.addMarSystem(mng.create("Stereo2Mono", "s2m"));
    net.addMarSystem(mng.create("ShiftInput", "si"));
    net.addMarSystem(mng.create("Windowing", "win"));
    net.addMarSystem(mng.create("Rms","Rms"));

    # Update Marsyas controls
    net.updControl("SoundFileSource/src/mrs_string/filename",
                   marsyas.MarControlPtr.from_string(audioFile))
    net.updControl("SoundFileSource/src/mrs_natural/inSamples", hopSize)
    net.updControl("ShiftInput/si/mrs_natural/winSize", winSize)
    net.updControl("mrs_natural/inSamples", int(hopSize))

    # Sample rate and samples per tick
    networkSampleRate = net.getControl("mrs_real/osrate").to_real()
    soundFileSampleRate = net.getControl("SoundFileSource/src/mrs_real/osrate").to_real()
    insamples = net.getControl("SoundFileSource/src/mrs_natural/inSamples").to_natural()
    
    # Calculate values
    samplesToSkip = int(soundFileSampleRate * (startSec))
    durationSec = (endSec - startSec)
    ticksToRun = int(durationSec * networkSampleRate)

    # Move to the correct position in the file
    net.updControl("SoundFileSource/src/mrs_natural/moveToSamplePos", samplesToSkip)

    # The array to be displayed to the user
    out = np.zeros( (ticksToRun), dtype=np.double )

    # Tick the network until we are done
    for x in range(0,ticksToRun):
        net.tick()
        data = net.getControl("mrs_realvec/processedData").to_realvec()
        for y in range(0,_height):
            out[(_height - y - 1),x] = data[y]

    # Normalize and make black on white    
    out /= np.max(np.abs(out))
    out = 1.0 - out

    nyquist = 44100 / 2.;
    bins = out.shape[0]
    lowBin = int((bins / nyquist) * lowHz);
    highBin = int((bins / nyquist) * highHz);

    halfWinSize = int(hopSize / 2)
    out = out[halfWinSize - highBin:halfWinSize - lowBin, :]

    # Resize and convert the array to an image
    if (height == "native") and (width == "native"):
        height = winSize / 2
        width = hopSize * durationSec

    if (height != "native") and (width == "native"):
        pxPerItem = int(height) / float(winSize / 2.)
        # TODO(sness) - Why do we have to multiply this by 4?  Check the math above
        width = int(ticksToRun * pxPerItem) * 4

    # out = smp.imresize(out,(int(height),int(width)))
    # im = smp.toimage(out)
    resize = imresize(out,(int(height),int(width)))
    im = toimage(resize)
               

    # Output a png
    response = HttpResponse(mimetype="image/png")
    im.save(response, "PNG")

    return response
