import { useEffect, useState } from "react";
import {
    Navigate,
    Outlet,
    NavLink,
    useMatches,
    useLocation,
} from "react-router-dom";
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
    faChevronDown,
    faToolbox,
    faShield,
    faRepeat,
    faLink,
    faBuilding,
    faLayerGroup,
    faBuildingColumns,
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
    const [servicesOpen, setServicesOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false); // ← separate state
    const [adminOpen, setAdminOpen] = useState(false);
    const matches = useMatches();
    const location = useLocation();

    // Auto-open dropdowns based on active route
    useEffect(() => {
        if (
            location.pathname.startsWith("/projects") ||
            location.pathname.startsWith("/subscriptions")
        ) {
            setServicesOpen(true);
        }
        if (
            location.pathname.startsWith("/sales-report") ||
            location.pathname.startsWith("/receivables-report") ||
            location.pathname.startsWith("/overdue-report")
        ) {
            setReportsOpen(true);
        }
        if (
            location.pathname.startsWith("/users") ||
            location.pathname.startsWith("/company-management")
        ) {
            setAdminOpen(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (token) {
            axiosClient.get("/user").then(({ data }) => {
                setUser(data);
            });
        }
    }, [token]);

    useEffect(() => {
        const current = matches[matches.length - 1];
        const title = current?.handle?.title;
        document.title = title
            ? `${title} | Invoicing System`
            : "Invoicing System";
    }, [matches]);

    if (!token) return <Navigate to="/login" />;
    if (!selectedCompany) return <Navigate to="/company" />;

    const onLogout = (e) => {
        e.preventDefault();
        setLoadingLogout(true);
        axiosClient
            .post("/logout")
            .then(() => {
                setUser({});
                setToken(null);
                setSelectedCompany(null);
            })
            .catch(() => {})
            .finally(() => setLoadingLogout(false));
    };

    const isServicesActive =
        location.pathname.startsWith("/projects") ||
        location.pathname.startsWith("/subscriptions") ||
        location.pathname.startsWith("/assign");

    const isReportsActive =
        location.pathname.startsWith("/sales-report") ||
        location.pathname.startsWith("/receivables-report") ||
        location.pathname.startsWith("/overdue-report");

    return (
        <div className="bg-gray-100 font-family-karla flex">
            <aside
                className={`
                fixed sm:relative z-40 bg-cyan-800 h-screen w-64 shadow-xl
                transform transition-transform duration-300 flex flex-col
                overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                ${openSidebar ? "translate-x-0" : "-translate-x-full"}
                sm:translate-x-0
            `}
            >
                <div className="p-5 flex flex-col items-center justify-center border-b border-cyan-600">
                    <img
                        src={logo}
                        alt="invoicing logo"
                        className="w-40 h-12 [filter:brightness(0)_saturate(100%)_invert(85%)_sepia(30%)_saturate(400%)_hue-rotate(150deg)]"
                    />
                </div>
                <nav className="text-white text-base font-semibold">
                    <NavLink
                        to="/dashboard"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faGauge} className="mr-3" />{" "}
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/clients"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faUser} className="mr-3" />{" "}
                        Clients
                    </NavLink>

                    {/* ── Services Dropdown ── */}
                    <div>
                        <button
                            onClick={() => setServicesOpen((prev) => !prev)}
                            className={`w-full flex items-center justify-between py-4 pl-6 pr-4 nav-item transition-all ${
                                isServicesActive
                                    ? "bg-cyan-900 text-white"
                                    : "text-white opacity-75 hover:opacity-100"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <FontAwesomeIcon icon={faToolbox} />
                                Services
                            </span>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`text-xs transition-transform duration-300 ${servicesOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${servicesOpen ? "max-h-40" : "max-h-0"}`}
                        >
                            <div className="bg-cyan-950 bg-opacity-40">
                                <NavLink
                                    to="/projects"
                                    onClick={() => setOpenSidebar(false)}
                                    className={({ isActive }) =>
                                        `flex items-center py-3 pl-5 pr-4 text-sm transition-all border-l-2 ml-6 ${
                                            isActive
                                                ? "border-white text-white"
                                                : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                        }`
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faDiagramProject}
                                        className="mr-3 text-xs"
                                    />
                                    Projects
                                </NavLink>
                                <NavLink
                                    to="/subscriptions"
                                    onClick={() => setOpenSidebar(false)}
                                    className={({ isActive }) =>
                                        `flex items-center py-3 pl-5 pr-4 text-sm transition-all border-l-2 ml-6 ${
                                            isActive
                                                ? "border-white text-white"
                                                : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                        }`
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faRepeat}
                                        className="mr-3 text-xs"
                                    />
                                    Subscription
                                </NavLink>
                            </div>
                        </div>
                    </div>

                    <NavLink
                        to="/payments"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon icon={faMoneyBill} className="mr-3" />{" "}
                        Payments
                    </NavLink>
                    <NavLink
                        to="/upload"
                        onClick={() => setOpenSidebar(false)}
                        className={({ isActive }) =>
                            `flex items-center py-4 pl-6 nav-item transition-all ${isActive ? "bg-cyan-900 text-white" : "text-white opacity-75 hover:opacity-100"}`
                        }
                    >
                        <FontAwesomeIcon
                            icon={faFileArrowUp}
                            className="mr-3"
                        />{" "}
                        Upload Files
                    </NavLink>

                    {/* ── Report Module Dropdown ── */}
                    <div>
                        <button
                            onClick={() => setReportsOpen((prev) => !prev)} // ← uses reportsOpen
                            className={`w-full flex items-center justify-between py-4 pl-6 pr-4 nav-item transition-all ${
                                isReportsActive
                                    ? "bg-cyan-900 text-white"
                                    : "text-white opacity-75 hover:opacity-100"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <FontAwesomeIcon icon={faClipboardList} />
                                Report Module
                            </span>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`text-xs transition-transform duration-300 ${reportsOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${reportsOpen ? "max-h-40" : "max-h-0"}`}
                        >
                            <div className="bg-cyan-950 bg-opacity-40">
                                <NavLink
                                    to="/sales-report"
                                    onClick={() => setOpenSidebar(false)}
                                    className={({ isActive }) =>
                                        `flex items-center py-3 pl-5 pr-4 text-sm transition-all border-l-2 ml-6 ${
                                            isActive
                                                ? "border-white text-white"
                                                : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                        }`
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faDiagramProject}
                                        className="mr-3 text-xs"
                                    />
                                    Sales Report
                                </NavLink>
                                <NavLink
                                    to="/receivables-report"
                                    onClick={() => setOpenSidebar(false)}
                                    className={({ isActive }) =>
                                        `flex items-center py-3 pl-5 pr-4 text-sm transition-all border-l-2 ml-6 ${
                                            isActive
                                                ? "border-white text-white"
                                                : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                        }`
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faDiagramProject}
                                        className="mr-3 text-xs"
                                    />
                                    Receivables Report
                                </NavLink>
                                <NavLink
                                    to="/overdue-report"
                                    onClick={() => setOpenSidebar(false)}
                                    className={({ isActive }) =>
                                        `flex items-center py-3 pl-5 pr-4 text-sm transition-all border-l-2 ml-6 ${
                                            isActive
                                                ? "border-white text-white"
                                                : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                        }`
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faDiagramProject}
                                        className="mr-3 text-xs"
                                    />
                                    Overdue Report
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </nav>

                {user?.role_name !== "viewer" && (
                    <div className="border-t border-cyan-700 bg-cyan-900">
                        {/* Admin Dropdown */}
                        <button
                            onClick={() => setAdminOpen((prev) => !prev)}
                            className={`w-full flex items-center justify-between py-4 pl-6 pr-4 transition-all ${
                                location.pathname.startsWith("/users") ||
                                location.pathname.startsWith(
                                    "/company-management",
                                )
                                    ? "text-white"
                                    : "text-white opacity-75 hover:opacity-100"
                            }`}
                        >
                            <span className="flex items-center gap-3 text-base font-semibold">
                                <FontAwesomeIcon icon={faShield} />
                                Admin
                            </span>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`text-xs transition-transform duration-300 ${adminOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${adminOpen ? "max-h-100" : "max-h-0"}`}
                        >
                            <div className="bg-cyan-950 bg-opacity-40 pb-2">
                                {user?.role_name === "super_admin" && (
                                    <>
                                        <NavLink
                                            to="/users"
                                            onClick={() =>
                                                setOpenSidebar(false)
                                            }
                                            className={({ isActive }) =>
                                                `text-sm flex items-center py-3 pl-5 pr-4 transition-all border-l-2 ml-6 ${
                                                    isActive
                                                        ? "border-white text-white"
                                                        : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                                }`
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={faUserTie}
                                                className="mr-3 text-xs"
                                            />
                                            Account Management
                                        </NavLink>
                                        <NavLink
                                            to="/company-management"
                                            onClick={() =>
                                                setOpenSidebar(false)
                                            }
                                            className={({ isActive }) =>
                                                `text-sm flex items-center py-3 pl-5 pr-4 transition-all border-l-2 ml-6 ${
                                                    isActive
                                                        ? "border-white text-white"
                                                        : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                                }`
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={faBuilding}
                                                className="mr-3 text-xs"
                                            />
                                            Company Profile
                                        </NavLink>
                                    </>
                                )}
                                <NavLink
                                    to="/company-type"
                                    onClick={() => setOpenSidebar(false)}
                                    className={({ isActive }) =>
                                        `text-sm flex items-center py-3 pl-5 pr-4 transition-all border-l-2 ml-6 ${
                                            isActive
                                                ? "border-white text-white"
                                                : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                        }`
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faLayerGroup}
                                        className="mr-3 text-xs"
                                    />
                                    Company Types
                                </NavLink>
                                <NavLink
                                    to="/payment-details"
                                    onClick={() => setOpenSidebar(false)}
                                    className={({ isActive }) =>
                                        `text-sm flex items-center py-3 pl-5 pr-4 transition-all border-l-2 ml-6 ${
                                            isActive
                                                ? "border-white text-white"
                                                : "border-transparent text-white opacity-60 hover:opacity-100 hover:border-cyan-400"
                                        }`
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faBuildingColumns}
                                        className="mr-3 text-xs"
                                    />
                                    Payment Details
                                </NavLink>
                            </div>
                        </div>
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
