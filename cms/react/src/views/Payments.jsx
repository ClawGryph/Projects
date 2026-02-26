import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import StatusBadge from "../components/StatusBadge";

export default function Payments() {
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setNotification, user } = useStateContext();
    const [editingId, setEditingId] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    });

    const getPaymentSchedules = () => {
        setLoading(true);
        axiosClient
            .get(`/client-projects`)
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
        axiosClient
            .put(`/payment-schedules/${scheduleId}/status`, {
                status: newStatus,
            })
            .then(() => {
                getPaymentSchedules();
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
        return type
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const filteredSchedules = selectedMonth
        ? paymentSchedules.filter((p) => {
              if (!p.due_date) return false;
              // due_date format assumed to be YYYY-MM-DD
              return p.due_date.slice(0, 7) === selectedMonth;
          })
        : paymentSchedules;

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Payments
                </h1>
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="month-filter"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Filter by Month:
                    </label>
                    <input
                        id="month-filter"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    />
                    {selectedMonth && (
                        <button
                            onClick={() => setSelectedMonth("")}
                            className="text-sm text-cyan-700 hover:underline dark:text-cyan-400"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto">
                <div className="max-w-[1100px] w-full overflow-auto rounded-lg hide-scrollbar max-height">
                    <table className="w-full bg-white shadow-sm border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20 bg-cyan-800">
                            <tr>
                                <th className="px-4 text-white text-sm font-medium">
                                    ID
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Client
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Project
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Cost
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Payment
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Due Date
                                </th>
                                {user?.role_name !== "viewer" && (
                                    <th className="px-4 py-2 text-white text-sm font-medium">
                                        Status
                                    </th>
                                )}
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center py-4"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && (
                            <tbody>
                                {filteredSchedules.length > 0 ? (
                                    filteredSchedules.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-cyan-50 text-center"
                                        >
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.id}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.client?.name}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.project?.title}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                ₱
                                                {new Intl.NumberFormat(
                                                    "en-PH",
                                                ).format(p.expected_amount)}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {formatPaymentType(
                                                    p.payment?.payment_type ===
                                                        "recurring"
                                                        ? p.payment
                                                              ?.recurring_type
                                                        : p.payment
                                                              ?.payment_type,
                                                )}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.due_date || " - "}
                                            </td>
                                            {user?.role_name !== "viewer" && (
                                                <td className="border-b border-gray-200 px-4 py-2 relative">
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
                                                                setEditingId(
                                                                    p.id,
                                                                );
                                                            }}
                                                            className="cursor-pointer flex justify-center"
                                                        >
                                                            <StatusBadge
                                                                status={
                                                                    p.status
                                                                }
                                                                isEnded={
                                                                    p.isEnded
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            {selectedMonth
                                                ? "No payments for the selected month"
                                                : "No payments"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </>
    );
}
