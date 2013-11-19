from django.utils import simplejson

def convertGameToJson(game,levels):
    outLevels = []
    
    for level in levels:
        l = {}
        l['id'] = level.id
        l['gameId'] = game.id

        l['queryClip'] = {}
        if level.queryClip:
            l['queryClip']['id'] = level.queryClip.id
            l['queryClip']['recording'] = level.queryClip.recording.id
            l['queryClip']['startSec'] = level.queryClip.startSec
            l['queryClip']['endSec'] = level.queryClip.endSec
            l['queryClip']['name'] = level.queryClip.name
            l['queryClip']['title'] = 'queryClip'

        l['correctReferenceClip'] = {}
        if level.correctReferenceClip:
            l['correctReferenceClip']['id'] = level.correctReferenceClip.id
            l['correctReferenceClip']['recording'] = level.correctReferenceClip.recording.id
            l['correctReferenceClip']['startSec'] = level.correctReferenceClip.startSec
            l['correctReferenceClip']['endSec'] = level.correctReferenceClip.endSec
            l['correctReferenceClip']['name'] = level.correctReferenceClip.name
            l['correctReferenceClip']['title'] = 'correct'

        l['otherReferenceClip1'] = {}
        if level.otherReferenceClip1:
            l['otherReferenceClip1']['id'] = level.otherReferenceClip1.id
            l['otherReferenceClip1']['recording'] = level.otherReferenceClip1.recording.id
            l['otherReferenceClip1']['startSec'] = level.otherReferenceClip1.startSec
            l['otherReferenceClip1']['endSec'] = level.otherReferenceClip1.endSec
            l['otherReferenceClip1']['name'] = level.otherReferenceClip1.name
            l['otherReferenceClip1']['title'] = 'other 1'

        l['otherReferenceClip2'] = {}
        if level.otherReferenceClip2:
            l['otherReferenceClip2']['id'] = level.otherReferenceClip2.id
            l['otherReferenceClip2']['recording'] = level.otherReferenceClip2.recording.id
            l['otherReferenceClip2']['startSec'] = level.otherReferenceClip2.startSec
            l['otherReferenceClip2']['endSec'] = level.otherReferenceClip2.endSec
            l['otherReferenceClip2']['name'] = level.otherReferenceClip2.name
            l['otherReferenceClip2']['title'] = 'other 2'

        l['otherReferenceClip3'] = {}
        if level.otherReferenceClip3:
            l['otherReferenceClip3']['id'] = level.otherReferenceClip3.id
            l['otherReferenceClip3']['recording'] = level.otherReferenceClip3.recording.id
            l['otherReferenceClip3']['startSec'] = level.otherReferenceClip3.startSec
            l['otherReferenceClip3']['endSec'] = level.otherReferenceClip3.endSec
            l['otherReferenceClip3']['name'] = level.otherReferenceClip3.name
            l['otherReferenceClip3']['title'] = 'other 3'

        outLevels.append(l)
    
    levelsJson = simplejson.dumps(outLevels)
    return levelsJson
