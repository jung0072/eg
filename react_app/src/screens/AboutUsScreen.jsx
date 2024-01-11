import React, { useContext, useEffect } from 'react';
import AboutUs from "../components/about_us/AboutUs";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

export default function AboutUsScreen({}) {
    // styling for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    // useEffect hook for component did mount
    useEffect(() => {
        removeLayoutPadding(false);
        changeBackgroundColor(false);
        updateActiveNavigationMenu(MENU_ROUTES[5].key)
    }, []);

    return (
        <div className={'about-us-screen'}>
            <AboutUs />
        </div>
    );
}
