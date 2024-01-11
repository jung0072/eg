from typing import Union, List

from django.core import mail
from django.core.mail import EmailMultiAlternatives
from django.template.loader import get_template
from django.contrib.auth.models import User
from config.settings import SERVER_NAME

from email_app.utils.constants import EmailTemplateConstants

RecipientList = Union[str, List[str]]
OptionalRecipientList = Union[None, RecipientList]


class EngageEmail:
    """
    This class that handles sending emails for all other apps
    :param subject: The Subject of the email
    :param template_name: The HTML template to use when sending the email
    :param template_params: additional values that are needed by template to form the email
    """

    def __init__(self, subject=None, template_name=None, template_params={}):
        self.email_message = EmailMultiAlternatives()
        self.subject = subject
        self.template_name = template_name
        self.template_params = template_params
        self.__sent = False

    def build_template_params(self):
        if self.template_name == EmailTemplateConstants.ADMIN_REQUEST_FOR_APPROVAL:
            current_admin = User.objects.get(is_superuser=True)
            self.template_params["admin"] = current_admin
            self.template_params["active_users"] = []
            self.template_params["cc_users"] = []

    def set_recipients(self, to: RecipientList, cc: OptionalRecipientList = None) -> None:
        """Sets the recipients of this email message to the provided people."""

        # Normalize the recipients parameters so that they're all lists
        recipients_to = to if type(to) is list else [to]
        recipients_cc = cc if type(cc) is list else [cc] if cc is not None else []

        # Set the fields on the email message
        self.email_message.to = recipients_to
        self.email_message.cc = recipients_cc

    def render_body(self):
        # Check if "link" is present in template_params
        link = self.template_params.get("link", "")

        if link:
            self.template_params["link"] = link

        template = get_template(self.template_name)
        html_content = template.render(self.template_params)

        self.email_message.body = html_content
        self.email_message.content_subtype = 'html'

    def send(self):

        if self.__sent:
            raise Exception('Cannot reuse email message object. Please create a new one.')
        self.__sent = True

        self.render_body()
        connection = mail.get_connection()

        self.email_message.subject = self.subject
        self.email_message.send()

        connection.close()
