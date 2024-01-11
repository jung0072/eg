import base64
import io

from aws_s3_provider.S3Service import S3Service
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.http import HttpResponse

from communication_app.utils import MessageTypes
from engage_app.utils import EngageFileCategory


class Message(models.Model):
    discussion_board = models.ForeignKey(
        'DiscussionBoard', related_name="parent_discussion_board", on_delete=models.CASCADE
    )
    sender = models.ForeignKey(User, related_name='user_from_creator', on_delete=models.CASCADE)
    parent_message = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    content = models.CharField(max_length=4000)
    type = models.TextField(choices=MessageTypes.to_list(), max_length=100)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Fields to track message status in the chat room
    users_that_liked_message = ArrayField(
        base_field=models.IntegerField(blank=True, null=True),
        null=True, blank=True,
        size=255,
        default=list
    )
    picture_link = models.TextField(null=True, blank=True)
    is_pinned = models.BooleanField(default=False)
    users_that_read_message = ArrayField(
        base_field=models.IntegerField(blank=True, null=True),
        null=True, blank=True,
        size=255,
        default=list
    )

    @property
    def like_count(self):
        if self.users_that_liked_message:
            return len(self.users_that_liked_message)
        else:
            return 0

    def has_user_read_message(self, user_id):
        return user_id in self.users_that_read_message

    def pin_message_to_discussion_board(self):
        self.is_pinned = not self.is_pinned
        self.save()

    def generate_image_attachment_name(self):
        return f'image_{self.id}.png'

    def get_image_attachment(self):
        picture = S3Service(settings.AWS_S3_BUCKET).get_file(self.get_file_key)
        picture = base64.b64encode(picture.get('content'))
        return picture.decode('ascii')

    def save_base_64_image(self, base_64_image_data):
        file_name = self.generate_image_attachment_name()
        image_base64_without_header = base_64_image_data[base_64_image_data.find(',') + 1:]
        image_obj = base64.b64decode(bytes(image_base64_without_header, 'ascii'))
        Message.upload_image_to_aws(self.discussion_board_id, file_name, io.BytesIO(image_obj))
        self.picture_link = file_name
        self.save()
        return ''

    @property
    def get_file_key(self):
        return f'{EngageFileCategory.MESSAGE.name}/{self.discussion_board_id}/{self.picture_link}'

    @classmethod
    def upload_image_to_aws(cls, discussion_board_id, file_name, file):
        S3Service(settings.AWS_S3_BUCKET).upload_file(
            file_key=f'{EngageFileCategory.MESSAGE.name}/{discussion_board_id}/{file_name}',
            file_obj=file
        )

    def download_image_from_aws(self):
        file_metadata = S3Service(settings.AWS_S3_BUCKET).get_file(file_key=self.get_file_key)

        # build the content response by using the file metadata and return the file as an http response
        content_type = file_metadata.get('ContentType')
        response = HttpResponse(file_metadata.get('content'), content_type=content_type)
        response['Content-Length'] = file_metadata.get('ContentLength')
        response['Content-Disposition'] = 'attachment; filename=%s' % self.generate_image_attachment_name()
        return response

    # TODO: add fields for if this message is/ isn't a parent message or reply
    def to_json(self):
        from auth_app.models import UserProfile

        user_profile = UserProfile.objects.get(user_id=self.sender_id)

        # Update the JSON value returned with basic info about the parent (replied to) message
        parent_message_dict = None
        if self.parent_message_id:
            parent_message = Message.objects.get(id=self.parent_message_id)
            parent_message_dict = dict(
                content=parent_message.content,
                display_name=f'{parent_message.sender.first_name} {parent_message.sender.last_name}',
                sender=parent_message.sender.username,
                has_image_attachment=bool(parent_message.picture_link),
                message_id=parent_message.id,
                is_deleted=parent_message.is_deleted
            )

        return dict(
            sender=self.sender.username,
            display_name=f'{self.sender.first_name} {self.sender.last_name}',
            content=self.content,
            parent_message=parent_message_dict,
            created_at=self.created_at.strftime("%m/%d/%Y %H:%M:%S"),
            updated_at=self.updated_at.strftime("%m/%d/%Y %H:%M:%S"),
            message_id=self.id,
            profile_type=user_profile.role,
            users_that_liked_message_list=self.users_that_liked_message,
            users_that_liked_message_count=self.like_count,
            is_pinned=self.is_pinned,
            has_image_attachment=bool(self.picture_link),
            users_that_read_message_list=self.users_that_read_message,
            displayed_pronouns=user_profile.pronouns or [],
            is_deleted=self.is_deleted
        )
