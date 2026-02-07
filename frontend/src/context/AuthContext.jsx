import { useContext,createContext,useState,useEffect } from "react";
import api from '../api/axios'

const AuthContext= createContext();

export const AuthProvider= ({children})=>{
    const [user,setUser]=useState(null);
    const [loading,setLoading]= useState(true);

    useEffect(()=>{
        const checkAuth= async ()=>{
            try{
                const res =await api.get('/api/auth/me');
                setUser(res.data.user);
            }catch(err){
                setUser(null);
            }finally{
                setLoading(false);
            }
        };
        checkAuth();

    },
    []);
    const login =async (Credential) =>{
        const res = await api.post('/api/auth/login',Credential);
        setUser(res.data.user);
        window.location.href = '/dashboard';
    }

    const register = async (Credential) =>{
        const res = await api.post('/api/auth/resgister',Credential);
        setUser(res.data.user);
        window.location.href = '/dashboard';
    }

    const logout = async () => {
        await api.post('/api/auth/logout');
        setUser(null);
        window.location.href = '/explore';
        // window.location.href = '/login'; // Redirect to login
    };

    return (
        <AuthContext.Provider value={{ user, login,register, logout, loading }}>
            {!loading && children} 
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);