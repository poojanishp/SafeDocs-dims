import axios from "axios";

const api = axios.create({
<<<<<<< HEAD
    baseURL: "http://localhost:3001/api",
=======
    baseURL: "http://localhost:8747/api",
>>>>>>> 60b5bf141b6f4391bc131bdc8477845e9af8d43d
    withCredentials: true, // Important for cookies
});

export default api;
