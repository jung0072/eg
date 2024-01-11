from abc import ABC

from rest_framework import serializers


class ResearchInterestsSerializer(serializers.BaseSerializer, ABC):
    def to_representation(self, instance):
        return {
            'id': instance.get('id'),
            'title': instance.get('title'),
            'description': instance.get('description'),
            'mapping': instance.get('mapping'),
            'parent_id': instance.get('parent_id'),
            'type': instance.get('type'),
            'options': instance.get('options'),
        }
