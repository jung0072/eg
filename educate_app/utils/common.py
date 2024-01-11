from rest_framework import serializers


def validate_date_fields(is_using_date, date_type, date):
    """
    Validate date fields.

    Parameters:
    - is_using_date (bool): Indicates whether the date is being used.
    - date_type: The type of the date.
    - date: The date value.

    Raises:
    - serializers.ValidationError: If the date fields are not selected (are None or falsy).
    """
    if is_using_date and (date_type is None or not date_type or date is None or not date):
        raise serializers.ValidationError("The dates are not selected, please select a date type and a date.")
