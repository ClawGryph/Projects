import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import StatusBadge from "../components/StatusBadge";

export default function Payments() {
    const [payment, setPayment] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setNotification } = useStateContext();
    const [editingId, setEditingId] = useState(null);

    const getPayments = () => {
        setLoading(true);

        axiosClient
            .get("/client-projects")
            .then(({ data }) => {
                setLoading(false);
                setPayment(data.data);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        getPayments();
    }, []);

    const updateStatus = (paymentId, newStatus, paymentType) => {
        // For installment payments, prevent overwriting the status to 'partial' manually
        if (paymentType === "installment" && newStatus === "partial") {
            // Send 'partial' status to trigger installment increment
            axiosClient
                .put(`/payments/${paymentId}/status`, { status: "partial" }) // ✅ Added status field
                .then(() => {
                    getPayments();
                    setNotification("Installment updated successfully");
                })
                .catch(() => {
                    setNotification("Failed to update installment");
                });
            return;
        }

        // All other cases
        axiosClient
            .put(`/payments/${paymentId}/status`, { status: newStatus })
            .then(() => {
                getPayments(); // refresh list
                setNotification("Payment status updated");
            })
            .catch(() => {
                setNotification("Failed to update payment status");
            });
    };

    useEffect(() => {
        const close = () => setEditingId(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    const formatPaymentType = (type) => {
        if (!type) return "";

        // Replace underscores with spaces
        const formatted = type.replace(/_/g, " ");

        // Capitalize first letter of every word
        return formatted
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Payments
                </h1>
            </div>
            <div className="flex flex-col h-full justify-start items-center overflow-x-auto">
                <table className="max-w-[1100px] w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                    <thead>
                        <tr className="bg-cyan-800">
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                ID
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Client
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Project
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Cost
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Payment
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Payment Start Date
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Next Payment Date
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Payment Progress
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Status
                            </th>
                        </tr>
                    </thead>
                    {loading && (
                        <tbody>
                            <tr>
                                <td colSpan="9" className="text-center">
                                    Loading...
                                </td>
                            </tr>
                        </tbody>
                    )}
                    {!loading && (
                        <tbody>
                            {payment.length > 0 ? (
                                payment.map((p) => (
                                    <tr
                                        key={p.payment.id}
                                        className="border-b border-gray-200 hover:bg-cyan-50 text-center"
                                    >
                                        <td className="px-4 py-2">
                                            {p.payment.id}
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.client.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.project.title}
                                        </td>
                                        <td className="px-4 py-2">
                                            ₱
                                            {new Intl.NumberFormat(
                                                "en-PH",
                                            ).format(p.project.price)}
                                        </td>
                                        <td className="px-4 py-2">
                                            {formatPaymentType(
                                                p.payment.payment_type ===
                                                    "recurring"
                                                    ? p.payment.recurring_type
                                                    : p.payment.payment_type,
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.payment.start_date}
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.payment.next_payment_date
                                                ? p.payment.next_payment_date
                                                : " - "}
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.payment?.payment_type ===
                                            "installment" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium border border-purple-100">
                                                    <svg
                                                        className="w-3 h-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span>
                                                        {
                                                            p.payment
                                                                .current_installment
                                                        }
                                                    </span>
                                                    <span className="text-purple-400">
                                                        /
                                                    </span>
                                                    <span className="font-semibold">
                                                        {p.payment.installments}
                                                    </span>
                                                </span>
                                            ) : (
                                                " - "
                                            )}
                                        </td>
                                        <td className="px-4 py-2 relative">
                                            {editingId === p.payment.id ? (
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-1 bg-white border rounded shadow-md z-10">
                                                    {[
                                                        "pending",
                                                        "paid",
                                                        "partial",
                                                        "active",
                                                        "overdue",
                                                        "cancelled",
                                                        "failed",
                                                    ].map((status) => (
                                                        <div
                                                            key={status}
                                                            onClick={() => {
                                                                updateStatus(
                                                                    p.payment
                                                                        .id,
                                                                    status,
                                                                    p.payment
                                                                        .payment_type,
                                                                );
                                                                setEditingId(
                                                                    null,
                                                                );
                                                            }}
                                                            className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                        >
                                                            <StatusBadge
                                                                status={status}
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
                                                        setEditingId(
                                                            p.payment.id,
                                                        );
                                                    }}
                                                    className="cursor-pointer flex justify-center"
                                                >
                                                    <StatusBadge
                                                        status={
                                                            p.payment.status
                                                        }
                                                        isEnded={p.isEnded}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-6 text-center text-gray-500"
                                    >
                                        No payments
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    )}
                </table>
            </div>
        </>
    );
}
