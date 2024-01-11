import React from 'react';
import './unauthenticatedHeader.css';
import EngageLogo from "../authentication/EngageLogo";
import { Link } from 'react-router-dom';

function UnauthenticatedHeader() {
    return (
        <div className="header">
            <div className="header-left">
                <EngageLogo useWhiteLogo={true} />
            </div>
            <div className="header-right">
                <Link to="/">Login</Link>
                <Link to="/registration">Signup</Link>
            </div>
        </div>
    );
}

export default UnauthenticatedHeader;
