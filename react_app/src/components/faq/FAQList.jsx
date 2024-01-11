import React, { useEffect, useState } from "react";
import { Input, Layout, List, Tabs, Typography } from "antd";
import "./faq_list.css";
import { SearchOutlined } from "@ant-design/icons";
import { FAQ_TAB_OPTIONS } from "../utils/constants";
import { useGetFAQListQuery } from "../../redux/services/faqAPI";
import { EngageSpinner } from "../utils";
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from "../../redux/services/userAPI";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UnauthenticatedFooter, UnauthenticatedHeader } from "../unauthenticated";

let authenticated = false;
const { Footer } = Layout;

function RenderHeader() {
    return (<div className="header-bar">
        <Typography.Title level={1} className="title">
            Engage Help Center!
        </Typography.Title>
        <Input
            placeholder="Looking for something?"
            prefix={<SearchOutlined />}
            style={{ width: '30%', height: '20%', borderRadius: '10px', fontSize: '25px' }}
        />
    </div>);
}


function RenderFAQList(data) {
    let url = '/faq_question/' + data['id'];
    url = authenticated ? '/app' + url : url;

    return (
        <List.Item>
            <div className="faq-card">
                <Typography.Title level={3}>
                    {data['title']}
                </Typography.Title>
                <Typography.Paragraph>
                    {data['description']}
                </Typography.Paragraph>
                <div>
                    <u><Link to={url}>Read More</Link></u>
                </div>
            </div>
        </List.Item>
    );
}

function DisplayFaqList(faq_option, faq_data) {
    return <List
        style={{ paddingLeft: '5%', paddingRight: '5%' }}
        grid={{
            gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4
        }}
        dataSource={faq_data}
        itemLayout="horizontal"
        renderItem={(item) => {
            return RenderFAQList(item);
        }}
    />;
}

function RenderedFAQList({ faqListData }) {
    if (faqListData.length <= 0) {
        return (
            <div className="no-data">
                {userInfo?.is_admin ? <Typography.Title level={4} style={{ alignItems: 'center' }}>
                        There are no faqs currently.....<br />
                        Would you like to create a new one? <Link to={'#'}>Click here......</Link>
                    </Typography.Title> :
                    <Typography.Title level={4}>
                        No FAQs yet...
                    </Typography.Title>}
            </div>
        );
    }

    const renderedTabItems = FAQ_TAB_OPTIONS.map(option => {
        // Filter faqListData based on the faq_type of the current option
        const filteredFAQList = faqListData.filter(faq => faq.faq_type === option.type);
        return {
            label: `${option.label} (${filteredFAQList.length})`,
            key: option.type,
            children: (filteredFAQList.length >= 1)
                ? (DisplayFaqList(option.label, filteredFAQList))
                : (
                    <div style={{ textAlign: 'center' }}>
                        <Typography.Text>There are no FAQs currently in this category....</Typography.Text>
                    </div>
                )
            ,
            length: filteredFAQList.length
        };
    });

    return (
        <Tabs
            className="tab"
            centered
            items={renderedTabItems}
            style={{ paddingLeft: '5%', paddingRight: '5%' }}
        />
    );
}

export default function FAQList({ isUserAuthenticated }) {
    const userInfo = useSelector(selectLoggedInUserData);
    const location = useLocation();
    if (userInfo && location.pathname === "/faq_list/") {
        const navigate = useNavigate();
        navigate('/app/faq_list/');
    }
    const [header, setHeader] = useState(false);

    useEffect(() => {
        const loadHeader = async () => {
            if (userInfo) {
                setHeader(null);
            } else {
                setHeader(<UnauthenticatedHeader />);
            }
        };

        loadHeader().catch(console.error);
    }, [userInfo, setHeader]);
    authenticated = userInfo;

    // Load the FAQ List Data and show the engage spinner, if we could not retrieve the data show the error to the user
    const {
        data: faqListData,
        isLoading: isLoading,
        isError: isError,
        error: error
    } = useGetFAQListQuery();
    if (isLoading) {
        return <EngageSpinner loaderText={"Loading FAQs"} display="fullscreen" />;
    } else {
        if (isError) {
            console.error(error);
        }
        if (faqListData == null) {
            return (<div>Could not load the data...</div>);
        }
    }

    // return the rendered FAQ list
    return (<>
        {header}
        <Layout>
            <RenderHeader />
            <RenderedFAQList faqListData={faqListData} />
        </Layout>
        {userInfo ? null : <UnauthenticatedFooter />}
    </>);
}
