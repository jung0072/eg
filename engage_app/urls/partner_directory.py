from django.urls import path
from engage_app.views import researcher_directory_list, patient_directory_list, get_user_list

partner_directory_urls = [
    # path('researcher_directory/', researcher_directory_list, name='researcher_directory_list'),
    # path('patient_directory/', patient_directory_list, name="patient_directory_list"),
    # path('partner_directory/', get_user_list, name="partner_directory_list"),
]
