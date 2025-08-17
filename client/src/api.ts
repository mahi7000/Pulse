import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Add other headers if needed
  },
  withCredentials: true // if using cookies
});

// Add request interceptor if needed
API.interceptors.request.use(config => {
  // You can modify requests here (e.g., add auth token)
  return config;
});

export default API;