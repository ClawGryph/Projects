import { useEffect, useState } from "react";
import { Navigate, Outlet, NavLink, useMatches } from "react-router-dom";
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
    faFileArrowUp,
    faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

export default function DefaultLayout() {
    const {
        user,
        token,
        selectedCompany,
        setSelectedCompany,
        notification,
        setUser,
        setToken,
    } = useStateContext();
    const [openSidebar, setOpenSidebar] = useState(false);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const matches = useMatches();

    useEffect(() => {
        // If access token exist get the users data
        if (token) {
            axiosClient.get("/user").then(({ data }) => {
                setUser(data);
            });
        }
    }, [token]);

    // Handles tab title name for browser
    useEffect(() => {
        const current = matches[matches.length - 1];
        const title = current?.handle?.title;
        document.title = title
            ? `${title} | Client Management System`
            : "Client Management System";
    }, [matches]);

    // If no token always go back to login page
    if (!token) return <Navigate to="/login" />;
    // If no company always navigate to company page
    if (!selectedCompany) return <Navigate to="/company" />;

    const onLogout = (e) => {
        e.preventDefault();
        setLoadingLogout(true);
        axiosClient
            .post("/logout")
            .then(() => {
                setUser({});
                setToken(null);
                setSelectedCompany(null); // ← reset company on logout
            })
            .catch(() => {})
            .finally(() => setLoadingLogout(false));
    };

    return (
        <div className="bg-gray-100 font-family-karla flex">
            <aside
                className={`
                fixed sm:relative z-40 bg-cyan-800 h-screen w-64 shadow-xl
                transform transition-transform duration-300 flex flex-col
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
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faGauge} /> Dashboard
                    </NavLink>
                    <NavLink
                        to="/clients"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faUser} /> Clients
                    </NavLink>
                    <NavLink
                        to="/projects"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faDiagramProject} /> Projects
                    </NavLink>
                    <NavLink
                        to="/payments"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faMoneyBill} /> Payments
                    </NavLink>
                    <NavLink
                        to="/upload"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faFileArrowUp} /> Upload Files
                    </NavLink>
                    <NavLink
                        to="/report"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faClipboardList} /> Report Module
                    </NavLink>
                </nav>
                {user?.role_name === "super_admin" && (
                    <div className="border-t border-cyan-700 p-4 bg-cyan-900 mt-auto">
                        <NavLink
                            to="/users"
                            onClick={() => setOpenSidebar(false)}
                            className={({ isActive }) =>
                                `text-sm flex items-center py-2 px-2 rounded-lg transition-all ${isActive ? "bg-white text-cyan-900" : "text-white hover:bg-cyan-700"}`
                            }
                        >
                            <FontAwesomeIcon
                                icon={faUserTie}
                                className="mr-2"
                            />
                            Account Management
                        </NavLink>
                    </div>
                )}
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onLogout}
                            disabled={loadingLogout}
                            className={`bg-cyan-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition ${loadingLogout ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:bg-cyan-900"}`}
                        >
                            {loadingLogout && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            <FontAwesomeIcon
                                icon={faRightFromBracket}
                                className={`${loadingLogout ? "hidden sm:hidden" : "sm:hidden"}`}
                            />
                            <span className="hidden sm:inline">
                                {loadingLogout ? "Logging out..." : "Logout"}
                            </span>
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
