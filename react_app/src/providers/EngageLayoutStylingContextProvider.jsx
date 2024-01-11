import React, { createContext, useContext, useState } from 'react';

/**
 * Context for Engage Layout Styling.
 * @typedef {Object} EngageLayoutStylingContext
 * @property {boolean} removePadding - Flag indicating whether layout padding should be removed.
 * @property {boolean} whiteBackground - Flag indicating whether the background should be white.
 * @property {function} removeLayoutPadding - Function to toggle the removal of layout padding.
 * @property {function} changeBackgroundColor - Function to change the background color.
 */

/** Engage Layout Styling context */
const EngageLayoutStylingContext = createContext();

/**
 * Engage Layout Styling Provider component.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {React.ReactNode} Engage Layout Styling Provider.
 */
const EngageLayoutStylingProvider = ({ children }) => {
    const [removePadding, setRemovePadding] = useState(false);
    const [whiteBackground, setWhiteBackground] = useState(false);

    /**
     * Toggle the removal of layout padding.
     * @param {boolean} value - Flag indicating whether to remove layout padding.
     */
    const removeLayoutPadding = (value) => {
        setRemovePadding(value);
    };

    /**
     * Change the background color toggle white color. Truthy will set the white color Falsy will remove it.
     * @param {boolean} value - Flag indicating whether the background should be white.
     */
    const changeBackgroundColor = (value) => {
        setWhiteBackground(value);
    };

    // Combine the state and functions into a single context value
    const contextValue = {
        removePadding,
        whiteBackground,
        removeLayoutPadding,
        changeBackgroundColor,
    };

    return (
        <EngageLayoutStylingContext.Provider value={contextValue}>
            {children}
        </EngageLayoutStylingContext.Provider>
    );
};

/**
 * Hook to access the Engage Layout Styling context.
 * @returns {EngageLayoutStylingContext} Engage Layout Styling context.
 */
const useEngageStylingLayout = () => {
    return useContext(EngageLayoutStylingContext);
};

export { EngageLayoutStylingProvider, useEngageStylingLayout };
