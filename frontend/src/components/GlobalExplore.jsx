import { useState, useEffect } from 'react';
import api from '../api/axios';
import TaskItem from './TaskItem';
import TaskDetails from './TaskDetails';
import FolderNav from './FolderNav';
import { useNotify } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {Link} from 'react-router-dom';

const GlobalExplore = () => {
    const{user,logout}=useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const showNotify = useNotify();
    // Category states
    const [categories, setCategories] = useState([]);
   
    //loadmore
    const [visibleCount, setVisibleCount] = useState(5);
    const loadMore = () =>{
        setVisibleCount(prev => prev + 6);
    }

    const [searchQuery,setSearchQuery]= useState();
    
    // user? setIsGlobal(false) : setIsGlobal(true);
    // Fetch Tasks
    useEffect(() => {
        const getTasks = async () => {
            try {
                const response = await api.get('/api/global');
                setTasks(response.data);
            } catch (err) {
                console.error("failed to fetch:", err);
            } finally {
                setLoading(false);
            }
        };
        getTasks();
    }, []);

    //search tasks
    useEffect(()=>{
      const delayDebounceFn = setTimeout(()=>{
        fetchTask(searchQuery);
      },300);
      return()=> clearTimeout(delayDebounceFn); 
    },[searchQuery])

    const fetchTask = async (query="")=>{
      try{
        const response =await api.get(`/api/global${query ?`?search=${query}`:''}`)
        setTasks(response.data);
      }catch(err){
        console.error(err);
        showNotify(err.response?.data?.error);
      }

    }

    // Fetch Categories
    useEffect(() => {
        const fetchCat = async () => {
            try {
                const res = await api.get('/api/categories');
                setCategories(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCat();
    }, []);

  



//detail page
    const [activeTask, setActiveTask] = useState(null); 
    const [isMenuActive, setIsMenuActive] = useState(false);
    return (
        <>
        <div className="min-h-screen bg-black ">
        <FolderNav 
        onMouseEnter={()=>setIsMenuActive(true) }
        onMouseLeave={()=>setIsMenuActive(false)}
        isActive={isMenuActive}/>


        <main className={`relative pt-12 transition-all duration-500 ${isMenuActive? 'pt-[112px]':'pt-12'}`}>
        <div className="rend max-w-6xl mx-auto h-screen flex flex-col pt-10 px-4 ">
            <TaskDetails 
    task={activeTask} 
    isOpen={!!activeTask} 
    onClose={() => setActiveTask(null)} 
    isGlobal={true}
/>
            
            {/* STICKY HEADER AREA */}
            <div className="sticky top-0 z-30 bg-transparent backdrop-blur-md pb-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic">
                        COSMIC <span className="text-memory-gold">TASKS</span>
                    </h1>
                    {user?
                    <Link onClick={logout} 
                        className="text-xs font-bold text-dream-orange border border-dream-orange/30 px-3 py-1 rounded-full hover:bg-dream-orange hover:text-white transition-all"
                    >
                        Logout
                    </Link>
                    :
                    <Link to="/login" 
                        className="text-xs font-bold text-dream-orange border border-dream-orange/30 px-3 py-1 rounded-full hover:bg-dream-orange hover:text-white transition-all"
                    >
                        Login
                    </Link>}
                    
                </div>

             
                 <input type="text"
                    placeholder="Search Task"
                      className="bg-black/40 p-3 mt-4 rounded-xl border border-white/20 text-white"
                      onChange={(e)=>{
                        setSearchQuery(e.target.value);
                        // showNotify(searchQuery);
                      }}
                    
                    />
            </div>

            {/* SCROLLABLE TASK LIST */}
            {/* <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar"> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            
                
                
                {loading ? (
                    <p className="text-cosmic-teal animate-pulse text-center mt-10">Scanning nebula for tasks...</p>
                ) : tasks.length > 0 ? (
                    tasks.slice(0,visibleCount).map((task,index) => (
                      <div
                      key={task.id}
                    
                      className="cursor-grab acitve:cursor-grabbing">
                        <TaskItem 
                            // key={task.id} 
                            task={task} 
                            categories={categories}
                            onView={()=> setActiveTask(task)}
                            isGlobal={true}
                        />
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic text-center mt-10">No tasks found in this sector.</p>
                )}
            </div>
            {tasks.length > visibleCount &&(
                <div className="flex justify-center mt-12 mb-20">
                    <button onClick={loadMore}
                    className="group relative px-8 py-3 rounded-full bg-white/5 border
                    border-white/10 hover:border-dream-orange/50 transition-all duration-500">
                        <span className="relative z-10 text-[10px] font-black tracking-[0.3em] text-cosmic-teal group-hover:text-white">
                LOAD MORE DATA
            </span>
            {/* Subtle Glow Effect */}
            <div className="absolute inset-0 bg-dream-orange/0 group-hover:bg-dream-orange/10 blur-xl transition-all rounded-full" />

                    </button>
                </div>
            )}
        </div>
        </main>
        </div>
   </>
    );
};

export default GlobalExplore;