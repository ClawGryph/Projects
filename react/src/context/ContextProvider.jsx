import { createContext, useContext, useState } from "react";

const StateContext = createContext({
    user: null,
    client: null,
    project: null,
    subscription: null,
    token: null,
    notification: null,
    payment: null,
    selectedCompany: null,
    setUser: () => {},
    setClient: () => {},
    setToken: () => {},
    setNotification: () => {},
    setProject: () => {},
    setSubscription: () => {},
    setPayment: () => {},
    setSelectedCompany: () => {},
});

export const ContextProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [client, setClient] = useState({});
    const [project, setProject] = useState({});
    const [subscription, setSubscription] = useState({});
    const [payment, setPayment] = useState({});
    const [notification, _setNotification] = useState("");
    const [token, _setToken] = useState(localStorage.getItem("ACCESS_TOKEN"));

    // Initialize from localStorage so it survives page refresh
    const [selectedCompany, _setSelectedCompany] = useState(() => {
        const saved = localStorage.getItem("SELECTED_COMPANY");
        return saved ? JSON.parse(saved) : null;
    });

    // Displays notification message
    const setNotification = (message) => {
        _setNotification(message);
        setTimeout(() => {
            _setNotification("");
        }, 5000);
    };

    // Sychronize authentication state between react and local storage
    const setToken = (token) => {
        _setToken(token);
        if (token) {
            localStorage.setItem("ACCESS_TOKEN", token);
        } else {
            localStorage.removeItem("ACCESS_TOKEN");
        }
    };

    // Synchronizes the selected company between React state and localStorage for persistence across sessions
    const setSelectedCompany = (company) => {
        _setSelectedCompany(company);
        if (company) {
            localStorage.setItem("SELECTED_COMPANY", JSON.stringify(company));
        } else {
            localStorage.removeItem("SELECTED_COMPANY");
        }
    };

    return (
        <StateContext.Provider
            value={{
                user,
                client,
                token,
                setUser,
                setClient,
                setToken,
                notification,
                setNotification,
                project,
                setProject,
                subscription,
                setSubscription,
                payment,
                setPayment,
                selectedCompany,
                setSelectedCompany,
            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);
