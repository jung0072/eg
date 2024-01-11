import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Avatar, Select, Typography } from "antd";
import debounce from 'lodash/debounce';
import { Constants } from '../utils';
import { useLazySearchUserTypeQuery } from '../../redux/services/userAPI';

const { HumanizedUserRoles } = Constants;
const { Text } = Typography;

/**
 * Component for a multiple user search box.
 * @param {Object} props - The component props.
 * @param {boolean} [props.clearOnSelect=false] - Flag indicating whether to clear the input after selecting a user.
 * @param {function} props.onUserSelected - Callback function invoked when a user is selected.
 * @param {function} props.onCloseValue - Callback function invoked when the component's modal is closed.
 * @param {Object} [props.searchBoxStyle={}] - Custom styles for the search box.
 * @param {Array} [props.excludeUsers=[]] - List of users to exclude from search results.
 * @param {string} [props.formName=''] - Name of the form associated with the component.
 * @param {Object} [props.initialUser=null] - Initial selected user.
 * @param {string} [props.mode="single"] - Selection mode ('single' or 'multiple').
 * @returns {JSX.Element} - MultipleUserSearchBox component.
 */
export default function MultipleUserSearchBox({
    clearOnSelect = false,
    onUserSelected,
    onCloseValue,
    searchBoxStyle = {},
    excludeUsers = [],
    formName = '',
    initialUser = null,
    mode = "single"
}) {
    // The current options list from the server's response
    const [options, setOptions] = useState([]);

    // The current search query
    const [searchValue, setSearchValue] = useState('');

    // Used to keep track of the selected users
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Used to cancel a request's callback if the user updated the query before it completed
    const query = useRef();

    // rtk query for the user search
    const [triggerUserSearch, { isLoading: isLoadingUserSearch }] = useLazySearchUserTypeQuery();

    /**
     * Handles the search text update.
     * @param {string} value - The search value.
   */
    const handleSearch = (value) => {
        // Clear existing results
        setOptions([]);
        query.current = value;

        // If it's empty return. Don't make a request
        if (!value) return;

        // Build the exclude list into a string to append to the query
        // We de-duplicate the excluded users by converting it to a set then back to an array
        const uniqe_exluded_ids = [...new Set(excludeUsers.map((u) => u.id))];
        const query_param = uniqe_exluded_ids.reduce((str, uid) => str + `&exclude=${uid}`, '');
        // Begin the query
        triggerUserSearch(`?q=${value}${query_param}`)
            .then(({ data }) => {
                const { users = [] } = data;
                // If the query changed while we were waiting for the response cancel
                if (query.current !== value) return;

                // Map the server's response to a dict including the rendered label for the selection
                const options = users.map((x) => ({
                    value: x.username,
                    user: x,
                    label: (
                        <>
                            <Avatar
                                size={20}
                                src={<img alt={'profile picture of the user'} src={'data:;base64,' + x.profile_picture} />}
                            />
                            &nbsp;
                            <Text>{x.full_name}</Text>
                            &nbsp;
                            <Text type="secondary">
                                {HumanizedUserRoles[x.role]}
                            </Text>
                        </>
                    )
                }));

                // Update the state
                setOptions(options);
            })
            .catch(console.error);
    };

    // Wrap the search callback in a debouncer so that it waits 500ms after they stop typing to perform the request
    const debounceSearch = useCallback(debounce(handleSearch, 500), [
        excludeUsers
    ]);

    // Keep track of the user's input in the search box
    /**
     * Handles the user's input in the search box.
     * @param {string} value - The search value.
   */
    const onSearchValueChanged = (value) => setSearchValue(value);

    // When the user selects someone from the results list
    /**
     * Handles the selection of a user from the results list.
     * @param {string} selectedUsername - The selected username.
   */
    const onSelect = (selectedUsername) => {
        // Reverse lookup this username in the previous search results to grab the user object again
        const user = options.find((x) => x.user.username === selectedUsername)?.user;

        // Update our state. Either clear the input or autofill the full name
        if (clearOnSelect) {
            setSearchValue("");
        } else {
            setSearchValue(user.full_name);
            if (mode === "multiple") {
                // if the mode is multiple we want to append the users inside the selectedUsers
                if(selectedUsers.includes(user)) return;
                setSelectedUsers((prevSelectedUsers) => {
                    const updatedSelectedUsers = [...prevSelectedUsers, user];
                    if (onUserSelected) {
                        onUserSelected(updatedSelectedUsers); // Call onUserSelected with the latest selected users
                    }
                    return updatedSelectedUsers;
                });
            } else {
                // when the form mode is single just pass the first value of the array
                setSelectedUsers((prevSelectedUsers) => {
                    const updatedSelectedUsers = user;
                    if (onUserSelected) {
                        onUserSelected(updatedSelectedUsers); // Call onUserSelected with the latest selected users
                    }
                    return [updatedSelectedUsers];
                });
            }
        }
        // Clean up
        setOptions([]);
    };

    // When the user clears the selected value
    const onClear = () => {
        setSearchValue("");
        setSelectedUsers([]); // Clear the selected users list
        setOptions([]);
    };

    // When user deselect an option
    const onDeselect = (value) => {
        setSelectedUsers((prevSelectedUsers) =>
            prevSelectedUsers.filter((user) => user.full_name !== value)
        );
    };

    // Custom filtering function for options based on username and full name
    const filterOption = (inputValue, option) => {
        const userFullName = option.user.full_name.toLowerCase();
        const username = option.value.toLowerCase();
        const searchValue = inputValue.toLowerCase();
        return (
            userFullName.includes(searchValue) || username.includes(searchValue)
        );
    };

    // If we're a part of a modal, when it closes we want to clear ourselves
    useEffect(() => {
        if (onCloseValue) {
            setSearchValue('');
        }
    }, [onCloseValue]);

    // check if we have an initial user and set them to the user search box
    useEffect(() => {
        if (initialUser && options.length === 0 && selectedUsers.length === 0) {
            setSearchValue(initialUser);
            handleSearch(initialUser);
        }
    }, [initialUser]);

    // set the default user when editing the project
    useEffect(() => {
        if (initialUser && options.length > 0 && selectedUsers.length === 0) {
            const user = options.find((option) => option.user.full_name === initialUser)?.user;
            if (user) {
                setSelectedUsers([user]);
            }
        }
    }, [initialUser, options]);

    return (
        <Select
            mode="multiple"
            onSearch={debounceSearch}
            filterOption={filterOption}
            options={options}
            onSelect={onSelect}
            value={selectedUsers.map((user) => user.full_name)} // Update value prop to an array of selected user values
            onChange={onSearchValueChanged}
            style={searchBoxStyle}
            className="engage-user-search-box"
            placeholder="Find a user"
            showArrow={false}
            allowClear
            loading={isLoadingUserSearch}
            optionLabelProp="label"
            notFoundContent={null}
            onClear={onClear}
            onDeselect={onDeselect}
        >
            {options.map((option) => (
                <Select.Option key={option.value} value={option.value} label={option.label}>
                    {option.label}
                </Select.Option>
            ))}
        </Select>
    );
}
