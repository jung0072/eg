import React, { createContext, useState } from 'react';

// Create the context for the Active Menu Navigation Item
export const ActiveNavigationMenuContext = createContext();

// Create the context provider component
export function ActiveNavigationMenuProvider({ children }) {
    // State to hold the selected navigation menu item
    const [activeNavigationMenu, setActiveNavigationMenu] = useState('');

    // Function to update the selected navigation menu item
    const updateActiveNavigationMenu = (updatedActiveMenu) => {
        setActiveNavigationMenu(updatedActiveMenu);
    };

    // Value object to be provided by the context provider
    const value = {
        activeNavigationMenu, updateActiveNavigationMenu,
    };

    return (<ActiveNavigationMenuContext.Provider value={value} children={children} />);
}
