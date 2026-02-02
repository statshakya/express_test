import { useAuth } from './context/AuthContext';
import TaskDashboard from './components/TaskDashboard'; // Move your current App logic here
import Login from './components/Login';

const App=()=> {
  const { user, loading } = useAuth();
 
   if (loading) return <div className="text-white p-10">Initialising systems...</div>;
  return user ? <TaskDashboard /> : <Login />;
}

export default App
