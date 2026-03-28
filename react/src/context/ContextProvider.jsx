import { createContext, useContext, useState } from "react";

const StateContext = createContext({
    user: null,
    client: null,
    project: null,
    token: null,
    notification: null,
    payment: null,
    selectedCompany: null,
    setUser: () => {},
    setClient: () => {},
    setToken: () => {},
    setNotification: () => {},
    setProject: () => {},
    setPayment: () => {},
    setSelectedCompany: () => {},
});

export const ContextProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [client, setClient] = useState({});
    const [project, setProject] = useState({});
    const [payment, setPayment] = useState({});
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [notification, _setNotification] = useState("");
    const [token, _setToken] = useState(localStorage.getItem("ACCESS_TOKEN"));

    const setNotification = (message) => {
        _setNotification(message);
        setTimeout(() => {
            _setNotification("");
        }, 5000);
    };

    const setToken = (token) => {
        _setToken(token);

        if (token) {
            localStorage.setItem("ACCESS_TOKEN", token);
        } else {
            localStorage.removeItem("ACCESS_TOKEN");
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
