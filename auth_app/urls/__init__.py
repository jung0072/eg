from auth_app.urls.urls import auth_urls

app_name='auth_app'

urlpatterns = [
    *auth_urls
]
