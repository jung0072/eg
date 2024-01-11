from django.db import models
from django.contrib.auth.models import User

from engage_app.utils.constants import FAQTypes


class FAQ(models.Model):
    submitter = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=250)
    description = models.TextField()
    faq_type = models.CharField(choices=FAQTypes.to_list(), max_length=50)
    viewed_users = models.ManyToManyField(User, related_name='viewed_faqs')
    liked_users = models.ManyToManyField(User, related_name='liked_faqs')

    def __str__(self):
        return self.title
