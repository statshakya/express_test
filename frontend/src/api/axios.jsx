import axios from 'axios';


const api = axios.create({
    baseURL: 'https://cosmic-tasks-backend.onrender.com', // NO trailing slash
    withCredentials: true,
})


export default api;