import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faReceipt,
    faFloppyDisk,
    faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

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

const inputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 ${
        hasError ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

const readOnlyClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-default select-none";

const pesoInputClass = (hasError) =>
    `w-full border rounded-lg pl-7 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 ${
        hasError ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

export default function OfficialReceiptModal({ payment, onClose, onSaved }) {
    const existingOR = payment?.transaction?.officialReceipt;

    // Pre-fill read-only fields from the payment prop
    const clientName = payment?.clientsProject?.client?.name ?? "";
    const clientAddress =
        payment?.clientsProject?.client?.company_address ?? "";
    const projectName = payment?.clientsProject?.project?.title ?? "";

    const [form, setForm] = useState({
        service_invoice_number: "",
        or_date: "",
        quantity: "",
        amount: "",
        vat_amount: "",
        other: "",
        form_2307_status: "pending",
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Prefill form — edit mode uses saved O.R. values, create mode auto-fills from payment
    useEffect(() => {
        const expectedAmount = parseFloat(payment?.expected_amount) || 0;
        const isVatable = payment?.clientsProject?.is_vatable;

        // expected_amount is VAT-inclusive, so we back-compute:
        // base (ex-VAT) = expectedAmount / 1.12
        // vat            = expectedAmount - base
        const autoBase = isVatable
            ? parseFloat((expectedAmount / 1.12).toFixed(2))
            : expectedAmount;
        const autoVat = isVatable
            ? parseFloat((expectedAmount - autoBase).toFixed(2))
            : 0;

        if (existingOR) {
            setForm({
                service_invoice_number: existingOR.service_invoice_number ?? "",
                or_number: existingOR.or_number ?? invoiceNumber,
                or_date: existingOR.or_date ?? "",
                quantity: existingOR.quantity ?? "",
                amount: existingOR.amount ?? "",
                vat_amount: existingOR.vat_amount ?? "",
                other: existingOR.other ?? "",
                form_2307_status: existingOR.form_2307_status ?? "pending",
            });
        } else {
            setForm((prev) => ({
                ...prev,
                amount: autoBase > 0 ? String(autoBase) : "",
                vat_amount: autoVat > 0 ? String(autoVat) : "",
            }));
        }
    }, [existingOR, payment]);

    // Derive total_amount directly — no useEffect needed, no re-render scroll side effects
    const totalAmount = (
        (parseFloat(form.amount) || 0) +
        (parseFloat(form.vat_amount) || 0) +
        (parseFloat(form.other) || 0)
    ).toFixed(2);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.or_date) newErrors.or_date = "O.R. issued date is required.";
        if (!form.amount || isNaN(form.amount))
            newErrors.amount = "Valid amount is required.";
        return newErrors;
    };

    console.log("transaction:", payment?.transaction);
    console.log("officialReceipt:", payment?.transaction?.officialReceipt);

    const handleSubmit = () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);

        const transactionId = payment?.transaction?.id;
        const projectId = payment?.clientsProject?.project?.id ?? "?";
        const invoiceNumber = `${projectId}-${payment?.id}`;

        const payload = {
            ...form,
            total_amount: totalAmount,
            payment_transaction_id: transactionId,
            or_number: invoiceNumber,
        };

        const request = existingOR
            ? axiosClient.put(`/official-receipts/${existingOR.id}`, payload)
            : axiosClient.post("/official-receipts", payload);

        request
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

    const isEditing = !!existingOR;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-cyan-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/15 rounded-lg p-2">
                            <FontAwesomeIcon
                                icon={faReceipt}
                                className="text-white text-lg"
                            />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-base leading-tight">
                                {isEditing
                                    ? "Edit Official Receipt"
                                    : "Issue Official Receipt"}
                            </h2>
                            <p className="text-cyan-200 text-xs mt-0.5">
                                {clientName} — {projectName}
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
                    {/* Row 1: Service Invoice No. + O.R. Number + O.R. Issued Date */}
                    <div className="grid grid-cols-3 gap-4">
                        <Field label="Service Invoice No.">
                            <input
                                type="text"
                                name="service_invoice_number"
                                value={form.service_invoice_number}
                                onChange={handleChange}
                                placeholder="NO. 00001"
                                className={inputClass(false)}
                            />
                        </Field>

                        <Field label="O.R. Number">
                            <input
                                type="text"
                                value={`${payment?.clientsProject?.project?.id ?? "?"}-${payment?.id ?? "?"}`}
                                readOnly
                                className={readOnlyClass}
                            />
                        </Field>

                        <Field
                            label="O.R. Issued Date"
                            required
                            error={errors.or_date}
                        >
                            <input
                                type="date"
                                name="or_date"
                                value={form.or_date}
                                onChange={handleChange}
                                className={inputClass(!!errors.or_date)}
                            />
                        </Field>
                    </div>

                    {/* Client Name — read only, auto-filled */}
                    <Field label="Client Name">
                        <input
                            type="text"
                            value={clientName}
                            readOnly
                            className={readOnlyClass}
                        />
                    </Field>

                    {/* Client Address — read only, auto-filled */}
                    <Field label="Client Address">
                        <input
                            type="text"
                            value={clientAddress}
                            readOnly
                            placeholder="No address on file"
                            className={readOnlyClass}
                        />
                    </Field>

                    {/* Project Name — read only, auto-filled */}
                    <Field label="Project Name">
                        <input
                            type="text"
                            value={projectName}
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
                            {/* Amount */}
                            <Field
                                label="Amount"
                                required
                                error={errors.amount}
                            >
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={form.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className={pesoInputClass(
                                            !!errors.amount,
                                        )}
                                    />
                                </div>
                            </Field>

                            {/* VAT Amount */}
                            <Field label="VAT Amount">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        name="vat_amount"
                                        value={form.vat_amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className={pesoInputClass(false)}
                                    />
                                </div>
                            </Field>

                            {/* Others */}
                            <Field label="Others">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        name="other"
                                        value={form.other}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className={pesoInputClass(false)}
                                    />
                                </div>
                            </Field>
                        </div>

                        {/* Total — auto-computed, read only */}
                        <div className="mt-4 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-cyan-800 uppercase tracking-wide">
                                Total Amount
                            </span>
                            <span className="text-xl font-bold text-cyan-900 font-mono">
                                ₱
                                {new Intl.NumberFormat("en-PH", {
                                    minimumFractionDigits: 2,
                                }).format(totalAmount || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                    {/* 2307 Radio */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            2307 Issued?
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name="form_2307_status"
                                value="issued"
                                checked={form.form_2307_status === "issued"}
                                onChange={handleChange}
                                className="accent-cyan-700"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name="form_2307_status"
                                value="pending"
                                checked={form.form_2307_status === "pending"}
                                onChange={handleChange}
                                className="accent-cyan-700"
                            />
                            <span className="text-sm text-gray-700">No</span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
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
                            {saving
                                ? "Saving..."
                                : isEditing
                                  ? "Update O.R."
                                  : "Issue O.R."}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
