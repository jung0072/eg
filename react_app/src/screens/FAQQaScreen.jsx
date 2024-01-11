import React, { useContext, useEffect } from "react";
import QuestionVisit from "../components/faq/QuestionVisit";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";

export default function FaqQAScreen({ isUserAuthenticated }) {
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // useEffect hook for the component did mount lifecycle event
    useEffect(() => {
        if (isUserAuthenticated) {
            // remove the padding
            removeLayoutPadding(true);
            // remove the white background color
            changeBackgroundColor(false);
            // reset the active nav menu context
            updateActiveNavigationMenu('');
        }
    }, []);
    return <QuestionVisit />;
}
