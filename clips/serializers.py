from django.forms import widgets
from rest_framework import serializers
from clips.models import Clip,ClipList,Catalog,CatalogClip

class ClipSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='catalogClip')
    
    class Meta:
        model = Clip
        fields = ('id', 'name', 'recording', 'startSec', 'endSec', 'catalogClip')

class CatalogClipSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CatalogClip
        fields = ('id', 'name', 'catalog', 'recording', 'startSec', 'endSec')
        
class CatalogSerializer(serializers.ModelSerializer):

    class Meta:
        model = Catalog
