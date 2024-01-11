from django.http import HttpRequest
from rest_framework.exceptions import NotFound

from engage_app.models.research_project.research_project import ResearchProject
from engage_app.models.research_project.research_project_participant import ResearchProjectParticipant


def attach_project(request: HttpRequest, project_id: int):
    """
    Given an http request object and a project id, attempts to obtain and attach the project instance to the request object
    If unsuccessful, this will raise an appropriate exception.
    """

    # Make sure we're given good data
    if project_id is None or not isinstance(project_id, int):
        raise NotFound("Project ID given was non-integer")
    
    # Check if the project is already attached
    if hasattr(request, 'project'):
        # Just double check it's the same project ID. I don't know how this would happen but check anyway
        if request.project.id != project_id:
            raise Exception("attach_project called twice on the same request with different project_id's")
        
        # If it's already the same then we just continue
        return

    # Try to get the project
    project = ResearchProject.objects.filter(pk=project_id).first()
    if not project:
        # Client error (not found)
        raise NotFound("Project with the given ID does not exist")

    # Seems like everything is OK, attach the project to the request
    setattr(request, 'project', project)

    # Next we can also pre-fetch the user's membership status if applicable.
    if request.user.is_authenticated:
        # This CAN be None, which represents the requesting user is not affiliated with the project.
        project_membership = ResearchProjectParticipant.objects.filter(
            user_id=request.user.id, study_id=project.id
        ).first()
        setattr(request, 'project_membership', project_membership)

    # Project is attached, request can continue
    return
