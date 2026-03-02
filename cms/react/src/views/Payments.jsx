import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import StatusBadge from "../components/StatusBadge";

export default function Payments() {
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setNotification, user } = useStateContext();
    const [editingId, setEditingId] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

    const uniqueProjects = [
        ...new Map(
            paymentSchedules.map((p) => [
                p.project?.id,
                { id: p.project?.id, title: p.project?.title },
            ]),
        ).values(),
    ].filter((p) => p.id);

    const filteredSchedules = paymentSchedules.filter((p) => {
        const matchMonth = selectedMonth
            ? p.due_date?.slice(0, 7) === selectedMonth
            : true;

        const matchProject = selectedProject
            ? p.project?.id === Number(selectedProject)
            : true;

        return matchMonth && matchProject;
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 mt-5 gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Payments
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Project:
                        </label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                            <option value="">All Projects</option>
                            {uniqueProjects.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                    {proj.title}
                                </option>
                            ))}
                        </select>
                    </div>
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
                    {(selectedMonth || selectedProject) && (
                        <button
                            onClick={() => {
                                setSelectedMonth("");
                                setSelectedProject("");
                            }}
                            className="text-sm text-cyan-700 hover:underline dark:text-cyan-400"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto p-5">
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
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Status
                                </th>
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
                                                            {
                                                                user?.role_name !==
                                                                    "viewer" &&
                                                                    setEditingId(
                                                                        p.id,
                                                                    );
                                                            }
                                                        }}
                                                        className={`flex justify-center ${
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
                                                    </div>
                                                )}
                                            </td>
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
