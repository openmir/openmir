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

