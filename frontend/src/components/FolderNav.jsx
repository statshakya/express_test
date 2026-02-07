import {Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
const FolderNav = ({onMouseEnter,onMouseLeave,isActive}) => {
    const {user,logout} = useAuth();
    return (
        /* The header is fixed, but its content will push the rest of the app down */
        <header className="fixed top-0 left-0 w-full z-50 flex flex-col items-center"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        >
            
            {/* 1. THE LID: Now part of the flow (relative) */}
          <div className={`relative w-full bg-zinc-900/95 backdrop-blur-2xl border-b border-white/10
                            transition-all duration-500 ease-in-out overflow-hidden
                            flex flex-col justify-center items-center shadow-2xl
                            ${isActive ? 'h-[100px]' : 'h-0'}`}>

                {/* NAV ITEMS: They reveal as the height expands */}
             <nav className={`flex gap-16 transition-all duration-700 delay-100 
                                ${isActive ? 'opacity-100' : 'opacity-0'}`}>      
                    <Link to="/explore"
                    className="text-[11px] font-bold text-white/40 group-hover/item:text-dream-orange transition-colors tracking-widest uppercase">Explore</Link>
                     {user? <Link 
                    className="text-[11px] font-bold text-white/40 group-hover/item:text-dream-orange transition-colors tracking-widest uppercase"
                    to="/dashboard">Dashboard</Link>:
                    ''}
                    {user? <Link 
                    className="text-[11px] font-bold text-white/40 group-hover/item:text-dream-orange transition-colors tracking-widest uppercase"
                    onClick={logout}>Logout</Link>:
                    <Link className="text-[11px] font-bold text-white/40 group-hover/item:text-dream-orange transition-colors tracking-widest uppercase" to="/login">Login/Register</Link>}
                     
                    
                </nav>

                {/* Subtle "Inside" shadow to show depth */}
                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/50 to-transparent" />
            </div>

            {/* 2. THE MENU TAB: Anchored below the lid */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 
                            bg-zinc-900/95 border-x border-b border-white/10 
                            px-12 py-3 rounded-b-3xl cursor-pointer 
                            group-hover:bg-dream-orange/10 transition-colors">
                <span className="text-[10px] font-black tracking-[0.5em] text-white uppercase italic">
                    Menu
                </span>
            </div>
        </header>
    );
};

// Small helper for the labels
const NavItem = ({ label }) => (
    <div className="group/item cursor-pointer">
        <p className="text-[11px] font-bold text-white/40 group-hover/item:text-dream-orange transition-colors tracking-widest uppercase">
            {label}
        </p>
        <div className="h-[1px] w-0 group-hover/item:w-full bg-dream-orange transition-all duration-300" />
    </div>
);
export default FolderNav