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
    

def run(inFilename):
    data = parseFile(inFilename)

    currentSec = 0.0
    
    for item in data:
        # Print out background item
        print "%.6f\t%.6f\t%s" % (currentSec, item['startTime'] - 0.000001, "b")
        
        # Print out label
        print "%.6f\t%.6f\t%s" % (item['startTime'], item['endTime'], item['label'])

        # Update currentSec
        currentSec = item['endTime']
                
       

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print "Usage: openmir-add-background-between-audacity-clips.py in.txt"
        sys.exit(1)
        
    inFilename = sys.argv[1]
    run(inFilename)
        
