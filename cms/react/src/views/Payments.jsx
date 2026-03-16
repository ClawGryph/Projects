import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDownload,
    faFileInvoice,
    faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge";
import InvoiceModal from "../components/InvoiceModal";
import OfficialReceiptModal from "../components/OfficialReceiptModal";

export default function Payments() {
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [projects, setProjects] = useState([]);
    const [invoicePayment, setInvoicePayment] = useState(null);
    const [orPayment, setOrPayment] = useState(null);
    const [loading, setLoading] = useState(false);
    const { setNotification, user } = useStateContext();
    const [editingId, setEditingId] = useState(null);
    const [editing2307Id, setEditing2307Id] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [statusDropdownPos, setStatusDropdownPos] = useState({
        top: 0,
        left: 0,
    });

    const getPaymentSchedules = () => {
        setLoading(true);
        axiosClient
            .get("/payment-schedules", {
                params: {
                    month: selectedMonth || undefined,
                    project_id: selectedProject || undefined,
                },
            })
            .then(({ data }) => {
                setPaymentSchedules(data.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        getPaymentSchedules();
    }, [selectedMonth, selectedProject]);

    useEffect(() => {
        axiosClient.get("/projects").then(({ data }) => {
            setProjects(data.data);
        });
    }, []);

    const updateStatus = (scheduleId, newStatus, currentPayment) => {
        const wasPaid = currentPayment.status === "paid";
        const changingToPending = newStatus === "pending";

        const doUpdate = () => {
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

        if (wasPaid && changingToPending && currentPayment.transaction?.id) {
            axiosClient
                .delete(`/transactions/${currentPayment.transaction.id}`)
                .then(() => doUpdate())
                .catch(() =>
                    setNotification("Failed to remove paid transaction"),
                );
        } else {
            doUpdate();
        }
    };

    // Close both dropdowns on outside click
    useEffect(() => {
        const close = () => {
            setEditingId(null);
            setEditing2307Id(null);
        };
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

    const exportCSV = () => {
        const headers = [
            "ID",
            "Client",
            "Project",
            "Cost",
            "Payment",
            "Due Date",
            "Status",
            "O.R. #",
            "2307 Status",
        ];

        const rows = paymentSchedules.map((p) => {
            const paymentType =
                p.clientsProject?.payment?.payment_type === "recurring"
                    ? p.clientsProject?.payment?.recurring_type
                    : p.clientsProject?.payment?.payment_type;

            const isPaid = p.status === "paid";
            const orNumber = p.transaction?.officialReceipt?.or_number ?? "";
            const form2307Status = isPaid
                ? (p.transaction?.officialReceipt?.form_2307_status ?? "")
                : "";

            return [
                p.id,
                p.clientsProject?.client?.name ?? "",
                p.clientsProject?.project?.title ?? "",
                p.expected_amount,
                formatPaymentType(paymentType),
                p.due_date ?? "",
                p.status,
                isPaid ? orNumber || "No O.R. issued" : "-",
                form2307Status,
            ];
        });

        const csvContent = [headers, ...rows]
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(","),
            )
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const filename = [
            "payments",
            selectedMonth || null,
            selectedProject
                ? projects.find((p) => String(p.id) === String(selectedProject))
                      ?.title
                : null,
        ]
            .filter(Boolean)
            .join("_")
            .replace(/\s+/g, "-")
            .toLowerCase();

        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 mt-5 gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Payments
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Project Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Project:
                        </label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                            <option value="">All Projects</option>
                            {projects.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                    {proj.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month Filter */}
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="month-filter"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Month:
                        </label>
                        <input
                            id="month-filter"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        />
                    </div>

                    {/* Clear Button */}
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

                    {/* Export CSV Button */}
                    <button
                        onClick={exportCSV}
                        disabled={paymentSchedules.length === 0}
                        className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                        <span className="hidden sm:inline ml-1">
                            Export CSV
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto p-5">
                <div className="max-w-[1300px] w-full overflow-auto rounded-lg hide-scrollbar max-height">
                    <table className="w-full bg-white shadow-sm border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20 bg-cyan-800">
                            <tr>
                                <th className="px-4 text-white text-sm font-medium">
                                    ID
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Client Name
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Project Name
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Payment Details
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    OR No.
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium">
                                    2307 Status
                                </th>
                                {user?.role_name !== "viewer" && (
                                    <th className="px-4 py-2 text-white text-sm font-medium">
                                        Action
                                    </th>
                                )}
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan="11"
                                        className="text-center py-4"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && (
                            <tbody>
                                {paymentSchedules.length > 0 ? (
                                    paymentSchedules.map((p, index) => {
                                        const isPaid = p.status === "paid";
                                        const officialReceipt =
                                            p.transaction?.officialReceipt;
                                        const orNumber =
                                            officialReceipt?.or_number;
                                        const form2307Status =
                                            officialReceipt?.form_2307_status;

                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-cyan-50 text-center"
                                            >
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {index + 1}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {
                                                        p.clientsProject?.client
                                                            ?.name
                                                    }
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {
                                                        p.clientsProject
                                                            ?.project?.title
                                                    }
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <div className="font-semibold">
                                                        ₱
                                                        {new Intl.NumberFormat(
                                                            "en-PH",
                                                        ).format(
                                                            p.expected_amount,
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-gray-500">
                                                        {formatPaymentType(
                                                            p.clientsProject
                                                                ?.payment
                                                                ?.payment_type ===
                                                                "recurring"
                                                                ? p
                                                                      .clientsProject
                                                                      ?.payment
                                                                      ?.recurring_type
                                                                : p
                                                                      .clientsProject
                                                                      ?.payment
                                                                      ?.payment_type,
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-gray-400">
                                                        Due: {p.due_date || "-"}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="border-b border-gray-200 px-4 py-2 relative">
                                                    {editingId === p.id ? (
                                                        <div
                                                            style={{
                                                                position:
                                                                    "fixed",
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
                                                                            p,
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
                                                            className={`flex justify-center ${
                                                                user?.role_name !==
                                                                "viewer"
                                                                    ? "cursor-pointer"
                                                                    : "cursor-default"
                                                            }`}
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

                                                {/* O.R # Column */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {isPaid ? (
                                                        orNumber ? (
                                                            <span className="text-s font-mono text-gray-700">
                                                                {orNumber}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">
                                                                No O.R. issued
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 2307 Status Column */}
                                                <td className="border-b border-gray-200 px-4 py-2 relative">
                                                    {isPaid ? (
                                                        editing2307Id ===
                                                        officialReceipt?.id ? (
                                                            <div
                                                                style={{
                                                                    position:
                                                                        "fixed",
                                                                    top: statusDropdownPos.top,
                                                                    left: statusDropdownPos.left,
                                                                    transform:
                                                                        "translateX(-50%)",
                                                                }}
                                                                className="bg-white border rounded shadow-md z-50"
                                                            >
                                                                {[
                                                                    "pending",
                                                                    "issued",
                                                                ].map(
                                                                    (
                                                                        status,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                status
                                                                            }
                                                                            onClick={() => {
                                                                                axiosClient
                                                                                    .put(
                                                                                        `/official-receipts/${officialReceipt.id}`,
                                                                                        {
                                                                                            ...officialReceipt,
                                                                                            form_2307_status:
                                                                                                status,
                                                                                        },
                                                                                    )
                                                                                    .then(
                                                                                        () => {
                                                                                            getPaymentSchedules();
                                                                                            setNotification(
                                                                                                "2307 status updated",
                                                                                            );
                                                                                        },
                                                                                    )
                                                                                    .catch(
                                                                                        () =>
                                                                                            setNotification(
                                                                                                "Failed to update 2307 status",
                                                                                            ),
                                                                                    );
                                                                                setEditing2307Id(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                                        >
                                                                            <StatusBadge
                                                                                status={
                                                                                    status
                                                                                }
                                                                            />
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        user?.role_name ===
                                                                            "viewer" ||
                                                                        !officialReceipt
                                                                    )
                                                                        return;
                                                                    e.stopPropagation();
                                                                    const rect =
                                                                        e.currentTarget.getBoundingClientRect();
                                                                    setStatusDropdownPos(
                                                                        {
                                                                            top:
                                                                                rect.bottom +
                                                                                window.scrollY -
                                                                                30,
                                                                            left:
                                                                                rect.left +
                                                                                rect.width /
                                                                                    2 +
                                                                                window.scrollX,
                                                                        },
                                                                    );
                                                                    setEditing2307Id(
                                                                        officialReceipt.id,
                                                                    );
                                                                }}
                                                                className={`flex justify-center ${
                                                                    user?.role_name !==
                                                                        "viewer" &&
                                                                    officialReceipt
                                                                        ? "cursor-pointer"
                                                                        : "cursor-default"
                                                                }`}
                                                            >
                                                                <StatusBadge
                                                                    status={
                                                                        form2307Status ??
                                                                        "pending"
                                                                    }
                                                                />
                                                            </div>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                {user?.role_name !==
                                                    "viewer" && (
                                                    <>
                                                        <td className="border-b border-gray-200 px-4 py-2">
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() =>
                                                                        setInvoicePayment(
                                                                            p,
                                                                        )
                                                                    }
                                                                    className="group relative inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all duration-150 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-md active:scale-95 cursor-pointer"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faFileInvoice
                                                                        }
                                                                        className="h-3 w-3"
                                                                    />
                                                                    <span>
                                                                        Invoice
                                                                    </span>
                                                                </button>

                                                                {isPaid && (
                                                                    <button
                                                                        onClick={() =>
                                                                            setOrPayment(
                                                                                p,
                                                                            )
                                                                        }
                                                                        className="group relative inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md active:scale-95 cursor-pointer"
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                faReceipt
                                                                            }
                                                                            className="h-3 w-3"
                                                                        />
                                                                        <span>
                                                                            Issue
                                                                            OR
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={11}
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

            {invoicePayment && (
                <InvoiceModal
                    payment={invoicePayment}
                    scheduleIndex={invoicePayment.schedule_index}
                    totalSchedules={invoicePayment.total_schedules}
                    onClose={() => setInvoicePayment(null)}
                />
            )}

            {orPayment && (
                <OfficialReceiptModal
                    payment={orPayment}
                    onClose={() => setOrPayment(null)}
                    onSaved={() => {
                        setOrPayment(null);
                        getPaymentSchedules();
                        setNotification("Official Receipt saved");
                    }}
                />
            )}
        </>
    );
}
