import React, { createContext, useState } from 'react';

// Create the context for the Selected Research Project
export const SelectedResearchProjectContext = createContext();

// Create the context provider component
export function SelectedResearchProjectProvider({ children }) {
    // State to hold the selected project ID
    const [selectedResearchProject, setSelectedResearchProject] = useState({
        id: null
    });

    // Function to update the selected project ID and any other data we may need
    const updateSelectedResearchProject = (updatedProject) => {
        setSelectedResearchProject(updatedProject);
    };

    // Value object to be provided by the context provider
    const value = {
        selectedResearchProject, updateSelectedResearchProject,
    };

    return (<SelectedResearchProjectContext.Provider value={value} children={children} />);
}
