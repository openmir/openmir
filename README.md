openmir readme
--------------

Openmir is a Django project that allows you to listen to, view,
annotate and run audio feature extraction and machine learning
algorithms on large audio databases.


steps to setup on ubuntu
------------------------

1) Install required packages

   apt-get install g++ cmake-curses-gui libasound2-dev \
     python-setuptools make python-dev python-pip python-mysqldb \
     mysql-server mysql-client python-numpy python-scipy \
     python-matplotlib rabbitmq-server memcached

   sudo pip install django-menus django==1.5 django-tastypie==0.9.12 \
     djangorestframework markdown django-filter celery django-celery \
     django-jinja2 jinja2

   sudo pip install -e \
     git://github.com/tomchristie/django-rest-framework.git#egg=djangorestframework

2) Install marysas with Python bindings

   git clone git@github.com:marsyas/marsyas.git
   cd marsyas
   mkdir release
   cd release
   ccmake ..
   make -j3
   make install
   
3) Create database with mysql

   echo "create database databasename" | mysql -u root -p

4) Add Django tables to mysql
   
   manage.py syncdb

5) Load some test data to get you going

   manage.py loaddata dev_data 

6) Run the server on localhost

   manage.py runserver 0.0.0.0:8000

7) Navigate to the home page

   http://localhost:8080
