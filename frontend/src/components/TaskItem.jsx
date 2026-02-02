import { useEffect } from "react";
import { useState } from "react";
import api from "../api/axios";
const TaskItem = ({ task ,onDelete, onUpdate,categories,onToggle,handleRemoveCategory,handleAddCategory}) => {
    // console.log(task);
    const [isEditing,setIsEditing] = useState(false);
    const [editText,setEditText] = useState(task.content);
    const [selectedCategory, setSelectedCategory] = useState(task.category_id);
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    
  const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };
    const handleSave = ()=>{
        onUpdate(task.id,editText,selectedCategory);
        setIsEditing(false);
    }
    const handleCancel = () => {
        setEditText(task.content); // Reset text to original if they cancel
        setIsEditing(false);
    };

    return(
        <div 
        className={`glass-card p-4 mb-4 flex justify-between 
        items-center transition-all duration-500
        ${task.is_completed?' opacity-50 grayscale-[0.5] scale[0.98]':' hover:scale-[1.02] hover:bg-white/15'} 
        `}>
            <div className="flex items-center gap-4 flex-1">
                <button
                onClick={()=> onToggle(task.id)}
                className={`w-6 h-6 rounded-full border-2
                transition-all flex items-center justify-center shrink-0
                ${task.is_completed ?'bg-dream-orange border-dream-orange':'border-white/20  hover:border-dream-orange/50'}`}>
                    
                    {task.is_completed && <span 
                    className="text-white text-[10px] font-black">✓</span>}
                </button>
            
            <div className="flex-1 min-w-0"> 
                {isEditing ?(
                <input
                type="text"
                value= {editText}
                onChange={(e)=>{
                  setEditText(e.target.value)
                  
                }}
                className="bg-black/20 text-memory-gold p-1 rounded outline-none border border-dream-orange/30 w-full"  
                autoFocus
                />
                ) : (<>
                    <h3 className="text-memory-gold font-bold text-lg">
                {task.content}</h3>
                
                </>)}
            
            <span className="text-cosmic-teal text-xs uppercase tracking-widest font-semibold">
            {isEditing?(
                <>
                {isAddingCat?(
                    <div className="flex gap-2 animate-in slide-in-from-left-2 duration-400">
                        <input
                        type="text"
                        value={newCatName}
                        onChange={(e)=>{
                            setNewCatName(e.target.value);
                        }}
                        placeholder="New Category Name"
                        className="bg-dream-orange/10 border border-dream-orange/50 p-1
                        px-3 rounded-full text-md text-white outline-none"
                        />
                        <button onClick={ async ()=>{
                            const newcat= await handleAddCategory(newCatName);
                            setSelectedCategory(newcat);
                            setIsAddingCat(false);
                            }}>add</button>
                        <button onClick={()=>setIsAddingCat(false)}>back</button>
                    </div>):(
                        <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map((cat)=>(
                        <div key={cat.id}
                        className={`group flex items-center gap-2 px-3 py-1 rounded-full border tansition-all cursor-pointer 
            ${selectedCategory===cat.id ?'bg-dream-orange border-dream-orange text-white':'bg-black/20 border-white/10 text-cosmic-teal hover:border-white/30'}`}
            onClick={()=>setSelectedCategory(prev=> prev === cat.id? null: cat.id)}
            >
              <span>{cat.name}</span>
              {cat.user_id &&(
                <button
                onClick={(e)=>{
                  e.stopPropagation();
                  handleRemoveCategory(cat.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity font-bold">
                  &times;
                </button>
                
              )}
            </div>
            
                    ))}
                    <button
          onClick={()=> setIsAddingCat(true)}
          className="px-3 py-1 rounded-full border border-dashed border-white/20 text-white/40 hover:text-white hovver:border-white/60">
            + NEW
          </button>
                
                </div>
                 )}
                 </> 
               
                ):(
                   <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] uppercase tracking-tighter font-bold text-cosmic-teal">
                            {task.category_name || 'Uncategorized'}
                        </span>
                        <span className="text-[10px] text-white/20 italic">
                            • {getTimeAgo(task.created_at)}
                        </span>
                    </div>
                    
                    )}
            </span>
            </div>

            <div className="flex gap-3">
                {isEditing ?(
                    <>
                    <button onClick={()=>handleSave()} className="text-green-400 font-bold uppercase text-xs"> save</button>
                    <button className="text-red-400 hover:text-red-200 transition-colors text-sm font-bold uppercase"
                    onClick={()=>{
                        setIsEditing(false)
                        handleCancel()
                    }}>back</button>
                    </>
                ):(
                    <>
                <button className="text-dream-orange hover:text-white transition-colors text-sm font-bold uppercase"
                onClick={()=>setIsEditing(true)}>edit</button>
                <button 
                    onClick={() => onDelete(task.id)}
                    className="text-dream-orange hover:text-red-500 font-bold uppercase text-xs"
                >
                    Delete
                </button>
                </>
                )}
            </div>
            </div>
        </div>
    );
}

export default TaskItem;