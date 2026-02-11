import { useState,useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import api from "../api/axios"

const Register =() =>{
    const [username,setUsername] = useState("");
    const [password,setPassword] =useState("");
    const [email,setEmail]= useState("");
    const [otp,setOtp] = useState("");
    const [showOtp,setShowOtp]=useState(false);
    const [showAll,setShowAll]= useState(false);
    const [repassword,setRepassword] =useState("");
    const [passwordLiveError, setPasswordLiveError] =useState();
    const [usernameLiveError, setUsernameLiveError] =useState();
    const [emailLiveError,setEmailLiveError]= useState();
    const [otpLiveError,setOtpLiveError]= useState();
    const [liveError,setLiveError] =useState();

    const {register} = useAuth();
    const showNotify = useNotify();

    useEffect(()=>{
        const ValidateRealTime= async() =>{
            if (!username && !password && !email && !otp) {
            setUsernameLiveError("");
            setPasswordLiveError("");
            setEmailLiveError("");
            setOtpLiveError("");
            return;
        }
            try{
                const result =await api.post('/api/auth/resgister',{
                    email,
                    username,
                    password,
                    repassword,
                    otp,
                    validateOnly:true
                })
                setUsernameLiveError("");
                setPasswordLiveError("");
                setEmailLiveError("");
                setOtpLiveError("");
                setLiveError("");
                if (result.data.otppass) {
    setShowAll(true);
    setOtpLiveError(""); // Clear the error if it passed
}
            }catch(err){
                const { type, error } = err.response?.data || {};
                if(type==="username"){
                    setUsernameLiveError(error);
                    setPasswordLiveError("");
                    setEmailLiveError("");
                    setOtpLiveError("");
                }
                else if(type==="password"){
                    setPasswordLiveError(error);
                    setUsernameLiveError("");
                    setEmailLiveError("");
                    setOtpLiveError("");
                }
                else if(type ==="email"){
                    setEmailLiveError(error);
                    setUsernameLiveError("");
                    setPasswordLiveError("");
                    setOtpLiveError("");
                    // setShowOtp(false);
                }
                else if(type==="otp"){
                    setOtpLiveError(error);
                    setEmailLiveError("");
                    setPasswordLiveError("");
                    setUsernameLiveError("");
                }
                else{
                     setLiveError(error);
                }

            }
        } ;
        const timer = setTimeout(ValidateRealTime, 500);
        return () => clearTimeout(timer);


    },[email,username,password,repassword,otp])


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
    const sendOtp = async (e) => {
    e.preventDefault();
    // 1. Check if email exists and there are no live validation errors
    if (!email) {
        setEmailLiveError("Please enter an email first");
        return;
    }

    try {
        // Only send if the real-time validator hasn't flagged the email
        if (!emailLiveError) {
            const otpdata = await api.post('/api/auth/send-otp', { email });
            if (otpdata.data.valid) {
                setShowOtp(true);
                showNotify("Code sent! Check your inbox.", 3000);
            }
        }
    } catch (err) {
        const serverError = err.response?.data?.error || "Check if you are using your Resend-registered email";
        showNotify(`Issue: ${serverError}`, 5000);
    }
}
    const isMatch= password && repassword && password === repassword;

    return(
       <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-2xl font-bold mb-6">Rergister</h2>
            <form 
            onSubmit={handleRegister}
            className="flex flex-col gap-4">
                <div>
                <input type="email" placeholder="Enter Email"
                className="bg-black/40 rounded-xl p-2 text-white outline-none border border-white px-3"
                onChange={(e)=>setEmail(e.target.value)}/>
                {emailLiveError &&<p className="text-red-400 text-xs">{emailLiveError}</p>}
                <button
                type="button"
                onClick={sendOtp}
                className="px-3 border border-white/20 py-2 rounded-xl bg-black/80"
                >send</button>
                </div>
                  
                {showOtp ? 
                <>
                <input type="number" placeholder="Enter Otp"
                value={otp}
                className="bg-black/40 rounded-xl p-2 text-white outline-none border border-white"
                onChange={(e)=>setOtp(e.target.value)}/>
                {otpLiveError &&<p className="text-red-400 text-xs">{otpLiveError}</p>}
                </>
                :''
                }
                {showAll ? 
                <>
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
                
                </>: ''}
                <button className="bg-dream-orange p-3 rounded-xl font-bold text-white">
                    Register
                </button>
                {liveError &&<p className="text-red-400 text-xs">{liveError}</p>}
            </form>
        </div>
    );


    
}
export default Register