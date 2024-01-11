import React from "react";
import { Spin, Col, Row, Layout, Skeleton } from "antd";
import './engage_spinner.css';

const loaderStyles = {
    container: {
        backgroundColor: 'rgba(206, 206, 206, 0.7)',
    },
    areaContainer: {
        width: '100%',
        height: '100%'
    },
    fullScreenContainer: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: 'rgb(206, 206, 206)',
        zIndex: 1000
    },
    centerAlign: {
        display: 'flex',
        flexDirection: 'column nowrap',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loader: {
        width: '100%',
        fontWeight: 800,
        fontSize: '20px'
    },
    '.ant-spin-nested-loading': {}
};

export const DISPLAY_TYPES_ENUM = {
    FULLSCREEN: 'fullscreen',
    AREA: 'area',
};

export const LOADER_TYPES_ENUM = {
    SKELETON: 'skeleton',
    SPINNER: 'spinner'
};

/**
 * A loading wheel (spinner) to tell the user the content on that page is loading
 * @param  {String} display the text indication if the spinner takes up the full page or that component (Choices: full, area)
 * @param  {[type]} loaderText the displayed text underneath the spinner (loader)
 * @param {[type]} loaderType the type of loader shown, spinner or skeleton
 * @param {Boolean} useBackground set to False if we do not want the grey background to show
 */
export function EngageSpinner(
    {
        display = DISPLAY_TYPES_ENUM.AREA,
        loaderText = "Loading...",
        loaderType = LOADER_TYPES_ENUM.SPINNER,
        useBackground=true
    }
) {
    // check if we are using a full screen loader or just taking up the area of this component
    const containerStyle = (display === DISPLAY_TYPES_ENUM.FULLSCREEN)
        ? { ...loaderStyles.container, ...loaderStyles.fullScreenContainer }
        : { ...loaderStyles.container, ...loaderStyles.areaContainer };

    const displayedSpinner = (loaderType === LOADER_TYPES_ENUM.SPINNER)
        ? (
            <Spin tip={loaderText} size="large" style={loaderStyles.loader}>
                <div className="loader-content" style={loaderStyles.areaContainer} />
            </Spin>
        )
        :(
            <Skeleton active={true} paragraph={{ row: 2 }} />
        )
    ;


    return (
        <Layout style={(useBackground) ? containerStyle : {}}>
            <Row style={{ ...loaderStyles.areaContainer, ...loaderStyles.centerAlign }}>
                <Col span={24} style={{ ...loaderStyles.areaContainer, ...loaderStyles.centerAlign }}>
                    {displayedSpinner}
                </Col>
            </Row>
        </Layout>
    );
}
