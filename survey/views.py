from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext
from survey.models import Survey

def index(request):
    return render_to_response('survey/index.html', { }, context_instance=RequestContext(request))

def about(request):
    return render_to_response('survey/about.html', { }, context_instance=RequestContext(request))

def submit(request):
    if request.method == 'POST':
        s = Survey(data = request.raw_post_data,
                   remote_addr = request.META["REMOTE_ADDR"],
                   user_agent = request.META["HTTP_USER_AGENT"])
        s.save()

    return HttpResponse("OK")
    
