openmir readme
--------------

Openmir is a Django project that allows you to listen to, view,
annotate and run audio feature extraction and machine learning
algorithms on large audio databases.


steps to setup on ubuntu
------------------------

1) Install required packages

2) Create database with mysql

 echo "create database databasename" | mysql -u root -p

3) Add Django tables to 
   
   manage.py syncdb

4) Load some test data to get you going

   manage.py loaddata dev_data 

5) Run the server on localhost

   manage.py runserver 0.0.0.0:8000

6) 
