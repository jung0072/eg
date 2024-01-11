import React, { createContext, useState, useContext } from 'react';

// Define the default state for projects
const DEFAULT_PROJECTS_STATE = null;

// Create the context for the ProjectContext
export const UserProjectListContext = createContext();

/**
 * Context provider for managing user project lists.
 *
 * @component
 * @param {Object} props - The component's properties.
 * @param {ReactNode} props.children - The child elements to be wrapped by this context provider.
 * @returns {JSX.Element} The user project list context provider component.
 */
export function UserProjectListProvider({ children }) {
    // State to hold the list of projects
    const [userProjectList, setUserProjectList] = useState(DEFAULT_PROJECTS_STATE);

    // Function to update the list of projects
    const updateUserProjectList = (newProjects) => setUserProjectList(newProjects);

    // Value object to be provided by the context provider
    const value = {
        userProjectList,
        updateUserProjectList
    };

    return (
        <UserProjectListContext.Provider value={value} children={children} />
    );
}
