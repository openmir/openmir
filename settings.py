# Django settings for openmir project.

import os

if (('DJANGO_ENVIRONMENT' in os.environ) and (os.environ['DJANGO_ENVIRONMENT'] == 'dev')):
    DEBUG = True
else:
    DEBUG = False

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS

if DEBUG == True:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'openmir',                   
            'USER': 'root',                      
            'PASSWORD': '0beth2',                
            'HOST': '/var/run/mysqld/mysqld.sock', 
            'PORT': '',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'openmir',                   
            'USER': 'root',                      
            'PASSWORD': '0beth2',                
            'HOST': '/var/mysql/mysql.sock', 
            'PORT': '3306',
            }
        }

if DEBUG == True:    
    OPENMIR_FILE_PATH = "/global/scratch/sness/openmir-dev"
else:
    OPENMIR_FILE_PATH = "/global/scratch/sness/openmir"

DEBUG = True

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
        'LOCATION': '127.0.0.1:11211',
        }
    }

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Vancouver'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = '/home/sness/dev/code/django/openmir/openmir/admin'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = ''

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

STATIC_URL = '/www/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = '*w$v(e()p14p-ixv-&yy580@y=lyc%km79!q9%qoeqcrd_pvo1'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    )

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

ROOT_URLCONF = 'urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    "/var/www/openmir/openmir/templates",
)

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
)


TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.request",
    "django.contrib.messages.context_processors.messages",
    "contextProcessors.siteName",
 )

AVATAR_STORAGE_DIR = 'uploads/avatars'

LOGIN_REDIRECT_URL = '/'

ACCOUNT_EMAIL_REQUIRED = True

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.admin',
    'django.contrib.admindocs',
    'menus',
    'accounts',
    'main',
    'recordings',
    'clips',
    'trainingsets',
    'celerytasks',
    'classifiers',
    'predictions',
    'visualizations',
    'games',
    'survey',
#    'djcelery',
    'rest_framework',
)

ACCOUNT_ACTIVATION_DAYS = 7

EMAIL_USE_TLS = True
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'openmirserver@gmail.com'
EMAIL_HOST_PASSWORD = 'openmirserver123'

#
# Celery
#
#BROKER_HOST = "127.0.0.1"
#BROKER_PORT = 5672
#BROKER_VHOST = "/"
#BROKER_USER = "guest"
#BROKER_PASSWORD = "guest"

#BROKER_URL = "amqp://guest:guest@localhost:5672//"

# Use redis as broker
BROKER_URL = 'redis://localhost:6379/0'

# Use redis as backend
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'


import djcelery
djcelery.setup_loader()

USE_TZ=True


REST_FRAMEWORK = {
    # Use hyperlinked styles by default.
    # Only used if the `serializer_class` attribute is not set on a view.
    'DEFAULT_MODEL_SERIALIZER_CLASS':
        'rest_framework.serializers.HyperlinkedModelSerializer',
    
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly'
        ]
    }

APPEND_SLASH = True
ALLOWED_HOSTS = '*'

