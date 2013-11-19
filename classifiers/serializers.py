from django.forms import widgets
from rest_framework import serializers, relations
from classifiers.models import Classifier

class ClassifierSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Classifier
        fields = ('id','name','description','options')

        
