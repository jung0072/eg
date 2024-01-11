import React, { memo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './reminderCard.css';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

const ReminderCard = ({ title, colorHex, icon, dueDate, onClick, openInfo }) => {
	return (
		<div className='reminder-card' style={{ borderColor: colorHex }} onClick={onClick}>
			<strong className='title'>{title}</strong>
			<span className='due-date'>Due Date: {dueDate}</span>

			<div className='icon-container' style={{ background: colorHex }}>
				<FontAwesomeIcon className='icon' icon={icon} />
			</div>
			{openInfo ? <div className='update-info'>
				<Tooltip
					placement="topRight"
					title="Updated Recently"
				>
					<InfoCircleOutlined />
				</Tooltip>
			</div> : ""}
		</div>
	)
};

export default memo(ReminderCard);
