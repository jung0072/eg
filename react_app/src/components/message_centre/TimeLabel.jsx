import React from "react";

const timeLabelStyles = {
    container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0.5em'
    },
    label: {
        backgroundColor: '#00000040',
        borderRadius: '5px',
        boxShadow: '0px 1px 2px 0px #00000040',
        color: '#FFFFFF',
        fontSize: '10px',
        marginBottom: 0,
        padding: '0.5em'
    }
};

const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function TimeLabel({ previousMessageDate, currentMessageDate }) {

    // check the time between the previous message and the current message, we can add a TimeLabel for each message
    // grouped by day (show the previous 7 days as Monday to Sunday, and anything greater than a week before we can
    // show the actual date
    const DATE_IN_MS = 1000 * 60 * 60 * 24;

    const currentDate = new Date();
    if (!previousMessageDate || !currentMessageDate) {
        console.error("There was an error generating the date label");
        return null;
    }
    const timeDeltaMS = currentMessageDate.getTime() - previousMessageDate.getTime();
    const timeDeltaBetweenPreviousMessageDays = Math.ceil(timeDeltaMS / DATE_IN_MS);
    const timeDeltaBetweenCurrentDateDays = Math.ceil((currentDate.getTime() - currentMessageDate.getTime()) / DATE_IN_MS);
    const isDateWithinWeek = (timeDeltaBetweenCurrentDateDays <= 7);
    const timeLabel = { day: '' };

    // check if the previous message date and the current message date is less then a day between them, then we do
    // not have to render anything and can return null
    if (timeDeltaBetweenPreviousMessageDays <= 1) {
        return null;
    }

    if (isDateWithinWeek) {
        // If the current date of the message is less then a week old we will show the actual day spelt out fully
        timeLabel.day = (timeDeltaBetweenCurrentDateDays <= 0) ? 'Today' : DAY_NAMES[currentMessageDate.getDay()];
    } else {
        // If the current date is older then a week, we will show the date as MM/DD/YYYY
        timeLabel.day = currentMessageDate.toDateString();
    }
    return (
        <div style={timeLabelStyles.container}>
            <p style={timeLabelStyles.label}>{timeLabel.day}</p>
        </div>
    );
}
