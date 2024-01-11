import React from 'react';
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider";
import SystemMessage from '../components/system_message/SystemMessage';


export default function SystemMessageScreen({ }) {
    // styling for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    removeLayoutPadding(false);
    changeBackgroundColor(false);

    return (
        <>
            <SystemMessage />
        </>

    );
}
