import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from "antd";
import { BulbFilled } from "@ant-design/icons";
import html2canvas from "html2canvas";
import { WebPageInfoContext } from "../../../providers/WebPageInfoContextProvider";
import { useLocation, useNavigate } from "react-router-dom";
import './suggest_improvements_button.css';
import { captureScreenshot } from "../../utils/common";

export const SuggestImprovementsButton = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { updateWebPageInfo } = useContext(WebPageInfoContext);

    // callback function that uses the html2canvas npm library to save the current page to a screenshot
    // and then will update the WebPageInfoContext with the new picture uri
    const captureScreenShot = useCallback(() => {
        // First get a reference to the full document element and use html2canvas to get the image uri
        setLoading(true)
        captureScreenshot(function (canvas) {
            // Convert the canvas to a data URL and save it to the WebPageInfoContext
            const screenshotDataUrl = canvas.toDataURL('image/png');
            updateWebPageInfo({
                screenshot: screenshotDataUrl,
                route: location.pathname,
                reportBug: false
            });
            setLoading(false)

            // Finally reroute the user to the contact log page
            navigate('/app/contact_us/');
        })

    }, [location.pathname, navigate, updateWebPageInfo, setLoading]);


    return (
        <Button
            id={'suggest-engage-improvement-btn'}
            icon={<BulbFilled />}
            onClick={captureScreenShot}
            loading={loading}
        >
            Suggest Improvement
        </Button>
    );
};
