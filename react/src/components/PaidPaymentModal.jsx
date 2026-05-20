import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faMoneyBillWave,
    faFloppyDisk,
    faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { calcWithholdingTax } from "../utils/withholdingTax";

const readOnlyClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-default select-none";

const pesoReadOnlyClass =
    "w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-default select-none";

const pesoInputClass = (hasError) =>
    `w-full border rounded-lg pl-7 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 ${
        hasError ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

const Field = ({ label, required, error, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                {error}
            </p>
        )}
    </div>
);

const PesoField = ({
    label,
    value,
    required,
    error,
    readOnly = true,
    name,
    onChange,
}) => (
    <Field label={label} required={required} error={error}>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                ₱
            </span>
            {readOnly ? (
                <input
                    type="number"
                    value={value}
                    readOnly
                    className={pesoReadOnlyClass}
                />
            ) : (
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={pesoInputClass(!!error)}
                />
            )}
        </div>
    </Field>
);

export default function PaidPaymentModal({
    payment,
    onClose,
    onSaved,
    company,
}) {
    const [paidAmount, setPaidAmount] = useState("");
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [manualInvoiceTotal, setManualInvoiceTotal] = useState(0);

    const client = payment?.clientsProject?.client ?? {};
    const isProject = !!payment?.clientsProject?.project;
    const project = isProject
        ? payment?.clientsProject?.project
        : payment?.clientsProject?.subscription;

    const invoiceNumber = payment?.invoice_number ?? "—";
    const clientName = client.name ?? "—";
    const clientAddress = client.company_address ?? "—";
    const serviceType = isProject ? "Project" : "Subscription";
    const serviceName = project?.title ?? "—";

    const [paidDate, setPaidDate] = useState("");

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const startCoverage = formatDate(payment?.start_coverage);
    const endCoverage = formatDate(payment?.end_coverage);
    const coverageDate =
        startCoverage && endCoverage
            ? `${startCoverage} – ${endCoverage}`
            : (startCoverage ?? endCoverage ?? "—");

    const baseAmount = parseFloat(payment?.base_amount) || 0;
    const vatAmount = parseFloat(payment?.vat_amount) || 0;
    const totalAmount = parseFloat(payment?.total_amount) || 0;

    const clientType = client.company_type ?? "";
    const annualGross = parseFloat(company?.annual_gross) || 0;
    const vatType = isProject
        ? (payment?.clientsProject?.project?.vat_type ?? "vat_exempt")
        : (payment?.clientsProject?.subscription?.vat_type ?? "vat_exempt");

    const paidAmountFloat = parseFloat(paidAmount) || 0;
    const { tax: withholdingTax } = calcWithholdingTax({
        clientType,
        annualGross,
        vatType,
        baseAmount: paidAmountFloat,
        totalAmount: paidAmountFloat,
    });

    const netAmount = paidAmountFloat - withholdingTax;

    useEffect(() => {
        if (!payment?.id) return;
        axiosClient
            .get("/manual-invoices", { params: { schedule_id: payment.id } })
            .then(({ data }) => {
                const items = data.data?.line_items ?? [];
                const total = items.reduce((sum, item) => {
                    if (!item.is_additional) return sum;
                    return parseFloat(item.unitPrice) || 0;
                }, 0);
                setManualInvoiceTotal(total);
            })
            .catch(() => setManualInvoiceTotal(0));
    }, [payment?.id]);

    const formatPHP = (val) =>
        new Intl.NumberFormat("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(parseFloat(val) || 0);

    const validate = () => {
        const errs = {};
        if (!paidAmount || isNaN(paidAmount))
            errs.paidAmount = "Paid amount is required.";
        if (parseFloat(paidAmount) <= 0)
            errs.paidAmount = "Paid amount must be greater than 0.";
        if (!paidDate) errs.paidDate = "Payment date is required.";
        return errs;
    };

    const handleSubmit = () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSaving(true);
        axiosClient
            .put(`/payment-schedules/${payment.id}/status`, {
                status: "paid",
                paid_amount: parseFloat(paidAmount),
                paid_at: paidDate,
                wh_tax: withholdingTax,
            })
            .then(() => {
                setSaving(false);
                onSaved();
            })
            .catch((err) => {
                setSaving(false);
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                }
            });
    };

    if (!payment) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-cyan-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/15 rounded-lg p-2">
                            <FontAwesomeIcon
                                icon={faMoneyBillWave}
                                className="text-white text-lg"
                            />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-base leading-tight">
                                Payment Details Form
                            </h2>
                            <p className="text-cyan-200 text-xs mt-0.5">
                                {clientName} — {serviceName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                    {/* Invoice + Service Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Invoice No.">
                            <input
                                type="text"
                                value={invoiceNumber}
                                readOnly
                                className={readOnlyClass}
                            />
                        </Field>
                        <Field label="Service Type">
                            <input
                                type="text"
                                value={serviceType}
                                readOnly
                                className={readOnlyClass}
                            />
                        </Field>
                    </div>

                    {/* Client Name */}
                    <Field label="Client Name">
                        <input
                            type="text"
                            value={clientName}
                            readOnly
                            className={readOnlyClass}
                        />
                    </Field>

                    {/* Client Address */}
                    <Field label="Client Address">
                        <input
                            type="text"
                            value={clientAddress}
                            readOnly
                            className={readOnlyClass}
                        />
                    </Field>

                    {/* Service Name */}
                    <Field label="Service Name">
                        <input
                            type="text"
                            value={serviceName}
                            readOnly
                            className={readOnlyClass}
                        />
                    </Field>

                    {/* Coverage Date */}
                    <Field label="Coverage Date">
                        <input
                            type="text"
                            value={coverageDate}
                            readOnly
                            className={readOnlyClass}
                        />
                    </Field>

                    {/* Amount Breakdown */}
                    <div className="border-t border-dashed border-gray-200 pt-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Amount Breakdown
                        </p>

                        <div className="space-y-3">
                            <PesoField
                                label="Base Amount"
                                value={baseAmount.toFixed(2)}
                            />

                            {manualInvoiceTotal > 0 && (
                                <PesoField
                                    label="Add On (Manual Invoice)"
                                    value={manualInvoiceTotal.toFixed(2)}
                                />
                            )}

                            <PesoField
                                label="VAT Amount"
                                value={vatAmount.toFixed(2)}
                            />

                            {/* Total */}
                            <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-cyan-800 uppercase tracking-wide">
                                    Total Amount
                                </span>
                                <span className="text-xl font-bold text-cyan-900 font-mono">
                                    ₱{formatPHP(totalAmount)}
                                </span>
                            </div>

                            <Field
                                label="Payment Date"
                                required
                                error={errors.paidDate}
                            >
                                <input
                                    type="date"
                                    value={paidDate}
                                    onChange={(e) => {
                                        setPaidDate(e.target.value);
                                        setErrors((prev) => ({
                                            ...prev,
                                            paidDate: null,
                                        }));
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                                />
                            </Field>

                            {/* Paid Amount — only editable field */}
                            <PesoField
                                label="Paid Amount"
                                required
                                value={paidAmount}
                                readOnly={false}
                                name="paidAmount"
                                error={errors.paidAmount}
                                onChange={(e) => {
                                    setPaidAmount(e.target.value);
                                    setErrors((prev) => ({
                                        ...prev,
                                        paidAmount: null,
                                    }));
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-cyan-800 rounded-lg hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FontAwesomeIcon icon={faFloppyDisk} />
                        {saving ? "Saving..." : "Paid"}
                    </button>
                </div>
            </div>
        </div>
    );
}
