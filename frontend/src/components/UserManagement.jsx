import api from "../api/axios";
import { useState, useEffect } from "react";
import FolderNav from "./FolderNav";
import { useNotify } from "../context/NotificationContext";

const UserManagement = () => {
    const [isMenuActive, setIsMenuActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userDatas, setUserDatas] = useState([]);
    const [editUser,setEditUser]=useState({ id:'',username: '', role: '' });
    
    const showNotify = useNotify();

    useEffect(() => {
        const getuser = async () => {
            try {
                const result = await api.get('/api/admin/user');
                setUserDatas(result.data);
            } catch (err) {
                showNotify(err.response?.data?.error);
            } finally {
                setIsLoading(false);
            }
        };
        getuser();
    }, []);

    const updateuser = async (uid,uusername,urole)=>{
        try{
            const result= await api.put(`/api/admin/user/${uid}`,{id:uid,username:uusername,role:urole})
            setUserDatas(prev => prev.map(user => user.id === uid ? result.data.data : user));
            // setUserDatas(...prev.map(user=>user.id ===id?result.data.data : user));
            showNotify(result.data.message,4000);
            setEditUser({ id: '', username: '', role: '' });
        }catch(err){
            showNotify(err.response?.data?.error);
        }
    }

    const deleteUser = async (id) => {
        try {
            const result = await api.delete(`/api/admin/user/${id}`);
            setUserDatas(prev => prev.filter(user => user.id !== id));
            showNotify(result.data.message);
        } catch (err) {
            showNotify(err.response?.data?.error);
        }
    };

    const toggleStatus = async (id) => {
        try {
            const result = await api.patch(`/api/admin/user/${id}/status`);
            setUserDatas(prev => prev.map(user => user.id === id ? result.data.data : user));
            showNotify(result.data.message, 3000);
        } catch (err) {
            showNotify(err.response?.data?.error);
        }
    };

return (
        <div className="min-h-screen bg-black text-white selection:bg-dream-orange/30">
            <FolderNav 
                onMouseEnter={() => setIsMenuActive(true)}
                onMouseLeave={() => setIsMenuActive(false)}
                isActive={isMenuActive} 
            />
            
            <main className={`relative transition-all duration-500 px-6 ${isMenuActive ? 'pt-[112px]' : 'pt-12'}`}>
                <div className="max-w-6xl mx-auto flex flex-col pt-10 pb-20">
                    
                    {/* Header Section (Unchanged) */}
                    <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md pb-6 border-b border-white/5 mb-8">
                        <div className="flex justify-between items-center mb-8 pt-4">
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter italic uppercase">
                                    Control <span className="text-memory-gold">Center</span>
                                </h1>
                                <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] mt-1">User & Authority Management</p>
                            </div>
                            <button className="text-sm font-bold text-dream-orange border border-dream-orange/30 px-6 py-2 rounded-full hover:bg-dream-orange hover:text-white transition-all duration-300 uppercase">
                                Logout
                            </button>
                        </div>

                        <div className="relative group">
                            <input
                                className="w-full md:w-96 bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-dream-orange/50 transition-all text-sm"
                                placeholder="Search operatives..."
                            />
                            <span className="absolute left-4 top-4 opacity-20">🔍</span>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="space-y-3">
                        {!isLoading ? (
                            userDatas.map((userdata, index) => (
                          <div 
    key={index} 
    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border transition-all duration-300 p-5 rounded-3xl ${editUser.id === userdata.id ? 'border-dream-orange/50 bg-dream-orange/5' : 'border-white/10 hover:bg-white/[0.08]'}`}
>
                                    {editUser.id === userdata.id ? (
                                        /* EDIT MODE UI */
                                        <div className="flex flex-col md:flex-row flex-1 gap-4 items-center animate-in fade-in zoom-in duration-200">
                                            <div className="flex flex-1 gap-2 w-full">
                                                <input 
                                                    className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-2 text-white outline-none focus:border-dream-orange"
                                                    value={editUser.username}
                                                    onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                                                    placeholder="Username"
                                                />
                                                <select 
                                                    className="bg-black border border-white/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-dream-orange"
                                                    value={editUser.role}
                                                    onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                                                >
                                                    <option value="user">USER</option>
                                                    <option value="admin">ADMIN</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto border-t border-white/5 pt-4 sm:pt-0 sm:border-none">
                                                <button onClick={() => updateuser(editUser.id, editUser.username, editUser.role)} className="bg-dream-orange text-white px-6 py-2 rounded-xl text-xs font-bold uppercase shadow-lg shadow-dream-orange/20">Save</button>
                                                <button onClick={() => setEditUser({ id:'', username: '', role: '' })} className="bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* VIEW MODE UI */
                                        <>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center font-black text-memory-gold shadow-inner">
                                                    {userdata.username[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-bold tracking-tight">{userdata.username}</span>
                                                    <span className={`text-[9px] font-black w-fit px-2 py-0.5 rounded uppercase tracking-widest ${userdata.role === 'admin' ? 'bg-dream-orange/20 text-dream-orange' : 'bg-white/10 text-white/40'}`}>
                                                        {userdata.role}
                                                    </span>
                                                </div>
                                            </div>
<div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto border-t border-white/5 pt-4 sm:pt-0 sm:border-none">
                                                <button
                                                    onClick={() => toggleStatus(userdata.id)}
                                                    className={`text-[10px] font-bold px-4 py-2 rounded-xl border transition-all duration-300 uppercase tracking-widest ${
                                                        userdata.status 
                                                        ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white' 
                                                        : 'bg-white/5 border-white/10 text-white/20 hover:border-white/40'
                                                    }`}
                                                >
                                                    {userdata.status ? '● Active' : '○ Inactive'}
                                                </button>
                                                
                                                <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
                                                    <button onClick={() => setEditUser(userdata)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors" title="Edit Operative">✏️</button>
                                                    <button onClick={() => deleteUser(userdata.id)} className="p-2.5 hover:bg-red-500/10 text-red-500/40 hover:text-red-500 rounded-xl transition-colors" title="Exile User">🗑️</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20 italic">
                                <div className="animate-spin mb-4 text-3xl">◌</div>
                                <p className="uppercase tracking-[0.5em] text-xs">Accessing Encrypted Data</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserManagement;