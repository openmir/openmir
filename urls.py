from django.conf.urls.defaults import *
from rest_framework import viewsets, routers

from django.contrib.auth.models import User, Group

from recordings.models import Recording
from clips.models import Clip,ClipList,Catalog,CatalogClip

from clips.views import ClipViewSet,CatalogClipViewSet,CatalogViewSet
from games.views import GameViewSet,LevelViewSet
from classifiers.views import ClassifierViewSet
from trainingsets.views import TrainingsetViewSet,TrainingsetClipListViewSet

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    model = User
    
class GroupViewSet(viewsets.ModelViewSet):
    model = Group

class RecordingViewSet(viewsets.ModelViewSet):
    model = Recording

# Routers provide an easy way of automatically determining the URL conf
router = routers.SimpleRouter(trailing_slash=False)
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'recordings', RecordingViewSet)
router.register(r'clips', ClipViewSet)
router.register(r'catalogClips', CatalogClipViewSet)
router.register(r'catalogs', CatalogViewSet)
router.register(r'games', GameViewSet)
router.register(r'levels', LevelViewSet)
router.register(r'classifiers', ClassifierViewSet)
router.register(r'trainingsets', TrainingsetViewSet)
router.register(r'trainingsetClipLists', TrainingsetClipListViewSet)

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns(
    '',
    (r'^$', 'main.views.index'),
    (r'^main/about$', 'main.views.about'),
    (r'^main/tour$', 'main.views.tour'),
    (r'^main/people$', 'main.views.people'),

    # Recordings
    (r'^recordings$', 'recordings.views.index'),
    (r'^recordings/(?P<recordingId>\d+)$', 'recordings.views.show'),
    (r'^recordings/dataview/(?P<recordingId>\d+)$', 'recordings.views.dataview'),
    (r'^recordings/abmiview/(?P<recordingId>\d+)$', 'recordings.views.abmiview'),

    # Trainingsets
    (r'^trainingsets$', 'trainingsets.views.index'),
    (r'^trainingsets/new$', 'trainingsets.views.new'),
    (r'^trainingsets/(?P<trainingsetId>\d+)$', 'trainingsets.views.show'),
    
    # Classifiers
    (r'^classifiers$', 'classifiers.views.index'),
    (r'^classifiers/new$', 'classifiers.views.new'),
    (r'^classifiers/(?P<classifierId>\d+)$', 'classifiers.views.show'),
    (r'^classifiers/train/(?P<classifierId>\d+)$', 'classifiers.views.train'),

    # Predictions
    (r'^predictions$', 'predictions.views.index'),
    (r'^predictions/new$', 'predictions.views.new'),
    (r'^predictions/view$', 'predictions.views.view'),
    (r'^predictions/recording/(?P<recordingId>\d+)$', 'predictions.views.recording'),

    # Data
    (r'^data$', 'data.views.index'),
    (r'^data/new$', 'data.views.new'),
    (r'^data/view$', 'data.views.view'),
    (r'^data/recording/(?P<recordingId>\d+)$', 'data.views.recording'),
    
    # Games
    (r'^games$', 'games.views.index'),
    #(r'^games/(?P<gameId>\d+)$', 'games.views.play'),
    (r'^games/show/(?P<gameId>\d+)$', 'games.views.show'),

    # User survey
    (r'^survey$', 'survey.views.index'),
    (r'^surveyAbout$', 'survey.views.about'),
    (r'^survey/submit$', 'survey.views.submit'),
    
    # # Tools
    # (r'^tools/recordingAnnotator/(?P<recordingId>\d+)$', 'tools.views.recordingAnnotator'),
    # (r'^tools/recordingPitchViewer/(?P<recordingId>\d+)$', 'tools.views.recordingPitchViewer'),
    # (r'^tools/recordingAuditoryImageViewer/(?P<recordingId>\d+)$', 'tools.views.recordingAuditoryImageViewer'),
    # (r'^tools/gameBuilder/(?P<gameId>\d+)$', 'tools.views.gameBuilder'),
    # (r'^tools/gamesViewer/$', 'tools.views.gamesViewer'),
    # (r'^tools/buildTrainingsetFromGames$', 'tools.views.buildTrainingsetFromGames'),
    # (r'^tools/trainingsetBuilder/(?P<trainingsetId>\d+)$', 'tools.views.trainingsetBuilder'),

    # User login
    (r'^accounts/login/$', 'django.contrib.auth.views.login', {'template_name': 'accounts/login.html'}),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'template_name': 'accounts/logout.html'}),
    (r'^accounts/preferences/$', 'django.contrib.auth.views.login', {'template_name': 'accounts/preferences.html'}),

    # Visualizations
    (r'^visualizations/spectrogram/(?P<recordingId>\d+)$', 'visualizations.views.spectrogram'),
    (r'^visualizations/waveform/(?P<recordingId>\d+)$', 'visualizations.views.waveform'),
    (r'^visualizations/yin/(?P<recordingId>\d+)$', 'visualizations.views.yin'),
    (r'^visualizations/energy/(?P<recordingId>\d+)$', 'visualizations.views.energy'),

    # Audio
    (r'^audio/(?P<recordingId>\d+)$', 'audio.views.play'),
    
    # Assets
    (r'^www/(?P<path>.*)$', 'django.views.static.serve',
     {'document_root': '/var/www/openmir/openmir/www'}),

    (r'^admin/', include(admin.site.urls)),

    # Celery
#    ('^tasks/', include('djcelery.urls')),

    # Django rest framework
    url(r'^api/v1/', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    # old rest framework
    (r'^oapi/v1/trainingsets/(?P<trainingsetId>\d+)$', 'oapi.views.trainingsetId'),

)
