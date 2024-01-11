import React, { createContext, useState } from 'react';

// the default state of the webpage info context
const DEFAULT_WEB_PAGE_INFO_STATE = {
    screenshot: null,
    route: null,
    reportBug: false
};

// Create the context for the WebpageInfo
export const WebPageInfoContext = createContext();

// Create the context provider component
export function WebPageInfoProvider({ children }) {
    // State to hold the webpage information
    const [webPageInfo, setWebPageInfo] = useState({
        ...DEFAULT_WEB_PAGE_INFO_STATE
    });

    // Function to update the webpage information
    const updateWebPageInfo = ({ screenshot, route, reportBug }) => {
        setWebPageInfo((previousState) => ({ ...previousState, screenshot, route, reportBug }));
    };

    // function to clear the state of the webpage info
    const clearWebPageInfo = () => setWebPageInfo({...DEFAULT_WEB_PAGE_INFO_STATE});

    // Value object to be provided by the context provider
    const value = {
        webPageInfo,
        updateWebPageInfo,
        clearWebPageInfo
    };

    return (
        <WebPageInfoContext.Provider value={value}>
            {children}
        </WebPageInfoContext.Provider>
    );
}
