import api from "../api/axios";
import { useState, useEffect } from "react";
import FolderNav from "./FolderNav";
import { useNotify } from "../context/NotificationContext";

const UserManagement = () => {
    const [isMenuActive, setIsMenuActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab]= useState('users')
    
    const [userDatas, setUserDatas] = useState([]);
    const [roles,setRoles]= useState([]);
    const [permissions,setPermissions]= useState([]);
    
    const [newRoleName, setNewRoleName] = useState('');
    const [editUser,setEditUser]=useState({ id:'',username: '', role_id: '' });
    const [selectedRole,setSelectedRole]= useState(null);
    const showNotify = useNotify();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [userRes,rolesRes,permRes] = await Promise.all([
                    api.get('/api/admin/user'),
                    api.get('/api/admin/roles-config'),
                    api.get('/api/admin/permissions-list')
                ]);
                setUserDatas(userRes.data);
                setRoles(rolesRes.data);
                setPermissions(permRes.data);
            } catch (err) {
                showNotify(err.response?.data?.error,4000);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const assignPermission= async(roleId,permId)=>{
        try{
            const res = await api.post('/api/admin/roles/assign',{roleId,permissionId:permId});
            showNotify(res.data.message,3000);
            const rRes= await api.get('/api/admin/roles-config');
            setRoles(rRes.data);
            setSelectedRole(rRes.data.find(r=> r.role_id===roleId));
        }
        catch(err){
            showNotify("assigment failed");
        }
    }

    const createRole = async ()=>{
        if(!newRoleName) return;
        try{
            const res= await api.post('/api/admin/roles',{name:newRoleName});
            setRoles(prev=> [...prev,res.data.data]);
            setNewRoleName('');
            showNotify(res.data.message,3000);
        }catch(err){
            showNotify(err.response?.data)
        }
    }

    const updateuser = async (uid,uusername,uroleId)=>{
        try{
            const result= await api.put(`/api/admin/user/${uid}`,{id:uid,username:uusername,role:uroleId})
            setUserDatas(prev => prev.map(user => user.id === uid ? result.data.data : user));
            // setUserDatas(...prev.map(user=>user.id ===id?result.data.data : user));
            showNotify(result.data.message,4000);
            setEditUser({ id: '', username: '', role_id: '' });
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
                            <div className="flex gap-4">
                                <button
                                onClick={()=>setCurrentTab('users')}
                                className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase transition-all
                                ${currentTab==='users'?'bg-dream-orange text-white':'text-white/40 hover:text-white'}`}
                                >User Management</button>
                                <button
                                onClick={()=>setCurrentTab('roles')}
                                 className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase transition-all
                                ${currentTab==='roles'?'bg-dream-orange text-white':'text-white/40 hover:text-white'}`}
                               >Permission Management</button>

                            </div>
                            <button className="text-sm font-bold text-dream-orange border border-dream-orange/30 px-6 py-2 rounded-full hover:bg-dream-orange hover:text-white transition-all duration-300 uppercase">
                                Logout
                            </button>
                        </div>
                    {currentTab==='users' &&(
                        <div className="relative group animate-in fade-in slide-in-from-top-2">
                            <input
                                className="w-full md:w-96 bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-dream-orange/50 transition-all text-sm"
                                placeholder="Search operatives..."
                            />
                            <span className="absolute left-4 top-4 opacity-20">🔍</span>
                        </div>
                    )}
                        
                    </div>
                    <div className="relative mb-6 group">
                        <input
                            value={newRoleName}
                            onChange={(e)=>setNewRoleName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-16 focus:outline-none focus:border-dream-orange/50 transition-all text-sm uppercase font-bold"
                            placeholder="New Role Name..."
                            onKeyDown={(e)=> e.key === 'Enter' && createRole()}
                        />
                        <button
                        onClick={createRole}
                        className="absolute right-2 top-2 bottom-2 bg-dream-orange text-white p-4 rounded-xl text-xs font-black hover:scale-95 transition-transform">Add</button>
                    </div>


                    {/* Users List */}
                    <div className="space-y-3">
                        {!isLoading ? (

                            currentTab === 'users' ? (
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
                                                    value={editUser.role_id}
                                                    onChange={(e) => setEditUser({...editUser, role_id: e.target.value})}
                                                >
                                                   {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto border-t border-white/5 pt-4 sm:pt-0 sm:border-none">
                                                <button onClick={() => updateuser(editUser.id, editUser.username, editUser.role_id)} className="bg-dream-orange text-white px-6 py-2 rounded-xl text-xs font-bold uppercase shadow-lg shadow-dream-orange/20">Save</button>
                                                <button onClick={() => setEditUser({ id:'', username: '', role: '' })} className="bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/20">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* VIEW MODE UI */
                                      /* VIEW MODE */
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center font-black text-memory-gold">
                                                        {userdata.username[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-bold">{userdata.username}</span>
                                                        <span className="text-[9px] font-black w-fit px-2 py-0.5 rounded uppercase bg-white/10 text-white/40">
                                                            {userdata.role}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => toggleStatus(userdata.id)} className={`text-[10px] font-bold px-4 py-2 rounded-xl border uppercase tracking-widest ${userdata.status ? 'text-green-500 border-green-500/20' : 'text-white/20 border-white/10'}`}>
                                                        {userdata.status ? '● Active' : '○ Inactive'}
                                                    </button>
                                                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                                                        <button onClick={() => setEditUser(userdata)} className="p-2.5 hover:bg-white/10 rounded-xl">✏️</button>
                                                        <button onClick={() => deleteUser(userdata.id)} className="p-2.5 hover:bg-red-500/10 text-red-500/40 rounded-xl">🗑️</button>
                                                    </div>
                                                </div>
                                            </>
                                    )}
                                </div>
                            ))):(

                                <div className="grid grid-col-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="md:col-span-4 space-y-4">
                                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/80 mv-4">Select Role</h2>
                                        {roles.map(role=>(
                                            <button
                                            key={role.role_id}
                                            onClick={()=> setSelectedRole(role)}
                                            className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 ${selectedRole?.role_id === role.role_id ?'border-dream-orange bg-dream-orange/10':'border-white/10 bg-white/5 hover:border-white/30 '} `}
                                            >
                                            <div className="font-bold text-xl  tracking-tighter uppercase italic">{role.role_name}</div>
                                            <div>{role.actions?.filter(a=>a).length||0} Protocal Active</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="md:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-8">
                                        {selectedRole?(
                                            <>
                                                <div className="flex justify-between items-center mb-8">
                                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                                                    Permissions: <span className="text-dream-orange">{selectedRole.role_name}</span>
                                                </h2>
                                                <button className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest">Load More +</button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {permissions.map(perm=>{
                                                        const isActive= selectedRole.actions?.includes(perm.name);
                                                        return(
                                                            <div
                                                            key={perm.id}
                                                            className="group flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl hover:border-white/20 transition-all"
                                                            >
                                                                <span
                                                                className="text-xs font-bold uppercase tracking-widest text-white/70"
                                                                >{perm.name.replace(':',' ')}</span>
                                                                <button
                                                                onClick={()=>assignPermission(selectedRole.role_id,perm.id)}
                                                                className={`h-8 w-8 rounded-full border  flex items-center justify-center transition-all ${isActive?'bg-green-500 border-green-500 text-black':'border-white/20 text-white/20 hover:border-dream-orange hover:text-dream-orange'}`}
                                                                >
                                                                {isActive ?'✓' : '+'}
                                                                </button>
                                                            </div>
                                                        )
                                                    })}

                                                </div>
                                            </>
                                        ):(
                                            <div className="h-full flex flex-col items-center justify-center text-white/80 italic">
                                            <div className="text-6xl mb-4">🛡️</div>
                                            <p className="uppercase tracking-[0.2em] text-sm">Select a rank to modify protocols</p>
                                            </div>
                                        )}
                                    </div>
                                </div>    
                            )
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