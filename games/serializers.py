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
