import React, { useContext, useEffect } from "react";
import FAQList from "../components/faq/FAQList.jsx";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider.jsx";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";

export default function FAQListScreen({ isUserAuthenticated }) {
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
            updateActiveNavigationMenu('')
        }
    }, []);

    return (
        <div className={'faq-list-screen'}>
            <FAQList />
        </div>
    );
}
