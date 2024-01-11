const discussionBoardApp = {
    init: () => {
        console.log('The Communication App Discussion Board script has been loaded');
        const deleteBoardButtons = Array.from(document.getElementsByName('delete-discussion-board-button'));
        deleteBoardButtons.forEach(btn => btn.addEventListener('click', discussionBoardApp.deleteDiscussionBoard));
    },
    submitDiscussionBoard: (submitEvent) => {
        submitEvent.preventDefault();
        submitEvent.stopPropagation();
    },
    deleteDiscussionBoard: (clickEvent) => {
        const discussionBoardId = clickEvent.currentTarget.getAttribute('data-board-id');
        sendFetchRequest({
            url: `/chat/discussion_board/${discussionBoardId}/delete/`,
            method: 'GET',
            headers: {
                'X-CSRFToken': globalValues.CSRF_TOKEN,
                'Accept': 'application/json',
            },
            callback: ({ success: successMessage, error: errorMessage }) => {
                // display the proper toast notification
                if (errorMessage) {
                    toastApp.createNotification('error', `Failed to delete discussion board`, errorMessage);
                } else {
                    toastApp.createNotification('success', `Deleted discussion board`, successMessage);
                    setTimeout(() => location.reload(), 3000);
                }
            },
            onFail: (error) => {
                console.error("There was an error deleting the discussion board", error);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', discussionBoardApp.init);
