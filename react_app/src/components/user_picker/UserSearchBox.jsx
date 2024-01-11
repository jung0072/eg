import React, { useCallback, useRef, useState, useEffect } from 'react';
import { AutoComplete, Avatar, Typography } from "antd";
import Search from "antd/lib/input/Search";
import { UserOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { Constants } from '../utils';
import { useLazySearchUserTypeQuery } from '../../redux/services/userAPI';

const { HumanizedUserRoles } = Constants;
const { Text } = Typography;

export default function UserSearchBox(
    {
        clearOnSelect = false,
        onUserSelected,
        onCloseValue,
        searchBoxStyle = {},
        excludeUsers = [],
        formName = '',
        initialUser = null
    }
) {
    // The current options list from the server's response
    const [options, setOptions] = useState([]);

    // The current search query
    const [searchValue, setSearchValue] = useState("");

    // Used to keep track of the selected user if this field is used as a single field on it's own
    const [selectedUser, setSelectedUser] = useState(null);

    // Used to cancel a request's callback if the user updated the query before it completed
    const query = useRef();

    // rtk query for the user search
    const [triggerUserSearch, { isLoading: isLoadingUserSearch }] = useLazySearchUserTypeQuery();
    // When the search text updates
    const handleSearch = (value) => {
        // Clear existing results
        setOptions([]);
        setSelectedUser(null);
        query.current = value;

        // If it's empty return. Don't make a request
        if (!value) return;

        // Build the exclude list into a string to append to the query
        // We de-duplicate the excluded users by converting it to a set then back to an array
        let uniqe_exluded_ids = [...new Set(excludeUsers.map(u => u.id))];
        let query_param = uniqe_exluded_ids.reduce((str, uid) => str + `&exclude=${uid}`, "");
        // Begin the query
        triggerUserSearch(`?q=${value}${query_param}`).then(
            ({ data }) => {
                const { users = [] } = data;
                // If the query changed while we were waiting for the response cancel
                if (query.current !== value) return;

                // Map the server's response to a dict including the rendered label for the selection
                let options = users.map(x => ({
                    value: x.username,
                    user: x,
                    label: (
                        <>
                            <Avatar size={20} src={(
                                <img alt={'profile picture of the user'} src={'data:;base64,' + x.profile_picture}/>
                            )}/>
                            &nbsp;<Text>{x.full_name}</Text>
                            &nbsp;<Text type="secondary">{HumanizedUserRoles[x.role]}</Text>
                        </>
                    )
                }));

                // Update the state
                setOptions(options);
            }
        ).catch(console.error);
    };

    // Wrap the search callback in a debouncer so that it waits 500ms after they stop typing to perform the request
    const debounceSearch = useCallback(debounce(handleSearch, 500), [excludeUsers]);

    // Keep track of the user's input in the search box
    const onSearchValueChanged = (value) => setSearchValue(value);

    // When the user selects someone from the results list
    const onSelect = (selectedUsername) => {
        // Reverse lookup this username in the previous search results to grab the user object again
        let user = options.filter(x => x.user.username === selectedUsername)[0].user;

        // Update our state. Either clear the input or autofill the full name
        if (clearOnSelect) {
            setSearchValue("");
        } else {
            setSearchValue(user.full_name);
            setSelectedUser(user);
        }

        // Fire off a couple callbacks
        if (onUserSelected) onUserSelected(user);

        // Clean up
        setOptions([]);
    };

    // If we're a part of a modal, when it closes we want to clear ourselves
    useEffect(() => {
        if (onCloseValue) {
            setSearchValue("");
        }
    }, [onCloseValue]);

    // check if we have an initial user and set them to the user search box
    // TODO: BUGFIX: setting the initial value for form reloads

    useEffect(() => {
        if (initialUser && options.length === 0 && selectedUser === null) {
            setSearchValue(initialUser);
            handleSearch(initialUser);
        }
    }, [initialUser]);

    return (
        <AutoComplete
            onSearch={debounceSearch}
            options={options}
            onSelect={onSelect}
            value={searchValue}
            onChange={onSearchValueChanged}
            style={searchBoxStyle}
            className="engage-user-search-box"
        >
            <Search
                placeholder="Find a user"
                name={formName}
                allowClear={true}
                prefix={<>{
                    selectedUser ? <Avatar
                        size={20}
                        src={(
                            <img src={'data:;base64,' + selectedUser.profile_picture}
                                 alt={'profile picture of the user'}/>
                        )}
                    /> : <UserOutlined/>}
                    &nbsp;
                </>}
                loading={isLoadingUserSearch}/>
        </AutoComplete>
    );
}
