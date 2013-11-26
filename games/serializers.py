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

from django.forms import widgets
from rest_framework import serializers, relations
from games.models import Game,Level
from clips.serializers import ClipSerializer,CatalogClipSerializer,CatalogSerializer

class LevelSerializer(serializers.ModelSerializer):

    def restore_object(self, attrs, instance=None):
        if instance:
            # Update existing instance
            instance.game = attrs.get('game', instance.game)
            instance.queryClip = attrs.get('queryClip', instance.queryClip)
            instance.correctReferenceClip = attrs.get('correctReferenceClip', instance.correctReferenceClip)
            instance.otherReferenceClip1 = attrs.get('otherReferenceClip1', instance.otherReferenceClip1)
            instance.otherReferenceClip2 = attrs.get('otherReferenceClip2', instance.otherReferenceClip2)
            instance.otherReferenceClip3 = attrs.get('otherReferenceClip3', instance.otherReferenceClip3)
            return instance

        # Create new instance
        return Level(**attrs)

    
    class Meta:
        model = Level
        fields = ('id', 'game', 'queryClip', 'correctReferenceClip',
                  'otherReferenceClip1', 'otherReferenceClip2', 'otherReferenceClip3')
        

class FullLevelSerializer(serializers.ModelSerializer):
    queryClip = ClipSerializer()
    correctReferenceClip = CatalogClipSerializer()
    otherReferenceClip1 = CatalogClipSerializer()
    otherReferenceClip2 = CatalogClipSerializer()
    otherReferenceClip3 = CatalogClipSerializer()
    
    class Meta:
        model = Level
        fields = ('id', 'game', 'queryClip', 'correctReferenceClip',
                  'otherReferenceClip1', 'otherReferenceClip2', 'otherReferenceClip3')


class GameSerializer(serializers.ModelSerializer):
    levels = FullLevelSerializer(many=True)
    
    class Meta:
        model = Game
        fields = ('levels','id')
