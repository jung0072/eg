import React from 'react';

import { WarningOutlined } from '@ant-design/icons';
import { Dropdown, Popover } from 'antd';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarning } from "@fortawesome/free-solid-svg-icons";

import "./engage_action.css";

import { useEngageAction } from '../../../providers/EngageActionContextProvider';
import { checkAssociatedWithID, getTrianglePosition, } from '../common';

/**
 * Functional component for an Engage Action Button.
 *
 * @param {Object} props - Component properties.
 * @param {React.Component} props.actionComponent - The action component to display.
 * @param {Object} props.engageActionStyle - Style for the Engage Action Button.
 * @param {Object} props.engageActionStyle.reportIconStyle - Action Button icon style.
 * @param {Object} props.engageActionStyle.popoverPosition - ant-d placement for Popover component
 * @param {Object} props.engageActionStyle.componentContainer - Style for component when used outside of ant d Popover
 * @param {boolean} [props.isFixedPosition=false] - If you want to use your Action component outside EngageAction set this to true.
 * @param {boolean} [props.isUseInPopover=true] - Indicates whether to use the action component inside a popover.
 * @param {string} [props.itemID=null] - The item's ID.
 * @param {string} props.type - The type of the action file.
 * @param {function} [props.callbackClickAction] - Callback function for action item onClick.
 * @param {boolean} [props.isActionIconFilled=true] - Indicates if the action icon should be filled.
 * @param {boolean} [props.showActionMenu=true] - Indicates whether to show the action menu.
 * @param {string} [props.position='leftBottom'] - The position of the button.
 *   Possible values for 'position':
 *   - 'topRight' - Position at the top right corner.
 *   - 'topLeft' - Position at the top left corner.
 *   - 'bottomRight' - Position at the bottom right corner.
 *   - 'bottomLeft' - Position at the bottom left corner.
 *   - 'rightTop' - Position at the right top corner.
 *   - 'leftTop' - Position at the left top corner.
 *   - 'rightBottom' - Position at the right bottom corner.
 *   - 'leftBottom' - Position at the left bottom corner.
* @param {Array} [props.skipOptionWithKey] - An array of keys to skip from the action menu.
 *  @todo This feature is not yet implemented. It will be implemented in a future release.
 */
const EngageActionButton = ({
    actionComponent,
    engageActionStyle,
    isFixedPosition = false,
    isUseInPopover = true,
    itemID = null,
    type,
    callbackClickAction,
    isActionIconFilled = true,
    showActionMenu = true,
    position = 'leftBottom',
    skipOptionWithKey,
}) => {
    const {
        actionState,
        toggleShowMenuOptions,
        setAssociatedWithID,
    } = useEngageAction();

    const { showMenuOptions, associatedWithID } = actionState;

    // position for the popover triangle when using custom action outside Popover
    const triangleTransform = getTrianglePosition(position)

    // styles for triangle
    const customPopoverTriangleStyle = {
        position: 'absolute',
        width: 0,
        height: 0,
        borderLeft: '11px solid transparent',
        borderRight: '11px solid transparent',
        borderBottom: '15px solid #fff',
        borderStyle: 'solid',
        zIndex: '997',
        borderTopColor: 'transparent',
        borderTopRadius: '20px',
        ...triangleTransform,
    };

    // list of action items
    const actionItems = [
        {
            key: '1',
            label: (
                <div
                    className='report-item'
                    onClick={() => {
                        if (callbackClickAction) {
                            callbackClickAction();
                        }
                        toggleShowMenuOptions(true);
                        setAssociatedWithID(`${type}-${itemID}`);
                    }}
                >
                    Report
                </div>
            ),
        },
    ];

    // could be a feature if we don't want to show certain actions
    // if (skipOptionWithKey && Array.isArray(skipOptionWithKey)) {
    //     skipOptionWithKey.forEach(keyToSkip => {
    //         const index = actionItems.findIndex(item => item.key === keyToSkip);
    //         if (index !== -1) {
    //             actionItems.splice(index, 1);
    //         }
    //     });
    // }

    return (
        <div className='action-container' key={itemID}>
            {showActionMenu && (
                <Dropdown
                    arrow
                    menu={{ items: actionItems }}
                    overlayStyle={engageActionContainerStyle.menuItemContainer}
                    dropdownRender={(menu) => menu}
                >
                    {isActionIconFilled ? (
                        <FontAwesomeIcon
                            icon={faWarning}
                            className='action-button-icon'
                            onClick={(e) => e.preventDefault()}
                            style={engageActionStyle?.reportIconStyle}
                        />
                    ) : (
                        <WarningOutlined
                            onClick={(e) => e.preventDefault()}
                            className='action-button-icon'
                            style={engageActionStyle?.reportIconStyle}
                        />
                    )
                    }
                </Dropdown>
            )}
            {/* 
                in some cases you might wanna use your component outside the popover
                to deal with that we also check for isFixedPosition
                if true -> we are using it outside of the popover
                false -> using component inside
             */}
            {showMenuOptions
                && !isFixedPosition
                && checkAssociatedWithID(associatedWithID, type, itemID) && (
                    isUseInPopover ? (
                        <Popover
                            overlayClassName='popover-container'
                            open={showMenuOptions}
                            content={actionComponent}
                            placement={engageActionStyle?.popoverPosition || 'bottomLeft'}
                        />
                    ) : (
                        <div style={{ ...engageActionContainerStyle?.actionComponent, ...engageActionStyle?.componentContainer }}>
                            <div style={{ position: 'relative' }}>
                                <div style={customPopoverTriangleStyle}></div>
                                {actionComponent}
                            </div>
                        </div>
                    )
                )
            }
        </div>
    );
};

const engageActionContainerStyle = {
    menuItemContainer: {
        minWidth: '100px',
        width: 'auto',
        maxWidth: '300px',
    },
    actionComponent: {
        display: 'flex',
        position: 'absolute',
        backgroundColor: '#FFF',
        zIndex: 999,
        justifyContent: 'center',
        minHeight: '130px',
        minWidth: '223px',
        borderRadius: '10px',
        padding: '1rem',
        boxShadow: '0 3px 6px -4px rgb(0 0 0 / 12%), 0 6px 16px 0 rgb(0 0 0 / 8%), 0 9px 28px 8px rgb(0 0 0 / 5%)',
    },
}

export default EngageActionButton;
