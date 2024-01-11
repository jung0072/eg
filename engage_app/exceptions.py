class ResearchProjectPermissionsDoesNotExistError(Exception):
    """This exception occurs when a user will try and access a research project they are not apart of or
    they are currently not approved/ active for"""

    def __init__(
            self,
            user_id,
            research_study_id,
            message="This user does not have active research project permissions for this research study"
    ):
        self.message = message
        self.user_id = user_id
        self.research_study_id = research_study_id

    def __str__(self):
        return f'Error: -> User: {self.user_id} Study: {self.research_study_id} | {self.message}'
