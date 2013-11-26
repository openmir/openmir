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

from django.shortcuts import render_to_response, render, redirect
from django.core.context_processors import csrf
from django.template import RequestContext

from recordings.models import Recording
from clips.models import Clip,ClipList,Catalog 
from django.core import serializers
from trainingsets.models import Trainingset,TrainingsetClipList

from trainingsets.serializers import TrainingsetSerializer,TrainingsetClipListSerializer
from rest_framework import viewsets
from rest_framework.decorators import link

def index(request):
    trainingsets = Trainingset.objects.all()
    catalogs = Catalog.objects.all()
    return render(request, 'trainingsets/index.html', {'trainingsets' : trainingsets, 'catalogs' : catalogs})

def new(request):
    if request.method == 'POST':
        catalog = Catalog.objects.get(pk=request.POST.get("catalog"))
        trainingset = Trainingset(name = request.POST.get("name"), catalog = catalog )
        trainingset.save()

        doAll = request.POST.get("all")
        # Create a clipList and a trainingsetClipList for each item in
        # the selected catalog, and optionally populate them.
        for catalogClip in catalog.catalogclip_set.all():
            clipList = ClipList()
            clipList.save()

            if doAll:
                allClips = Clip.objects.filter(catalogClip = catalogClip).all()
                clipList.clips = allClips
                clipList.save()

            trainingsetClipList = TrainingsetClipList(trainingset = trainingset, clipList = clipList, catalogClip = catalogClip)
            trainingsetClipList.save()
        
        return redirect("/trainingsets")

def show(request, trainingsetId):
    trainingset = Trainingset.objects.get(pk=int(trainingsetId))
    return render(request, 'trainingsets/show.html', {'trainingset' : trainingset})    

class TrainingsetViewSet(viewsets.ModelViewSet):
    queryset = Trainingset.objects.all()
    serializer_class = TrainingsetSerializer

class TrainingsetClipListViewSet(viewsets.ModelViewSet):
    queryset = TrainingsetClipList.objects.all()
    serializer_class = TrainingsetClipListSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        queryset = TrainingsetClipList.objects.all()
        trainingset = self.request.QUERY_PARAMS.get('trainingset', None)
        if trainingset is not None:
            queryset = queryset.filter(trainingset=trainingset)
        return queryset
