"""engage URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URL conf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls import url
from django.urls import path, include
from django.views.static import serve

# commenting out for testing engage without sso
# sso_client = Client(settings.SSO_SERVER, settings.SSO_PUBLIC_KEY, settings.SSO_PRIVATE_KEY)

urlpatterns = [
    path('', include('auth_app.urls', namespace='auth_app')),
    # Adding add engage URL's under app to differentiate between authentication and application urls
    path('app/', include('engage_app.urls', namespace='engage_app')),
    # Urls for the chat rooms, discussion boards and user messages
    path('chat/', include('communication_app.urls', namespace='communication_app')),

    # API STUFF
    path('api/', include(('api_app.urls', 'api_app'), namespace='api_app')),
    path('educate/api/', include(('educate_app.urls', 'educate_app'), namespace='educate_app')),

    # place it at whatever base url you like
    url(r'^select2/', include("django_select2.urls")),

    # For serving the static files from nginx
    url(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT, }),
    
]
