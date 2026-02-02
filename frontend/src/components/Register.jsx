import { useState,useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import api from "../api/axios"

const Register =() =>{
    const [username,setUsername] = useState("");
    const [password,setPassword] =useState("");
    const [repassword,setRepassword] =useState("");
    const [passwordLiveError, setPasswordLiveError] =useState();
    const [usernameLiveError, setUsernameLiveError] =useState();
    const [liveError,setLiveError] =useState();

    const {register} = useAuth();
    const showNotify = useNotify();

    useEffect(()=>{
        const ValidateRealTime= async() =>{
            if (!username && !password) {
            setUsernameLiveError("");
            setPasswordLiveError("");
            return;
        }
            try{
                await api.post('/api/auth/resgister',{
                    username,
                    password,
                    repassword,
                    validateOnly:true
                })
                setUsernameLiveError("");
                setPasswordLiveError("");
                setLiveError("");
            }catch(err){
                const { type, error } = err.response?.data || {};
                if(type==="username"){
                    setUsernameLiveError(error);
                    setPasswordLiveError("");
                }
                else if(type==="password"){
                    setPasswordLiveError(error);
                    setUsernameLiveError("");
                }
                else{
                     setLiveError(error);
                }

            }
        } ;
        const timer = setTimeout(ValidateRealTime, 500);
        return () => clearTimeout(timer);


    },[username,password,repassword])


    const handleRegister= async (e) =>{
        e.preventDefault();
        try{
            await register({
                username,password,repassword});
            showNotify(`User ${username} Registered`,5000);
        }
        catch(err){
            const serverError = err.response?.data?.error ||"issue with api"
            showNotify(`Issue: ${serverError} `,5000);
        }
    }
    const isMatch= password && repassword && password === repassword;

    return(
       <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-2xl font-bold mb-6">Rergister</h2>
            <form 
            onSubmit={handleRegister}
            className="flex flex-col gap-4">
                <input type="text" placeholder="Enter Username"
                className="bg-black/40 rounded-xl p-2 text-white outline-none border border-white"
                onChange={(e)=>setUsername(e.target.value)}/>
                {usernameLiveError &&<p className="text-red-400 text-xs">{usernameLiveError}</p>}
                <input type="Password" placeholder="Enter Password"
                onChange={(e)=>setPassword(e.target.value)}
                className="bg-black/40 rounded-xl p-2 text-white outline-none border border-white"/>
                <input type="Password" placeholder="Re-Enter Password"
                onChange={(e)=>setRepassword(e.target.value)}
                className="bg-black/40 rounded-xl p-2 text-white outline-none border border-white"/>
                {passwordLiveError &&<p className="text-red-400 text-xs">{passwordLiveError}</p>}
                <button className="bg-dream-orange p-3 rounded-xl font-bold text-white">
                    Register
                </button>
                {liveError &&<p className="text-red-400 text-xs">{liveError}</p>}
            </form>
        </div>
    );


    
}
export default Register