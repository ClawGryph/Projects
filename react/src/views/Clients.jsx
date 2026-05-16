import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrash,
    faPen,
    faDiagramProject,
    faTimes,
    faFileInvoice,
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
    const [clientsWithSchedules, setClientsWithSchedules] = useState(new Set());

    const [openDropdown, setOpenDropdown] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        getClients();
    }, []);

    useEffect(() => {
        axiosClient.get("/payment-schedules").then(({ data }) => {
            const ids = new Set(
                data.data
                    .map((s) => s.clientsProject?.client?.id)
                    .filter(Boolean),
            );
            setClientsWithSchedules(ids);
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
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
                <div className="w-full overflow-auto rounded-lg max-height">
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
                                                <Link
                                                    to={`/clients/${u.id}/dashboard`}
                                                    className="text-cyan-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                                                >
                                                    {u.name}
                                                </Link>
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
                                                <td className="border-b border-gray-200 px-4 py-2 text-center">
                                                    <div className="relative flex justify-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rect =
                                                                    e.currentTarget.getBoundingClientRect();
                                                                const dropdownHeight = 160;
                                                                const spaceBelow =
                                                                    window.innerHeight -
                                                                    rect.bottom;
                                                                setDropdownPos({
                                                                    top:
                                                                        spaceBelow <
                                                                        dropdownHeight
                                                                            ? rect.top -
                                                                              dropdownHeight
                                                                            : rect.bottom,
                                                                    left: rect.right,
                                                                });
                                                                setOpenDropdown(
                                                                    openDropdown ===
                                                                        u.id
                                                                        ? null
                                                                        : u.id,
                                                                );
                                                            }}
                                                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                            >
                                                                <circle
                                                                    cx="12"
                                                                    cy="5"
                                                                    r="1.5"
                                                                />
                                                                <circle
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="1.5"
                                                                />
                                                                <circle
                                                                    cx="12"
                                                                    cy="19"
                                                                    r="1.5"
                                                                />
                                                            </svg>
                                                        </button>

                                                        {openDropdown ===
                                                            u.id && (
                                                            <div
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                style={{
                                                                    position:
                                                                        "fixed",
                                                                    top: dropdownPos.top,
                                                                    left: dropdownPos.left,
                                                                    transform:
                                                                        "translateX(-100%)",
                                                                }}
                                                                className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-md min-w-[150px]"
                                                            >
                                                                <Link
                                                                    to={`/clients/assign/${u.id}`}
                                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faDiagramProject
                                                                        }
                                                                    />
                                                                    Assign
                                                                </Link>
                                                                <Link
                                                                    to={`/clients/assign/${u.id}`}
                                                                    state={{
                                                                        activeTab:
                                                                            "payment_summary",
                                                                    }}
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            !clientsWithSchedules.has(
                                                                                u.id,
                                                                            )
                                                                        )
                                                                            e.preventDefault();
                                                                    }}
                                                                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                                        clientsWithSchedules.has(
                                                                            u.id,
                                                                        )
                                                                            ? "text-gray-700 dark:text-gray-200"
                                                                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed pointer-events-none"
                                                                    }`}
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faFileInvoice
                                                                        }
                                                                    />
                                                                    Payment
                                                                    Summary
                                                                </Link>
                                                                <Link
                                                                    to={`/clients/${u.id}`}
                                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faPen
                                                                        }
                                                                    />
                                                                    Edit
                                                                </Link>
                                                                {user?.role_name ===
                                                                    "super_admin" && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenDropdown(
                                                                                null,
                                                                            );
                                                                            onDelete(
                                                                                u,
                                                                            );
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 cursor-pointer"
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                faTrash
                                                                            }
                                                                        />
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
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
        </>
    );
}
