import { useEffect } from "react";
import { useState } from "react";
import api from "../api/axios";
const TaskItem = ({
  task,
  onDelete,
  onUpdate,
  categories,
  onToggle,
  handleRemoveCategory,
  handleAddCategory,
  onView,
  isGlobal
}) => {
  // console.log(task);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.content);
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
  const handleSave = () => {
    onUpdate(task.id, editText, selectedCategory);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setEditText(task.content); // Reset text to original if they cancel
    setIsEditing(false);
  };

  return (
    <div
      className={`glass-card p-6 flex flex-col min-h-[320px]
            transition-all duration-500 relative
        ${task.is_completed ? " opacity-40 grayscale-[0.8] scale[0.95]" : " hover:scale-[1.03] hover:bg-white/15 shadow-lg"} 
        `}
    >
      {/* status checkbox and category and its edit */}
      <div className="flex justify-between items-start mb-4">
        {isEditing ? (
          <span className="text-[10px] uppercase tracking-widest font-bold text-dream-orange">
            Editing Task...
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-widest font-bold text-cosmic-teal bg-white/5 px-2 py-1 rounded">
            {task.category_name || "uncategorized"}
          </span>
        )}
        {isGlobal?<span className="text-[20px] uppercase tracking-widest font-bold text-white/60 bg-white/10 rounded-xl p-1"
        >{task.username}</span>
:''}
        
        {/* global case 1 */}
        {isGlobal?'':
        <button
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-full border-2 
                transition-all flex items-center justify-center shrink-0
                ${task.is_completed ? "bg-dream-orange border-dream-orange" : "border-white/20 hover:border-dream-orange/50"}`}
        >
          {task.is_completed && (
            <span className="text-white text-[10px] font-black">✓</span>
          )}
        </button>
        }
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {isEditing ? (
          <>
            <textarea
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
              }}
              className={`bg-black/40 text-memory-gold p-2 rounded outline-none border border-dream-orange/30 w-full h-24 resize-none`}
              autoFocus
            />
            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
              {isAddingCat ? (
                <div className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-300">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                    }}
                    placeholder="New Category Name"
                    className="bg-dream-orange/10 border border-dream-orange/50 p-1
                        px-3 rounded-lg text-xs text-white outline-none flex-1"
                  />
                  <button
                    className="text-green-400 text-[10px] font-bold"
                    onClick={async () => {
                      const newcat = await handleAddCategory(newCatName);
                      setSelectedCategory(newcat);
                      setIsAddingCat(false);
                    }}
                  >
                    add
                  </button>
                  <button
                    className="text-grey-400 text-[10px] font-bold"
                    onClick={() => setIsAddingCat(false)}
                  >
                    back
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`group flex items-center gap-2 px-3 py-1 rounded-full border tansition-all cursor-pointer 
            ${selectedCategory === cat.id ? "bg-dream-orange border-dream-orange text-white" : "bg-black/20 border-white/10 text-cosmic-teal hover:border-white/30"}`}
                      onClick={() =>
                        setSelectedCategory((prev) =>
                          prev === cat.id ? null : cat.id,
                        )
                      }
                    >
                      <span>{cat.name}</span>
                      {cat.user_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCategory(cat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity font-bold"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setIsAddingCat(true)}
                    className="px-2 py-1 rounded-md border border-dashed border-white/20 text-white/40 text-[10px] hover:text-white"
                  >
                    + NEW
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h3
              onClick={onView}
              className={`text-memory-gold font-bold text-lg leading-tight ${task.is_completed ? "line-through" : ""}`}
            >
              {task.content}

              {/* Subtask Quick-Look */}
{!isEditing && task.subtasks?.length > 0 && (
    <div className="mt-3 group/progress">
        <div className="flex justify-between items-end mb-1">
            <span className="text-[8px] font-black text-white/30 tracking-[0.2em] uppercase">
                System Objectives
            </span>
            <span className="text-[10px] font-bold text-dream-orange">
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
            </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
                className="h-full bg-gradient-to-r from-dream-orange to-memory-gold transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,115,0,0.4)]"
                style={{ 
                    width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` 
                }}
            />
        </div>

        {/* Individual Pips (dots) */}
        <div className="flex gap-1 mt-2">
            {task.subtasks.map((st) => (
                <div 
                    key={st.id} 
                    className={`w-1 h-1 rounded-full transition-all duration-500 
                        ${st.completed ? 'bg-dream-orange' : 'bg-white/10'}`}
                />
            ))}
        </div>

        <div>
          <ul>
            {task.subtasks.map((sub,index)=>(


              <li key={sub.id} className={`text-[15px] ${sub.is_completed===true ?' text-white/20 ':' text-white/80'}`}><span>{index+1}</span>. {sub.text}</li>
            ))}
          </ul>
        </div>
    </div>
)}
            </h3>
          </>
        )}
      </div>

      {/* BOTTOM: Meta info & Buttons */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-[10px] text-white/20 italic">
          {getTimeAgo(task.created_at)}
        </span>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="text-green-400 font-black uppercase text-[10px] tracking-widest"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-red-400 font-black uppercase text-[10px] tracking-widest"
              >
                Back
              </button>
            </>
          ) : (
          //  global case 2
            (isGlobal?'':
               <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-white/40 hover:text-dream-orange transition-colors text-[10px] font-bold uppercase"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="text-white/40 hover:text-red-500 transition-colors text-[10px] font-bold uppercase"
              >
                Delete
              </button>
              </>
            
            )
            
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
