import React, { createContext, useState } from 'react';

// Create the context for the UserProfileFormCompletion
export const UserProfileFormCompletionStatusContext = createContext();

// Create the context provider component
export function UserProfileFormCompletionStatusProvider({ children }) {
    // State to the initial values for profile form completion
    // each completed form will set their id as the attribute and if it is complete as the value
    const [userProfileCompletionStatus, setUserProfileCompletionStatus] = useState({});

    // Function to update the selected project ID and any other data we may need
    const updateUserProfileCompletionStatus = (completionStatus) => setUserProfileCompletionStatus(previous => ({ ...previous, ...completionStatus }));

    // Value object to be provided by the context provider
    const value = {
        userProfileCompletionStatus, updateUserProfileCompletionStatus,
    };

    return (<UserProfileFormCompletionStatusContext.Provider value={value} children={children} />);
}
