import { AppstoreOutlined, BarsOutlined, SearchOutlined, FilterFilled } from "@ant-design/icons";
import { Button, Input, List, Row, Tabs, Typography } from "antd";
import React, { useCallback, useEffect, useState, useLayoutEffect } from "react";
import CommunityListCardItem from "./CommunityListCard";
import CommunityListDetailView from "./CommunityListDetailView";
import './style/community_list.css';
import { Constants } from "../utils";
import UserSearchFilters from "./UserSearchFilters";
import { useCommunityListFiltersQuery } from '../../redux/services/userAPI';
import { anonymousTabString } from "../utils/constants.strings";

const { LIST_TYPES } = Constants;
const { Text } = Typography;

function countCategory(data, category) {
    if (category !== 'All') {
        return data.filter(x => x.role === category).length;
    }
    return data.length;
}

function FilteredCommunityCardList({ type, communityListData }) {

    // First filter out all the users that do not have the specified role unless we are viewing all
    if (type !== 'All') {
        communityListData = communityListData.filter(x => (x.role === type));
    }

    // if type is All remove all the anonymous user from the list
    if (type === 'All') {
        communityListData = communityListData.filter(x => (!x?.is_anonymous));
    }

    // If the tab is 'Anonymous', show the text
    if (type === "Anonymous") {
        return (
            <Text style={{ width: '70%', display: 'flex' }}>
                {anonymousTabString}
            </Text>
        );
    }

    return <List
        grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 1,
            lg: 1,
            xl: 2,
            xxl: 2,
        }}
        dataSource={communityListData}
        itemLayout="horizontal"
        // Map any fields that don't match the backend before trying to render the community list item
        renderItem={(item) => (<CommunityListCardItem key={item.user} userInfo={{
            ...item,
            interests: item.research_interests,
            pronouns: item.pronouns,
        }} />
        )}
    />;
}

export default function CommunityList({ userInfo, communityList, selectedFilters, setSelectedFilters }) {
    const { user: userData } = userInfo;
    // search by username state
    const [searchQuery, setSearchQuery] = useState('');
    const [communityListTabs, setCommunityListTabs] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [listType, setListType] = useState(LIST_TYPES.CARD);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const handleSwitchListType = useCallback(
        (clickEvent) => setListType(clickEvent.currentTarget.getAttribute('data-list-type')),
        [setListType]
    );

    const {
        data: communityListFilters,
        isLoading: isLoadingSearchFilters
    } = useCommunityListFiltersQuery();

    // useEffect hook to fetch the community list data
    const [isFilterDataLoaded, setIsFilterDataLoaded] = useState(false);
    const [filters, setFilters] = useState(null);
    useEffect(() => {
        if (communityListFilters && !isLoadingSearchFilters) {
            setIsFilterDataLoaded(true);
            setFilters(communityListFilters)
        }
    }, [communityListFilters, isLoadingSearchFilters]);

    // useEffect hook to render the tabs for the community list based on the returned data
    useEffect(() => {
        const userRoleSet = new Set();
        const userArray = (filteredUsers.length > 0) ? filteredUsers : communityList;
        let hasAnonymous = false;

        userArray.forEach(user => {
            if (user.role === 'Anonymous') {
                hasAnonymous = true; // Set flag to true if 'anonymous' is found
                return; // Skip adding 'anonymous' for now
            }
            userRoleSet.add(user.role); // Add roles other than 'anonymous'
        });

        // Add 'anonymous' at before 'All' if it was found in the userArray
        if (hasAnonymous) {
            userRoleSet.add('Anonymous');
        }

        if (userRoleSet.size >= 1) {
            userRoleSet.add('All');
        }

        setCommunityListTabs(Array.from(userRoleSet).map((role, index) => ({
            label: `${role}(${countCategory(filteredUsers, role)})`,
            key: `${index}`,
            children: (listType === LIST_TYPES.CARD)
                ? (<FilteredCommunityCardList type={role} communityListData={filteredUsers} />)
                : (<CommunityListDetailView type={role} communityListData={filteredUsers} />),
        })));
    }, [filteredUsers, searchQuery, listType, filters]);

    // useEffect hook to perform the search for the user by limiting the community list data, this can also
    // be the place where we filter users based on set answers
    useEffect(() => {
        // search on the basis of searchQuery
        if (searchQuery !== '') {

            // remove the Anonymous user when searching
            communityList = communityList.filter(x => !x?.is_anonymous);

            setFilteredUsers(communityList.filter(user => {
                const fullName = `${user.first_name} ${user.last_name}`;
                const trimmedQuery = searchQuery.trim().toLowerCase();
                const trimmedName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');

                return (
                    user.username.toLowerCase().includes(trimmedQuery) ||
                    fullName.toLowerCase().includes(trimmedQuery) ||
                    trimmedName.includes(trimmedQuery)
                );
            })
            );
        } else {
            setFilteredUsers(communityList);
        }
    }, [searchQuery, communityList]);

    // Only render the community list if we have data, if not just display a message saying there is no users
    // show the all tab as the default active tab, since it's the last tab created we can set the default active key
    // to the length of the array minus 1
    const renderedList = (communityList.length > 0 && communityListTabs.length > 0)
        ? (<Tabs
            defaultActiveKey={`${communityListTabs.length - 1}`}
            tabBarExtraContent={(
                <Input.Search
                    style={communityListStyles.search}
                    placeholder="Search by name..."
                    prefix={<SearchOutlined />}
                    onChange={e => setSearchQuery(e.target.value)}
                    value={searchQuery}
                />
            )}
            items={communityListTabs}
        />)
        : (<div>We could not find any users based on your search criteria</div>);

    return (
        <div style={communityListStyles.container}>
            <div>
                <Typography.Title style={communityListStyles.title}> Community </Typography.Title>
                <Typography.Paragraph>
                    This is the community list where you can view approved researchers, approved clinicians, or patient
                    and family partners on Engage.
                </Typography.Paragraph>
            </div>
            <Row justify={"end"}>
                <UserSearchFilters filters={filters} setIsOpenState={setIsFilterDrawerOpen}
                    isOpen={isFilterDrawerOpen} setSelectedFilters={setSelectedFilters}
                    selectedFilters={selectedFilters} isFilterDataLoaded={isFilterDataLoaded}
                />
            </Row>
            <Row justify={"end"}>
                <Button type={(listType === LIST_TYPES.CARD) ? "primary" : "dashed"} icon={<AppstoreOutlined />}
                    data-list-type={LIST_TYPES.CARD} onClick={handleSwitchListType}
                    style={{ ...communityListStyles.button, marginRight: '1em' }}
                >
                    Cards
                </Button>
                <Button type={(listType === LIST_TYPES.DETAIL) ? "primary" : "dashed"} icon={<BarsOutlined />}
                    data-list-type={LIST_TYPES.DETAIL} onClick={handleSwitchListType}
                    style={communityListStyles.button}
                >
                    Details
                </Button>
            </Row>
            {renderedList}
        </div>
    );
}

const communityListStyles = {
    container: {
        paddingLeft: '5%',
        paddingRight: '5%'
    },
    title: {
        color: "#002E6D"
    },
    button: {
        borderRadius: '5px'
    },
    search: {
        borderRadius: '10px'
    }
};
