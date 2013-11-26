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

from django.shortcuts import render_to_response, redirect, render
from django.core.context_processors import csrf
from django.template import RequestContext

from django.utils import simplejson
from django.http import HttpResponse

from django.core import serializers

from clips.models import Clip,ClipList
from recordings.models import Recording
from games.models import Game,Level,UserClassification

from games.serializers import GameSerializer,LevelSerializer
from rest_framework import viewsets
from rest_framework.decorators import link


from django.core.servers.basehttp import FileWrapper
import random

def index(request):
    games = Game.objects.all()[:100]
    return render(request, 'games/index.html', {
            'games' : games,
            })

def show(request, gameId):
    game = Game.objects.get(pk=int(gameId))
    levels = game.levels.all()
    levelsJson = convertGameToJson(game,levels)

    return render_to_response('games/show.html', {
            "game" : game,
            "levelsJson" : levelsJson}, context_instance=RequestContext(request))

def next(request):
    numGames = Game.objects.count()
    randomGame = random.randint(1,numGames)

    return redirect('/games/%i#play/0' % randomGame)


def data(request):
    if request.method == 'POST':
        if request.POST["correct"] == '1':
            correct = True
        else:
            correct = False

        # Firefox
        if "HTTP_HOST" in request.META:
            httpOrigin = request.META["HTTP_HOST"]

        # Chrome
        if "HTTP_ORIGIN" in request.META:
            httpOrigin = request.META["HTTP_ORIGIN"]
            
        n = UserClassification(
            query_id = request.POST["query"],
            reference_id = request.POST["reference"],
            remoteAddr = request.META["REMOTE_ADDR"],
            userAgent = request.META["HTTP_USER_AGENT"],
            origin = httpOrigin,
            guid = request.POST["guid"],
            correct = correct,
            userEvents = request.POST["userEvents"])
        n.save()
                                       
    return HttpResponse("OK")
            

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

class LevelViewSet(viewsets.ModelViewSet):
    queryset = Level.objects.all()
    serializer_class = LevelSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        queryset = Level.objects.all()
        game = self.request.QUERY_PARAMS.get('game', None)
        if game is not None:
            queryset = queryset.filter(game=game)
        return queryset
