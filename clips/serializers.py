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
