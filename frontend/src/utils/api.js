import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8747/api",
    withCredentials: true, // Important for cookies
});

export default api;
