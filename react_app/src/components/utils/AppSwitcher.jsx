import React, { useState } from 'react';
import { Card, Image } from "antd";
import { useDjangoContext } from '../../providers/DjangoContextProvider';
import insightScopeLogo from '../../imgs/colour-logo.png';
import engageIC4ULogo from '../../imgs/engage-ic4u-small-logo.svg';
import gridIcon from '../../imgs/grid-3x3-gap-fill-svgrepo-com.svg';
import '../../css/AppSwitcher.css';


export default function AppSwitcher() {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAppSwitcherOnClick = () => setIsExpanded(!isExpanded);

    return (
        <div className={'app-switcher'}>
            <div className="app-switcher-container">
                <button onClick={handleAppSwitcherOnClick} className="app-switcher-icon">
                    <img src={gridIcon} className="switch-badge" alt="The grid icon for the Connect App Switcher"/>
                </button>

            </div>
            <div id="switch-items" className={`switch-content ${(isExpanded) ? 'show' : ''}`}>
                <div className="tooltip-triangle"/>
                <a id="shifter-id" className="shifters" href={`${globalValues.insightScopeURL}/dashboard`}
                   target="_blank">
                    <img alt="Insight Scope logo" src={insightScopeLogo}/>
                    <p className="shifter-title">insightScope</p>
                </a>

                <a className="shifters" href={globalValues.engageIC4UURL}>
                    <img className="engage-logo" alt="engage logo" src={engageIC4ULogo}/>
                    <p className="shifter-title">Engage</p>
                </a>
            </div>
        </div>
    );
}
