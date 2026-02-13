import { createContext, useContext, useState } from "react";

const StateContext = createContext({
    client: null,
    project: null,
    token: null,
    notification: null,
    setClient: () => {},
    setToken: () => {},
    setNotification: () => {},
    setProject: () => {},
});

export const ContextProvider = ({ children }) => {
    const [client, setClient] = useState({});
    const [project, setProject] = useState({});
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
                client,
                token,
                setClient,
                setToken,
                notification,
                setNotification,
                project,
                setProject,
            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);
