import React, { createContext, useContext, useState } from 'react';

const EngageActionContext = createContext();

export const useEngageAction = () => {
    return useContext(EngageActionContext);
};

export const EngageActionProvider = ({ children }) => {
    const [actionState, setActionState] = useState({
        showMenuOptions: false,
        associatedWithID: null,
    });

    const toggleShowMenuOptions = (value) => {
        setActionState((prevState) => ({ ...prevState, showMenuOptions: value }));
    };

    const setAssociatedWithID = (id) => {
        setActionState((prevState) => ({ ...prevState, associatedWithID: id }));
    };

    return (
        <EngageActionContext.Provider value={{
            actionState,
            toggleShowMenuOptions,
            setAssociatedWithID,
        }}>
            {children}
        </EngageActionContext.Provider>
    );
};
