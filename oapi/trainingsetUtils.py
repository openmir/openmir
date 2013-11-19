from django.utils import simplejson
from clips.models import Clip,ClipList
from classifiers.models import Classifier
from trainingsets.models import Trainingset,TrainingsetClipList

# Turn the django classifer data structure into exactly what our
# backbone wants, a nested data structure of cliplists and clips.
def convertTrainingsetToJson(trainingset):
    outTrainingset = {'id' : trainingset.id, 'rawClipLists' : []}

    for trainingsetClipList in trainingset.trainingsetcliplist_set.all():
        outClipList = {'id' : trainingsetClipList.clipList.id, 'clips' : [], 'name' :  trainingsetClipList.catalogClip.name }
        
        for clip in trainingsetClipList.clipList.clips.all():
            outClip = {'id' : clip.id,
                       'recording' : clip.recording.id,
                       'audioFile' : clip.recording.name,
                       'name' : clip.name,
                       'startSec' : clip.startSec,
                       'endSec' : clip.endSec}
            outClipList['clips'].append(outClip)

        outTrainingset['rawClipLists'].append(outClipList)

    trainingsetJson = simplejson.dumps(outTrainingset)
    return trainingsetJson

# Convert a json representation of a trainingset into a Trainingset with
# TrainingsetClipLists, ClipLists and ClipListItems
def convertJsonToTrainingset(trainingset,data):
    i = 0
    for cl in data['clipLists']:
        clipList = ClipList(name = data['clipListNames'][i])
        clipList.save()
        trainingsetClipList = TrainingsetClipList(trainingset_id = trainingset.id, clipList_id = clipList.id)
        trainingsetClipList.save()
        for c in cl:
            clipListItem = ClipListItem(clip_id = c['id'], clipList_id = clipList.id)
            clipListItem.save()
        i += 1

