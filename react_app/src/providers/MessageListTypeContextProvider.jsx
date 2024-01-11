import React, { createContext, useContext, useReducer } from 'react';

const MESSAGE_LIST_TYPES = {
    PROJECT: {
        name: "Research Projects", label: "Projects"
    }
    ,
    TASK: {
        name: "Research Tasks", label: "Tasks"
    }
};


// Create the context element for the Active Tab
const MessageListTypeContext = createContext();
const reducer = (state, pair) => ({ ...state, ...pair });

/**
 * A react provider function to set the state of the GroupMessageList from any componenet inside MessageCentre
 * This will switch the displayed message list type from Project Messages to Tasks Messages and perform any needed
 * state modifications or API calls.
 * @returns
    {
        JSX;
    }
 A JSX object containing a the react context element and a use effect hook
 */
function MessageListTypeContextProvider(props) {
    // TODO: Link with React Redux Toolkit when we implement API calls for the discussion boards or tasks
    // useReducer lets us pass in an object to the update function, similar to setState
    const initialMessageListTypeContext = MESSAGE_LIST_TYPES.PROJECT;
    const [messageListTypeContext, setMessageListTypeContext] = useReducer(
        reducer, { type: initialMessageListTypeContext }
    );

    return <MessageListTypeContext.Provider value={{ messageListTypeContext, setMessageListTypeContext }} {...props} />;
}

// use Active Tab is a context provider function that will return the current active tab from the application
function useMessageListTypeContext() {
    const messageListTypeContext = useContext(MessageListTypeContext);

    if (!messageListTypeContext) console.error(
        'useMessageListTypeContext must be used within an Message List Type Context Provider'
    );
    return messageListTypeContext;
}

export { MessageListTypeContextProvider, useMessageListTypeContext, MessageListTypeContext, MESSAGE_LIST_TYPES };
