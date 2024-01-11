from django.db import models


class ResearchInterestCategory(models.Model):
    """Research interests categories are the category for each research interest"""
    title = models.TextField()
    mapping = models.TextField()
    description = models.TextField(null=True, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
