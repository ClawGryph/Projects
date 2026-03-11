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
    const [transactions, setTransactions] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [dismissedNotifications, setDismissedNotifications] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("dismissed_2307_notifications") || "{}",
            );
        } catch {
            return {};
        }
    });

    useEffect(() => {
        if (token) {
            axiosClient.get("/user").then(({ data }) => {
                setUser(data);
            });
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            axiosClient
                .get("/transactions")
                .then(({ data }) => {
                    setTransactions(data.data);
                })
                .catch(() => {});
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

    const todayKey = new Date().toISOString().split("T")[0];

    const pending2307Notifications = transactions.filter((t) => {
        if (!t.paid_at) return false;
        if ((t.official_receipt?.form_2307_status ?? "pending") !== "pending")
            return false;
        return !dismissedNotifications[`${t.id}_${todayKey}`];
    });

    const dismiss2307Notification = (id) => {
        const key = `${id}_${todayKey}`;
        const updated = { ...dismissedNotifications, [key]: true };
        setDismissedNotifications(updated);
        localStorage.setItem(
            "dismissed_2307_notifications",
            JSON.stringify(updated),
        );
    };

    return (
        <div className="bg-gray-100 font-family-karla flex">
            <aside
                className={`
                    fixed sm:relative z-40 bg-cyan-800 h-screen w-64 shadow-xl
                    transform transition-transform duration-300
                    flex flex-col
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
                {user?.role_name === "super_admin" && (
                    <div className="border-t border-cyan-700 p-4 bg-cyan-900 mt-auto">
                        <NavLink
                            to="/users"
                            onClick={() => setOpenSidebar(false)}
                            className={({ isActive }) =>
                                `text-sm flex items-center py-2 px-2 rounded-lg transition-all ${
                                    isActive
                                        ? "bg-white text-cyan-900"
                                        : "text-white hover:bg-cyan-700"
                                }`
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
                        {/* 🔔 2307 Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowNotifications((prev) => !prev)
                                }
                                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                            >
                                <svg
                                    className="w-5 h-5 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                {pending2307Notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {pending2307Notifications.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-800 text-sm">
                                            Pending 2307 Forms
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setShowNotifications(false)
                                            }
                                            className="text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="max-h-72 overflow-y-auto">
                                        {pending2307Notifications.length ===
                                        0 ? (
                                            <p className="text-center text-gray-500 text-sm py-6">
                                                All 2307 forms are up to date ✓
                                            </p>
                                        ) : (
                                            pending2307Notifications.map(
                                                (t) => (
                                                    <div
                                                        key={t.id}
                                                        className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-50 hover:bg-yellow-50 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <svg
                                                                    className="w-4 h-4 text-yellow-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-800">
                                                                    {t.client
                                                                        ?.name ||
                                                                        "Client"}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {t.project
                                                                        ?.title ||
                                                                        "Project"}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    Paid:{" "}
                                                                    {new Date(
                                                                        t.paid_at,
                                                                    ).toLocaleDateString(
                                                                        "en-CA",
                                                                    )}{" "}
                                                                    · O.R.{" "}
                                                                    {t
                                                                        .official_receipt
                                                                        ?.or_number ||
                                                                        "N/A"}
                                                                </p>
                                                                <span className="inline-block mt-1 text-[10px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                                                    2307 Pending
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                dismiss2307Notification(
                                                                    t.id,
                                                                )
                                                            }
                                                            title="Dismiss for today"
                                                            className="text-gray-300 hover:text-gray-500 text-xs flex-shrink-0 cursor-pointer mt-1"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ),
                                            )
                                        )}
                                    </div>

                                    {pending2307Notifications.length > 0 && (
                                        <div className="px-4 py-2 bg-gray-50 text-center">
                                            <button
                                                onClick={() => {
                                                    pending2307Notifications.forEach(
                                                        (t) =>
                                                            dismiss2307Notification(
                                                                t.id,
                                                            ),
                                                    );
                                                    setShowNotifications(false);
                                                }}
                                                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                                            >
                                                Dismiss all for today
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Logout */}
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
