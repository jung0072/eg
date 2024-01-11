from django.urls import path

from api_app.controllers.faq import FAQController, FAQQueryController

urlpatterns = [
    path('', FAQController.as_view(), name='faq'),
    path('<int:question_id>/', FAQQueryController.as_view(), name='faq_question')
]
