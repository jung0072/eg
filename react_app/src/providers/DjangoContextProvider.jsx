import React, { createContext, useContext, useReducer } from 'react';


// Create the context element for the Active Tab
const DjangoContext = createContext();
const reducer = (state, pair) => ({ ...state, ...pair });

/**
 * A react provider function to send any items from the django context provided to the template to any child components
 * A react provider function to send any items from the django context provided to the template to any child components
 * @returns
    {
        JSX;
    }
 A JSX object containing a the react context element and a use effect hook
 */
function DjangoContextProvider(props) {
    // useReducer lets us pass in an object to the update function, similar to setState
    const rootElement = document.getElementById('root')
    const initialDjangoContext = rootElement.getAttribute('data-django-context')
    const [context, setContext] = useReducer(reducer, JSON.parse(initialDjangoContext));

    return <DjangoContext.Provider value={{ context, setContext }} {...props} />;
}

// use Active Tab is a context provider function that will return the current active tab from the application
function useDjangoContext() {
    const djangoContext = useContext(DjangoContext);

    if (!djangoContext) console.error('useDjangoContext must be used within an Django Context Provider');
    return djangoContext;
}

export { DjangoContextProvider, useDjangoContext, DjangoContext };
