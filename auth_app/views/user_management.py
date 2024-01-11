import json

from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import render

from auth_app.models import UserProfile
from engage_app.decorators import admin_required_ajax


@admin_required_ajax
def change_user_password(request):
    # First get the requested user object and generate and set the new password on engage
    json_data = json.loads(request.body)
    user_account = User.objects.filter(id=json_data['user_id'])

    if user_account.exists():
        user_account = user_account.first()
        new_password = User.objects.make_random_password(15)

        # Now make a request to insight-scope to set the new password
        # commenting the request made to insightScope as we have individual setup now for both platforms
        # response = requests.post(
        #     url=f'{config_provider.get_config("sso", "server")}/engage/change_password/',
        #     headers={
        #         "X-API-KEY": settings.API_KEY,
        #         'X-USER-EMAIL': user_account.email,
        #         'X-USERNAME': user_account.username
        #     },
        #     data={
        #         "new_password": new_password
        #     }
        # )
        # if response.status_code == 200:
            # Once we have confirmed that the password was changed on insightScope we can then set the new password
        user_account.set_password(new_password)
        user_account.save()

            # Finally return the newly created password to the Admin User so they can copy and paste the password
        return JsonResponse(data=dict(
                success=f"We have successfully updated the account password for {user_account.email}",
                new_password=new_password
            ), status=200)

    return JsonResponse(data=dict(
        error=f"There was an error setting the password for the selected user, please try again later",
    ), status=500)


@admin_required_ajax
def change_user_role(request):
    if request.method == 'POST':
        # First get the requested user object and the new role for the user
        user_profile = UserProfile.objects.filter(user_id=request.POST.get('user_id'))
        new_role = request.POST.get('user_role')
        # If the user exists, set the new role and save the user
        if user_profile.exists():
            user_profile = user_profile.first()
            user_profile.role = new_role
            user_profile.save()

            # Now make a request to insightScope to update the user profile details
            # commenting the request made to insightScope as we have individual setup now for both platforms
            # update_insight_scope_user_profile_response = requests.post(
            #     url=f'{config_provider.get_config("sso", "server")}/engage/user_data/',
            #     data={
            #         'role': user_profile.role
            #     },
            #     headers={
            #         "X-API-KEY": settings.API_KEY, 'X-USERNAME': user_profile.user.username,
            #         'X-USER-EMAIL': user_profile.user.email
            #     }
            # )

            # If we have a successful response, send a toast notification to the admin saying the request went through
            # if update_insight_scope_user_profile_response.status_code == 200:
            return JsonResponse(data=dict(
                    success=f"You have successfully updated the role for user {user_profile.user.email} to {new_role}"
                ))

    return JsonResponse(data=dict(
        error=f"There was an issue saving the new role for the selected user please try again later",
    ), status=500)
