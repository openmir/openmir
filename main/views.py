from django.shortcuts import render_to_response, render
from django.core.context_processors import csrf
from django.template import RequestContext
from utils import getSiteFromRequest

def index(request):
    return render(request, 'main/' + getSiteFromRequest(request) + "/index.html")

def about(request):
    return render(request, 'main/' + getSiteFromRequest(request) + "/about.html")

def tour(request):
    return render(request, 'main/' + getSiteFromRequest(request) + "/tour.html")

def people(request):
    return render(request, 'main/' + getSiteFromRequest(request) + "/people.html")

