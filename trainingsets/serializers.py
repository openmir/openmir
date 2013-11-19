from django.forms import widgets
from rest_framework import serializers, relations
from trainingsets.models import Trainingset,TrainingsetClipList

class TrainingsetSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Trainingset
        fields = ('id','name')

class TrainingsetClipListSerializer(serializers.ModelSerializer):

    class Meta:
        model = TrainingsetClipList
        fields = ('id','catalogClip','trainingset','clipList')
        
        
