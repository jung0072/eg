import React, { useCallback, useEffect, useState } from "react";
import { Layout, Menu, Table, Typography, Collapse } from "antd";
import './user_profile_resume.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const userProfileResumeColumns = [
    {
        title: 'Attribute',
        dataIndex: 'attribute',
        key: 'attribute',
        sorter: (a, b) => (a.attribute.toLowerCase() < b.attribute.toLowerCase() ? -1 : 1),
        sortDirections: ['ascend', 'descend'],
        render: (item) => (<Title level={5}>{item}</Title>)
    },
    {
        title: 'Selection',
        dataIndex: 'value',
        key: 'value',
        sorter: (a, b) => (a.value.toLowerCase() < b.value.toLowerCase() ? -1 : 1),
        sortDirections: ['ascend', 'descend'],
        render: (_, item) => (item.isWeblink)
            ? (<a target="_blank" href={item.value}>{item.attribute} Link</a>)
            : (<Text>{item.value}</Text>)
    }
];

function PublicProfileDetails({ customAnswers }) {
    const displayedData = customAnswers.map(({
                                                 selected_options,
                                                 question_text,
                                                 label,
                                                 is_weblink
                                             }, index) => ({
        key: index,
        attribute: label,
        value: selected_options.filter(opt => opt !== "other<free_text>").map((option) => option).join(', '),
        isWeblink: is_weblink
    }));

    return (
        <Table dataSource={displayedData}
               columns={userProfileResumeColumns}
               pagination={{ pageSize: 12 }}
               size={"small"}
               style={{ marginTop: '1em' }}
        />
    );
}

const checkPrivacySettings = (userAnswers) => {
    // check if EDI info is shown and if that section is seen even
    const privacySettingIndex = userAnswers.findIndex(answer => answer.label === "EDI Privacy Settings");
    if (privacySettingIndex > -1) {
        // if the question exists we know the edi section exists and then we can filter out the questions
        // and then show only the EDI Privacy question. Only if the user is not the same user as the one viewing
        // the section
        return userAnswers[privacySettingIndex]?.selected_options[0] === "Everyone can see this";
    }
    return true;
};

export default function UserProfileResume({ userData, currentUserID }) {
    const { custom_answers: customAnswers } = userData;
    const [displayedResume, setDisplayedResume] = useState({ menu: 0 });
    const [displayedMenuItems, setDisplayedMenuItems] = useState([]);
    const [displayedSection, setDisplayedSection] = useState(null);

    // useEffect Hook to render the displayed section based on what the user clicked, we will first filter the
    // menu items based on the selection and we will then map the section to a PublicProfileDetails Component
    // and give it the custom answers that match the displayed section
    useEffect(() => {
        let displayedAnswers = customAnswers;
        const isEDIInfoShown = checkPrivacySettings(customAnswers);
        if (!isEDIInfoShown && userData.user !== currentUserID) {
            const privacySettingIndex = customAnswers.findIndex(answer => answer.label === "EDI Privacy Settings");
            displayedAnswers = displayedAnswers.filter((answer) =>
                answer.section !== "Equity, Diversity, Inclusion (EDI) Information" && answer.label !== "EDI Privacy Settings"
            );
            displayedAnswers.push(customAnswers[privacySettingIndex]);
        }
        setDisplayedSection(displayedMenuItems.filter(menu => menu.key === parseInt(displayedResume.menu)).map(item => (
            <PublicProfileDetails key={item.key}
                                  customAnswers={displayedAnswers.filter(answer => answer.section === item.label)}
            />
        )));
    }, [displayedResume, setDisplayedSection, displayedMenuItems]);

    // useEffect hook to set the menu items based on the returned user profile answers
    useEffect(() => {
        if (customAnswers && customAnswers.length > 0) {
            // check if EDI info is shown and if that section is seen even
            // TODO Map this to a property returned in the request object
            let displayedAnswers = customAnswers;
            const isEDIInfoSectionModified = !checkPrivacySettings(customAnswers) && userData.user === currentUserID;

            // map the sections returned to a set to only show unique sections
            const uniqueSections = new Set();
            displayedAnswers.forEach(({ section }) => uniqueSections.add(section));
            const newMenuItems = Array.from(uniqueSections).map((sectionName, index) => ({
                key: index,
                label: sectionName,
                className: (sectionName === "Equity, Diversity, Inclusion (EDI) Information" && isEDIInfoSectionModified)
                    ? 'private-edi-settings'
                    : '',
                title: (sectionName === "Equity, Diversity, Inclusion (EDI) Information" && isEDIInfoSectionModified)
                    ? 'This section is only shown to you, not to anyone else'
                    : ''
            }));
            setDisplayedMenuItems(newMenuItems);
        }
    }, [userData, setDisplayedMenuItems]);

    // callback function to set which menu is active
    const handleMenuClick = useCallback((item) => setDisplayedResume({ menu: item.key }));

    return (
        <Collapse defaultActiveKey={['1']} style={resumeStyles.container}>
            <Panel className="user-profile-resume-header"
                   header={<Text style={resumeStyles.title}>User Profile Variables:</Text>}
                   key={"1"}
            >
                <Layout style={{ ...resumeStyles.container, margin: '1em' }}>
                    <Menu
                        style={{ minWidth: 0, flex: "auto" }}
                        items={displayedMenuItems}
                        onClick={handleMenuClick}
                        selectedKeys={`${displayedResume.menu}`}
                        mode="horizontal"
                    />
                    {displayedSection}
                </Layout>
            </Panel>
        </Collapse>
    );
}

const resumeStyles = {
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: '15px',
        marginTop: '1em',
        padding: '1em !important',
        width: '100%',
    },
    title: {
        fontWeight: 600,
        color: '#002E6D',
        margin: '1em',
        fontSize: '1.5em'
    }
};
