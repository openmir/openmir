from django.db import models

class Survey(models.Model):
    data = models.TextField()
    remote_addr = models.CharField(max_length = 50)
    user_agent = models.CharField(max_length = 200)
    timestamp = models.TimeField(auto_now = True)

    def __unicode__(self):
        return str(self.timestamp)


