import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import Register from './Register';

const Login = () => {
    const [username, setUsername] = useState("");
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

    return (
        <>
        <div class="max-w-md mx-auto mt-20 p-8">
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
                <input 
                    type="text" placeholder="username" 
                    className="bg-black/20 p-3 rounded text-white outline-none border border-white/10"
                    onChange={(e) => setUsername(e.target.value)} 
                />
                <input 
                    type="password" placeholder="Password" 
                    className="bg-black/20 p-3 rounded text-white outline-none border border-white/10"
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button className="bg-dream-orange p-3 rounded-xl font-bold text-white">
                    LOGIN
                </button>
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