import { createContext,useContext,useState,useCallback,useEffect } from "react";

import Notification from "../components/Notification";
const NotificationContext =createContext();


export const NotificationProvider=({children})=>{
    const[notification,setNotification]=useState(null);

    const showNotification= useCallback((message,timeout)=>{
        setNotification({message,timeout});
    },[])
    const clearNotification= () =>setNotification(null);

    return(
        <NotificationContext.Provider value={showNotification}>
            {children}
            {notification && (
                <Notification
                message={notification.message}
                timeout={notification.timeout}
                onClose={clearNotification}
                />
                )}         
        </NotificationContext.Provider>
    );
    
}
export const useNotify=()=> useContext(NotificationContext);