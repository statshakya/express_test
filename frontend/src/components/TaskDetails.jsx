import { useState } from "react";
import api from "../api/axios";
import { useNotify } from "../context/NotificationContext";

const TaskDetails = ({ task, isOpen, onClose, onUpdateSubtasks ,isGlobal}) => {
    if (!isOpen || !task) return null;
    const showNotify = useNotify();
    const [newSubTask, setNewSubTask] = useState("");
    const[updateSubdata,setUpdateSubdata]=useState();
    const [updateSubtask, setUpdateSubtask]= useState(false);
    const subtasks = task.subtasks || [];

    const addSubtask= async (e)=>{
        e.preventDefault();
        try{
            if(!newSubTask.trim()) return;
            const newItem ={
                id:crypto.randomUUID(),
                date:Date.now(),
                text:newSubTask,
                completed:false
            }
            const updatedList = [...subtasks,newItem]
            onUpdateSubtasks(task.id,task.content,task.category_id,updatedList);
            setNewSubTask("");
        }catch(err){
            console.error(err);
            showNotify(err.response?.data?.error);
        }

    }

    const deleteSubtask = (id)=>{
        try{
        const updatedList = subtasks.filter(st =>st.id !==id);
        onUpdateSubtasks(task.id,task.content,task.category_id,updatedList);
        showNotify(`Subtask ${id} deleted`);
        }catch(err){
            showNotify(err.response?.data?.error);
        }
    }
    const changeSubTask= (id)=>{
        try{
            const updatedList = subtasks.map(st=>st.id===id
                ?{...st,text:updateSubdata.text} :st
            )
            onUpdateSubtasks(task.id,task.content,task.category_id,updatedList);
            showNotify(`subTask ${id} updated`);
        }
        catch(err){
            showNotify(err.response?.data?.error);
        }
    }

    const toggleSubTask =(id) =>{
        try{
            const updatedList= subtasks.map(st => st.id ===id
                ?{...st,completed:!st.completed}: st
            );
            onUpdateSubtasks(task.id,task.content,task.category_id,updatedList);

        }catch(err){
            showNotify(err.response?.data?.error);
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            {/* Modal */}
            <div className="relative glass-card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-start bg-white/5">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-dream-orange font-black mb-1">Detailed Mission Log</p>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{task.content}</h2>
                    </div>
                    <button onClick={onClose} className="text-white/20 hover:text-white transition-colors text-3xl">&times;</button>
                </div>

                {/* Body - Subtasks Section */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
                    <h3 className="text-cosmic-teal text-[10px] font-black uppercase tracking-widest mb-6">Sub-Task Objectives</h3>
                    
                    <div className="space-y-3">
                        {subtasks.length > 0 ? subtasks.map((st, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                                {isGlobal? idx+1 :<input 
                                    type="checkbox" 
                                    checked={st.completed}
                                    onChange={() => {toggleSubTask(st.id)}}
                                    className="w-4 h-4 accent-dream-orange rounded border-white/20 bg-transparent"
                                />}
                                
                                <span className={`text-sm flex-1 ${st.completed ? 'line-through text-white/20' : 'text-white/80'}`}>
                                    
                                    {(updateSubtask && updateSubdata?.id ===st.id) ? 
                                    <input
                                    className="bg-black/40 p-2 rounded"
                                    placeholder="Edit subtask ..."
                                    value={updateSubdata.text}
                                    onChange={(e)=>setUpdateSubdata({...updateSubdata,text:e.target.value})}
                                    />: 
                                    st.text}
                                
                                </span>
                                
                                {(updateSubtask && updateSubdata?.id ===st.id)?
                                <>
                                <button
                                onClick={()=>{
                                    changeSubTask(st.id);
                                    setUpdateSubtask(false);
                                }}
                                className="bg-black/60 hover:bg-dream-orange/20 rounded p-1"
                                >Save</button>
                                <button
                                type="button"
                                onClick={()=>setUpdateSubtask(false)}
                                className="bg-black/60 hover:bg-dream-orange/20 rounded p-1">back</button> 
                                </>
                                :
                                (isGlobal?'':<>
                                <button
                                onClick={()=>{
                                    setUpdateSubdata({id:st.id,text:st.text})
                                    setUpdateSubtask(true)}}
                                className="bg-black/60 hover:bg-dream-orange/20 rounded p-1"
                                >Edit</button>
                                <button type="button"
                                onClick={()=>deleteSubtask(st.id)}
                                className="text-black/70 text-[20px] hover:text-white/20"
                                >&times;</button>
                                </>)
                                }
                            </div>
                        )) : (
                            <p className="text-white/20 italic text-sm text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
                                No sub-objectives defined for this mission.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer / Input */}
                <div className="p-6 border-t border-white/5 bg-white/5">
                    
                    {isGlobal?
                    <div>User: {task.username}</div>
                    
                    
                    :<div>
                       <form onSubmit={addSubtask} className="flex gap-2">
                        <input 
                            type="text"
                            value={newSubTask}
                            onChange={(e)=>setNewSubTask(e.target.value)}
                            placeholder="Add sub-objective..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-dream-orange/50 transition-all"
                        />
                        <button 
                        type="submit"
                        className="bg-dream-orange/20 text-dream-orange border border-dream-orange/30 px-6 py-2 rounded-xl text-xs font-black hover:bg-dream-orange hover:text-white transition-all">
                            ADD
                        </button>
                        </form>
                    </div>}
                    
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;