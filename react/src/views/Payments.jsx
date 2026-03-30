import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDownload,
    faFileInvoice,
    faReceipt,
    faChevronDown,
    faFileInvoiceDollar,
} from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge";
import InvoiceModal from "../components/InvoiceModal";
import OfficialReceiptModal from "../components/OfficialReceiptModal";
import ManualInvoiceModal from "../components/ManualInvoiceModal";
import Form2307Modal from "../components/Form2307Modal";

export default function Payments() {
    const [company, setCompany] = useState(null);
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [projects, setProjects] = useState([]);
    const [invoicePayment, setInvoicePayment] = useState(null);
    const [orPayment, setOrPayment] = useState(null);
    const [manualInvoicePayment, setManualInvoicePayment] = useState(null);
    const [form2307Payment, setForm2307Payment] = useState(null);
    const [loading, setLoading] = useState(false);
    const { setNotification, user } = useStateContext();
    const [editingId, setEditingId] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selected2307Status, setSelected2307Status] = useState("");
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

    // Fetch company
    useEffect(() => {
        axiosClient
            .get("/company")
            .then(({ data }) => setCompany(data))
            .catch(() => setNotification("Failed to load company data"));
    }, []);

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
            const payload = { status: newStatus };

            // Calculate amounts when marking as paid
            if (newStatus === "paid") {
                const vatType =
                    currentPayment.clientsProject?.vat_type ?? "vat_exempt";
                const isVatExclusive = vatType === "vat_exclusive";
                const isVatInclusive = vatType === "vat_inclusive";

                const expectedAmount =
                    parseFloat(currentPayment.expected_amount) || 0;
                const subtotal =
                    isVatInclusive || isVatExclusive
                        ? expectedAmount / 1.12
                        : expectedAmount;
                const vatAmount =
                    isVatInclusive || isVatExclusive ? subtotal * 0.12 : 0;
                const total = subtotal + vatAmount;

                const clientType =
                    currentPayment.clientsProject?.client?.company_type ?? "";
                const annualGross = parseFloat(company?.annual_gross) || 0;

                const getWithholdingRate = () => {
                    if (clientType === "Private Corp") {
                        return annualGross >= 3_000_000 ? 0.02 : 0.01;
                    }
                    if (clientType === "Government") return 0.01;
                    return 0;
                };

                const withholdingRate = getWithholdingRate();
                const withholdingBase =
                    clientType === "Government" ? total : subtotal;
                const withholdingTax = withholdingBase * withholdingRate;
                const netAmount = total - withholdingTax;

                payload.amount_paid = netAmount;
                payload.wh_tax = withholdingTax;
            }

            axiosClient
                .put(`/payment-schedules/${scheduleId}/status`, payload)
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

    // Close dropdown on outside click
    useEffect(() => {
        const close = () => {
            setEditingId(null);
        };
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    const filteredSchedules = paymentSchedules.filter((p) => {
        const isPaid = p.status === "paid";
        const form2307Status = p.transaction?.officialReceipt?.form2307
            ? "issued"
            : "pending";

        const matchesStatus = !selectedStatus || p.status === selectedStatus;
        const matches2307 =
            !selected2307Status ||
            (isPaid && form2307Status === selected2307Status);

        return matchesStatus && matches2307;
    });

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
            const SIOrACKNo =
                p.transaction?.officialReceipt?.service_invoice_number ||
                p.transaction?.officialReceipt
                    ?.payment_acknowledgement_number ||
                "";

            const form2307Status = isPaid
                ? p.transaction?.officialReceipt?.form2307
                    ? "issued"
                    : "pending"
                : "";

            return [
                p.id,
                p.clientsProject?.client?.name ?? "",
                p.clientsProject?.project?.title ?? "",
                p.expected_amount,
                formatPaymentType(paymentType),
                p.due_date ?? "",
                p.status,
                isPaid ? SIOrACKNo || "No O.R. issued" : "-",
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

    const tableHeaders = [
        { key: "Due Date" },
        { key: "Client Name" },
        { key: "Project Name" },
        { key: "Payment Details" },
        {
            key: "Status",
            render: () => (
                <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <div className="relative">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-black"
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="ended">Ended</option>
                        </select>
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`h-3 w-3 transition-colors ${selectedStatus ? "text-yellow-300" : "text-white/70"} text-xs`}
                        />
                    </div>
                </div>
            ),
        },
        { key: "S.I/ACK No." },
        {
            key: "2307 Status",
            render: () => (
                <div className="flex items-center justify-center gap-1">
                    <span>2307 Status</span>
                    <div className="relative">
                        <select
                            value={selected2307Status}
                            onChange={(e) =>
                                setSelected2307Status(e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-black"
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="issued">Issued</option>
                        </select>
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`h-3 w-3 transition-colors ${selected2307Status ? "text-yellow-300" : "text-white/70"} text-xs`}
                        />
                    </div>
                </div>
            ),
        },
        { key: "Action" },
    ];

    const columnCount = tableHeaders.filter(
        (h) => !(h.key === "Action" && user?.role_name === "viewer"),
    ).length;

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
                                setSelectedStatus("");
                                setSelected2307Status("");
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
                                {tableHeaders.map((header) => {
                                    if (
                                        header.key === "Action" &&
                                        user?.role_name === "viewer"
                                    )
                                        return null;
                                    return (
                                        <th
                                            key={header.key}
                                            className="px-4 py-2 text-white text-sm font-medium"
                                        >
                                            {header.render
                                                ? header.render()
                                                : header.key}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={columnCount}
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
                                    filteredSchedules.map((p) => {
                                        const isPaid = p.status === "paid";
                                        const officialReceipt =
                                            p.transaction?.officialReceipt;
                                        const SIOrACKNo =
                                            officialReceipt?.service_invoice_number ||
                                            officialReceipt?.payment_acknowledgement_number ||
                                            "";
                                        const form2307Status =
                                            officialReceipt?.form2307
                                                ? "issued"
                                                : "pending";

                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-cyan-50 text-center"
                                            >
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {p.due_date || "-"}
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
                                                                const dropdownHeight = 140;
                                                                const spaceBelow =
                                                                    window.innerHeight -
                                                                    rect.bottom;

                                                                setDropdownPos({
                                                                    top:
                                                                        spaceBelow <
                                                                        dropdownHeight
                                                                            ? rect.top -
                                                                              dropdownHeight // open upward
                                                                            : rect.bottom, // open downward
                                                                    left:
                                                                        rect.left +
                                                                        rect.width /
                                                                            2,
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
                                                                status={
                                                                    p.status
                                                                }
                                                                isEnded={
                                                                    p.isEnded
                                                                }
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

                                                {/* O.R # Column */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {isPaid ? (
                                                        SIOrACKNo ? (
                                                            <span className="text-s font-mono text-gray-700">
                                                                {SIOrACKNo}
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

                                                {/* 2307 Status Column - read only */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {isPaid ? (
                                                        <div className="flex justify-center">
                                                            <StatusBadge
                                                                status={
                                                                    form2307Status
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {user?.role_name !==
                                                    "viewer" && (
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        <div className="relative flex justify-center">
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    const rect =
                                                                        e.currentTarget.getBoundingClientRect();
                                                                    const dropdownHeight = 65; // approximate height of the dropdown
                                                                    const spaceBelow =
                                                                        window.innerHeight -
                                                                        rect.bottom;

                                                                    setDropdownPos(
                                                                        {
                                                                            top:
                                                                                spaceBelow <
                                                                                dropdownHeight
                                                                                    ? rect.top -
                                                                                      dropdownHeight
                                                                                    : rect.bottom,
                                                                            left: rect.right,
                                                                        },
                                                                    );
                                                                    setEditingId(
                                                                        editingId ===
                                                                            `action-${p.id}`
                                                                            ? null
                                                                            : `action-${p.id}`,
                                                                    );
                                                                }}
                                                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 cursor-pointer"
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

                                                            {editingId ===
                                                                `action-${p.id}` && (
                                                                <div
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
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
                                                                    className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-md min-w-[130px]"
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            setInvoicePayment(
                                                                                p,
                                                                            );
                                                                            setEditingId(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                faFileInvoice
                                                                            }
                                                                            className="h-3 w-3"
                                                                        />
                                                                        Invoice
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setManualInvoicePayment(
                                                                                p,
                                                                            );
                                                                            setEditingId(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                faFileInvoice
                                                                            }
                                                                            className="h-3 w-3"
                                                                        />
                                                                        Manual
                                                                        Invoice
                                                                    </button>

                                                                    {isPaid && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setOrPayment(
                                                                                    p,
                                                                                );
                                                                                setEditingId(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer"
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faReceipt
                                                                                }
                                                                                className="h-3 w-3"
                                                                            />
                                                                            Issue
                                                                            O.R.
                                                                        </button>
                                                                    )}

                                                                    {isPaid &&
                                                                        SIOrACKNo && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setForm2307Payment(
                                                                                        p,
                                                                                    );
                                                                                    setEditingId(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-700 cursor-pointer"
                                                                            >
                                                                                <FontAwesomeIcon
                                                                                    icon={
                                                                                        faFileInvoiceDollar
                                                                                    }
                                                                                    className="h-3 w-3"
                                                                                />
                                                                                {p
                                                                                    .transaction
                                                                                    ?.officialReceipt
                                                                                    ?.form2307
                                                                                    ? "Edit 2307"
                                                                                    : "Issue 2307"}
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={columnCount}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No payments match the selected
                                            filters
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
                    company={company}
                    onClose={() => setInvoicePayment(null)}
                />
            )}

            {manualInvoicePayment && (
                <ManualInvoiceModal
                    payment={manualInvoicePayment}
                    company={company}
                    onClose={() => setManualInvoicePayment(null)}
                />
            )}

            {orPayment && (
                <OfficialReceiptModal
                    payment={orPayment}
                    scheduleIndex={orPayment.schedule_index}
                    company={company}
                    onClose={() => setOrPayment(null)}
                    onSaved={() => {
                        setOrPayment(null);
                        getPaymentSchedules();
                        setNotification("Official Receipt saved");
                    }}
                />
            )}

            {form2307Payment && (
                <Form2307Modal
                    payment={form2307Payment}
                    onClose={() => setForm2307Payment(null)}
                    onSaved={() => {
                        setForm2307Payment(null);
                        getPaymentSchedules();
                        setNotification("BIR Form 2307 saved");
                    }}
                />
            )}
        </>
    );
}
