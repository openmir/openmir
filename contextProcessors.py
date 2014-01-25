#  Copyright (C) 2012-2014 Steven Ness <sness@sness.net>
from urlparse import urlparse
from utils import getSiteFromRequest

def siteName(request):

    return { 'site': getSiteFromRequest(request) }
