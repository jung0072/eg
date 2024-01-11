import React, { memo } from 'react';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { Button, Modal } from 'antd';

/**
 * Custom modal
 * @param {String} title the title for the modal
 * @param {Boolean} visible if the modal is visible
 * @param {Function} handleOk Modal action button Ok
 * @param {Function} handleCancel Modal action button to cancel or close the modal
 * @param {String} type type of the modal { info, success, warning }; default type is info
 * @param {ReactElement} children modal content that is displayed inside the modal
 * @param {Boolean} disableScreenTouch if the modal can be closed when clicked outside
 * @param {String} footerButton text for footer button
 * @param {Boolean} centered
 * @param {Integer} width the width of the modal
 * @param {Object} style the stylesheet for the modal
 * @param {Boolean} closable weather we are showing the top right x button or not
 * @param loadingState
 * @param customFooter setting the custom footer
 * @param footerButtonIcon the icon (from ant-d or font-awesome) that will be displayed in the footer button
 * @returns
 */
function ModalPopup(
    {
        title,
        visible,
        handleOk,
        handleCancel,
        type,
        children,
        disableScreenTouch,
        footerButton,
        centered,
        width,
        style,
        closable,
        loadingState = false,
        customFooter = null,
        footerButtonIcon = null
    }
) {
    /**
     * Reusable modal with different message types
     * type: info, success, warning; default type is info
     */
    let modalType = null;
    let icon = null;

    switch (type) {
        case "info":
            icon = <InfoCircleOutlined style={{ color: '#37A3FF' }} />;
            break;
        case "success":
            icon = <CheckCircleOutlined style={{ color: 'green' }} />;
            break;
        case "warning":
            icon = <ExclamationCircleOutlined style={{ color: 'yellow' }} />;
            break;
        default:
            icon = <InfoCircleOutlined style={{ color: '#37A3FF' }} />;
            break;
    }

    const footer = disableScreenTouch
        ? (
            <div>
                {customFooter ? customFooter : <></>}
                <Button
                    loading={loadingState}
                    style={modalButtonStyle.OkButton}
                    onClick={handleOk}
                    icon={footerButtonIcon}
                >
                    {footerButton}
                </Button>
            </div>
        )
        : null;

    return (
        <Modal
            title={(<div style={modalButtonStyle.title}><span style={modalButtonStyle.iconStyle}>{icon}</span>{title}
            </div>)}
            open={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            footer={footer}
            maskClosable={!disableScreenTouch}
            type={modalType}
            centered={centered}
            children={children}
            width={width}
            style={style}
            closable={closable}
        >
        </Modal>
    );
}

export default memo(ModalPopup);

const modalButtonStyle = {
    OkButton: {
        boxShadow: '0px 4px 4px 0px #00000040',
        minWidth: '180px',
        height: '48px',
        borderRadius: '75px',
        backgroundColor: '#002E6D',
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: '16px'
    },
    title: {
        fontSize: '1.5em',
        textAlign: 'center',
    },
    iconStyle: {
        marginRight: '1em'
    }
};
