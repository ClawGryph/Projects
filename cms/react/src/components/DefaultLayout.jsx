import { useEffect, useState } from "react";
import { Navigate, Outlet, NavLink } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logo from "../assets/logo1.png";
import {
    faGauge,
    faUser,
    faDiagramProject,
    faMoneyBill,
    faUserTie,
    faBars,
    faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

export default function DefaultLayout() {
    const { user, token, notification, setUser, setToken } = useStateContext();
    const [openSidebar, setOpenSidebar] = useState(false);

    useEffect(() => {
        if (token) {
            axiosClient.get("/user").then(({ data }) => {
                setUser(data);
            });
        }
    }, [token]);

    if (!token) {
        return <Navigate to="/login" />;
    }

    const onLogout = (e) => {
        e.preventDefault();

        axiosClient.post("/logout").then(() => {
            setUser({});
            setToken(null);
        });
    };

    return (
        <div className="bg-gray-100 font-family-karla flex">
            <aside
                className={`
                    fixed sm:relative z-40 bg-cyan-800 h-screen w-64 shadow-xl
                    transform transition-transform duration-300
                    ${openSidebar ? "translate-x-0" : "-translate-x-full"}
                    sm:translate-x-0
                `}
            >
                <div className="m-5 flex flex-col items-center justify-center">
                    <img src={logo} alt="cms logo" className="w-full h-17" />
                </div>
                <nav className="text-white text-base font-semibold pt-3">
                    <NavLink
                        to="/dashboard"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${
                                isActive
                                    ? "bg-cyan-900 text-white"
                                    : "text-white opacity-75 hover:opacity-100"
                            }`
                        }
                    >
                        <FontAwesomeIcon icon={faGauge} />
                        Dashboard
                    </NavLink>
                    {user?.role_name === "super_admin" && (
                        <NavLink
                            to="/users"
                            onClick={() => setOpenSidebar(false)}
                            className={({ isActive }) =>
                                `flex items-center py-4 pl-6 nav-item transition-all ${
                                    isActive
                                        ? "bg-cyan-900 text-white"
                                        : "text-white opacity-75 hover:opacity-100"
                                }`
                            }
                        >
                            <FontAwesomeIcon icon={faUserTie} />
                            Employees
                        </NavLink>
                    )}
                    <NavLink
                        to="/clients"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${
                                isActive
                                    ? "bg-cyan-900 text-white"
                                    : "text-white opacity-75 hover:opacity-100"
                            }`
                        }
                    >
                        <FontAwesomeIcon icon={faUser} />
                        Clients
                    </NavLink>
                    <NavLink
                        to="/projects"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${
                                isActive
                                    ? "bg-cyan-900 text-white"
                                    : "text-white opacity-75 hover:opacity-100"
                            }`
                        }
                    >
                        <FontAwesomeIcon icon={faDiagramProject} />
                        Projects
                    </NavLink>
                    <NavLink
                        to="/payments"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${
                                isActive
                                    ? "bg-cyan-900 text-white"
                                    : "text-white opacity-75 hover:opacity-100"
                            }`
                        }
                    >
                        <FontAwesomeIcon icon={faMoneyBill} />
                        Payments
                    </NavLink>
                </nav>
            </aside>
            {openSidebar && (
                <div
                    className="fixed inset-0 z-30 sm:hidden"
                    onClick={() => setOpenSidebar(false)}
                />
            )}
            <main className="relative w-full h-full flex flex-col h-screen overflow-y-auto">
                <header className="w-full bg-white py-2 px-4 flex items-center justify-between">
                    <button
                        onClick={() => setOpenSidebar(!openSidebar)}
                        className="sm:hidden mr-4 text-cyan-800"
                    >
                        <FontAwesomeIcon icon={faBars} size="lg" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <FontAwesomeIcon
                                icon={faUserTie}
                                className="text-cyan-800"
                            />
                        </div>
                        <div>
                            <p className="hidden sm:block text-xs text-gray-500">
                                {user?.role_label || ""}
                            </p>
                            <p className="hidden sm:block text-lg font-bold text-gray-800">
                                {user?.name || ""}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={onLogout}
                            className="bg-cyan-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-lg hover:shadow-xl hover:bg-cyan-900 flex items-center justify-center cursor-pointer"
                        >
                            <FontAwesomeIcon
                                icon={faRightFromBracket}
                                className="sm:hidden"
                            />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>
                <Outlet />
            </main>
            {notification && (
                <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow text-white bg-green-600 animate-slide-in">
                    {notification}
                </div>
            )}
        </div>
    );
}
