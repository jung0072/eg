from django import forms
from communication_app.models import DiscussionBoard


class DiscussionBoardForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.parent_task_id = kwargs.pop('parent_task_id', None)
        self.board_creator_id = kwargs.pop('board_creator_id', None)
        super().__init__(*args, **kwargs)

    class Meta:
        model = DiscussionBoard
        fields = ['title', 'description']
        widgets = {
            'title': forms.TextInput()
        }

    def save(self, commit=False):
        # Save the discussion board if and only if the parent task id and the board creator id were supplied
        # otherwise we cannot create the discussion board
        discussion_board = super().save(commit=commit)
        if self.parent_task_id and self.board_creator_id:
            discussion_board.parent_task_id = self.parent_task_id
            discussion_board.board_creator_id = self.board_creator_id
            discussion_board.save()
        return discussion_board
