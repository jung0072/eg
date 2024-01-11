from engage_app.utils import VALID_FILE_TYPES


def validate_file_extension(file):
    import os
    from django.core.exceptions import ValidationError
    ext = os.path.splitext(file.name)[1]  # [0] returns path+filename
    if not ext.lower() in VALID_FILE_TYPES:
        raise ValidationError('Unsupported file extension.')
