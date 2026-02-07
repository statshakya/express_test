import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import TaskDashboard from './components/TaskDashboard'; // Move your current App logic here
import Login from './components/Login';
import GlobalExplore from './components/GlobalExplore';
const App=()=> {
  const { user, loading } = useAuth();
 
   if (loading) return <div className="text-white p-10">Initialising systems...</div>;
  // return user ? <TaskDashboard /> : <Login />;
  return(
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <navigate to="/dashboard"/>} />
        <Route path="/explore" element={<GlobalExplore />}/>
        <Route path="/dashboard" element={user ?<TaskDashboard />:<Navigate to="/login"/>}/>
        <Route path="/admin" element={user?.role === "admin" ? <TaskDashboard/> :<Navigate to="/dashboard"/>}/>
        <Route path="*" element={<Navigate to="/explore"/>} />
      </Routes>
    </Router>
  )
}

export default App
