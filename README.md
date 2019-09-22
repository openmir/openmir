openmir readme
--------------

Openmir is a Django project that allows you to listen to, view,
annotate and run audio feature extraction and machine learning
algorithms on large audio databases.


steps to setup on ubuntu
------------------------

1) Install required packages

```
   apt-get install g++ cmake-curses-gui libasound2-dev \
     python-setuptools make python-dev python-pip python-mysqldb \
     mysql-server mysql-client python-numpy python-scipy \
     python-matplotlib rabbitmq-server memcached

   sudo pip install django-menus==1.1.2 django==1.5 django-tastypie==0.9.12 \
     djangorestframework==2.3.6 markdown django-filter==0.6 celery==3.0.21 django-celery=3.0.17 \
     django-jinja2 jinja2
```

1) Install marysas with Python bindings

```
   git clone git@github.com:marsyas/marsyas.git
   cd marsyas
   mkdir release
   cd release
   ccmake ..
   make -j3
   make install
 ```
 
1) Create database with mysql

```
   echo "create database databasename" | mysql -u root -p
```

1) Add Django tables to mysql

```
   manage.py syncdb
```

1) Load some test data to get you going

```
   manage.py loaddata dev_data 
```

1) Run the server on localhost

```
   manage.py runserver 0.0.0.0:8000
```

1) Navigate to the home page

```
   http://localhost:8080
```
