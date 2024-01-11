import React, { lazy, Suspense, StrictMode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from "react-redux";
import { createRoot } from 'react-dom/client';
import './css/index.css';
import { CurrentFormSectionProvider } from './providers/CurrentFormSectionContextProvider';
import 'antd/dist/antd.css';
import store from './redux/store.js';
import { CheckUserProfile, EngageSpinner, RequireAuth, RequireAdmin, AuthFromPlatform } from './components/utils/';
import EngageNavigationLayout from "./components/utils/EngageNavigationLayout";
import {
    UserProfileFormCompletionStatusProvider,
    EngageLayoutStylingProvider,
    NotificationsWebSocketProvider,
    SelectedResearchProjectProvider,
    ActiveNavigationMenuProvider,
    WebPageInfoProvider,
    UserProjectListProvider,
    EngageActionProvider,
} from './providers/index';

const AuthorizeUserScreen = lazy(async () => await import('./screens/AuthorizeUserScreen.jsx'));
const RegisterUserScreen = lazy(async () => await import('./screens/RegisterUserScreen.jsx'));
const HomePage = lazy(async () => await import("./screens/HomePage.jsx"));
const ProjectListScreen = lazy(async () => await import("./screens/ProjectListScreen.jsx"));
const CommunityList = lazy(async () => await import("./screens/CommunityListScreen.jsx"));
const NotificationScreen = lazy(async () => await import("./screens/NotificationScreen.jsx"));
const MessageCentre = lazy(async () => await import("./screens/MessageCentre.jsx"));
const AdminPanel = lazy(async () => await import("./screens/AdminPanelScreen.jsx"));
const UserProfileScreen = lazy(async () => await import("./screens/UserProfileScreen.jsx"));
const ModifyUserProfileScreen = lazy(async () => await import("./screens/ModifyUserProfileScreen"));
const ProjectDetails = lazy(async () => await import("./screens/ProjectDetails"));
const ResearchProjectFormScreen = lazy(async () => await import("./screens/ResearchProjectFormScreen"));
const ProjectTaskPage = lazy(async () => await import("./components/research_study/research_task/ProjectTaskPage"));
const AccountActivatedScreen = lazy(async () => await import("./screens/AccountActivatedScreen"));
const ContactUsScreen = lazy(async () => await import('./screens/ContactUsScreen.jsx'));
const ChangeUserPasswordScreen = lazy(async () => await import("./screens/ChangeUserPasswordScreen"));
const SystemIssuesScreen = lazy(async () => await import("./screens/SystemIssuesScreen"));
const FAQListScreen = lazy(async () => await import("./screens/FAQListScreen"));
const FaqQAScreen = lazy(async () => await import("./screens/FAQQaScreen"));
const AboutUsScreen = lazy(async () => await import("./screens/AboutUsScreen"));
const SystemMessageScreen = lazy(async () => await import("./screens/SystemMessageScreen"));
const PrivacyPolicyScreen = lazy(async () => await import("./screens/PrivacyPolicyScreen"));
const TermsOfServicesScreen = lazy(async () => await import("./screens/TermsOfServicesScreen"));
const NotificationSettingsScreen = lazy(async () => await import("./screens/NotificationSettingsScreen"));
const EngageReports = lazy(async () => await import("./screens/EngageReports"));
const InsightScopeAuthScreen = lazy(async () => await import("./screens/InsightScopeAuthScreen"));

const EngageIC4UApp = () => {

    return (
        <Suspense fallback={<EngageSpinner loaderText={`Loading Engage...`} display="fullscreen" />}>
            <Provider store={store}>
                <Routes>
                    {/* public routes */}
                    <Route exact path={"/"} element={<AuthorizeUserScreen />} />
                    <Route path={"/registration/"} element={<RegisterUserScreen />} />
                    <Route path={"/activated/"} element={<AccountActivatedScreen />} />
                    <Route path={"/reset_password_confirm/:uidb64/:token/"} element={<ChangeUserPasswordScreen />} />
                    <Route path={"/faq_list/"} element={<FAQListScreen isUserAuthenticated={false} />} />
                    <Route path={"/faq_question/:question_id/"} element={<FaqQAScreen isUserAuthenticated={false} />} />
                    <Route path={"/contact_us/"} element={<ContactUsScreen isUserAuthenticated={false} />} />
                    <Route path={"/contact_us/system_issue/"}
                        element={<SystemIssuesScreen isUserAuthenticated={false} />} />
                    <Route path={'/privacy_policy/'}
                        element={<PrivacyPolicyScreen isUserAuthenticated={false} />} />
                    <Route path={'/tos/'} element={<TermsOfServicesScreen isUserAuthenticated={false} />} />
                    <Route path={'/notification_settings/'}
                        element={<NotificationSettingsScreen isUserAuthenticated={false} />} />
                    {/* routes for authentication from other platforms */}
                    <Route path={"/register_from_platform/"} element={<AuthFromPlatform />}>
                        <Route path='insightScope' element={<InsightScopeAuthScreen />} />
                    </Route>
                    {/* protected routes will be authenticated first */}
                    <Route element={<RequireAuth />}>
                        <Route element={<EngageNavigationLayout />}>
                            <Route path={"/system_message/"} element={<SystemMessageScreen />} />
                            <Route path={"/system_message/:id"} element={<SystemMessageScreen />} />
                            <Route path={'/about_us/'} element={<AboutUsScreen />} />
                            <Route path={"/home/"} element={<HomePage />} />
                            <Route path="/edit_profile/" element={<ModifyUserProfileScreen />} />
                            <Route path={"/notifications/"} element={<NotificationScreen />} />
                            <Route path={"/app/faq_list/"} element={<FAQListScreen isUserAuthenticated={true} />} />
                            <Route path={"/app/faq_question/:question_id/"}
                                element={<FaqQAScreen isUserAuthenticated={true} />} />
                            <Route path={'/app/contact_us/'} element={<ContactUsScreen isUserAuthenticated={true} />} />
                            <Route path={'/app/contact_us/system_issue/'}
                                element={<SystemIssuesScreen isUserAuthenticated={true} />} />
                            <Route path={'/app/privacy_policy/'}
                                element={<PrivacyPolicyScreen isUserAuthenticated={true} />} />
                            <Route path={'/app/tos/'} element={<TermsOfServicesScreen isUserAuthenticated={true} />} />
                            <Route path={'/app/notification_settings/'}
                                element={<NotificationSettingsScreen isUserAuthenticated={true} />} />
                            <Route element={<CheckUserProfile />}>
                                {/* The following routes should be added to the minimum requirement check once it is fully implemented */}
                                <Route path={"/projects/"} element={<ProjectListScreen />} />
                                <Route path={"/community/"} element={<CommunityList />} />
                                <Route path={"/message_centre/"} element={<MessageCentre />} />
                                <Route path={"/app/user/:id/"} element={<UserProfileScreen />}
                                    removeLayoutPadding={true} />
                                <Route path={"/app/research_study/:id/"} element={<ProjectDetails />} />
                                <Route path={"/app/research_task/:id/"} element={<ProjectTaskPage />} />
                                <Route path={"/app/research_study_form/"}
                                    element={<ResearchProjectFormScreen key={'create-project'} />} />
                                <Route path={"/app/research_study_form/:id/"}
                                    element={<ResearchProjectFormScreen key={'edit-project'} />} />
                            </Route>
                            {/* Requires the user to be admin to access this page */}
                            <Route element={<RequireAdmin />}>
                                <Route path={'/admin-panel/'} element={<AdminPanel />} />
                                <Route path={'/app/engage_reports/'} element={<EngageReports />} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </Provider>
        </Suspense>
    );
};

function RenderedApp() {
    return (
        <NotificationsWebSocketProvider>
            <EngageLayoutStylingProvider>
                <ActiveNavigationMenuProvider>
                    <WebPageInfoProvider>
                        <UserProfileFormCompletionStatusProvider>
                            <CurrentFormSectionProvider>
                                <UserProjectListProvider>
                                    <SelectedResearchProjectProvider>
                                        <EngageActionProvider>
                                            <BrowserRouter>
                                                <EngageIC4UApp />
                                            </BrowserRouter>
                                        </EngageActionProvider>
                                    </SelectedResearchProjectProvider>
                                </UserProjectListProvider>
                            </CurrentFormSectionProvider>
                        </UserProfileFormCompletionStatusProvider>
                    </WebPageInfoProvider>
                </ActiveNavigationMenuProvider>
            </EngageLayoutStylingProvider>
        </NotificationsWebSocketProvider>
    );
}

const documentRoot = createRoot(document.getElementById("root"));
documentRoot.render(
    <StrictMode>
        <RenderedApp />
    </StrictMode>
);
