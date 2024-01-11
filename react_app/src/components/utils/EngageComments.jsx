import React, { useEffect, useRef, useState } from 'react';

import { Button, Comment, Form, Input, Row } from 'antd';

/**
 * EngageComments component renders a comment section with actions for adding and editing comments, depth level to 1.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {Array} props.actions - Action buttons for the comment.
 * @param {string} props.commentContent - Content of the comment.
 * @param {ReactNode} props.children - Child elements (Nested Comments).
 * @param {ReactNode} props.commentAuthor - Custom author element for comments.
 * @param {Object} props.authorData - Author data.
 * @param {string} props.authorData.first_name - First name of the author.
 * @param {string} props.authorData.last_name - Last name of the author.
 * @param {string} props.authorData.email - Email of the author.
 * @param {string} [props.authorData.profile_link] - Profile link of the author (optional).
 * @param {string} props.authorData.id - User ID of the author.
 * @param {boolean} props.loadingAddComment - Flag indicating if comment action request is in process or not.
 * @param {Object} props.commentBoxProps - Handle the comment box and the indexing of comment specific to the row.
 * @param {Object} props.commentBoxProps.rows - row height for the text area.
 * @param {Object} props.commentBoxProps.addButtonText - text for add button text.
 * @param {boolean} props.showCommentAuthor - Flag to show the comment author.
 * @param {boolean} props.isAddingWithIndex - Flag indicating if a comment is being added with an index.
 * @param {boolean} props.isEditingWithIndex - Flag indicating if a comment is being edited with an index.
 * @param {Function} props.closeCommentBox - Function to close the comment box.
 * @param {ReactNode} props.customCommentBox - Custom comment box.
 * @param {Object} props.commentActionStates - State of comment actions.
 * @param {Object} props.commentActionStates.adding - if adding a new comment.
 * @param {Object} props.commentActionStates.editing - if editing comment.
 * @param {Object} props.commentActionStates.deleting - if deleting comment.
 * @param {Object} props.commentActionStates.index - Index of the comment, if children it's +1 else index.
 * @param {Function} props.handleComment - Function to handle comments.
 * @param {string} props.commentKey - Key of the comment, if it is a child the indexing will be +1 the row index; if it is a parent, indexing is equal to row index.
 * @returns {JSX.Element} The rendered EngageComments component.
 */
// TODO: better way to handle children indexing, if depth level is increased
const EngageComments = ({
    actions,
    commentContent,
    children,
    commentAuthor,
    authorData,
    loadingAddComment,
    commentBoxProps,
    showCommentAuthor = false,
    isAddingWithIndex,
    isEditingWithIndex,
    closeCommentBox,
    customCommentBox,
    commentActionStates,
    handleComment,
    commentKey,
}) => {

    // state to handle commentBoxContent
    const [commentBoxContent, setCommentBoxContent] = useState('');
    // reference for edit input field
    const inputRef = useRef(null);

    // check if we are editing a comment
    useEffect(() => {
        if (commentActionStates.editing) {
            inputRef?.current?.focus();
        }
    }, [commentActionStates]);

    // handles the edit comment functionality
    const saveComment = () => {
        const newComment = inputRef?.current?.input.value
        if (newComment != commentContent) {
            handleComment(newComment);
            closeCommentBox();
        } else {
            closeCommentBox();
        }
    }

    return (
        <>
            <Comment
                actions={actions}
                author={
                    commentAuthor || showCommentAuthor && (
                        <>
                            <a href={authorData?.profile_link || `/app/user_profile/${authorData.id}`}>{authorData.first_name} {authorData.last_name} </a>
                            <a href={`mailto: ${authorData.email}`}><i>{`<${authorData.email}>`}</i></a>
                        </>
                    )
                }
                content={
                    commentActionStates.editing && isEditingWithIndex && commentKey === commentActionStates.index ? (
                        <Input ref={inputRef} defaultValue={commentContent} onPressEnter={saveComment} onBlur={saveComment} />
                    ) : commentContent
                }
            >
                {children}
            </Comment>
            {
                customCommentBox || isAddingWithIndex && <>
                    <Form.Item>
                        <Input.TextArea onChange={(e) => setCommentBoxContent(e.target.value)} rows={commentBoxProps?.rows || 4} />
                    </Form.Item>

                    <Form.Item>
                        <Row style={engageCommentStyles.commentButtonActionContainer}>
                            <Button loading={loadingAddComment} onClick={() => handleComment(commentBoxContent)} htmlType="submit" type="primary">
                                {commentBoxProps.addButtonText || "Add Comment"}
                            </Button>
                            <Button onClick={() => closeCommentBox()}>
                                Cancel
                            </Button>
                        </Row>
                    </Form.Item>
                </>
            }
        </>
    )
}

const engageCommentStyles = {
    commentButtonActionContainer: {
        display: 'flex',
        gap: '1rem',
        flexDirection: 'row'
    }
}

export default EngageComments;
