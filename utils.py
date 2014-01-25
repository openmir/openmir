#  Copyright (C) 2012-2014 Steven Ness <sness@sness.net>
def getSiteFromRequest(request):
    
    url = request.META['HTTP_HOST']
        
    site = "openmir"

    if ("orchive" in url):
        site = "orchive"

    if ("ornithopedia" in url):
        site = "ornithopedia"

    # TODO(sness) - For now, just return orchive
    site = "orchive"
    return site
