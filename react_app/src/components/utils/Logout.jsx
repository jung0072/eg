import React from 'react';
import {
    Button,
    Row,
} from 'antd';
import {
    LogoutOutlined,
} from '@ant-design/icons';
import { LOGOUT } from './constants.jsx';
import { useDispatch } from 'react-redux';
import { logOut } from '../../redux/slicers/authSlice.js';
import { logoutUser } from "../../redux/slicers/userSlice";
import { useLogoutMutation } from '../../redux/services/authAPI.js';
import { useNavigate } from 'react-router-dom';
import { userAPI } from "../../redux/services/userAPI";

export default function Logout(props) {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const buttonStyle = {
        display: 'flex',
        backgroundColor: props.backgroundColor,
        bordercolor: props.textColor,
        color: props.textColor,
        width: '200px',
        justifyContent: 'flex-start',
        alignItems: 'center',
        fontStyle: 'normal',
        fontWeight: 500,
        fontSize: '18px',
        lineHeight: '42px',
    };
    const [logout, { isLoading: isLoadingLogout }] = useLogoutMutation();

    async function handleLogOut() {

        try {
            await logout({ refresh: sessionStorage.getItem('refresh') }).unwrap();

            dispatch(logOut());
            dispatch(logoutUser());
            dispatch(userAPI.util.resetApiState());
            dispatch(userAPI.util.invalidateTags(['CurrentUser', 'Notifications']));
            // navigate to home
            navigate('/');

        } catch (err) {
            // catch the error show it to the user
            console.log(err);
        }
    }


    return (
        <Row style={{ height: '82px' }} align={'middle'} justify={'center'}>
            <Button onClick={handleLogOut} size="large" style={buttonStyle} shape="round" icon={<LogoutOutlined/>}
                    loading={isLoadingLogout}
            >
                {LOGOUT}
            </Button>
        </Row>
    );
}
