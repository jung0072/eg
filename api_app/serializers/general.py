from abc import ABC

from rest_framework import serializers


class ErrorSerializer(serializers.BaseSerializer, ABC):
    def to_representation(self, instance):
        form_errors = instance.get('form_errors')
        # If the form errors given are a dict, iterate at least 2 levels down to collect all of the form errors into
        # a list to render properly in the react application
        form_error_list = None
        if isinstance(form_errors, dict):
            form_error_list = []
            for key in form_errors:
                if isinstance(form_errors[key], dict):
                    for item in form_errors[key]:
                        form_error_list.append(f"{item.title()}: {form_errors[key][item][0].title()}")
                else:
                    form_error_list.append(f"{key.title()}: {form_errors[key][0].title()}")
        return {
            'error': instance.get('error'),
            'form_errors': form_error_list or instance.get('form_errors'),
        }


class SuccessSerializer(serializers.BaseSerializer, ABC):
    def to_representation(self, instance):
        return {
            'success': instance.get('success'),
            'redirect_link': instance.get('redirect_link'),
            'resource_id': instance.get('resource_id'),
            'data': instance.get('data'),
        }


class DataSerializer(serializers.BaseSerializer, ABC):
    def to_representation(self, instance):
        return {
            'data': instance.get('data')
        }
