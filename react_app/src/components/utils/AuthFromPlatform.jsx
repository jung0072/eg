import React from 'react';
import { Outlet } from 'react-router';

import { UnauthenticatedHeader, UnauthenticatedFooter } from '../unauthenticated';

export default function AuthFromPlatform() {
    return (
        <div>
            <UnauthenticatedHeader />
            <div style={{ minHeight: 'calc(100vh - 134px)' }}>
                <Outlet />
            </div>
            <UnauthenticatedFooter />
        </div>
    );
}
