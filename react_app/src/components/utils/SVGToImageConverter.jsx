import React from "react";
import { Image } from "antd";

const iconStyles = {
    defaultLogoStyle: {
        width: '150px',
        height: '60px',
    }
};

export default function SVGToImageConverter({ styleOverride = {}, logo, alt }) {
    // Spread the default styles first so they can be overridden by the props style and return the ant-d image
    return (
        <Image preview={false}
            src={logo}
            alt={alt}
            style={{ ...iconStyles.defaultLogoStyle, ...styleOverride }}
        />
    );
}
