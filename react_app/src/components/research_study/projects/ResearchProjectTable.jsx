import React, { useCallback, useContext, useEffect, useState } from "react";
import { Button, Col, Input, Popover, Row, Space, Table, Tabs } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    FolderOpenFilled, InboxOutlined,
    Loading3QuartersOutlined
} from "@ant-design/icons";
import { Colours, EngageSpinner, openNotification, renderFormErrors } from "../../utils/";
import {
    useApprovedResearchProjectsQuery,
    useUserResearchProjectListDataQuery
} from '../../../redux/services/researchProjectAPI.js';
import { convertToTitleCase, getEstimatedDates } from "../../utils/common";
import { Link } from 'react-router-dom';
import { SelectedResearchProjectContext } from "../../../providers/SelectedResearchProjectContextProvider";
import { useArchiveProjectMutation } from "../../../redux/services/userAPI";
import { UserProjectListContext } from "../../../providers/UserProjectListContextProvider";

const tableStyles = {
    icon: {
        marginRight: '0.5em'
    }
};

/**
 * Displays the content of a research project table.
 *
 * @param {Object} props - The component's properties.
 * @param {Object[]} props.dataSource - An array of data source items for the table.
 * @param {boolean} props.isHome - A flag indicating whether the component is on the home page.
 * @param {number} props.pageSize - The number of items to display per page.
 * @param {boolean} props.disableArchive - A flag indicating whether the archive functionality is disabled.
 * @returns {JSX.Element} The research project table content component.
 */
function ResearchProjectTableContent({ dataSource, isHome, pageSize, disableArchive, archiveButtonText = "Archive" }) {
    // Get a reference to the selected research project context to modify with the table selection
    const { updateSelectedResearchProject } = useContext(SelectedResearchProjectContext);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [hoveredRow, setHoveredRow] = useState(null);
    const handleSelectProject = useCallback((selectedRowKey) => {
        updateSelectedResearchProject({ id: selectedRowKey[0] });
    }, [updateSelectedResearchProject]);
    // state variables for the project
    // const [researchProjectDataSource, setResearchProjectDataSource] = useState(dataSource);
    const [archiveProject, { isLoading: isLoadingArchiveProjectsRequest }] = useArchiveProjectMutation();
    const { updateUserProjectList, userProjectList } = useContext(UserProjectListContext);


    // the total due task for the projects needs to be set depending on the data, it will update the column header.
    const initialTaskNumber = dataSource.reduce(
        (accumulator, currentVal) => accumulator + currentVal.totalTasksDue, 0
    );
    const [totalTaskDueCount, setTotalTaskDueCount] = useState(initialTaskNumber);
    useEffect(() => {

    }, [isHome]);

    // callback functions to handle table search only when the user sets a value in the search field
    const handleSearch = useCallback((selectedKeys, dataIndex) => {
        if (selectedKeys[0] !== '' && selectedKeys[0]) {
            setSearchText(selectedKeys[0]);
            setSearchedColumn(dataIndex);
        }
    }, [setSearchText, setSearchedColumn]);

    const handleReset = useCallback(() => {
        setSearchText('');
    }, [setSearchText]);

    // callback functions to handle hovering over a row
    const handleRowHover = (record) => setHoveredRow(record.key);

    const handleRowLeave = () => setHoveredRow(null);

    const handleButtonClick = (record) => {
        // Handle the button click for the specific row to archive that project
        archiveProject({
            project_id: record.key
        }).then(({ data, error }) => {
            if (error) {
                openNotification({
                    message: `Error ${archiveButtonText === "Archive" ? "Archiving" : "Unarchiving"}`,
                    description: error.data.error,
                    placement: 'topRight',
                    timeout: 600,
                    icon: (<ExclamationCircleOutlined style={{ color: 'red' }} />),
                });
            } else {
                // update the state of the research projects data to move the project into archived
                const archivedProjectIndex = userProjectList.data.findIndex(project => project.id === record.key);
                if (archivedProjectIndex > -1) {
                    // create a new list with the updated archived project and then set the state
                    const updatedProjects = [...userProjectList.data];
                    updateUserProjectList({
                        ...userProjectList,
                        data: updatedProjects.map((project, index) => {
                            if (index === archivedProjectIndex) {
                                return {
                                    ...project,
                                    permissions: {
                                        ...project.permissions,
                                        is_archived: !project.permissions.is_archived
                                    }
                                };
                            }
                            return project;
                        })
                    });

                    // Show a notification to the user saying this project has been archived
                    openNotification({
                        message: data.success,
                        description: `You have successfully archived the research project, to access it go to the home page and then click on the archived tab`,
                        placement: 'topRight',
                        timeout: 400,
                        icon: (<CheckCircleOutlined style={{ color: 'green' }} />),
                    });
                }

            }
        }).catch(error => console.error("There was an error archiving the project", record.key, error));
    };

    // The column search properties that are defined based on the column dataIndex
    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${convertToTitleCase(dataIndex.replace('_', ' '))}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <div>
                    <button
                        onClick={() => handleSearch(selectedKeys, dataIndex)}
                        style={{ marginRight: 8 }}
                    >
                        Search
                    </button>
                    <button onClick={handleReset}>Reset</button>
                </div>
            </div>
        ),
        filterIcon: (filtered) => (
            <span style={{ color: filtered ? '#1890ff' : undefined }}>Search</span>
        ),
        onFilter: (value, record) =>
            record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
    });


    const PROJECT_TABLE_COLUMNS = [
        {
            title: "Name",
            dataIndex: "reference_name",
            key: "reference_name",
            align: "left",
            render: (name, record) => (searchedColumn === 'reference_name')
                ? (<span style={{ backgroundColor: '#ffc069' }}>{renderName(name, record)}</span>)
                : (renderName(name, record)),
            sorter: (a, b) => a.name.localeCompare(b.name),
            ...getColumnSearchProps('reference_name')
        },
        {
            title: "Project Leads",
            dataIndex: "project_leads",
            key: "project_leads",
            align: "left",
            sorter: (a, b) => a.project_leads.localeCompare(b.project_leads),
            render: (text) => (searchedColumn === 'project_leads')
                ? (<span style={{ backgroundColor: '#ffc069' }}>{text}</span>)
                : (text),
            ...getColumnSearchProps('project_leads')
        },
        {
            title: "Start Date",
            dataIndex: "startDate",
            key: "startDate",
            align: "left",
        },
        {
            title: "End Date",
            dataIndex: "endDate",
            key: "endDate",
            align: "left",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: "center",
            render: (status) => renderStatus(status),
            responsive: ["md"],
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
    ];

    // If this is the home page we can show the submission status of this project
    if (isHome) {
        // Add the progress columns and the tasks column if the user is on the home page
        PROJECT_TABLE_COLUMNS.push({
            title: "Progress",
            dataIndex: "submission_status",
            key: "submission_status",
            align: "left",
            width: "20%",
            sorter: (a, b) => a.submission_status.localeCompare(b.submission_status),
            onFilter: (value, record) => record.submission_status.indexOf(value) === 0,
            filters: [
                {
                    text: 'Draft',
                    value: 'Draft',
                },
                {
                    text: 'Pending',
                    value: 'Pending',
                },
                {
                    text: 'Completed',
                    value: 'Completed',
                },
                {
                    text: 'Active',
                    value: 'Active',
                },
                {
                    text: 'Inactive',
                    value: 'Inactive',
                },
            ],
            render: (text, record) => {
                if (disableArchive) {
                    return (<>{text}</>)
                }

                let contentText = record.is_archived
                    ? (record.permissions.is_principal_investigator || record.permissions.is_project_lead)
                        ? "Project is globally archived. You can edit this setting in the 'Edit Project' section."
                        : "The project is globally archived, and only leads can make changes."
                    : "Archive this project";

                return (
                    <Space style={{
                        width: "100%",
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {text}
                        {hoveredRow === record.key && (
                            <Popover content={contentText} style={{ marginLeft: 'auto' }}>
                                <Button
                                    type="info"
                                    onClick={() => handleButtonClick(record)}
                                    icon={<InboxOutlined />}
                                    loading={isLoadingArchiveProjectsRequest}
                                    // if project is archived disable the functionality
                                    disabled={record.is_archived}
                                >
                                    {archiveButtonText}
                                </Button>
                            </Popover>
                        )}
                    </Space>
                );
            }
        });

        PROJECT_TABLE_COLUMNS.splice(5, 0, {
            title: `Tasks (${totalTaskDueCount})`,
            dataIndex: "totalTasksDue",
            key: "totalTasksDue",
            align: "left",
            responsive: ["sm"],
            sorter: (a, b) => a.totalTasksDue - b.totalTasksDue
        });
    }

    function renderName(name, record) {
        const resourceURL = (`${record.key}`.includes('-'))
            ? `/app/research_task/${record.key.split('-')[1]}/`
            : `/app/research_study/${record.key}/`;
        return (
            <Link to={resourceURL}>
                <div className="column-name-title">{name}</div>
                <div className="column-name-subtitle">
                    {record.description ? record.description : record.taskDescription}
                </div>
            </Link>
        );
    }

    function renderStatus(status) {
        const statusIcons = [
            {
                projectStatus: "Project Open",
                icon: <FolderOpenFilled style={{ ...tableStyles.icon, color: Colours.SUCCESS }} />
            },
            {
                projectStatus: "Not Submitted",
                icon: <Loading3QuartersOutlined style={{ ...tableStyles.icon, color: Colours.WARNING }} />
            },
            {
                projectStatus: "Closed",
                icon: <CloseCircleOutlined style={{ ...tableStyles.icon, color: Colours.DANGER }} />
            },
            {
                projectStatus: "Open",
                icon: <CheckCircleOutlined style={{ ...tableStyles.icon, color: Colours.SUCCESS }} />
            },
            {
                projectStatus: "Active",
                icon: <CheckCircleOutlined style={{ ...tableStyles.icon, color: Colours.SUCCESS }} />
            },
            {
                projectStatus: "Submitted",
                icon: <CheckCircleOutlined style={{ ...tableStyles.icon, color: Colours.GREYED }} />
            },
        ];

        const trueIcon = statusIcons.find(
            (item) => item.projectStatus.toLowerCase() === status?.toLowerCase()
        );

        return (
            <Row justify={"space-between"} style={{ justifyContent: 'center', alignItems: 'center' }}>
                {trueIcon?.icon}
                {status?.charAt(0).toLocaleUpperCase() + status?.slice(1).toLowerCase()}
            </Row>
        );
    }

    // Filter the data based on the search query
    const filteredData = dataSource.filter((item) =>
        Object.keys(item).some((key) => item[key]?.toString().toLowerCase().includes(searchText?.toLowerCase()))
    );

    return (
        <>
            <Table
                locale={{ emptyText: <div>No Projects found</div> }}
                pagination={(isHome) ? { pageSize: 6 } : false}
                columns={PROJECT_TABLE_COLUMNS}
                dataSource={filteredData}
                onRow={(record) => ({
                    onMouseEnter: () => (isHome && !disableArchive) ? handleRowHover(record) : null,
                    onMouseLeave: () => (isHome && !disableArchive) ? handleRowLeave() : null,
                })}
                rowSelection={(isHome)
                    ? {
                        type: 'radio',
                        onChange: handleSelectProject,
                        getCheckboxProps: (record) => ({
                            disabled: !record?.permissions?.is_active,
                        })
                    }
                    : null
                }
            />
        </>
    );
}

/**
 * Generates an array of project tabs for the Home page view.
 *
 * @param {Object[]} mappedUserResearchProjectData - An array of mapped user research project data.
 * @param {number} pageSize - The number of items to display per page.
 * @param {boolean} isHome - A flag indicating whether the component is on the home page.
 * @returns {Object[]} An array of project tabs with their configuration.
 */
function getHomePageProjectTabs(mappedUserResearchProjectData, pageSize, isHome) {
    // Before rendering the Home tab, ensure that the necessary permissions are set up.
    // This is particularly important when transitioning from the Projects Page to Home, as permissions may not be
    // available until the state variable is updated.
    if (!mappedUserResearchProjectData || !mappedUserResearchProjectData[0]?.permissions) {
        return null;
    }
    // filter out the mapped user projects list for active projects and invited projects
    const invitedProjects = mappedUserResearchProjectData.filter(item => (!item.permissions.is_active && !item.permissions.is_archived && !item.is_complete));
    const activeProjects = mappedUserResearchProjectData.filter(item => (item.permissions.is_active && !item.permissions.is_archived && !item.is_complete));
    const archivedProjects = mappedUserResearchProjectData.filter(item => item.permissions.is_archived && !item.is_complete);
    const completedProjects = mappedUserResearchProjectData.filter(item => item.is_complete);

    const commonTableProps = {
        pagesize: pageSize,
        isHome
    };

    // after building both arrays of the project, we can return the array of tabs for the ant-t tabs
    return [
        {
            label: (<span className="tabs-title">My Projects({activeProjects.length})</span>),
            key: 0,
            size: activeProjects.length,
            children: (
                <ResearchProjectTableContent
                    dataSource={activeProjects}
                    {...commonTableProps}
                />
            )
        },
        {
            label: (<span className="tabs-title">Pending Invitations({invitedProjects.length})</span>),
            key: 1,
            size: invitedProjects.length,
            children: (
                <ResearchProjectTableContent
                    dataSource={invitedProjects}
                    disableArchive={true}
                    {...commonTableProps}
                />
            ),
            disabled: invitedProjects.length === 0
        },
        {
            label: (<span className="tabs-title">Archived Projects({archivedProjects.length})</span>),
            key: 2,
            size: archivedProjects.length,
            children: (
                <ResearchProjectTableContent
                    dataSource={archivedProjects}
                    archiveButtonText={"Unarchive"}
                    {...commonTableProps}
                />
            ),
            disabled: archivedProjects.length === 0
        },
        {
            label: (<span className="tabs-title">Completed Projects({completedProjects.length})</span>),
            key: 3,
            size: completedProjects.length,
            children: (
                <ResearchProjectTableContent
                    dataSource={completedProjects}
                    archiveButtonText={"Unarchive"}
                    {...commonTableProps}
                />
            ),
            disabled: completedProjects.length === 0
        },
        {
            label: (<span className="tabs-title">All({mappedUserResearchProjectData.length})</span>),
            key: 4,
            size: mappedUserResearchProjectData.length,
            children: (
                <ResearchProjectTableContent
                    dataSource={mappedUserResearchProjectData}
                    disableArchive={true}
                    {...commonTableProps}
                />
            )
        }
    ];
}

/**
 * Generates an array of project tabs for the Projects List view.
 *
 * @param {Object[]} mappedUserResearchProjectData - An array of mapped user research project data.
 * @param {number} pagesize - The number of items to display per page.
 * @param {boolean} isHome - A flag indicating whether the component is on the home page.
 * @returns {Object[]} An array of project tabs with their configuration.
 */
const getProjectsListTabs = (mappedUserResearchProjectData, pagesize, isHome) => {
    const completedProjects = mappedUserResearchProjectData.filter(item => item.is_complete && item.isPublic && !item.is_archived);
    const activeProjects = mappedUserResearchProjectData.filter(item => !item.is_complete && item.isPublic && !item.is_archived);
    const privateProjects = mappedUserResearchProjectData.filter(item => !item.isPublic);
    const globalArchivedProjects = mappedUserResearchProjectData.filter(item => item.is_archived && item.isPublic);

    const projectsPageTabList = [
        {
            label: (<span className="tabs-title">Active({activeProjects.length})</span>),
            key: 0,
            size: activeProjects.length,
            children: (
                <ResearchProjectTableContent
                    pagesize={pagesize}
                    dataSource={activeProjects}
                    isHome={isHome}
                />
            )
        },
        {
            label: (<span className="tabs-title">Completed({completedProjects.length})</span>),
            key: 1,
            size: completedProjects.length,
            children: (
                <ResearchProjectTableContent
                    pagesize={pagesize}
                    dataSource={completedProjects}
                    isHome={isHome}
                />
            ),
            disabled: completedProjects.length === 0
        },
        {
            label: (<span className="tabs-title">Archived({globalArchivedProjects.length})</span>),
            key: 3,
            size: globalArchivedProjects.length,
            children: (
                <ResearchProjectTableContent
                    pagesize={pagesize}
                    dataSource={globalArchivedProjects}
                    isHome={isHome}
                />
            ),
            disabled: globalArchivedProjects.length === 0
        },
        {
            label: (<span className="tabs-title">All({mappedUserResearchProjectData.length})</span>),
            key: 4,
            size: mappedUserResearchProjectData.length,
            children: (
                <ResearchProjectTableContent
                    pagesize={pagesize}
                    dataSource={mappedUserResearchProjectData}
                    isHome={isHome}
                />
            )
        }
    ];

    // Check if the user has any private projects page that we can show on this projects list page
    if (privateProjects.length > 0) {
        projectsPageTabList.splice(2, 0, {
            label: (<span className="tabs-title">Private({privateProjects.length})</span>),
            key: 2,
            size: privateProjects.length,
            children: (
                <ResearchProjectTableContent
                    pagesize={pagesize}
                    dataSource={privateProjects}
                    isHome={isHome}
                />
            ),
            disabled: privateProjects.length === 0
        });
    }
    return projectsPageTabList;
};

/**
 * Displays a table of research projects based on the provided parameters.
 *
 * @param {Object} props - The component's properties.
 * @param {boolean} props.isHome - A flag indicating whether the component is on the home page.
 * @returns {JSX.Element} The project table component.
 */
export default function ResearchProjectTable({ isHome }) {
    const [pagesize, setPagesize] = useState();
    const [projectTabs, setProjectTabs] = useState(null);
    const { updateUserProjectList, userProjectList } = useContext(UserProjectListContext);
    // get the approved project list if we are not on the home page otherwise get the users project list
    const {
        data: userProjectData,
        isLoading: isLoadingResearchProjectData
    } = (isHome) ? useUserResearchProjectListDataQuery() : useApprovedResearchProjectsQuery();
    const mapUserProjectDataFunction = useCallback((item) => ({
        ...item,
        key: item.id,
        name: item.title,
        description: item.description,
        due: '',
        totalTasksDue: item?.tasks?.length || 0,
        status: item.recruiting_status,
        projectLeads: item.project_leads,
        startDate: (item.is_using_start_date) ? getEstimatedDates(item).startDate : "N/A",
        endDate: (item.is_using_end_date) ? getEstimatedDates(item).endDate : "N/A",
        isPublic: item.is_public
    }));
    // useEffect hook to set the project data to the context when it is retrieved
    useEffect(() => updateUserProjectList(userProjectData), [userProjectData]);

    // useEffect hook to map and set up the tabs for the project list
    useEffect(() => {
        if (userProjectList) {
            setPagesize(userProjectList?.data?.length);
            // filter the projects returned based on the statuses after mapping, then we can set the different tab lists
            // with the different matched arrays for each project
            const projectList = (userProjectList?.data) ? userProjectList?.data : userProjectList;
            const mappedUserResearchProjectData = projectList.map(mapUserProjectDataFunction);
            setProjectTabs(
                (isHome)
                    ? getHomePageProjectTabs(mappedUserResearchProjectData, pagesize, isHome)
                    : getProjectsListTabs(mappedUserResearchProjectData, pagesize, isHome)
            );
        }
    }, [isHome, userProjectList]);

    if (isLoadingResearchProjectData) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'row',
                width: '100%',
                height: '200px',
            }}>
                <EngageSpinner useBackground={false} loaderText={"Loading Research Projects"} />
            </div>
        );
    }

    if (!userProjectData || userProjectData?.length <= 0 || !projectTabs) {
        return (
            <Col span={24}>
                <Row>
                    No Projects Found... Join a project or create a project.
                </Row>
            </Col>
        );
    }

    // The default active tab should be the first tab that has data from the list of tabs
    const defaultActiveTab = (projectTabs.length > 0)
        ? projectTabs?.filter(tab => tab.size > 0)[0]?.key || 0
        : 0;

    return (
        <Col span={24}>
            <Row>
                <Tabs
                    className="tabs-class"
                    defaultActiveKey={defaultActiveTab}
                    tabBarStyle={{ borderBottom: "3px solid #D9D9D9" }}
                    tabBarGutter={50}
                    items={projectTabs}
                />
            </Row>
        </Col>
    );
}
