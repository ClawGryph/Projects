import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrash,
    faPen,
    faEye,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { setNotification, user } = useStateContext();
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    // --- NEW MODAL STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    useEffect(() => {
        getProjects();
    }, []);

    const getProjects = (page = 1) => {
        setLoading(true);
        axiosClient
            .get(`/projects?page=${page}`)
            .then(({ data }) => {
                setLoading(false);
                setProjects(data.data);
                setMeta(data.meta);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const onDelete = (p) => {
        if (!window.confirm("Are you sure you want to delete this project?")) {
            return;
        }
        axiosClient.delete(`/projects/${p.id}`).then(() => {
            setNotification("Projects was successfully deleted");
            getProjects();
        });
    };

    const updateStatus = (projectId, newStatus) => {
        axiosClient
            .put(`/projects/${projectId}/status`, { status: newStatus })
            .then(() => {
                getProjects();
                setNotification("Project status updated");
            });
    };

    // --- NEW: Fetch payments and open modal ---
    const onView = (p) => {
        setSelectedProject(p);
        setModalOpen(true);
        setPayments([]);
        setPaymentsLoading(true);

        axiosClient
            .get(`/payment-schedules`, { params: { project_id: p.id } })
            .then(({ data }) => {
                setPayments(data.data ?? data);
                setPaymentsLoading(false);
            })
            .catch(() => {
                setPaymentsLoading(false);
            });
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedProject(null);
        setPayments([]);
    };

    useEffect(() => {
        const close = () => setEditingId(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    const tableHeaders = [
        "ID",
        "Title",
        "Cost",
        "Start Date",
        "End Date",
        "Status",
        "View",
        "Actions",
    ];

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Projects
                </h1>
                {user?.role_name !== "viewer" && (
                    <Link
                        to={"/projects/new"}
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
                                {projects.length > 0 ? (
                                    projects.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-cyan-50 text-center"
                                        >
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.id}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.title}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                ₱{" "}
                                                {new Intl.NumberFormat(
                                                    "en-PH",
                                                ).format(p.price)}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.start_date}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.end_date}
                                            </td>

                                            <td className="border-b border-gray-200 px-4 py-2 relative">
                                                {editingId === p.id ? (
                                                    <div
                                                        style={{
                                                            position: "fixed",
                                                            top: dropdownPos.top,
                                                            left: dropdownPos.left,
                                                            transform:
                                                                "translateX(-50%)",
                                                        }}
                                                        className="bg-white border rounded shadow-md z-50"
                                                    >
                                                        {[
                                                            "pending",
                                                            "ongoing",
                                                            "complete",
                                                        ].map((status) => (
                                                            <div
                                                                key={status}
                                                                onClick={() => {
                                                                    updateStatus(
                                                                        p.id,
                                                                        status,
                                                                    );
                                                                    setEditingId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                            >
                                                                <StatusBadge
                                                                    status={
                                                                        status
                                                                    }
                                                                    isEnded={
                                                                        p.isEnded
                                                                    }
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect =
                                                                e.currentTarget.getBoundingClientRect();
                                                            setDropdownPos({
                                                                top:
                                                                    rect.bottom +
                                                                    window.scrollY -
                                                                    30,
                                                                left:
                                                                    rect.left +
                                                                    rect.width /
                                                                        2 +
                                                                    window.scrollX,
                                                            });
                                                            user?.role_name !==
                                                                "viewer" &&
                                                                setEditingId(
                                                                    p.id,
                                                                );
                                                        }}
                                                        className={`inline-flex items-center gap-1 justify-center ${
                                                            user?.role_name !==
                                                            "viewer"
                                                                ? "cursor-pointer"
                                                                : "cursor-default"
                                                        }`}
                                                    >
                                                        <StatusBadge
                                                            status={p.status}
                                                            isEnded={p.isEnded}
                                                        />
                                                        {user?.role_name !==
                                                            "viewer" && (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-3 w-3 text-gray-400 shrink-0"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <button
                                                    onClick={() => onView(p)}
                                                    className="inline-block px-2 py-1 text-xs text-[#0d1b2a] border border-gray-200 font-semibold rounded-md shadow hover:bg-cyan-900 hover:text-white cursor-pointer"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEye}
                                                        className="pr-1"
                                                    />
                                                    View
                                                </button>
                                            </td>

                                            {user?.role_name !== "viewer" && (
                                                <td className="border-b border-gray-200 px-4 py-3 flex justify-center items-center gap-2">
                                                    <Link
                                                        to={"/projects/" + p.id}
                                                        className="inline-block px-2 py-1 text-xs bg-cyan-800 text-white font-semibold rounded-md shadow hover:bg-cyan-900"
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
                                                                onDelete(p)
                                                            }
                                                            className="inline-block px-2 py-1 text-xs bg-red-700 text-white font-semibold rounded-md shadow hover:bg-red-800 cursor-pointer"
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
                                            No projects
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
                                    getProjects(meta.current_page - 1)
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
                                    getProjects(meta.current_page + 1)
                                }
                                className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- PAYMENTS MODAL --- */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {selectedProject?.title}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Client Payments
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                        </div>

                        {/* Payments Table */}
                        {paymentsLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                Loading payments...
                            </div>
                        ) : payments.length > 0 ? (
                            <div className="overflow-auto max-h-96">
                                <table className="w-full text-sm border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-cyan-800 text-center text-white">
                                            <th className="px-4 py-2 rounded-tl-lg">
                                                ID
                                            </th>
                                            <th className="px-4 py-2">
                                                Client Name
                                            </th>
                                            <th className="px-4 py-2">
                                                Project Cost
                                            </th>
                                            <th className="px-4 py-2">
                                                Due Date
                                            </th>
                                            <th className="px-4 py-2">
                                                Status
                                            </th>
                                            <th className="px-4 py-2">
                                                S.I/ACK No.
                                            </th>
                                            <th className="px-4 py-2 rounded-tr-lg">
                                                2307 Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p, idx) => {
                                            const isPaid = p.status === "paid";
                                            const officialReceipt =
                                                p.transaction?.officialReceipt;
                                            const orNumber =
                                                officialReceipt?.service_invoice_number ??
                                                officialReceipt?.payment_acknowledgement_number;
                                            const form2307Status = isPaid
                                                ? p.transaction?.officialReceipt
                                                      ?.form2307
                                                    ? "issued"
                                                    : "pending"
                                                : "";

                                            return (
                                                <tr
                                                    key={p.id}
                                                    className="text-center hover:bg-cyan-50"
                                                >
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        {p.clientsProject
                                                            ?.client?.name ??
                                                            "—"}
                                                    </td>
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        ₱{" "}
                                                        {new Intl.NumberFormat(
                                                            "en-PH",
                                                        ).format(
                                                            p.expected_amount ??
                                                                0,
                                                        )}
                                                    </td>
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        {p.due_date ?? "—"}
                                                    </td>
                                                    <td className="border-b border-gray-200 px-4 py-2 capitalize">
                                                        <StatusBadge
                                                            status={
                                                                p.status ?? "—"
                                                            }
                                                        />
                                                    </td>
                                                    {/* O.R # Column */}
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        {isPaid ? (
                                                            orNumber ? (
                                                                <span className="text-xs font-mono text-gray-700">
                                                                    {orNumber}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">
                                                                    No O.R.
                                                                    issued
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    {/* 2307 Status Column */}
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        {isPaid ? (
                                                            <StatusBadge
                                                                status={
                                                                    form2307Status ??
                                                                    "pending"
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No payments found for this project.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
