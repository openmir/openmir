#  Copyright (C) 2012-2014 Steven Ness <sness@sness.net>
from django.contrib import admin
from survey.models import Survey

class SurveyAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'remote_addr', 'user_agent', 'data')

admin.site.register(Survey,SurveyAdmin)
