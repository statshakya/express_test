import api from "../api/axios";
import { useState,useEffect } from "react";
import FolderNav from "./FolderNav";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from '../context/AuthContext';
const UserDashboard = ()=>{
    const { user, setUser, loading } = useAuth();
    const [isMenuActive, setIsMenuActive] = useState(false);
    const [formData, setFormData] = useState({
        username: "", email: "", password: "", repassword: "", currentPassword: ""
    });

    const showNotify = useNotify();
    // console.log(user);

    useEffect(()=>{
        if(user){
            setFormData(prev =>({
                ...prev,
                username:user.username ||"",
                email:user.email ||""
            }));
        }
    },[user])
    if (loading) return <div className="bg-black min-h-screen" />; // Loading state
    if (!user) return <div className="text-white">Access Denied</div>; // No user state
  
    const changeUserDetail= async(e)=>{
        e.preventDefault();
        if(formData.password && formData.password!== formData.repassword){
            return showNotify("New passowrd do not match",4000);
        }
        try{
            const res = await api.post('/api/user/edit',formData);
            setUser(res.data.user);
            // console.log(res.data.user);
            showNotify(res.data.message,3000);

            setFormData(prev=>({...prev,password:"",repassword:"",currentPassword:""}))

        }catch (err) {
    console.error("FULL ERROR:", err);
    console.error("RESPONSE:", err.response);
    console.error("DATA:", err.response?.data);

    showNotify(
        err.response?.data?.message || 
        err.message || 
        "Something went wrong",
        4000
    );
}

    }
    return(
                     <div className="min-h-screen bg-black text-white selection:bg-dream-orange/30">
            <FolderNav 
                onMouseEnter={() => setIsMenuActive(true)}
                onMouseLeave={() => setIsMenuActive(false)}
                isActive={isMenuActive} 
            />
            
            <main className={`relative transition-all duration-500 px-6 ${isMenuActive ? 'pt-[112px]' : 'pt-12'}`}>
                <div className="max-w-6xl mx-auto flex flex-col pt-10 pb-20">
                <form className="space-y-6" onSubmit={changeUserDetail}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase ml-2">Public Alias</label>
                                <input 
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-dream-orange/50 outline-none transition-all"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase ml-2">Communication Link</label>
                                <input 
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-dream-orange/50 outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <hr className="border-white/5 my-8" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase ml-2">New Protocol (Password)</label>
                                <input 
                                    type="password"
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-dream-orange/50 outline-none transition-all"
                                    placeholder="Leave blank to keep current"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase ml-2">Confirm Protocol</label>
                                <input 
                                    type="password"
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-dream-orange/50 outline-none transition-all"
                                    value={formData.repassword}
                                    onChange={(e) => setFormData({...formData, repassword: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-10 bg-dream-orange/5 border border-dream-orange/20 p-6 rounded-3xl">
                            <label className="text-[10px] font-black text-dream-orange uppercase ml-1 block mb-3">Verification Required</label>
                            <input 
                                type="password"
                                // required
                                placeholder="Enter CURRENT password to authorize changes"
                                className="w-full bg-black border border-dream-orange/30 rounded-2xl p-4 focus:border-dream-orange outline-none transition-all text-sm"
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-dream-orange hover:bg-dream-orange/80 text-white font-black uppercase py-5 rounded-2xl shadow-lg shadow-dream-orange/20 transition-all hover:scale-[0.98] active:scale-95 mt-4"
                        >
                            Update Credentials
                        </button>
                    </form>    
                </div>
            </main>
                </div>
                
      
    );
}

export default UserDashboard;