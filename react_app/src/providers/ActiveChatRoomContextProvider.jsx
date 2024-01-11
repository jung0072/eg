import React, { createContext, useContext, useReducer } from 'react';

// Create the context element for the Active Tab
const DEFAULT_CHAT_ROOM_CONTEXT = { chatRoomID: null, researchProjectID: null, discussionBoard: null };
const ActiveChatRoomContext = createContext({ ...DEFAULT_CHAT_ROOM_CONTEXT });
const reducer = (state, pair) => ({ ...state, ...pair });

/**
 * @returns
    {
        JSX;
    }
 A JSX object containing a the react context element and a use effect hook
 */
function ActiveChatRoomContextProvider(props) {
    // TODO: Link with React Redux Toolkit when we implement API calls for the discussion boards or tasks
    // useReducer lets us pass in an object to the update function, similar to setState
    const [activeChatRoomContext, setActiveChatRoomContext] = useReducer(
        reducer, { ...DEFAULT_CHAT_ROOM_CONTEXT }
    );

    return <ActiveChatRoomContext.Provider value={{ activeChatRoomContext, setActiveChatRoomContext }} {...props} />;
}

// use Active Tab is a context provider function that will return the current active tab from the application
function useActiveChatRoomContext() {
    const activeChatRoomContext = useContext(ActiveChatRoomContext);

    if (!activeChatRoomContext) console.error(
        'useActiveChatRoomContext must be used within an Active Chat Room Context Provider'
    );
    return activeChatRoomContext;
}

export { ActiveChatRoomContext, ActiveChatRoomContextProvider, useActiveChatRoomContext };
