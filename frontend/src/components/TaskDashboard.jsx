import { useState, useEffect } from 'react';
import api from '../api/axios';
import TaskItem from './TaskItem';
import { useNotify } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const TaskDashboard = () => {
    const { logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newContent, setNewContent] = useState("");
    const showNotify = useNotify();
    const [draggedItemIndex, setDraggedItemIndex]= useState(null);

    // Category states
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // New category states
    const [isCreatingCat, setIsCreatingCat] = useState(false);
    const [newCatName, setNewCatName] = useState("");

    //loadmore
    const [visibleCount, setVisibleCount] = useState(5);
    const loadMore = () =>{
        setVisibleCount(prev => prev + 6);
    }

    const [searchQuery,setSearchQuery]= useState();
    // Fetch Tasks
    useEffect(() => {
        const getTasks = async () => {
            try {
                const response = await api.get('/api/tasks');
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
        const response =await api.get(`/api/tasks${query ?`?search=${query}`:''}`)
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

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newContent.trim()) return;
        try {
            const response = await api.post('/api/tasks', {
                note: newContent,
                categoryId: selectedCategory
            });
            setTasks(prev => [response.data.data,...prev ]);
            showNotify(response.data.message, 3000);
            setNewContent("");
            setSelectedCategory(null);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Failed to launch task";
            showNotify(`Error: ${errorMessage}`, 5000);
        }
    };

    const toggleTask = async (id) =>{
      try{
        const response = await api.patch(`/api/tasks/${id}/toggle`);
        setTasks(prev=> prev.map(task=>
          task.id===id ? response.data.data :task
        ))
      }catch(err){
        console.error(err);
        showNotify(err.response?.data?.error)
      }
    }
    const handleDragStart =(index)=>{
      setDraggedItemIndex(index);
    }
    const handleDragOver= (e)=>{
      e.preventDefault();
    }
    const handleDrop= async (index)=>{
      const newTasks= [...tasks];
      const [draggedItem] = newTasks.splice(draggedItemIndex,1);
      newTasks.splice(index,0,draggedItem);
      setTasks(newTasks);
      setDraggedItemIndex(null);
      try {
      // We send just the IDs in the new order
      const orderedIds = newTasks.map(t => t.id);
      await api.post('/api/tasks/reorder', { orderedIds });
  } catch (err) {
      showNotify("Failed to save new orbital path");
  }

    }

    const handleAddCategory = async (name) => {
        try {
            const res = await api.post('/api/categories', { name });
            setCategories(prev => [...prev, res.data.data]);
            return res.data.data.id;
        } catch (err) {
            showNotify(`Error: ${err}`, 5000);
        }
    };

    const handleRemoveCategory = async (id) => {
        try {
            const result = await api.delete(`/api/categories/${id}`);
            setCategories(prev => prev.filter(cat => cat.id !== id));
            setTasks(prev => prev.map(task =>
                task.category_id === id ? { ...task, category_id: null, category_name: null } : task
            ));
            if (selectedCategory === id) setSelectedCategory(null);
            showNotify(result.data.message, 5000);
        } catch (err) {
            showNotify(err.response?.data?.error || "Delete failed");
        }
    };

    const deleteTask = async (id) => {
        try {
            const response = await api.delete(`/api/tasks/${id}`);
            setTasks(prev => prev.filter(task => task.id !== id));
            showNotify(response.data.message, 5000);
        } catch (err) {
            showNotify("Connection to nebula lost", 5000);
        }
    };

    const updateTask = async (id, newContent, categoryId) => {
        try {
            const response = await api.put(`/api/tasks/${id}`, { content: newContent, categoryId: categoryId });
            setTasks(prev => prev.map(task => task.id === id ? response.data.data : task));
            showNotify(response.data.message, 5000);
        } catch (err) {
            showNotify("Update failed", 5000);
        }
    };

    return (
        <div className="rend max-w-6xl mx-auto h-screen flex flex-col pt-10 px-4">
            
            {/* STICKY HEADER AREA */}
            <div className="sticky top-0 z-30 bg-transparent backdrop-blur-md pb-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic">
                        COSMIC <span className="text-memory-gold">TASKS</span>
                    </h1>
                    <button 
                        onClick={logout}
                        className="text-xs font-bold text-dream-orange border border-dream-orange/30 px-3 py-1 rounded-full hover:bg-dream-orange hover:text-white transition-all"
                    >
                        LOGOUT
                    </button>
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
                {!loading && (
                    <div className="group relative flex flex-col justify-center items-center
                    glass-card p-6 min-h-[320px] border-2 border-dashed border-white/10 
                    hover:border-dream-orange/50 transition-all cursor-pointer overflow-hidden">
                        <div className="flex flex-col items-center group-hover:hidden animate-in fade-in duration-500">
                            <div className="text-5xl text-white/20 mb-2 font-thin">+</div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold"> New Task</p>
                        </div>
                        <div className="hidden group-hover:flex flex-col w-full
                        h-full animate-in slide-in-from-bottom-4 duration-300">
                            <form className="flex flex-col h-full"
                            onSubmit={handleAddTask}>
                                <textarea
                                    value={newContent}
                                    onChange={(e)=>
                                        setNewContent(e.target.value)
                                    }
                                    placeholder="Enter New Tasks ....."
                                    className="w-full bg-black/40 p-3 rounded-xl outline-none text-white border border-white/5 focus:border-dream-orange/30 text-sm h-32 resize-none mb-3"
                                />
                                      <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
                                        <p className="text-[9px] uppercase text-grey-500 mb-2 font-bold
                                        tracking-widest">Assign Category</p>
                                        <div className="flex flex-wrap gap-2">
                            {!isCreatingCat ? (
                                <>
                                    {categories.map((cat) => (
                                        <div 
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                            className={`group flex items-center gap-2 px-2 py-1 rounded-full border text-[10px] transition-all cursor-pointer ${
                                                selectedCategory === cat.id 
                                                ? 'bg-dream-orange border-dream-orange text-white' 
                                                : 'bg-white/5 border-white/10 text-cosmic-teal hover:border-white/30'
                                            }`}
                                        >
                                            <span>{cat.name}</span>
                                            {cat.user_id && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveCategory(cat.id); }}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 font-bold"
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingCat(true)}
                                        className="px-3 py-1 rounded-full border border-dashed border-white/20 text-white/40 text-xs hover:text-white"
                                    >
                                        + NEW
                                    </button>
                                </>
                            ) : (
                                <div className="flex gap-2 items-center animate-in slide-in-from-left-2 w-full">
                                    <input 
                                        type="text"
                                        autoFocus
                                        placeholder="Category name..."
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        className="bg-black/60 rounded-lg p-1 px-3 text-xs text-white border border-dream-orange/50 outline-none"
                                    />
                                    <button 
                                        type="button"
                                        onClick={async () => {
                                            const newId = await handleAddCategory(newCatName);
                                            setSelectedCategory(newId);
                                            setIsCreatingCat(false);
                                            setNewCatName("");
                                        }}
                                        className="text-green-400 text-xs font-bold"
                                    >SAVE</button>
                                    <button type="button" onClick={() => setIsCreatingCat(false)} className="text-red-400 text-xs">CANCEL</button>
                                </div>
                            )}
                        </div>
                        </div>
                     <button type="submit" className="w-full bg-dream-orange text-white py-2.5 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-orange-500 transition-colors shadow-lg shadow-dream-orange/10">
                    Deploy Task
                </button>
                            </form>
                        </div>
                    </div>

                )}
                
                
                {loading ? (
                    <p className="text-cosmic-teal animate-pulse text-center mt-10">Scanning nebula for tasks...</p>
                ) : tasks.length > 0 ? (
                    tasks.slice(0,visibleCount).map((task,index) => (
                      <div
                      key={task.id}
                      draggable
                      onDragStart={()=>handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={()=>handleDrop(index)}
                      className="cursor-grab acitve:cursor-grabbing">
                        <TaskItem 
                            // key={task.id} 
                            task={task} 
                            onDelete={deleteTask} 
                            onUpdate={updateTask}
                            categories={categories}
                            onToggle={toggleTask}
                            handleRemoveCategory={handleRemoveCategory}
                            handleAddCategory={handleAddCategory}
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
    );
};

export default TaskDashboard;