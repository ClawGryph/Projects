import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import StatusBadge from "../components/StatusBadge";

export default function Payments() {
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setNotification } = useStateContext();
    const [editingId, setEditingId] = useState(null);

    const getPaymentSchedules = () => {
        setLoading(true);
        axiosClient
            .get("/client-projects")
            .then(({ data }) => {
                setLoading(false);

                const schedules = [];
                (data.data || []).forEach((project) => {
                    project.payment_schedules?.forEach((sched) => {
                        schedules.push({
                            ...sched,
                            client: project.client,
                            project: project.project,
                            payment: project.payment,
                            isEnded: project.isEnded,
                        });
                    });
                });

                schedules.sort((a, b) => {
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return a.due_date.localeCompare(b.due_date);
                });

                setPaymentSchedules(schedules);
            })
            .catch((err) => {
                setLoading(false);
                console.error(err);
            });
    };

    useEffect(() => {
        getPaymentSchedules();
    }, []);

    const updateStatus = (scheduleId, newStatus) => {
        // All other cases
        axiosClient
            .put(`/payment-schedules/${scheduleId}/status`, {
                status: newStatus,
            })
            .then(() => {
                getPaymentSchedules(); // refresh list
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
                                Due Date
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
                            {paymentSchedules.length > 0 ? (
                                paymentSchedules.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-b border-gray-200 hover:bg-cyan-50 text-center"
                                    >
                                        <td className="px-4 py-2">{p.id}</td>
                                        <td className="px-4 py-2">
                                            {p.client?.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.project?.title}
                                        </td>
                                        <td className="px-4 py-2">
                                            ₱
                                            {new Intl.NumberFormat(
                                                "en-PH",
                                            ).format(p.expected_amount)}
                                        </td>
                                        <td className="px-4 py-2">
                                            {formatPaymentType(
                                                p.payment?.payment_type ===
                                                    "recurring"
                                                    ? p.payment?.recurring_type
                                                    : p.payment?.payment_type,
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {p.due_date || " - "}
                                        </td>
                                        <td className="px-4 py-2 relative">
                                            {editingId === p.id ? (
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-1 bg-white border rounded shadow-md z-10">
                                                    {[
                                                        "pending",
                                                        "paid",
                                                        "overdue",
                                                        "ended",
                                                    ].map((status) => (
                                                        <div
                                                            key={status}
                                                            onClick={() => {
                                                                updateStatus(
                                                                    p.id,
                                                                    status,
                                                                    p.payment
                                                                        ?.payment_type,
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
                                                        setEditingId(p.id);
                                                    }}
                                                    className="cursor-pointer flex justify-center"
                                                >
                                                    <StatusBadge
                                                        status={p.status}
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
