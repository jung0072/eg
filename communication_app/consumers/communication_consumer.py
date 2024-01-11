import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from django.shortcuts import reverse

from communication_app.models import Message, DiscussionBoard, Notification, UserMessageTag
from communication_app.utils import MessageTypes, NotificationTypes
from engage_app.models import ResearchProjectParticipant


class CommunicationAppConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = ''
        self.room_group_name = ''

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join the room group under the room name
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        if 'paradigm' not in text_data_json or 'sender' not in text_data_json:
            print("This is an invalid request to the websocket")
            return

        # parse out the original sender and the paradigm of the web socket event
        paradigm = text_data_json['paradigm']
        sender = text_data_json['sender']

        # check the project archive status before sending a message
        project_archive_status = await self.is_project_archived(code=self.room_name)

        if project_archive_status:
            print(f"The project is archived, received status: {project_archive_status} for room {self.room_name}")
            return

        if paradigm == 'message':
            # if we receive a chat message as the event get the content (message) the parent message id and
            # an image attachment if those are set and then create the message
            message = text_data_json['message']
            parent_message_id = text_data_json['parentMessageID']
            image_attachment = text_data_json['imageAttachment']

            # Create the new message in the database and then send the message id to the WebSocket so it can be read
            # and sent to the users
            new_message = await self.create_message(
                message, sender, code=self.room_name, parent_message_id=parent_message_id,
                image_attachment=image_attachment
            )
            await self.channel_layer.group_send(
                self.room_group_name, dict(type='send_message', message=new_message)
            )
        elif paradigm == 'typing':
            # if a user starts typing
            is_typing = text_data_json['isTyping']
            await self.channel_layer.group_send(
                self.room_group_name,
                dict(is_typing=is_typing, type='user_typing', sender=sender)
            )
        elif paradigm == 'delete':
            deleted_message_id = text_data_json['deletedMessageID']
            deleted_message_response = await self.validate_message_deletion(deleted_message_id, sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                dict(deleted_message_response=deleted_message_response, sender=sender, type='delete_message')
            )
        elif paradigm == 'like':
            liked_message_id = text_data_json['likedMessageID']
            liked_message_response = await self.validate_message_like(liked_message_id, sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                dict(liked_message_response=liked_message_response, sender=sender, type='like_message')
            )
        elif paradigm == 'pin':
            pinned_message_id = text_data_json['pinnedMessageID']
            pinned_message_response = await self.validate_message_pin(pinned_message_id, sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                dict(pinned_message_response=pinned_message_response, sender=sender, type='pin_message')
            )
        elif paradigm == 'read':
            read_message_list = text_data_json['readMessageList']
            read_message_response = await self.validate_message_read(read_message_list, sender)

            await self.channel_layer.group_send(
                self.room_group_name,
                dict(read_message_response=read_message_response, sender=sender, type='read_message')
            )
        else:
            print(f"The event type is not recognized {paradigm}")
            return

    async def send_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(dict(**message, paradigm='message')))

    async def user_typing(self, event):
        """A user in the group either stopped or started typing"""
        is_typing = event['is_typing']
        sender = event['sender']

        response = dict(is_typing=is_typing, sender=sender, paradigm='typing')
        await self.send(text_data=json.dumps(response))

    async def delete_message(self, event):
        """Delete a message from the group chat and send the response to the whole group"""
        deleted_message_response = event['deleted_message_response']
        await self.send(text_data=json.dumps(deleted_message_response))

    async def like_message(self, event):
        """Like a message from a group chat"""
        liked_message_response = event['liked_message_response']
        await self.send(text_data=json.dumps(liked_message_response))

    async def pin_message(self, event):
        pinned_message_response = event['pinned_message_response']
        await self.send(text_data=json.dumps(pinned_message_response))

    async def read_message(self, event):
        read_message_response = event['read_message_response']
        await self.send(text_data=json.dumps(read_message_response))

    @database_sync_to_async
    def validate_message_read(self, read_message_list, sender_username):
        user_that_read_message = User.objects.get(username=sender_username)
        if len(read_message_list) <= 0:
            return dict(
                read_message_list=read_message_list, sender=sender_username, paradigm='read', status="failed",
                sender_id=user_that_read_message.id
            )
        read_message_obj_list = Message.objects.filter(id__in=read_message_list)
        project_permissions = ResearchProjectParticipant.objects.get(
            user=user_that_read_message, study=read_message_obj_list.first().discussion_board.linked_study
        )

        status = "failed"
        if project_permissions:
            for msg in read_message_obj_list:
                if user_that_read_message.id not in msg.users_that_read_message:
                    if msg.discussion_board.linked_study.id == project_permissions.study.id:
                        msg.users_that_read_message.append(user_that_read_message.id)
                        msg.save()
                        status = "success"
        return dict(
            read_message_list=read_message_list, sender=sender_username, paradigm='read', status=status,
            sender_id=user_that_read_message.id
        )

    @database_sync_to_async
    def validate_message_pin(self, message_id, sender_username):
        # Validate that the user that pinned the message is apart of the project and then reverse the pinned state
        # of the message (any user on a project can pin any message)
        user_that_pinned_message = User.objects.get(username=sender_username)
        message = Message.objects.get(id=message_id)
        project_permissions = ResearchProjectParticipant.objects.get(
            user=user_that_pinned_message, study=message.discussion_board.linked_study
        )

        # If the user is apart of the project then we can pin the message to the board
        status = "failed"
        if project_permissions:
            message.pin_message_to_discussion_board()
            status = 'success'

        return dict(
            pinned_message_id=message_id, sender=sender_username, paradigm='pin', status=status,
            sender_id=user_that_pinned_message.id
        )

    @database_sync_to_async
    def validate_message_like(self, message_id, sender_username):
        user_that_liked_message = User.objects.get(username=sender_username)
        message = Message.objects.get(id=message_id)
        # check if the research study is linked by the task or the board
        project_permissions = ResearchProjectParticipant.objects.get(
            user=user_that_liked_message, study=message.discussion_board.linked_study
        )

        # Add the user id to the users that liked message list after validating that they are apart of the project
        # and that they are not apart of the original like list
        status = "failed"
        action = "none"

        # Like the message if the user is apart of the project and is not one of the user that liked the message
        if user_that_liked_message.id not in message.users_that_liked_message and project_permissions:
            message.users_that_liked_message.append(user_that_liked_message.id)
            message.save()
            status = "success"
            action = "like"
        elif user_that_liked_message.id in message.users_that_liked_message and project_permissions:
            # Remove the users like if the user that liked the message is in the liked message list and project permissions
            message.users_that_liked_message.remove(user_that_liked_message.id)
            message.save()
            status = "success"
            action = "dislike"

        return dict(
            liked_message_id=message_id, sender=sender_username, paradigm='like', status=status, action=action,
            sender_id=user_that_liked_message.id
        )

    @database_sync_to_async
    def validate_message_deletion(self, message_id, sender_username):
        user = User.objects.get(username=sender_username)
        message = Message.objects.get(id=message_id)
        # check if the research study is linked by the task or the board
        project_permissions = ResearchProjectParticipant.objects.get(
            user=user, study=message.discussion_board.linked_study
        )

        # Check to make sure the user deleting the message is the same as the one who created the message or one
        # of the lead researchers/ creator before deleting the message
        status = "failed"
        # TODO: must archive related images, related message and the message object instead of deleting
        if user.id == message.sender.id or project_permissions.is_lead_researcher_or_creator:
            message.is_deleted = True
            message.save()
            status = "success"
        return dict(deleted_message_id=message_id, sender=sender_username, paradigm='delete', status=status)

    @database_sync_to_async
    def create_message(self, message, sender, code, parent_message_id=None, image_attachment=None):
        # first check if the discussion board exists
        discussion_board = DiscussionBoard.objects.get(chat_room_code=code)

        # will retrieve a user or raise a User.DoesNotExist
        user = User.objects.get(username=sender)
        # Check if we have a parent_message_id, and if we do update the message create query
        update_query_dict = dict()
        if parent_message_id:
            update_query_dict['parent_message_id'] = parent_message_id

        new_message = Message.objects.create(
            sender_id=user.id, content=message, discussion_board_id=discussion_board.id,
            type=MessageTypes.DISCUSSION.value, users_that_read_message=[user.id],
            **update_query_dict
        )
        # if we have an image_attachment then save it using the newly created message
        if image_attachment:
            new_message.save_base_64_image(image_attachment)

        # Check if 1 or more users where mentioned in the message, if they were then we can send a new notification
        # to each of these users saying they were mentioned in a comment (allowing us to track recent mentions)
        study_team = discussion_board.linked_study.participants
        study_team_includes = [f'@{member.user.get_full_name()}' for member in study_team]
        for member_name in study_team_includes:
            if member_name in new_message.content:
                first_name = member_name.split(' ')[0][1:]
                last_name = member_name.split(' ')[-1]
                tagged_user = study_team.filter(user__first_name=first_name, user__last_name=last_name).first()
                user_message_tag = UserMessageTag.objects.create(user=tagged_user.user, message=new_message)
                user_message_tag.create_notification(sender_id=user.id)

        # Get all of the users from discussion board messages and send an update message to all of them
        all_messages = Message.objects.filter(discussion_board_id=discussion_board.id).exclude(
            sender=user
        ).values('sender')
        users_in_board = set()
        for user_message in all_messages:
            users_in_board.add(user_message['sender'])

        for receiver in users_in_board:
            # Check if the user already has an unread notification from this discussion board
            existing_notification = Notification.objects.filter(
                receiver_id=receiver, type=NotificationTypes.DISCUSSION.value, source_id=discussion_board.id,
                read_at=None
            )
            if not existing_notification.exists():
                # We're good to send them a notification
                Notification.objects.create(
                    receiver_id=receiver,
                    content="New unread messages...",
                    source_id=discussion_board.id,
                    link=f"{reverse('auth_app:message_centre')}?discussion={discussion_board.chat_room_code}",
                    type=NotificationTypes.DISCUSSION.value
                )
        new_message.save()
        self.send()
        return new_message.to_json()

    @database_sync_to_async
    def is_project_archived(self, code):
        """
        Check if the project associated with the given discussion room code is archived.

        Args:
        - code (str): The room code associated with the discussion board.

        Returns:
        - bool: True if the project is archived, False otherwise.
        """
        discussion_board = DiscussionBoard.objects.select_related(
            'parent_task__research_project', 'research_project'
        ).get(chat_room_code=code)

        if discussion_board.parent_task:
            return discussion_board.parent_task.research_project.is_archived

        return discussion_board.research_project.is_archived
