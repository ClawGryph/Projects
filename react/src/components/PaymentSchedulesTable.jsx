import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFileInvoice,
    faReceipt,
    faChevronLeft,
    faChevronRight,
    faFileInvoiceDollar,
    faUpload,
    faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "./StatusBadge";
import InvoiceModal from "./InvoiceModal";
import OfficialReceiptModal from "./OfficialReceiptModal";
import ManualInvoiceModal from "./ManualInvoiceModal";
import Form2307Modal from "./Form2307Modal";
import UploadFileModal from "./UploadFileModal";
import PaidPaymentModal from "./PaidPaymentModal";

export default function PaymentSchedulesTable({
    paymentSchedules = [],
    pagination = null, // { current_page, last_page, total, per_page }
    manualInvoiceTotals = {},
    company,
    user,
    onRefresh,
    onPageChange, // (page) => void
    setNotification,
    showClientColumn = true,
}) {
    const [editingId, setEditingId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [invoicePayment, setInvoicePayment] = useState(null);
    const [orPayment, setOrPayment] = useState(null);
    const [manualInvoicePayment, setManualInvoicePayment] = useState(null);
    const [form2307Payment, setForm2307Payment] = useState(null);
    const [uploadOrTransaction, setUploadOrTransaction] = useState(null);
    const [paidPayment, setPaidPayment] = useState(null);

    const formatPaymentType = (type) => {
        if (!type) return "";
        return type
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const tableHeaders = [
        { key: "Invoice No." },
        { key: "Due Date" },
        ...(showClientColumn ? [{ key: "Client Name" }] : []),
        { key: "Service" },
        { key: "Service Name" },
        { key: "Coverage Period" },
        { key: "Payment Details" },
        { key: "Status" },
        { key: "S.I/ACK No." },
        { key: "S.I/ACK Upload" },
        { key: "2307 Status" },
        { key: "2307 Upload" },
        { key: "Action" },
    ];

    const columnCount = tableHeaders.filter(
        (h) => !(h.key === "Action" && user?.role_name === "viewer"),
    ).length;

    const currentPage = pagination?.current_page ?? 1;
    const lastPage = pagination?.last_page ?? 1;
    const total = pagination?.total ?? paymentSchedules.length;
    const perPage = pagination?.per_page ?? 15;
    const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, total);

    const getPageNumbers = () => {
        const pages = [];
        const delta = 2;
        const left = currentPage - delta;
        const right = currentPage + delta;

        for (let i = 1; i <= lastPage; i++) {
            if (i === 1 || i === lastPage || (i >= left && i <= right)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    };

    return (
        <>
            <div
                className="w-full overflow-auto rounded-lg mt-5"
                style={{ maxHeight: "calc(100vh - 270px)" }}
            >
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
                                        {header.key}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paymentSchedules.length > 0 ? (
                            paymentSchedules.map((p) => {
                                const isProject = !!p.clientsProject?.project;
                                const isPaid = p.status === "paid";
                                const SIOrACKNo = p.is_or_issued
                                    ? p.transaction?.officialReceipt
                                          ?.service_invoice_number ||
                                      p.transaction?.officialReceipt
                                          ?.payment_acknowledgement_number ||
                                      ""
                                    : "";
                                const form2307Status = p.is_form2307_issued
                                    ? "issued"
                                    : "pending";
                                const hasActions =
                                    p.is_invoice_generated ||
                                    isPaid ||
                                    (isPaid && !!p.is_or_issued);

                                const startCoverage = formatDate(
                                    p.start_coverage,
                                );
                                const endCoverage = formatDate(p.end_coverage);

                                return (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-cyan-50 text-center"
                                    >
                                        <td className="border-b border-gray-200 px-4 py-2">
                                            {p.invoice_number ? (
                                                <span className="text-xs font-mono text-gray-700">
                                                    {p.invoice_number}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            <span className="text-xs font-mono text-gray-700">
                                                {p.due_date || "-"}
                                            </span>
                                        </td>

                                        {showClientColumn && (
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.clientsProject?.client?.name}
                                            </td>
                                        )}

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isProject ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                                            >
                                                {isProject
                                                    ? "Project"
                                                    : "Subscription"}
                                            </span>
                                        </td>

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            {p.clientsProject?.project?.title ??
                                                p.clientsProject?.subscription
                                                    ?.title ??
                                                "—"}
                                        </td>

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            {startCoverage || endCoverage ? (
                                                <div className="text-xs text-gray-700">
                                                    <div>
                                                        {startCoverage ?? "—"}
                                                    </div>
                                                    <div className="text-gray-400 text-[10px]">
                                                        to
                                                    </div>
                                                    <div>
                                                        {endCoverage ?? "—"}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            <div className="font-semibold">
                                                ₱
                                                {new Intl.NumberFormat(
                                                    "en-PH",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    },
                                                ).format(
                                                    parseFloat(
                                                        p.total_amount,
                                                    ) || 0,
                                                )}
                                            </div>
                                            {manualInvoiceTotals[p.id] > 0 && (
                                                <div className="text-xs text-cyan-600">
                                                    +₱
                                                    {new Intl.NumberFormat(
                                                        "en-PH",
                                                    ).format(
                                                        manualInvoiceTotals[
                                                            p.id
                                                        ],
                                                    )}{" "}
                                                    additional
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500">
                                                {formatPaymentType(
                                                    isProject
                                                        ? p.clientsProject
                                                              ?.project
                                                              ?.payment_type
                                                        : p.clientsProject
                                                              ?.subscription
                                                              ?.frequency,
                                                )}
                                            </div>
                                        </td>

                                        <td className="border-b border-gray-200 px-4 py-2 relative">
                                            <div className="inline-flex items-center justify-center">
                                                <StatusBadge
                                                    status={p.status}
                                                    isEnded={p.isEnded}
                                                />
                                            </div>
                                        </td>

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

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            {isPaid ? (
                                                <div className="flex justify-center">
                                                    <StatusBadge
                                                        status={
                                                            p.transaction
                                                                ?.officialReceipt
                                                                ?.or_file_url
                                                                ? "uploaded"
                                                                : "pending"
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            {isPaid ? (
                                                <div className="flex justify-center">
                                                    <StatusBadge
                                                        status={form2307Status}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="border-b border-gray-200 px-4 py-2">
                                            {isPaid ? (
                                                <div className="flex justify-center">
                                                    <StatusBadge
                                                        status={
                                                            p.transaction
                                                                ?.officialReceipt
                                                                ?.form2307_file_url
                                                                ? "uploaded"
                                                                : "pending"
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        {user?.role_name !== "viewer" && (
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <div className="relative flex justify-center">
                                                    {hasActions ? (
                                                        <>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    const rect =
                                                                        e.currentTarget.getBoundingClientRect();
                                                                    const dropdownHeight = 65;
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
                                                                    className="z-50 bg-white border border-gray-200 rounded-md shadow-md min-w-[130px]"
                                                                >
                                                                    {p.is_invoice_generated && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setInvoicePayment(
                                                                                    p,
                                                                                );
                                                                                setEditingId(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faFileInvoice
                                                                                }
                                                                                className="h-3 w-3"
                                                                            />{" "}
                                                                            Invoice
                                                                        </button>
                                                                    )}
                                                                    {p.is_invoice_generated && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setManualInvoicePayment(
                                                                                    p,
                                                                                );
                                                                                setEditingId(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faFileInvoice
                                                                                }
                                                                                className="h-3 w-3"
                                                                            />{" "}
                                                                            Manual
                                                                            Invoice
                                                                        </button>
                                                                    )}
                                                                    {p.is_invoice_generated &&
                                                                        !isPaid && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setPaidPayment(
                                                                                        p,
                                                                                    );
                                                                                    setEditingId(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 cursor-pointer"
                                                                            >
                                                                                <FontAwesomeIcon
                                                                                    icon={
                                                                                        faMoneyBillWave
                                                                                    }
                                                                                    className="h-3 w-3"
                                                                                />
                                                                                Paid
                                                                                Payment
                                                                            </button>
                                                                        )}
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
                                                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faReceipt
                                                                                }
                                                                                className="h-3 w-3"
                                                                            />{" "}
                                                                            Issue
                                                                            O.R.
                                                                        </button>
                                                                    )}
                                                                    {isPaid &&
                                                                        !!p.is_or_issued && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setUploadOrTransaction(
                                                                                        p.transaction,
                                                                                    );
                                                                                    setEditingId(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-sky-600 hover:bg-sky-50 cursor-pointer"
                                                                            >
                                                                                <FontAwesomeIcon
                                                                                    icon={
                                                                                        faUpload
                                                                                    }
                                                                                    className="h-3 w-3"
                                                                                />{" "}
                                                                                Upload
                                                                                O.R.
                                                                            </button>
                                                                        )}
                                                                    {isPaid &&
                                                                        !!p.is_or_issued && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setForm2307Payment(
                                                                                        p,
                                                                                    );
                                                                                    setEditingId(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 cursor-pointer"
                                                                            >
                                                                                <FontAwesomeIcon
                                                                                    icon={
                                                                                        faFileInvoiceDollar
                                                                                    }
                                                                                    className="h-3 w-3"
                                                                                />{" "}
                                                                                {p.is_form2307_issued
                                                                                    ? "Edit 2307"
                                                                                    : "Assign 2307"}
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">
                                                            —
                                                        </span>
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
                                    No payment schedules found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && lastPage > 1 && (
                <div className="flex items-center justify-between mt-3 px-1">
                    <p className="text-xs text-gray-500">
                        Showing{" "}
                        <span className="font-medium text-gray-700">
                            {from}–{to}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-gray-700">
                            {total}
                        </span>{" "}
                        results
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <FontAwesomeIcon
                                icon={faChevronLeft}
                                className="h-3 w-3"
                            />
                        </button>

                        {getPageNumbers().map((page, i) =>
                            page === "..." ? (
                                <span
                                    key={`ellipsis-${i}`}
                                    className="px-1 text-gray-400 text-xs"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition ${
                                        page === currentPage
                                            ? "bg-cyan-800 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {page}
                                </button>
                            ),
                        )}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === lastPage}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <FontAwesomeIcon
                                icon={faChevronRight}
                                className="h-3 w-3"
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
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
                    onClose={() => setManualInvoicePayment(null)}
                    onRefresh={onRefresh}
                />
            )}
            {orPayment && (
                <OfficialReceiptModal
                    payment={orPayment}
                    scheduleIndex={orPayment.schedule_index}
                    onClose={() => setOrPayment(null)}
                    onSaved={() => {
                        setOrPayment(null);
                        onRefresh();
                        setNotification("Official Receipt saved");
                    }}
                />
            )}
            {uploadOrTransaction && (
                <UploadFileModal
                    transaction={uploadOrTransaction}
                    orOnly={true}
                    onClose={() => setUploadOrTransaction(null)}
                    onSaved={() => {
                        setUploadOrTransaction(null);
                        onRefresh();
                        setNotification("O.R. file uploaded successfully");
                    }}
                />
            )}
            {form2307Payment && (
                <Form2307Modal
                    payment={form2307Payment}
                    onClose={() => setForm2307Payment(null)}
                    onSaved={() => {
                        setForm2307Payment(null);
                        onRefresh();
                        setNotification("BIR Form 2307 saved");
                    }}
                />
            )}
            {paidPayment && (
                <PaidPaymentModal
                    payment={paidPayment}
                    company={company}
                    onClose={() => setPaidPayment(null)}
                    onSaved={() => {
                        setPaidPayment(null);
                        onRefresh();
                        setNotification("Payment recorded successfully");
                    }}
                />
            )}
        </>
    );
}
