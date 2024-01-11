import React from 'react'
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectLoggedInUserData } from "../../redux/services/userAPI.js";

import { EngageSpinner } from '../utils/engage_spinner/EngageSpinner.jsx'

import SystemMessageList from './SystemMessageList.jsx'
import SystemMessageDetail from './SystemMessageDetail.jsx'
import SystemMessageAdmin from '../admin_panel/admin_panel_components/SystemMessage.jsx'

import { useGetAllSystemMessagesQuery } from '../../redux/services/userAPI.js'

export default function SystemMessage() {
  const { id: messageId } = useParams();
  const userData = useSelector(selectLoggedInUserData);
  const { data: messageList, error, isLoading } = useGetAllSystemMessagesQuery()
  const [message, setMessage] = React.useState(null)

  React.useEffect(() => {
    if (messageId && messageList) {
      const message = messageList.find((message) => message.id === parseInt(messageId))
      setMessage(message)
    }
  }, [messageId, messageList])

  if (isLoading) {
    return <EngageSpinner loaderText={"Loading System Messages"} />;
  }

  return (
    <>
      {messageId && userData.user.is_admin ? <SystemMessageAdmin /> : (messageId ? <SystemMessageDetail /> : <SystemMessageList messageList={messageList} isAdmin={userData.user.is_admin}/>)}
    </>
  )
}

