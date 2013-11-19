from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext

from django.utils import simplejson
from django.http import HttpResponse

from django.core import serializers

from clips.models import Clip,ClipList,Catalog,CatalogClip
from clips.serializers import ClipSerializer,CatalogClipSerializer,CatalogSerializer

from rest_framework import viewsets
from rest_framework.decorators import link

from recordings.models import Recording

from django.core.servers.basehttp import FileWrapper

def index(request):
    clips = Clip.objects.all()
    clipsJson = serializers.serialize("json", clips.all())
    return render_to_response('clips/index.html', { "clipsJson" : clipsJson })

def show(request, clipId):
    clip = Clip.objects.get(pk=int(clipId))
    return render_to_response('clips/show.html', {'clip' : clip,})

def audio(request, clipId):
    clip = Clip.objects.get(pk=int(clipId))

    # wrapper = FileWrapper(file( 'mp3file.mp3' ))
    # response = HttpResponse(wrapper, content_type='audio/mpeg')
    # response['Content-Length'] = os.path.getsize( 'mp3file.mp3' )

    response = HttpResponse(mimetype='audio/mpeg')
    response['Content-Disposition'] = 'attachment; filename=%s' % smart_str(file_name)
    response['Accept-Ranges'] = 'bytes'
    response['X-Sendfile'] = smart_str(path_to_file)
    return response


class ClipViewSet(viewsets.ModelViewSet):
    queryset = Clip.objects.all()
    serializer_class = ClipSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        queryset = Clip.objects.all()
        recording = self.request.QUERY_PARAMS.get('recording', None)
        if recording is not None:
            queryset = queryset.filter(recording=recording)

        catalogClip = self.request.QUERY_PARAMS.get('catalogClip', None)
        if catalogClip is not None:
            queryset = queryset.filter(catalogClip=catalogClip)

        catalog = self.request.QUERY_PARAMS.get('catalog', None)
        if catalog is not None:
            queryset = queryset.filter(catalogClip__catalog_id=catalog)

        name = self.request.QUERY_PARAMS.get('name', None)
        if name is not None:
            queryset = queryset.filter(catalogClip__name__contains=name)
            
        return queryset

class CatalogClipViewSet(viewsets.ModelViewSet):
    queryset = CatalogClip.objects.all()
    serializer_class = CatalogClipSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        queryset = CatalogClip.objects.all()
        catalog = self.request.QUERY_PARAMS.get('catalog', None)
        if catalog is not None:
            queryset = queryset.filter(catalog=catalog)
        return queryset

class CatalogViewSet(viewsets.ModelViewSet):
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer

