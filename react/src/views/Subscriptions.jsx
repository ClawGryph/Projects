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

export default function Subsciptions() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { setNotification, user } = useStateContext();
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    // --- NEW MODAL STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [viewedSubscription, setViewedSubscription] = useState(null);

    useEffect(() => {
        getSubscriptions();
    }, []);

    const getSubscriptions = (page = 1) => {
        setLoading(true);
        axiosClient
            .get(`/subscriptions?page=${page}`)
            .then(({ data }) => {
                setLoading(false);
                setSubscriptions(data.data);
                setMeta(data.meta);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const onDelete = (s) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this subscription?",
            )
        ) {
            return;
        }
        axiosClient.delete(`/subscriptions/${s.id}`).then(() => {
            setNotification("Subscription was successfully deleted");
            getSubscriptions();
        });
    };

    // View Subscription Modal
    const onViewSubscription = (s) => {
        setViewedSubscription(s);
        setSubscriptionModalOpen(true);
    };

    const closeSubscriptionModal = () => {
        setSubscriptionModalOpen(false);
        setViewedSubscription(null);
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
        "Start Coverage",
        "End Coverage",
        "Type",
        "Status",
        "Payment View",
        "Actions",
    ];

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Subscriptions
                </h1>
                {user?.role_name !== "viewer" && (
                    <Link
                        to={"/subscriptions/new"}
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
                                {subscriptions.length > 0 ? (
                                    subscriptions.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-cyan-50 text-center"
                                        >
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {s.subscription_id}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <button
                                                    onClick={() =>
                                                        onViewSubscription(s)
                                                    }
                                                    className="text-cyan-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                                                >
                                                    {s.title}
                                                </button>
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                ₱{" "}
                                                {new Intl.NumberFormat(
                                                    "en-PH",
                                                ).format(s.cost)}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {s.adjusted_start_coverage
                                                    ? s.adjusted_start_coverage
                                                    : s.start_coverage}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {s.adjusted_end_coverage
                                                    ? s.adjusted_end_coverage
                                                    : s.end_coverage}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {s.type}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2 relative">
                                                {editingId === s.id ? (
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
                                                            "Delay",
                                                            "Hold",
                                                            "complete",
                                                        ].map((status) => (
                                                            <div
                                                                key={status}
                                                                onClick={() => {
                                                                    updateStatus(
                                                                        s.id,
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
                                                                        s.isEnded
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
                                                                    s.id,
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
                                                            status={
                                                                s.auto_status
                                                            }
                                                            isEnded={s.isEnded}
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
                                                    onClick={() => onView(s)}
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
                                                        to={
                                                            "/subscriptions/" +
                                                            s.id
                                                        }
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
                                                                onDelete(s)
                                                            }
                                                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
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
                                            No subscriptions
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
                                    getSubscriptions(meta.current_page - 1)
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
                                    getSubscriptions(meta.current_page + 1)
                                }
                                className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SUBSCRIPTION DETAILS MODAL --- */}
            {subscriptionModalOpen && viewedSubscription && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={closeSubscriptionModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                    Subscription Details
                                </p>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {viewedSubscription.title}
                                </h2>
                            </div>
                            <button
                                onClick={closeSubscriptionModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Subscription Cost
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    ₱{" "}
                                    {new Intl.NumberFormat("en-PH").format(
                                        viewedSubscription.cost,
                                    )}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Status
                                </p>
                                <StatusBadge
                                    status={viewedSubscription.auto_status}
                                    isEnded={viewedSubscription.isEnded}
                                />
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Start Coverage
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {viewedSubscription.start_coverage ?? "—"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    End Coverage
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {viewedSubscription.end_coverage ?? "—"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Type
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {viewedSubscription.type ?? "—"}
                                </p>
                            </div>
                        </div>

                        {viewedSubscription.description && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-5">
                                <p className="text-xs text-gray-400 mb-1">
                                    Description
                                </p>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                    {viewedSubscription.description}
                                </p>
                            </div>
                        )}

                        {/* Additional Info */}
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                                Additional Info
                            </p>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="text-gray-400 py-1.5 w-1/2">
                                            Subscription ID
                                        </td>
                                        <td className="text-gray-800 font-medium py-1.5">
                                            #
                                            {viewedSubscription.subscription_id}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-400 py-1.5">
                                            Adjusted Start
                                        </td>
                                        <td className="text-gray-800 font-medium py-1.5">
                                            {viewedSubscription.adjusted_start_coverage ??
                                                "—"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-400 py-1.5">
                                            Adjusted End
                                        </td>
                                        <td className="text-gray-800 font-medium py-1.5">
                                            {viewedSubscription.adjusted_end_coverage ??
                                                "—"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-400 py-1.5">
                                            CR NO
                                        </td>
                                        <td className="text-gray-800 font-medium py-1.5">
                                            {viewedSubscription.cr_no ?? "—"}
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
