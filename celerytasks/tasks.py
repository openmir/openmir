from celery import task
import commands

#from tools.models import *
from classifiers.models import Classifier
from predictions.models import Prediction
from trainingsets.models import Trainingset,TrainingsetClipList
from datetime import datetime
import time
import redis
import simplejson as json
from django.conf import settings
import os
import shutil

@task()
def add(x, y):
    return x + y

@task()
def celeryTrainClassifier(classifierId, data):
    print "celeryTrainClassifier"

    classifier = Classifier.objects.get(pk=int(classifierId))
    mfFilename = "%s/bextract.mf" % (classifierDirectory)
    classifierDirectory = os.path.join(settings.CLASSIFIER_FILE_PATH, classifier.name)
    
    # Run bextract on audio file
    if classifier.runBextract:
        mplFilename = "%s/bextract.mpl" % (classifierDirectory)
        arffFilename = "%s/bextract.arff" % (classifierDirectory)
        command = "/home/sness/marsyas/release/bin/bextract -csv %s -pm -p %s -w %s" % (mfFilename, mplFilename, arffFilename)
        print command
        a = commands.getoutput(command)

    # Store files
    # mfFile = open(mfFilename, "r")
    # mfData = mfFile.read()
    # mplFile = open(mplFilename, "r")
    # mplData = mplFile.read()
    # arffFile = open(arffFilename, "r")
    # arffData = arffFile.read()

    # # TODO(sness) - Reenable this when debugging is done
    # # # Remove temporary audio files when done
    # # for item in data:
    # #     os.remove(item['outputFile'])
    # # os.remove(mfFilename)
    # # os.remove(mplFilename)

    # classifier.mf = mfData
    # classifier.mpl = mplData
    # classifier.arff = arffData
    classifier.trainEndTime = datetime.now()
    classifier.mplFilename = mplFilename
    classifier.trained = True
    classifier.save()
    
    return "OK"

    
@task()
def celeryRunPrediction(predictionId):
    print "celeryRunPrediction"
    
    prediction = Prediction.objects.get(pk=int(predictionId))
    classifierDirectory = os.path.join(settings.CLASSIFIER_FILE_PATH, prediction.classifier.name)

    ts = time.time()
    mplFilename = prediction.classifier.mplFilename
    print "mplFilename=%s" % mplFilename
    # mplFilename = "%s/sfplugin-%i.mpl" % (classifierDirectory, ts)
    # mplFile = open(mplFilename, "w")
    # mplFile.write(prediction.classifier.mpl)
    # mplFile.close()

    # Run sfplugin on this audio, saving the output
    audioFile = os.path.join(settings.OPENMIR_FILE_PATH, "audio", str(prediction.recording.audioFilename))

    predictionDirectory = os.path.join(prediction.recording.resultsFilepath,"predictions")
    if not os.path.exists(predictionDirectory):
        os.makedirs(predictionDirectory)

    resultsFile = "%s/prediction-%i-%s-%i-%s.txt" % (predictionDirectory, prediction.id, prediction.classifier.name, prediction.classifier.id, ts)
    command = "/home/sness/marsyas/release/bin/sfplugin -pl %s %s -pm > %s" % (mplFilename, audioFile, resultsFile)
    print "command="
    print command
    out = commands.getoutput(command)
    print out

    prediction.output = out
    prediction.predictEndTime = datetime.now()
    prediction.predicted = True
    prediction.save()
        
    return "OK"

    
