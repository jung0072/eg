import React, { createContext, useContext, useReducer } from 'react';

const defaultSection = "SETTINGS"
const DEFAULT_CURRENT_FORM_SECTION_CONTEXT = { current: defaultSection, renderedSections: null, previousSection: null };
const CurrentFormSectionContext = createContext({ ...DEFAULT_CURRENT_FORM_SECTION_CONTEXT });
const reducer = (state, pair) => ({ ...state, ...pair });

/**
 * @returns
    {
        JSX;
    }
 A JSX object containing a the react context element and a use effect hook
 */
function CurrentFormSectionProvider(props) {
    // useReducer lets us pass in an object to the update function, similar to setState
    const [currentFormSectionContext, setCurrentFormSectionContext] = useReducer(
        reducer, { ...DEFAULT_CURRENT_FORM_SECTION_CONTEXT }
    );

    return (
        <CurrentFormSectionContext.Provider
            value={{ currentFormSectionContext, setCurrentFormSectionContext }} {...props}
        />
    );
}

// use Active Tab is a context provider function that will return the current active tab from the application
function useCurrentFormSectionContext() {
    const currentFormSectionContext = useContext(CurrentFormSectionContext);

    if (!currentFormSectionContext) console.error(
        'useActiveChatRoomContext must be used within an Active Chat Room Context Provider'
    );
    return currentFormSectionContext;
}

export { CurrentFormSectionContext, CurrentFormSectionProvider, useCurrentFormSectionContext };
