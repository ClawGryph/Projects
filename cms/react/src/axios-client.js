import axios from "axios";

const axiosClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

// No request interceptor needed since no auth
// No response interceptor needed unless you want general error handling
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // handle global errors here
        console.error("API Error:", error.response?.data || error.message);
        throw error;
    },
);

export default axiosClient;
