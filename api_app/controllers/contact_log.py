from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from api_app.utils.permissions import RequireAdmin
from rest_framework.response import Response
from rest_framework.views import APIView

from api_app.serializers import ContactLogSerializer, AuthContactLogSerializer
from api_app.serializers.general import ErrorSerializer, SuccessSerializer
from auth_app.forms import ContactUsForm
from auth_app.models import ContactLog
from auth_app.utils import ContactEnquiryTypes


class AuthContactLogController(APIView):
    """This controller manages requests for users who are currently logged into the system and have been authenticated."""

    def get_permissions(self):
        if self.request.method == 'PATCH':
            return [RequireAdmin(), IsAuthenticated()]
        return [IsAuthenticated()]

    def post(self, request):
        # save user contact log form for authorized user
        screenshot_base64 = request.data.pop('screenshot')
        contact_us_form = ContactUsForm(get_user_request_info(request))

        if contact_us_form.is_valid():
            new_contact_log = contact_us_form.save()
            if screenshot_base64:
                new_contact_log.upload_image_to_aws(base_64_encoded_string=screenshot_base64)
            serialized_data = ContactLogSerializer(new_contact_log)
            return Response(
                content_type="application/json",
                data=SuccessSerializer(
                    dict(success='Your request was submitted successfully', data=serialized_data.data)
                ).data,
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
                data=ErrorSerializer(dict(error="Could not log Contact Form", form_errors=contact_us_form.errors))
            )

    def patch(self, request, contact_log_id):
        # First retrieve the contact log to check if this is a valid request
        contact_log_to_update = ContactLog.objects.filter(id=contact_log_id)
        if not contact_log_to_update.exists():
            return Response(
                data=ErrorSerializer(dict(error="This contact log entry does not exist")).data,
                content_type="application/json", status=status.HTTP_404_NOT_FOUND
            )

        # Now with the contact log get the items to update from the request
        patch_data = contact_log_to_update.values().first()
        patch_data.update(request.data.copy())
        contact_us_form = ContactUsForm(patch_data, instance=contact_log_to_update.first())
        if contact_us_form.is_valid():
            contact_us_form.save()
            serialized_data = ContactLogSerializer(contact_log_to_update.first())
            return Response(
                content_type="application/json",
                data=SuccessSerializer(
                    dict(success='You have successfully updated this contact log request', data=serialized_data.data)
                ).data,
                status=status.HTTP_200_OK
            )
        # Return a default could not update response if the form is invalid or the request is invalid
        return Response(
            content_type="application/json",
            status=status.HTTP_400_BAD_REQUEST,
            data=ErrorSerializer(
                dict(error="Could not update Contact Log Request", form_errors=contact_us_form.errors)
            ).data
        )


class ContactLogController(APIView):
    """This controller manages requests for users who are not on the system"""

    def get(self, request):
        # The get request retrieves the system issues based on the received request.
        # If the user is an admin, it uses the AuthContactLogSerializer, which provides all user details and system issues.
        # Otherwise, it uses the ContactLogSerializer to retrieve specific user details with an enquiry type limited to IT support.
        user = request.user

        # TODO: Get the screenshots that may have been uploaded to a contact log object to display in table

        if user.is_superuser:
            contact_log_list = ContactLog.objects.all()
            serializer_class = AuthContactLogSerializer
        else:
            contact_log_list = ContactLog.objects.filter(
                enquiry_type__in=[ContactEnquiryTypes.ITS.name, ContactEnquiryTypes.SGI.name]
            )
            serializer_class = ContactLogSerializer

        serialized_data = serializer_class(contact_log_list, many=True, context={'request': request})

        return Response(
            content_type="application/json",
            data=dict(logs=serialized_data.data, admin=user.is_superuser),
            status=status.HTTP_200_OK
        )

    def post(self, request):
        # save the contact us form for unauthorized user
        # TODO: Remove the screenshot data uri from the contact us form
        contact_us_form = ContactUsForm(request.data)
        if contact_us_form.is_valid():
            new_contact_log = contact_us_form.save()
            serialized_data = ContactLogSerializer(new_contact_log)

            # TODO: Upload the screenshot data uri to aws s3 and save the file link to the new contact log
            return Response(
                content_type="application/json",
                data=SuccessSerializer(
                    dict(success='Your request was submitted successfully', data=serialized_data.data)
                ).data,
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                content_type="application/json",
                status=status.HTTP_400_BAD_REQUEST,
                data=ErrorSerializer(dict(error="Could not log Contact Form", form_errors=contact_us_form.errors))
            )


def get_user_request_info(request):
    """Return a modified copy of the request data with user information.

    Args:
        request: The request object containing user and data information.

    Returns:
        A modified copy of the request data with additional user fields.
    """
    post_data = request.data.copy()
    post_data['submitter'] = request.user.id
    post_data['first_name'] = request.user.first_name
    post_data['last_name'] = request.user.last_name
    post_data['email_address'] = request.user.email
    return post_data
