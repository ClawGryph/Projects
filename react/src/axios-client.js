import axios from "axios";

const axiosClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const selectedCompany = localStorage.getItem("SELECTED_COMPANY");
    if (selectedCompany) {
        const company = JSON.parse(selectedCompany);
        config.headers["X-Company-Id"] = company.id;
    }

    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response?.data || error.message);

        const { response } = error;
        if (response && response.status === 401) {
            localStorage.removeItem("ACCESS_TOKEN");
        }

        return Promise.reject(error);
    },
);

export default axiosClient;
