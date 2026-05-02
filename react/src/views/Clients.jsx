import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrash,
    faPen,
    faDiagramProject,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const { setNotification, user } = useStateContext();

    // --- CLIENT DETAIL MODAL STATE ---
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        getClients();
    }, []);

    const onDelete = (u) => {
        if (!window.confirm("Are you sure you want to delete this client?")) {
            return;
        }
        axiosClient.delete(`/clients/${u.id}`).then(() => {
            setNotification("Client was successfully deleted");
            getClients();
        });
    };

    const getClients = (page = 1) => {
        setLoading(true);
        axiosClient
            .get(`/clients?page=${page}`)
            .then(({ data }) => {
                setLoading(false);
                setClients(data.data);
                setMeta(data.meta);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const onViewClient = (u) => {
        setSelectedClient(u);
        setClientModalOpen(true);
    };

    const closeClientModal = () => {
        setClientModalOpen(false);
        setSelectedClient(null);
    };

    const tableHeaders = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "Company",
        "Address",
        "Company Type",
        "Actions",
    ];

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Clients
                </h1>
                {user?.role_name !== "viewer" && (
                    <Link
                        to={"/clients/new"}
                        className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Add new
                    </Link>
                )}
            </div>

            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto p-5">
                <div className="max-w-[1100px] w-full overflow-auto rounded-lg max-height">
                    <table className="w-full bg-white shadow-sm border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-cyan-800">
                                {tableHeaders.map((header) => {
                                    if (
                                        header === "Actions" &&
                                        user?.role_name === "viewer"
                                    )
                                        return null;
                                    return (
                                        <th
                                            key={header}
                                            className="px-4 py-2 text-white text-sm font-medium"
                                        >
                                            {header}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={tableHeaders.length}
                                        className="text-center"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && (
                            <tbody>
                                {clients.length > 0 ? (
                                    clients.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="hover:bg-cyan-50 text-center"
                                        >
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {u.id}
                                            </td>

                                            {/* CLICKABLE NAME */}
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <button
                                                    onClick={() =>
                                                        onViewClient(u)
                                                    }
                                                    className="text-cyan-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                                                >
                                                    {u.name}
                                                </button>
                                            </td>

                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {u.email}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {u.phone_number}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {u.company_name}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {u.company_address}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {u.company_type}
                                            </td>
                                            {user?.role_name !== "viewer" && (
                                                <td className="border-b border-gray-200 px-4 py-3 flex justify-center items-center gap-2">
                                                    <Link
                                                        to={"/clients/" + u.id}
                                                        className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faPen}
                                                        />{" "}
                                                        Edit
                                                    </Link>
                                                    {user?.role_name ===
                                                        "super_admin" && (
                                                        <button
                                                            onClick={() =>
                                                                onDelete(u)
                                                            }
                                                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                            />{" "}
                                                            Delete
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={tableHeaders.length}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No clients
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        )}
                    </table>

                    <div className="flex justify-center items-center gap-2 mt-4">
                        {meta?.current_page > 1 && (
                            <button
                                onClick={() =>
                                    getClients(meta.current_page - 1)
                                }
                                className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                            >
                                Previous
                            </button>
                        )}
                        {meta?.current_page && (
                            <span className="text-sm text-gray-600">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                        )}
                        {meta?.current_page < meta?.last_page && (
                            <button
                                onClick={() =>
                                    getClients(meta.current_page + 1)
                                }
                                className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CLIENT DETAILS MODAL --- */}
            {clientModalOpen && selectedClient && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={closeClientModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                    Client Details
                                </p>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {selectedClient.name}
                                </h2>
                            </div>
                            <button
                                onClick={closeClientModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Email
                                </p>
                                <p className="text-sm font-semibold text-gray-800 break-all">
                                    {selectedClient.email ?? "—"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Phone
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {selectedClient.phone_number ?? "—"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Company
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {selectedClient.company_name ?? "—"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Company Type
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {selectedClient.company_type ?? "—"}
                                </p>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                                Additional Info
                            </p>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="text-gray-400 py-1.5 w-1/2">
                                            Client ID
                                        </td>
                                        <td className="text-gray-800 font-medium py-1.5">
                                            #{selectedClient.id}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-400 py-1.5">
                                            Address
                                        </td>
                                        <td className="text-gray-800 font-medium py-1.5">
                                            {selectedClient.company_address ??
                                                "—"}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
