import React from "react";

import { Button, Form } from "antd";
import { useNavigate } from "react-router-dom";

const { Item } = Form;

export default function HandleFormRouting({
                                              form,
                                              handleNextCallback,
                                              handleCancelCallback,
                                              handleBackCallback,
                                              hideBackButton = false,
                                              loadingState = false
                                          }) {

    const navigate = useNavigate();

    const handleNextClick = () => {
        form.submit();
    };

    const handleBackButtonClick = () => {
        // Go back to the previous step
        return navigate(-1);
    };

    return (
        <Item>
            <div style={formRouteButtonStyle.buttonContainer}>
                {
                    (hideBackButton)
                        ? null
                        : (
                            <Button
                                style={formRouteButtonStyle.back}
                                type="default"
                                onClick={handleBackCallback || handleBackButtonClick}
                            >
                                Back
                            </Button>
                        )
                }
                <div style={{ justifySelf: 'end' }}>
                    <Button
                        style={formRouteButtonStyle.next}
                        type="primary"
                        onClick={handleNextCallback || handleNextClick}
                        loading={loadingState}
                    >
                        Next
                    </Button>
                </div>

            </div>
        </Item>
    );
}

const formRouteButtonStyle = {
    next: {
        height: '3em',
        width: '19em',
        backgroundColor: '#002E6D',
        borderRadius: '75px',
        fontWeight: 700,
        fontSize: '1em',
        lineHeight: '2em',
        textAlign: 'center',
        grid: 1 / 3,
    },
    back: {
        height: '3em',
        width: '19em',
        backgroundColor: 'white',
        borderRadius: '75px',
        color: 'black',
        fontWeight: 700,
        fontSize: '1em',
        lineHeight: '2em',
        textAlign: 'center',
        grid: 1 / 3,
    },
    cancel: {
        height: '3em',
        width: '19em',
        backgroundColor: 'white',
        borderRadius: '75px',
        color: 'black',
        fontWeight: 700,
        fontSize: '1em',
        lineHeight: '2em',
        textAlign: 'center',
    },
    buttonContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gridGap: '10px',
    }
};
