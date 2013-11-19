from urlparse import urlparse
from utils import getSiteFromRequest

def siteName(request):

    return { 'site': getSiteFromRequest(request) }
