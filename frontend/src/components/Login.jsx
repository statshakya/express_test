import { useState ,useEffect} from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import Register from './Register';
import api from '../api/axios';

const Login = () => {
    const [username, setUsername] = useState("");
    const [email,setEmail]= useState("");
    const [otp,setOtp]= useState("");
    const [newPassword,setNewPassword]= useState("");
    const [forgotPassword,setForgotPassword]= useState(1);
    const [errors,setErrors]= useState({
        email:"",
        password:"",
        otp:"",
        general:""
    })
    const [password, setPassword] = useState("");
    const[usermode,setUsermode] =useState(true);
    
    const { login } = useAuth();
    const showNotify = useNotify();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login({ username, password });
            showNotify(`Welcome back ${username}!`,5000);
        } catch (err) { 
            const serverError = err.response?.data?.error || "Access Denied";
        showNotify(serverError);
        }
    };


    useEffect(()=>{
        const ValidateRealTime= async()=>{
        if(!email && !otp && !newPassword){
            setErrors({
                email:"",
                password:"",
                otp:"",
                general:""
            })
        }

        try{
            const result = await api.post('/api/auth/resetpassword',{
                email,
        password: newPassword,otp,validateOnly:true
            })
             setErrors({
                email:"",
                password:"",
                otp:"",
                general:""
            })
            if(result.data.otppass){
                setErrors(prev =>({...prev,otp:""}))
                setForgotPassword(4);
            }

        }catch(err){
            const {type,error} = err.response?.data || {};
            setErrors({
        email: (type === "email") ? error : "",
        otp: (type === "otp") ? error : "",
        password: (type === "password") ? error : "",
        general: !type ? error : ""
    });

        }

        }
        const timer = setTimeout(ValidateRealTime,500);
        return()=> clearTimeout(timer);
        
    },[email,otp,newPassword])

const resetSubmit = async () => { // No need to pass params if using state
    try {
        const result = await api.post('/api/auth/resetpassword', {
            email,
            password: newPassword, // Use the newPassword state here!
            otp
        });
        showNotify(`${email} password has been reset`);
        setForgotPassword(1);
        setEmail(""); 
        setOtp("");
        setNewPassword("");
        setErrors({ email: "", password: "", otp: "", general: "" });
    } catch (err) {
        const serverError = err.response?.data?.error || "Reset Failed";
        showNotify(serverError);
    }
};
    const sendOtp = async (e) => {
    e.preventDefault();
    // 1. Check if email exists and there are no live validation errors
    if (!email) {
        setErrors(prev =>({...prev,email:"please enter your email"}))
        return;
    }

    try {
        // Only send if the real-time validator hasn't flagged the email
        if (!errors.email) {
            const otpdata = await api.post('/api/auth/send-otp', { email });
            if (otpdata.data.valid) {
                setForgotPassword(3);
                showNotify("Code sent! Check your inbox.", 3000);
            }
        }
    } catch (err) {
        const serverError = err.response?.data?.error || "Error in sending code";
        
        showNotify(`Issue: ${serverError}`, 5000);
    }
    }

    return (
        <>
        <div className="max-w-md mx-auto mt-20 p-8">
            <div class="glass-card overflow-hidden transition-all duration-500">
            <div className="flex p-1 bg-black/40 m-4 rounded-xl border border-white/40 ">
            <button className={`flex-1 py-2  rounded-lg font-bold transition-all duration-500 rounded p-4 ${usermode?'bg-dream-orange text-white':'text-gray-400 hover:text-white'}`}
            onClick={()=>setUsermode(true)}
            >Login</button>
            <button className={`flex-1 py-2  rounded-lg font-bold transition-all duration-500 ${!usermode?'bg-dream-orange text-white':'text-gray-400 hover:text-white'} `}
            onClick={()=>setUsermode(false)}>Register</button>
            </div>

        <div className="p-8 pt-4">
        {!usermode ?
        <Register/>
        :
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl text-white font-bold mb-6 italic tracking-tighter">IDENTITY CHECK</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
                {forgotPassword===1 &&
                <>
                <input 
                    type="text" placeholder="username/Email" 
                    className="bg-black/20 p-3 rounded text-white outline-none border border-white/10"
                    onChange={(e) => setUsername(e.target.value)} 
                />
                <input 
                    type="password" placeholder="Password" 
                    className="bg-black/20 p-3 rounded text-white outline-none border border-white/10"
                    onChange={(e) => setPassword(e.target.value)} 
                /></>    
                }

                {forgotPassword===2 &&
                
                <div><input 
                    type="text" placeholder="Email" 
                    className="bg-black/20 p-3 rounded text-white outline-none border border-white/10"
                    onChange={(e) => setEmail(e.target.value)} 
                />
                 <button
                type="button"
                onClick={sendOtp}
                className="px-3 border border-white/20 py-2 rounded-xl bg-black/80"
                >send</button>
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>
                }
                {forgotPassword===3 &&
                <>
                <input 
                    type="text" placeholder="otp" 
                    className="bg-black/20 p-3 rounded text-white outline-none border border-white/10"
                    onChange={(e) => setOtp(e.target.value)} 
                />
                {errors.otp && <p className="text-red-500 text-xs">{errors.otp}</p>}
                </>
                }
                {forgotPassword===4 &&
                <>
                <input 
                    type="password" placeholder="Password" 
                    className="bg-black/20 p-3 rounded text-white outline-none border border-white/10"
                    onChange={(e) => setNewPassword(e.target.value)} 
                />
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                </>}
                {forgotPassword===1 &&
                <button
                type='button'
                onClick={()=>setForgotPassword(2)}
                className="p-2 ml-auto hover:underline"
                >Forgot Password ?</button>
                }
                {forgotPassword===2 &&
                <button
                type='button'
                onClick={()=>setForgotPassword(1)}
                className="p-2 ml-auto hover:underline"
                >Back</button>}
                {forgotPassword===4 ?
               <button
        type='button'
        onClick={resetSubmit} // Just call the function
        className="bg-dream-orange p-3 rounded-xl font-bold text-white"
    >
        Reset
    </button>
    :
                <button
                type='submit'
                className="bg-dream-orange p-3 rounded-xl font-bold text-white">
                    login
                </button>    }
            </form>
        </div>
        
        }
        </div>
        </div>
        <p className="text-center mt-6 text-white/30 text-xs tracking-[0.2em] uppercase">
                Secure Connection via Nebula Auth v2.0
            </p>
        </div>
        </>
    );
};

export default Login