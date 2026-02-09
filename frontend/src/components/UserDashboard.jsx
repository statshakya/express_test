import api from "../api/axios";
import { useState,useEffect } from "react";
import FolderNav from "./FolderNav";
import { useNotify } from "../context/NotificationContext";
const UserDashboard = ()=>{

    const[isLoading,setIsLoading] = useState(false);
    const [userData,setUserData] = useState([]);
    
    const showNotify = useNotify();

    useEffect=(()=>{
       
        const getuser= async()=>{
            try{ 
        const result = await api.get('/api/admin/user')
        setUserData(result.data);         
        }catch(err){
        showNotify(err.response?.data?.error);

       }finally{
        setIsLoading(true);
       }
    }
      

    },[])

    return(
        <>
        {isLoading? (<div>
            done loading</div>):(
                <div>not loading</div>
        )}
        </>

    );
}

export default UserDashboard;