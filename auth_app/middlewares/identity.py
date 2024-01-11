from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from auth_app.utils.constants import API_URLS, URL_EXCLUSION

# TODO: Before deleting the unauthenticated url names, verify if there is any pages we want to leave publicly accessible
UNAUTHENTICATED_URL_NAMES = [
    'prototype_testing'
]


class ApiMiddleware:
    """
    This middleware will check for the authentication of the user if the token is valid or not if it is not valid 
    it will return user to the login page if it is valid, pass the response with user id attached to it
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.frontend_urls = API_URLS

    def __call__(self, request):

        # Get the authorization token here
        auth_token = request.headers.get('Authorization')

        # we can add paths here where we dont want the middleware to work, like some public urls
        if not request.path.startswith('/api') and request.path in URL_EXCLUSION:
            return self.get_response(request)
        else:
            if auth_token:
                token = auth_token.replace('Bearer ', '')
                try:
                    access_token = AccessToken(token)
                    payload = access_token.payload

                    # If it exist add the claim user_id to request
                    request.id = payload['user_id']
                    setattr(request, 'user', User.objects.get(id=request.id))

                except TokenError as err:
                    return JsonResponse({"error": str(err)}, status=401)
        return self.get_response(request)
