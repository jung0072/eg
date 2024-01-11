from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated

from auth_app.models import UserProfile
from auth_app.views.serializers.user_serializer import UserProfileSerializer
from auth_app.utils import PLATFORMS

from api_app.controllers.authentication import remove_leading_trailing_whitespace
from api_app.serializers import SuccessSerializer, ErrorSerializer

from educate_app.utils.educate_errorcodes import ACCOUNT_CREATED_SUCCESSFULLY, SOMETHING_WENT_WRONG
from api_app.controllers.authentication import AuthenticateUserTokenObtainPairSerializer, UserProfileRegistrationSerializer


class RegistrationViewAPI(APIView):

    def post(self, request):
        # normalize the emails and the username from the address by setting to lowercase
        request.data['user']["username"] = remove_leading_trailing_whitespace(
            request.data['user'].get("username").lower())
        request.data['user']["email"] = remove_leading_trailing_whitespace(
            request.data['user'].get("email").lower())
        request.data['user']["first_name"] = remove_leading_trailing_whitespace(
            request.data['user'].get("first_name"))
        request.data['user']["last_name"] = remove_leading_trailing_whitespace(
            request.data['user'].get("last_name"))

        user_serializer = UserProfileRegistrationSerializer(
                data=request.data, context={'platform': PLATFORMS.EDUCATE.value}
            )

        if user_serializer.is_valid():
            user_serializer.create(validated_data=request.data)
            return Response(
                SuccessSerializer(dict(success=ACCOUNT_CREATED_SUCCESSFULLY)).data,
                content_type="application/json",
                status=status.HTTP_201_CREATED
            )
        return Response(
            ErrorSerializer(
                dict(
                    error=SOMETHING_WENT_WRONG,
                    form_errors=user_serializer.errors
                )
            ).data,
            content_type="application/json",
            status=status.HTTP_409_CONFLICT
        )


class LoginView(TokenObtainPairView):
    serializer_class = AuthenticateUserTokenObtainPairSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['platform'] = PLATFORMS.EDUCATE.value
        return context

# TODO: Use the retrieveuserView from api_app and check there if the info is available or not
class RetrieveUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_profile = UserProfile.objects.get(user__id=request.id)
        picture = user_profile.get_profile_image()
        is_admin = False

        if request.user.is_superuser and request.user.is_active:
            is_admin = True

        user_profile_info = {
            'id': request.user.id,
            'is_admin': is_admin,
            'full_name': request.user.get_full_name(),
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'profile_picture': picture,
            'is_profile_complete': user_profile.is_minimum_profile_check_valid,
            'username': user_profile.user.username,
            'email': user_profile.user.email,
            'pronouns': user_profile.pronouns,
            'user_location': user_profile.user_location.id if user_profile.user_location else '',
            'icu_institute': user_profile.icu_institute,
        }

        serialized_data = UserProfileSerializer(user_profile_info)
        return Response(data={"user": serialized_data.data}, status=status.HTTP_200_OK)
