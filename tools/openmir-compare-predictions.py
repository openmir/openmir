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
    

def run(queryFilename, referenceFilename, chunkSizeSec):
    # - Parse both files
    query = parseFile(queryFilename)
    print query
    # - Find longest timepoint in both files
    # - Loop from 0 seconds to longest
    #   - For each chunk
    #   - Find the length of all labels in this chunk
    #   - Find majority label
    #   - Check to see if the labels match
    # - Increment time by chunkSizeSec
       

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print "Usage: openmir-compare-predictions.py file1.txt file2.txt chunkSizeSec"
        sys.exit(1)
        
    queryFilename = sys.argv[1]
    referenceFilename = sys.argv[2]
    chunkSizeSec = float(sys.argv[3])
    run(queryFilename, referenceFilename, chunkSizeSec)
        
