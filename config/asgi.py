"""
ASGI config for engage project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os

import django
from django.core.asgi import get_asgi_application

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack
from channels.http import AsgiHandler
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import communication_app.routing

application = ProtocolTypeRouter({
    "http": AsgiHandler(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(communication_app.routing.websocket_urlpatterns)
        )
    )
})
