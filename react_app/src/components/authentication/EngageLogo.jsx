import React from "react";
import { Image } from "antd";
import engageLogo from "../../imgs/engage-condensed-logo.svg";
import whiteEngageLogo from '../../imgs/engage-condensed-logo-white.svg';

const iconStyles = {
    engageLogo: {
        width: '150px',
        height: '60px',
    }
};

export default function EngageLogo({ styleOverride = {}, useWhiteLogo = false }) {
    // Spread the default styles first so they can be overridden by the props style and return the ant-d image
    return (
        <Image preview={false}
            src={(useWhiteLogo) ? whiteEngageLogo : engageLogo}
            alt={"The Logo of Engage IC4U"}
            style={{ ...iconStyles.engageLogo, ...styleOverride }}
        />
    );
}