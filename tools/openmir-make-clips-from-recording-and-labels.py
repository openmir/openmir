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

def parseFile(inFilename):
    inFile = open(inFilename, "r")
    data = []
    
    line = inFile.readline()
    while line:
        m = re.search('([-0-9.]*)\t([-0-9.]*)\t([a-z]*)', line)
        if m is not None:
            startTime = float(m.group(1))
            endTime = float(m.group(2))
            label = m.group(3)
            item = { 'startTime' : startTime, 'endTime' : endTime, 'label' : label }
            data.append(item)
        
        line = inFile.readline()
    return data
    

def run(inFilename, inRecordingFilename):
    data = parseFile(inFilename)
    recordingId = os.path.basename(inRecordingFilename)[0:-4]
    
    for item in data:
        outputFile = "%s_%s_%.6f_%6f.wav" % (item['label'], recordingId, item['startTime'], item['endTime'])
        timeDelta = item['endTime'] - item['startTime']
        if timeDelta > 0:
            command = "sox %s %s trim %s %s" % (inRecordingFilename, outputFile, item['startTime'], (item['endTime'] - item['startTime']))
            print command
            a = commands.getoutput(command)
        
       

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print "Usage: openmir-make-clips-from-recording-and-labels.py in.txt recording.wav"
        sys.exit(1)
        
    inFilename = sys.argv[1]
    inRecordingFilename = sys.argv[2]
    run(inFilename, inRecordingFilename)
        
