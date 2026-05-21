import { useState, useEffect, Fragment } from "react";
import axiosClient from "../axios-client";
import StatusBadge from "../components/StatusBadge";

export default function MismatchReportTable({ transactions = [] }) {
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [mismatches, setMismatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notesModal, setNotesModal] = useState({
        open: false,
        mismatch: null,
        text: "",
    });
    const [savingNotes, setSavingNotes] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        Promise.all([
            axiosClient.get("/payment-schedules", {
                params: { status: "paid" },
            }),
            axiosClient.get("/mismatch-reports"),
        ])
            .then(([psRes, mmRes]) => {
                const ps = psRes.data?.data ?? psRes.data ?? [];
                const mm = mmRes.data?.data ?? mmRes.data ?? [];
                setPaymentSchedules(ps);
                setMismatches(mm);
            })
            .finally(() => setLoading(false));
    }, []);

    const toggleRow = (id) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(parseFloat(val) || 0);

    const mismatchedSchedules = paymentSchedules.filter((p) => {
        const totalSI =
            parseFloat(p.transaction?.officialReceipt?.total_amount) || 0;
        const totalPaid = parseFloat(p.transaction?.net_amount) || 0;
        return p.status === "paid" && p.is_or_issued && totalPaid !== totalSI;
    });

    const getMismatchRecord = (p) =>
        mismatches.find(
            (m) =>
                m.payment_schedule_id === p.id ||
                m.transaction_id === p.transaction?.id ||
                m.official_receipt_id === p.transaction?.officialReceipt?.id,
        );

    const formatPaymentType = (p) => {
        const isProject = !!p.clientsProject?.project;
        return isProject ? "Project" : "Subscription";
    };

    const openNotesModal = (p) => {
        const record = getMismatchRecord(p);
        setNotesModal({
            open: true,
            mismatch: record,
            paymentSchedule: p,
            text: record?.notes ?? "",
        });
    };

    const closeNotesModal = () =>
        setNotesModal({
            open: false,
            mismatch: null,
            paymentSchedule: null,
            text: "",
        });

    const handleSaveNotes = () => {
        const { mismatch, paymentSchedule, text } = notesModal;
        setSavingNotes(true);

        const request = mismatch
            ? axiosClient.patch(`/mismatch-reports/${mismatch.id}`, {
                  notes: text,
              })
            : axiosClient.post("/mismatch-reports", {
                  payment_schedule_id: paymentSchedule.id,
                  transaction_id: paymentSchedule.transaction?.id,
                  official_receipt_id:
                      paymentSchedule.transaction?.officialReceipt?.id,
                  total_paid:
                      parseFloat(paymentSchedule.transaction?.net_amount) || 0,
                  total_si:
                      parseFloat(
                          paymentSchedule.transaction?.officialReceipt
                              ?.total_amount,
                      ) || 0,
                  notes: text,
              });

        request
            .then(({ data }) => {
                setMismatches((prev) => {
                    const exists = prev.find((m) => m.id === data.id);
                    return exists
                        ? prev.map((m) => (m.id === data.id ? data : m))
                        : [...prev, data];
                });
                closeNotesModal();
            })
            .finally(() => setSavingNotes(false));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                Loading...
            </div>
        );
    }

    return (
        <div className="w-full p-5">
            <div className="w-full overflow-auto rounded-lg border border-gray-200">
                <table className="w-full bg-white border-separate border-spacing-0 text-sm">
                    <thead className="sticky top-0 z-20 bg-cyan-800">
                        <tr>
                            {[
                                "Invoice no.",
                                "S.I/ACK no.",
                                "Service type",
                                "Service name",
                                "Client name",
                                "Total service",
                                "Total invoice",
                                "Total paid",
                                "Total S.I/ACK",
                                "Status",
                                "Action",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-2 text-white text-sm font-medium text-left whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {mismatchedSchedules.length > 0 ? (
                            mismatchedSchedules.map((p) => {
                                const isProject = !!p.clientsProject?.project;
                                const vatType = p.clientsProject?.vat_type;
                                const rawAmount =
                                    parseFloat(p.base_amount) || 0;
                                const totalService =
                                    vatType === "vat_inclusive"
                                        ? rawAmount / 1.12
                                        : rawAmount;
                                const totalInvoice =
                                    parseFloat(p.total_amount) || 0;
                                const totalSI =
                                    parseFloat(
                                        p.transaction?.officialReceipt
                                            ?.total_amount,
                                    ) || 0;
                                const totalPaid =
                                    parseFloat(p.transaction?.net_amount) || 0;

                                const siOrAckNo =
                                    p.transaction?.officialReceipt
                                        ?.service_invoice_number ||
                                    p.transaction?.officialReceipt
                                        ?.payment_acknowledgement_number ||
                                    "—";

                                const serviceName =
                                    p.clientsProject?.project?.title ??
                                    p.clientsProject?.subscription?.title ??
                                    "—";

                                const clientName =
                                    p.clientsProject?.client?.name ?? "—";
                                const mismatchRecord = getMismatchRecord(p);
                                const isChecked =
                                    mismatchRecord?.is_checked ?? false;
                                const isExpanded = expandedRows.has(p.id);

                                return (
                                    <Fragment key={p.id}>
                                        <tr className="hover:bg-red-50 transition-colors">
                                            {/* Invoice no. with toggle chevron */}
                                            <td className="border-b border-gray-200 px-4 py-2 font-mono text-xs text-gray-700">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() =>
                                                            toggleRow(p.id)
                                                        }
                                                        className="text-gray-400 hover:text-cyan-700 transition-colors"
                                                    >
                                                        <svg
                                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M9 5l7 7-7 7"
                                                            />
                                                        </svg>
                                                    </button>
                                                    {p.invoice_number ?? "—"}
                                                </div>
                                            </td>

                                            <td className="border-b border-gray-200 px-4 py-2 font-mono text-xs text-gray-700">
                                                {siOrAckNo}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <span
                                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                        isProject
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-purple-100 text-purple-700"
                                                    }`}
                                                >
                                                    {formatPaymentType(p)}
                                                </span>
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                                                {serviceName}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                                                {clientName}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                                ₱{formatCurrency(totalService)}
                                            </td>

                                            {/* Total invoice — clickable */}
                                            <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                                <button
                                                    onClick={() =>
                                                        toggleRow(p.id)
                                                    }
                                                    className="hover:text-cyan-700 transition-colors"
                                                >
                                                    ₱
                                                    {formatCurrency(
                                                        totalInvoice,
                                                    )}
                                                </button>
                                            </td>

                                            {/* Total paid — clickable */}
                                            <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                                <button
                                                    onClick={() =>
                                                        toggleRow(p.id)
                                                    }
                                                    className="hover:text-cyan-700 transition-colors"
                                                >
                                                    ₱
                                                    {formatCurrency(
                                                        p.transaction
                                                            ?.paid_amount,
                                                    )}
                                                </button>
                                            </td>

                                            {/* Total S.I/ACK — clickable */}
                                            <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                                <button
                                                    onClick={() =>
                                                        toggleRow(p.id)
                                                    }
                                                    className="hover:text-cyan-700 transition-colors"
                                                >
                                                    ₱{formatCurrency(totalSI)}
                                                </button>
                                            </td>

                                            {/* Status */}
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <div className="relative inline-flex items-center gap-1 cursor-pointer">
                                                    <select
                                                        value={
                                                            isChecked
                                                                ? "mismatch_checked"
                                                                : "pending"
                                                        }
                                                        onChange={(e) => {
                                                            const newIsChecked =
                                                                e.target
                                                                    .value ===
                                                                "mismatch_checked";
                                                            const record =
                                                                getMismatchRecord(
                                                                    p,
                                                                );
                                                            const request =
                                                                record
                                                                    ? axiosClient.patch(
                                                                          `/mismatch-reports/${record.id}`,
                                                                          {
                                                                              is_checked:
                                                                                  newIsChecked,
                                                                          },
                                                                      )
                                                                    : axiosClient.post(
                                                                          "/mismatch-reports",
                                                                          {
                                                                              payment_schedule_id:
                                                                                  p.id,
                                                                              transaction_id:
                                                                                  p
                                                                                      .transaction
                                                                                      ?.id,
                                                                              official_receipt_id:
                                                                                  p
                                                                                      .transaction
                                                                                      ?.officialReceipt
                                                                                      ?.id,
                                                                              total_paid:
                                                                                  parseFloat(
                                                                                      p
                                                                                          .transaction
                                                                                          ?.net_amount,
                                                                                  ) ||
                                                                                  0,
                                                                              total_si:
                                                                                  parseFloat(
                                                                                      p
                                                                                          .transaction
                                                                                          ?.officialReceipt
                                                                                          ?.total_amount,
                                                                                  ) ||
                                                                                  0,
                                                                              is_checked:
                                                                                  newIsChecked,
                                                                          },
                                                                      );
                                                            request.then(
                                                                ({ data }) => {
                                                                    setMismatches(
                                                                        (
                                                                            prev,
                                                                        ) => {
                                                                            const exists =
                                                                                prev.find(
                                                                                    (
                                                                                        m,
                                                                                    ) =>
                                                                                        m.id ===
                                                                                        data.id,
                                                                                );
                                                                            return exists
                                                                                ? prev.map(
                                                                                      (
                                                                                          m,
                                                                                      ) =>
                                                                                          m.id ===
                                                                                          data.id
                                                                                              ? data
                                                                                              : m,
                                                                                  )
                                                                                : [
                                                                                      ...prev,
                                                                                      data,
                                                                                  ];
                                                                        },
                                                                    );
                                                                },
                                                            );
                                                        }}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    >
                                                        <option value="pending">
                                                            Pending
                                                        </option>
                                                        <option value="mismatch_checked">
                                                            Mismatch Checked
                                                        </option>
                                                    </select>
                                                    <StatusBadge
                                                        status={
                                                            isChecked
                                                                ? "mismatch_checked"
                                                                : "pending"
                                                        }
                                                    />
                                                    <svg
                                                        className="w-3 h-3 text-gray-400 shrink-0"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <button
                                                    onClick={() =>
                                                        openNotesModal(p)
                                                    }
                                                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition-colors whitespace-nowrap"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="w-3.5 h-3.5"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                                                    </svg>
                                                    {mismatchRecord?.notes
                                                        ? "Edit Notes"
                                                        : "Add Notes"}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Breakdown row — rendered as a sibling <tr> inside the fragment */}
                                        {isExpanded && (
                                            <tr
                                                key={`${p.id}-breakdown`}
                                                className="bg-slate-50"
                                            >
                                                <td
                                                    colSpan={11}
                                                    className="px-6 py-4 border-b border-gray-200"
                                                >
                                                    <div className="grid grid-cols-3 gap-6">
                                                        {/* Invoice Breakdown */}
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                                Invoice
                                                                Breakdown
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-xs text-gray-600">
                                                                    <span>
                                                                        Base
                                                                        amount
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            p.base_amount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-gray-600">
                                                                    <span>
                                                                        VAT
                                                                        (12%)
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            p.vat_amount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {p.manualInvoice
                                                                    ?.items
                                                                    ?.length >
                                                                    0 && (
                                                                    <div className="mt-1 space-y-1">
                                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                                            Add-ons
                                                                            (manual
                                                                            invoice)
                                                                        </p>
                                                                        {p.manualInvoice.items.map(
                                                                            (
                                                                                addon,
                                                                                idx,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    className="flex justify-between text-xs text-cyan-600"
                                                                                >
                                                                                    <span>
                                                                                        {addon.description ??
                                                                                            "—"}
                                                                                    </span>
                                                                                    <span className="font-mono">
                                                                                        +₱
                                                                                        {formatCurrency(
                                                                                            addon.unitPrice,
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between text-xs font-semibold text-gray-800 border-t border-gray-200 pt-1.5 mt-1">
                                                                    <span>
                                                                        Total
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            totalInvoice,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Payment Breakdown */}
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                                Payment
                                                                Breakdown
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-xs text-gray-600">
                                                                    <span>
                                                                        Base
                                                                        amount
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            p.base_amount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-gray-600">
                                                                    <span>
                                                                        VAT
                                                                        (12%)
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            p
                                                                                .transaction
                                                                                ?.vat_amount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {p.manualInvoice
                                                                    ?.items
                                                                    ?.length >
                                                                    0 && (
                                                                    <div className="mt-1 space-y-1">
                                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                                            Add-ons
                                                                            (manual
                                                                            invoice)
                                                                        </p>
                                                                        {p.manualInvoice.items.map(
                                                                            (
                                                                                addon,
                                                                                idx,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    className="flex justify-between text-xs text-cyan-600"
                                                                                >
                                                                                    <span>
                                                                                        {addon.description ??
                                                                                            "—"}
                                                                                    </span>
                                                                                    <span className="font-mono">
                                                                                        +₱
                                                                                        {formatCurrency(
                                                                                            addon.unitPrice,
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="border-t border-gray-200 pt-1.5 mt-1 space-y-1">
                                                                    <div className="flex justify-between text-xs font-semibold text-gray-800">
                                                                        <span>
                                                                            Gross
                                                                            amount
                                                                        </span>
                                                                        <span className="font-mono">
                                                                            ₱
                                                                            {formatCurrency(
                                                                                p
                                                                                    .transaction
                                                                                    ?.gross_amount,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs font-semibold text-gray-800">
                                                                        <span>
                                                                            Paid
                                                                            Amount
                                                                        </span>
                                                                        <span className="font-mono">
                                                                            ₱
                                                                            {formatCurrency(
                                                                                p
                                                                                    .transaction
                                                                                    ?.paid_amount,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* S.I/ACK Breakdown */}
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                                S.I / ACK
                                                                Breakdown
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-xs text-gray-600">
                                                                    <span>
                                                                        Base
                                                                        amount
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            p
                                                                                .transaction
                                                                                ?.officialReceipt
                                                                                ?.base_amount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-gray-600">
                                                                    <span>
                                                                        VAT
                                                                        (12%)
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            p
                                                                                .transaction
                                                                                ?.officialReceipt
                                                                                ?.vat_amount,
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {/* Add-ons */}
                                                                {p.manualInvoice
                                                                    ?.items
                                                                    ?.length >
                                                                    0 && (
                                                                    <div className="mt-1 space-y-1">
                                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                                            Add-ons
                                                                            (manual
                                                                            invoice)
                                                                        </p>
                                                                        {p.manualInvoice.items.map(
                                                                            (
                                                                                addon,
                                                                                idx,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    className="flex justify-between text-xs text-cyan-600"
                                                                                >
                                                                                    <span>
                                                                                        {addon.description ??
                                                                                            "—"}
                                                                                    </span>
                                                                                    <span className="font-mono">
                                                                                        +₱
                                                                                        {formatCurrency(
                                                                                            addon.unitPrice,
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between text-xs font-semibold text-gray-800 border-b border-gray-200 pb-1.5 mb-1.5">
                                                                    <span>
                                                                        Gross
                                                                        amount
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            p
                                                                                .transaction
                                                                                ?.gross_amount,
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {/* Withholding tax */}
                                                                {parseFloat(
                                                                    p
                                                                        .transaction
                                                                        ?.officialReceipt
                                                                        ?.wh_tax,
                                                                ) > 0 && (
                                                                    <div className="flex justify-between text-xs text-red-500">
                                                                        <span>
                                                                            Withholding
                                                                            tax
                                                                        </span>
                                                                        <span className="font-mono">
                                                                            −₱
                                                                            {formatCurrency(
                                                                                p
                                                                                    .transaction
                                                                                    ?.officialReceipt
                                                                                    ?.wh_tax,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {parseFloat(
                                                                    p
                                                                        .transaction
                                                                        ?.officialReceipt
                                                                        ?.other,
                                                                ) !== 0 && (
                                                                    <div className="flex justify-between text-xs text-gray-600">
                                                                        <span>
                                                                            {p
                                                                                .transaction
                                                                                ?.officialReceipt
                                                                                ?.other_label ||
                                                                                "Other"}
                                                                        </span>
                                                                        <span className="font-mono">
                                                                            {parseFloat(
                                                                                p
                                                                                    .transaction
                                                                                    ?.officialReceipt
                                                                                    ?.other,
                                                                            ) <
                                                                            0
                                                                                ? "−₱"
                                                                                : "+₱"}
                                                                            {formatCurrency(
                                                                                Math.abs(
                                                                                    parseFloat(
                                                                                        p
                                                                                            .transaction
                                                                                            ?.officialReceipt
                                                                                            ?.other,
                                                                                    ),
                                                                                ),
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between text-xs font-semibold text-gray-800 border-t border-gray-200 pt-1.5 mt-1">
                                                                    <span>
                                                                        Total
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        ₱
                                                                        {formatCurrency(
                                                                            totalSI,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={11}
                                    className="px-4 py-10 text-center text-gray-400"
                                >
                                    No mismatches found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Notes Modal */}
            {notesModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-1">
                            {notesModal.mismatch?.notes
                                ? "Edit Notes"
                                : "Add Notes"}
                        </h2>
                        <p className="text-xs text-gray-400 mb-4">
                            Invoice:{" "}
                            {notesModal.paymentSchedule?.invoice_number ?? "—"}
                        </p>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            rows={5}
                            placeholder="Enter notes here..."
                            value={notesModal.text}
                            onChange={(e) =>
                                setNotesModal((prev) => ({
                                    ...prev,
                                    text: e.target.value,
                                }))
                            }
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={closeNotesModal}
                                className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNotes}
                                disabled={savingNotes}
                                className="px-4 py-2 text-sm rounded-md bg-cyan-700 text-white hover:bg-cyan-800 transition-colors disabled:opacity-50"
                            >
                                {savingNotes ? "Saving..." : "Save Notes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
