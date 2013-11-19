#!/usr/bin/python

#
#
#


import sys
import os
import datetime
import commands
import re
import time
import simplejson as json

def run(inNextractFilename, inLiblinearFilename, numFrames):

    inNextractFile = open(inNextractFilename, "r")
    inLiblinearFile = open(inLiblinearFilename, "r")

    #
    # Extract the data from the file
    #
    nextractLine = inNextractFile.readline()
    liblinearLine = inLiblinearFile.readline()
    data = []
    while nextractLine:
        nm = re.search('([0-9.]*)', nextractLine)
        time = float(nm.group(1))

        nl = re.search('([0-9.]*)', liblinearLine)
        labelNum = int(nl.group(1))

        item = {'time' : time, 'labelNum' : labelNum}
        data.append(item)

        nextractLine = inNextractFile.readline()
        liblinearLine = inLiblinearFile.readline()

    #
    # Find the highest count label in each window
    #
    currFrame = 0
    windowCount = [0,0,0]
    windows = []
    currTime = -1
    for item in data:
        windowCount[item['labelNum']] += 1
        if currTime == -1:
            currTime = item['time']

        currFrame += 1
        if currFrame > numFrames:
            maxItem = windowCount.index(max(windowCount))
            confidence = float(max(windowCount)) / float(sum(windowCount))
            windows.append({'labelNum' : maxItem, 'confidence' : confidence, 'time': currTime})

            currFrame = 0
            currTime = -1
            windowCount = [0,0,0]

    #
    # Output labels in audacity format
    #
    deltaTime = windows[1]['time'] - 0.001
    for window in windows:
        # TODO(sness) - Don't hardcode orca/background/voice.
        labelNum = window['labelNum']
        if (labelNum == 0):
            label = "b"
        elif (labelNum == 1):
            label = "o"
        elif (labelNum == 2):
            label = "v"
        else:
            label = "unknown"

        print "%.3f\t%.3f\t%s\t%.3f" % (window['time'],
                                        window['time']+deltaTime,
                                        label,
                                        window['confidence'])
       

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print "Usage: openmir-generate-prediction.py nextract.libsvm liblinear.txt numFrames"
        sys.exit(1)
        
    inNextractFilename = sys.argv[1]
    inLiblinearFilename = sys.argv[2]
    numFrames = int(sys.argv[3])
    run(inNextractFilename, inLiblinearFilename, numFrames)
        
