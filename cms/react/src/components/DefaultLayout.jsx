import { Navigate, Outlet, Link } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logo from "../assets/logo.png";
import {
    faGauge,
    faUser,
    faDiagramProject,
    faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";

export default function DefaultLayout() {
    const { user, token, notification, setUser, setToken } = useStateContext();

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
            <aside className="relative bg-cyan-800 h-screen w-64 hidden sm:block shadow-xl">
                <div className="m-5 flex flex-col items-center justify-center">
                    <img src={logo} alt="cms logo" className="w-25" />
                    <p className="text-white">CMS</p>
                </div>
                <nav className="text-white text-base font-semibold pt-3">
                    <Link
                        to="/dashboard"
                        className="flex items-center text-white opacity-75 hover:opacity-100 py-4 pl-6 nav-item"
                    >
                        <FontAwesomeIcon icon={faGauge} />
                        Dashboard
                    </Link>
                    <Link
                        to="/clients"
                        className="flex items-center text-white opacity-75 hover:opacity-100 py-4 pl-6 nav-item"
                    >
                        <FontAwesomeIcon icon={faUser} />
                        Clients
                    </Link>
                    <Link
                        to="/projects"
                        className="flex items-center text-white opacity-75 hover:opacity-100 py-4 pl-6 nav-item"
                    >
                        <FontAwesomeIcon icon={faDiagramProject} />
                        Projects
                    </Link>
                    <Link
                        to="/payments"
                        className="flex items-center text-white opacity-75 hover:opacity-100 py-4 pl-6 nav-item"
                    >
                        <FontAwesomeIcon icon={faMoneyBill} />
                        Payments
                    </Link>
                </nav>
            </aside>
            <main className="relative w-full h-full flex flex-col h-screen overflow-y-auto">
                <header className="w-full items-center bg-white py-2 px-6 hidden sm:flex">
                    <div className="w-1/2"></div>
                    <div className="relative w-1/2 flex justify-end">
                        <button
                            onClick={onLogout}
                            className="w-20 bg-cyan-800 text-white cta-btn font-semibold py-2 rounded-br-lg rounded-bl-lg rounded-tr-lg shadow-lg hover:shadow-xl hover:bg-cyan-900 flex items-center justify-center cursor-pointer"
                        >
                            Logout
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
