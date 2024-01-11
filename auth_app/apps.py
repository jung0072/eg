import sys
from django.apps import AppConfig


class AuthAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'auth_app'

    # Django hook to run this code at the start of the application
    def ready(self):
        import auth_app.signals
        # Check if the admin has a user profile, if they do not create it. Only run this check when running the server
        if 'runserver' in sys.argv or 'config.asgi:application' in sys.argv:
            check_for_admin_user_profile()


def check_for_admin_user_profile():
    from engage_app.utils import UserRoles
    from auth_app.models import UserProfile
    from django.contrib.auth.models import User
    from cities_light.models import City, Country

    # get a reference to the admin user and check if they have a user profile made
    admin_user = User.objects.get(username="admin")
    admin_user_profile = UserProfile.objects.filter(user=admin_user)
    if not admin_user_profile.exists():
        try:
            # Now create the user profile for the admin account, they are an approved researcher from the start. Also make sure
            # you set the city to Ottawa from Canada. This can only be successful if the cities light import is completed
            canada = Country.objects.get(name="Canada")
            home_city = City.objects.get(name="Ottawa", country=canada)
            return UserProfile.objects.update_or_create(
                # Locations will only work if cities_light is installed before this migration is ran
                user=admin_user, user_location=home_city,
                icu_location=home_city,
                role=UserRoles.RESEARCHER.name,
                is_pending_researcher=False,
                is_active_researcher=True
            )
        except (Country.DoesNotExist, City.DoesNotExist) as error:
            print("Cannot create admin profile without the country and city data installed.", error)
