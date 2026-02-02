import { useState,useEffect } from "react"

const Notification=({message,timeout,onClose})=>{
const [isVisible,setIsVisible]= useState(true);

const [isAnimating,setIsAnimating] = useState(false);

useEffect(()=>{
    if(message){
        setIsAnimating(true);
        if(timeout && timeout>0){
        const timer= setTimeout(() => {
            setIsAnimating(false);
            setTimeout(onClose,300)
        }, timeout);
        
        return () => clearTimeout(timer);
        }
    }
},[message,timeout,onClose])

return(
    <>
    <div className={`text-white fixed top-10 right-6 z-[100] 
    w-64 md:w-72 transition-all duration-300 ease-in-out 
    ${isAnimating?"opacity-100 translate-x-0 ":" opacity-0 translate-x-10"}`}>
        <div className="relative  p-5 rounded-2xl bg-dream-orange/60 
        backdrop-blur-2xl border border-white/10 shadow-2xl 
        shadow-dream-orange/30 overflow-hidden">
        <button onClick={()=>{
            setIsAnimating(false)
            setTimeout(onClose,300)
        }} 
        className="absolute top-2 right-3 text-white/30 hover:text-white transition-colors text-xl">
            &times;
        </button>
        <p className="text-gray-200 leading-relaxed italic">
            {message}
        </p>

        {timeout > 0 && (
            <div 
                className="absolute bottom-0 left-0 h-1 bg-white/30 w-full origin-left"
                style={{
                animation: `shrink ${timeout}ms linear forwards` // Note the space after 'shrink'
                }}
            />
            )}

        </div>
    </div>
    </>
);

}
export default Notification;