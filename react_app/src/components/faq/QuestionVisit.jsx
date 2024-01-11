import React from "react";
import "./faq_list.css";
import { SearchOutlined } from "@ant-design/icons";
import { Divider, Input, Layout, List, Typography } from "antd";
import { useParams } from "react-router-dom";
import { useGetQuestionQuery } from "../../redux/services/faqAPI";
import { EngageSpinner } from "../utils";
import { UserAvatar } from "../user_profile/user_avatar";
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from "../../redux/services/userAPI";
import { UnauthenticatedFooter, UnauthenticatedHeader } from "../unauthenticated";

const {Footer} = Layout;

function RenderQuestion(item) {
    return <div style={{padding: '20px'}} className='article'>
        <Typography.Text style={{fontWeight: "bold", fontSize: "large"}}>{item}</Typography.Text>
    </div>;
}

function RenderRelatedQuestions(related_articles) {
    return (
		<div>
			<Typography.Title level={4}>
				Related articles
			</Typography.Title>
			<List
				grid={{ gutter: 0, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
				dataSource={related_articles}
				itemLayout="vertical"
				renderItem={(item) => {
					return RenderQuestion(item);
				}}
				locale={{
					emptyText: (
						<div style={{ color: "black", paddingTop: "10px", textAlign: "start" }}>
							No Related Articles on this faq yet...
						</div>
					),
				}}
			/>
		</div>
	);
}

function RenderFAQDetails(data) {
    const userFullName = data.submitter.first_name + " " + data.submitter.last_name
    return (
        <div>
            <Typography.Title level={1}>{data.title}</Typography.Title>
            <div className="container">
                <UserAvatar
                    userId={data.submitter.id}
                    size={80}
                    className="image"
                    fullName={userFullName}
                />
                <div>
                    <Typography.Title level={3} className="username"
                                      style={{marginBottom: 0, paddingLeft: '10px', alignContent: 'center'}}>
                        {userFullName}
                    </Typography.Title>
                </div>
            </div>
            <Typography.Paragraph style={{
                paddingTop: '10px',
                fontSize: 'large',
                fontWeight: "-moz-initial",
                color: "grey"
            }}>{data.description}</Typography.Paragraph>

            {data.related ?
                <div>
                    <Divider/>
                    Related
                    <br/><br/>
                    {data.related}
                </div> : null
            }
        </div>
    )
}

export default function QuestionVisit({isUserAuthenticated}) {
    const userInfo = useSelector(selectLoggedInUserData);
    const question_id = useParams('question_id').question_id
    const {
        data: data,
        isLoading: isLoading,
        isError: isError,
        error: error
    } = useGetQuestionQuery(question_id);
    if (isLoading) {
        return <EngageSpinner loaderText={"Loading Question"} display="fullscreen"/>
    } else {
        if (isError) {
            console.error(error);
        }
    }
    if (data === null) {
        return <div> Unable to get the question or the question does not exist.</div>
    }
    const related = RenderRelatedQuestions(data.related_articles)
    const faq_detail = RenderFAQDetails(data.data)
    return (
        <div>
            {userInfo ? null : <UnauthenticatedHeader/>}
            <div style={{padding: "20px"}} className='question-container'>
                <div className="col-1">{related}</div>
                <div className="col-2">{faq_detail}</div>
                <div className="col-3">
                    <div>
                        <Input
                            className="search-bar"
                            placeholder="Looking for something?"
                            prefix={<SearchOutlined/>}
                            style={{
                                borderRadius: '10px',
                                fontSize: '25px',
                                width: '80%'
                            }}
                        />
                    </div>
                </div>
            </div>
            {userInfo ? null : <UnauthenticatedFooter isPinnedToBottom={true} />}
        </div>
    );
}
