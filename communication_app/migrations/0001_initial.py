from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from communication_app.utils import MessageTypes, NotificationTypes


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('engage_app', '0005_02_06_2022'),
    ]

    operations = [
        migrations.CreateModel(
            name='DiscussionBoard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_room_code', models.CharField(max_length=255, unique=True)),
                ('description', models.CharField(default='This is the room description', max_length=255)),
                ('title', models.TextField(max_length=255, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent_task', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='parent_research_task',
                    to='engage_app.researchprojecttask'
                )),
                ('board_creator', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='message_board_creator',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.CharField(max_length=255)),
                ('type', models.TextField(choices=MessageTypes.to_list(), max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('discussion_board', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='parent_discussion_board',
                    to='communication_app.discussionboard'
                )),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='user_from_creator',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.CharField(max_length=255)),
                ('type', models.TextField(
                    choices=NotificationTypes.to_list(), max_length=255)),
                ('link', models.URLField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('receiver', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='notification_receiver',
                    to=settings.AUTH_USER_MODEL
                )),
                ('source', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                    related_name='notification_sender', to=settings.AUTH_USER_MODEL
                )),
            ],
        ),
    ]
