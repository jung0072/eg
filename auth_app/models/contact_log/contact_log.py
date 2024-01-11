import base64
import io

from aws_s3_provider.S3Service import S3Service
from django.contrib.auth.models import User
from django.db import models

from auth_app.utils import ContactEnquiryTypes, SupportScreens
from config import settings
from engage_app.utils import EngageFileCategory, create_alphanumeric_code
from engage_app.utils.constants import ContactLogActionTypes, ContactLogPriorityTypes


class ContactLog(models.Model):
    submitter = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=200)
    last_name = models.CharField(max_length=200)
    email_address = models.CharField(max_length=320)
    enquiry_type = models.CharField(choices=ContactEnquiryTypes.to_list(), max_length=100)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    support_screen = models.CharField(choices=SupportScreens.to_list(), max_length=100, blank=True, null=True)
    screenshot = models.TextField(null=True, blank=True)

    # Fields to track task management from Admins
    action_stage = models.CharField(
        choices=ContactLogActionTypes.to_list(), max_length=255, null=True, blank=True,
        default=ContactLogActionTypes.PENDING.name
    )
    priority = models.CharField(
        choices=ContactLogPriorityTypes.to_list(), max_length=255, null=True, blank=True,
        default=ContactLogPriorityTypes.NOT.name
    )
    is_complete = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return self.message

    @property
    def file_key(self):
        """Return the AWS S3 File key for this contact log instance"""
        if not self.screenshot:
            return None
        return f'{EngageFileCategory.ADMIN.name}/{EngageFileCategory.CONTACT.name}/{self.id}/{self.screenshot}'

    def get_screenshot(self):
        if self.screenshot:
            try:
                picture = S3Service(settings.AWS_S3_BUCKET).get_file(self.file_key)
                picture = base64.b64encode(picture.get('content'))
                return picture.decode('ascii')
            except:
                return None
        else:
            return None

    def upload_image_to_aws(self, base_64_encoded_string):
        # First remove the data header and add padding to the b64 encoded string, so it matches the standards
        base_64_encoded_string = base_64_encoded_string.split(',')[1]
        padded_base64_string = base_64_encoded_string + ('=' * (4 - len(base_64_encoded_string) % 4))

        # Decode the base 64 image string and then upload to aws
        image_binary = base64.b64decode(padded_base64_string)

        # Convert the file like object to an image file buffer and rewind the buffer to the start
        image_file_buffer = io.BytesIO(image_binary)
        image_file_buffer.seek(0)

        # Finally upload to AWS
        S3Service(settings.AWS_S3_BUCKET).upload_file(
            file_key=f'{EngageFileCategory.ADMIN.name}/{EngageFileCategory.CONTACT.name}/{self.id}/{self.generate_screenshot_name()}',
            file_obj=image_file_buffer
        )

    def generate_screenshot_name(self):
        self.screenshot = f'{self.enquiry_type.lower()}_{self.support_screen.lower()}_screenshot_{create_alphanumeric_code(8)}.png'
        self.save()
        return self.screenshot

    def to_json(self):
        return dict(
            submitter_id=self.submitter.id,
            first_name=self.submitter.first_name,
            last_name=self.submitter.last_name,
            email_address=self.submitter.email,
            enquiry_type=ContactEnquiryTypes[self.enquiry_type].value,
            message=self.message,
            created_at=self.created_at,
            updated_at=self.updated_at,
            support_screen=self.support_screen,
            screenshot=self.get_screenshot()
        )
