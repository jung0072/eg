import React, { useContext, useEffect, useState } from "react";
import CommunityList from "../components/community_list/CommunityList";
import {
    selectLoggedInUserData,
    useSearchCommunityListMutation
} from "../redux/services/userAPI";
import { useSelector } from "react-redux";
import { EngageSpinner } from "../components/utils";
import { useEngageStylingLayout } from "../providers/EngageLayoutStylingContextProvider";
import { ActiveNavigationMenuContext } from "../providers/ActiveNavigationMenuContextProvider";
import { MENU_ROUTES } from "../components/utils/constants";

export default function communityListScreen() {
    const [selectedFilters, setSelectedFilters] = useState({});
    const [communityListData, setCommunityListData] = useState([]);
    const userInfo = useSelector(selectLoggedInUserData);
    // style for engage layout
    const { removeLayoutPadding, changeBackgroundColor } = useEngageStylingLayout();
    const { updateActiveNavigationMenu } = useContext(ActiveNavigationMenuContext);

    const [retrieveCommunityList, {
        isLoading: isLoadingSearchedCommunityList,
        isError: isErrorCommunityList,
        error: communityListError
    }] = useSearchCommunityListMutation();

    // useEffect hook for component did mount
    useEffect(() => {
        // remove the padding
        removeLayoutPadding(false);
        // remove the white background color
        changeBackgroundColor(false);
        // set the active menu nav context to the community page
        updateActiveNavigationMenu(MENU_ROUTES[2].key);
    }, []);

    // useEffect Hook to load the initial user list when the component loads and when they select filters
    useEffect(() => {
        // Check each supplied filter and make sure its not an empty array or an empty string
        const validatedUserFilters = {};
        Object.keys(selectedFilters).forEach(selection => {
            const userOptions = selectedFilters[selection];
            if (Array.isArray(userOptions) && userOptions?.length > 0 && !userOptions.includes('')) {
                validatedUserFilters[selection] = userOptions;
            } else if (typeof userOptions === "string" && userOptions !== '') {
                validatedUserFilters[selection] = userOptions;
            }
        });
        retrieveCommunityList({ filters: validatedUserFilters }).then(response => setCommunityListData(response.data));
    }, [selectedFilters]);

    if (isLoadingSearchedCommunityList) {
        return <EngageSpinner loaderText={"Loading community list"} display="fullscreen"/>;
    }

    if (isErrorCommunityList) {
        console.error(communityListError);
    }
    if (!userInfo || !communityListData ) {
        return (<div>Could not load user data...</div>);
    }
    return (
        <div className={'community-list-screen'}>
            <CommunityList userInfo={userInfo} communityList={communityListData}
                           selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters}
            />
        </div>
    );
}
