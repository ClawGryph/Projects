import { useState, useEffect, useRef } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faReceipt,
    faFloppyDisk,
    faTriangleExclamation,
    faFileInvoiceDollar,
    faCircleCheck,
    faCircleXmark,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const Field = ({ label, required, error, children, labelSize = "text-xs" }) => (
    <div>
        <label
            className={`block ${labelSize} font-semibold text-gray-500 uppercase tracking-wide mb-1`}
        >
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

// ─── SI Uniqueness Status Indicator ──────────────────────────────────────────

const SIStatusBadge = ({ status }) => {
    if (status === "idle") return null;

    if (status === "checking") {
        return (
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Checking availability…
            </p>
        );
    }

    if (status === "available") {
        return (
            <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faCircleCheck} />
                Service Invoice No. is available
            </p>
        );
    }

    if (status === "taken") {
        return (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faCircleXmark} />
                This Service Invoice No. is already in use
            </p>
        );
    }

    if (status === "error") {
        return (
            <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Could not verify uniqueness — proceed with caution
            </p>
        );
    }

    return null;
};

// ─── BIR 2307 Sub-form ───────────────────────────────────────────────────────

const Form2307Section = ({ form2307, onChange, errors2307 }) => {
    const totalIncome = (
        (parseFloat(form2307.month1_amount) || 0) +
        (parseFloat(form2307.month2_amount) || 0) +
        (parseFloat(form2307.month3_amount) || 0)
    ).toFixed(2);

    return (
        <div className="mt-1 border border-amber-200 rounded-xl overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2">
                <FontAwesomeIcon
                    icon={faFileInvoiceDollar}
                    className="text-amber-600 text-sm"
                />
                <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                        BIR Form 2307 — Certificate of Creditable Tax Withheld
                        at Source
                    </p>
                </div>
            </div>

            <div className="px-4 py-4 space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-4">
                    <Field
                        label="Period — From"
                        required
                        error={errors2307.period_from}
                    >
                        <input
                            type="date"
                            name="period_from"
                            value={form2307.period_from}
                            onChange={onChange}
                            className={inputClass(!!errors2307.period_from)}
                        />
                    </Field>
                    <Field
                        label="Period — To"
                        required
                        error={errors2307.period_to}
                    >
                        <input
                            type="date"
                            name="period_to"
                            value={form2307.period_to}
                            onChange={onChange}
                            className={inputClass(!!errors2307.period_to)}
                        />
                    </Field>
                </div>

                <Field label="Payee TIN" required error={errors2307.payee_tin}>
                    <input
                        type="text"
                        name="payee_tin"
                        value={form2307.payee_tin}
                        onChange={onChange}
                        placeholder="000-000-000-000"
                        className={inputClass(!!errors2307.payee_tin)}
                    />
                </Field>

                <Field label="ATC Code" required error={errors2307.atc_code}>
                    <input
                        type="text"
                        name="atc_code"
                        value={form2307.atc_code}
                        onChange={onChange}
                        placeholder="e.g. WC158"
                        className={inputClass(!!errors2307.atc_code)}
                    />
                </Field>

                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Amount of Income Payments
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <Field
                            label="1st Month of the quarter"
                            labelSize="text-[10px]"
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                    ₱
                                </span>
                                <input
                                    type="number"
                                    name="month1_amount"
                                    value={form2307.month1_amount}
                                    onChange={onChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={pesoInputClass(false)}
                                />
                            </div>
                        </Field>
                        <Field
                            label="2nd Month of the quarter"
                            labelSize="text-[10px]"
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                    ₱
                                </span>
                                <input
                                    type="number"
                                    name="month2_amount"
                                    value={form2307.month2_amount}
                                    onChange={onChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={pesoInputClass(false)}
                                />
                            </div>
                        </Field>
                        <Field
                            label="3rd Month of the quarter"
                            labelSize="text-[11px]"
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                    ₱
                                </span>
                                <input
                                    type="number"
                                    name="month3_amount"
                                    value={form2307.month3_amount}
                                    onChange={onChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={pesoInputClass(false)}
                                />
                            </div>
                        </Field>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Total Income
                        </label>
                        <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 font-mono">
                            ₱
                            {new Intl.NumberFormat("en-PH", {
                                minimumFractionDigits: 2,
                            }).format(totalIncome || 0)}
                        </div>
                    </div>

                    <Field
                        label="Tax Withheld for the Quarter"
                        required
                        error={errors2307.tax_withheld}
                    >
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                ₱
                            </span>
                            <input
                                type="number"
                                name="tax_withheld"
                                value={form2307.tax_withheld}
                                onChange={onChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={pesoInputClass(
                                    !!errors2307.tax_withheld,
                                )}
                            />
                        </div>
                    </Field>
                </div>
            </div>
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function OfficialReceiptModal({ payment, onClose, onSaved }) {
    const existingOR = payment?.transaction?.officialReceipt;
    const existing2307 = existingOR?.form2307;

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

    const [form2307, setForm2307] = useState({
        period_from: "",
        period_to: "",
        payee_tin: "",
        atc_code: "",
        month1_amount: "",
        month2_amount: "",
        month3_amount: "",
        tax_withheld: "",
    });

    const [errors, setErrors] = useState({});
    const [errors2307, setErrors2307] = useState({});
    const [saving, setSaving] = useState(false);

    // ── SI uniqueness state ──────────────────────────────────────────────────
    // "idle" | "checking" | "available" | "taken" | "error"
    const [siStatus, setSiStatus] = useState("idle");
    const debounceRef = useRef(null);

    // Prefill form on load / edit
    useEffect(() => {
        const expectedAmount = parseFloat(payment?.expected_amount) || 0;
        const isVatable = payment?.clientsProject?.is_vatable;

        const autoBase = isVatable
            ? parseFloat((expectedAmount / 1.12).toFixed(2))
            : expectedAmount;
        const autoVat = isVatable
            ? parseFloat((expectedAmount - autoBase).toFixed(2))
            : 0;

        if (existingOR) {
            setForm({
                service_invoice_number: existingOR.service_invoice_number ?? "",
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

        if (existing2307) {
            setForm2307({
                period_from: existing2307.period_from ?? "",
                period_to: existing2307.period_to ?? "",
                payee_tin: existing2307.payee_tin ?? "",
                atc_code: existing2307.atc_code ?? "",
                month1_amount: existing2307.month1_amount ?? "",
                month2_amount: existing2307.month2_amount ?? "",
                month3_amount: existing2307.month3_amount ?? "",
                tax_withheld: existing2307.tax_withheld ?? "",
            });
        }
    }, [existingOR, existing2307, payment]);

    // ── Debounced SI uniqueness check ────────────────────────────────────────
    const checkSIUniqueness = (value) => {
        // Clear any pending debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Empty field → reset to idle silently
        if (!value.trim()) {
            setSiStatus("idle");
            return;
        }

        setSiStatus("checking");

        debounceRef.current = setTimeout(async () => {
            try {
                // Pass exclude_id when editing so the current record doesn't
                // flag itself as a duplicate
                const params = new URLSearchParams({ number: value.trim() });
                if (existingOR?.id) params.append("exclude_id", existingOR.id);

                const { data } = await axiosClient.get(
                    `/official-receipts/check-si?${params.toString()}`,
                );

                // Expect the API to return { available: true } or { available: false }
                setSiStatus(data.available ? "available" : "taken");
            } catch {
                setSiStatus("error");
            }
        }, 600);
    };

    const totalAmount = (
        (parseFloat(form.amount) || 0) +
        (parseFloat(form.vat_amount) || 0) +
        (parseFloat(form.other) || 0)
    ).toFixed(2);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null }));

        if (name === "service_invoice_number") {
            checkSIUniqueness(value);
        }
    };

    const handle2307Change = (e) => {
        const { name, value } = e.target;
        setForm2307((prev) => ({ ...prev, [name]: value }));
        setErrors2307((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.or_date) newErrors.or_date = "O.R. issued date is required.";
        if (!form.amount || isNaN(form.amount))
            newErrors.amount = "Valid amount is required.";
        return newErrors;
    };

    const validate2307 = () => {
        const newErrors = {};
        if (!form2307.period_from) newErrors.period_from = "Required.";
        if (!form2307.period_to) newErrors.period_to = "Required.";
        if (!form2307.payee_tin) newErrors.payee_tin = "Payee TIN is required.";
        if (!form2307.atc_code) newErrors.atc_code = "ATC code is required.";
        if (!form2307.tax_withheld || isNaN(form2307.tax_withheld))
            newErrors.tax_withheld = "Tax withheld amount is required.";
        return newErrors;
    };

    const handleSubmit = () => {
        // Block submit if SI check is still in-flight or the number is taken
        if (siStatus === "checking" || siStatus === "taken") {
            setErrors((prev) => ({
                ...prev,
                service_invoice_number:
                    siStatus === "taken"
                        ? "This Service Invoice No. is already in use."
                        : "Please wait — checking availability…",
            }));
            return;
        }

        const validationErrors = validate();

        let validation2307Errors = {};
        if (form.form_2307_status === "issued") {
            validation2307Errors = validate2307();
        }

        if (
            Object.keys(validationErrors).length > 0 ||
            Object.keys(validation2307Errors).length > 0
        ) {
            setErrors(validationErrors);
            setErrors2307(validation2307Errors);
            return;
        }

        setSaving(true);

        const transactionId = payment?.transaction?.id;
        const projectId = payment?.clientsProject?.project?.id ?? "?";
        const invoiceNumber = `${projectId}-${payment?.id}`;

        const total2307 = (
            (parseFloat(form2307.month1_amount) || 0) +
            (parseFloat(form2307.month2_amount) || 0) +
            (parseFloat(form2307.month3_amount) || 0)
        ).toFixed(2);

        const payload = {
            ...form,
            total_amount: totalAmount,
            payment_transaction_id: transactionId,
            or_number: invoiceNumber,
            ...(form.form_2307_status === "issued" && {
                form_2307: {
                    ...form2307,
                    total_income: total2307,
                },
            }),
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
                    const allErrors = err.response.data.errors;
                    const orErrors = {};
                    const f2307Errors = {};
                    Object.entries(allErrors).forEach(([key, val]) => {
                        if (key.startsWith("form_2307.")) {
                            f2307Errors[key.replace("form_2307.", "")] = val;
                        } else {
                            orErrors[key] = val;
                        }
                    });
                    setErrors(orErrors);
                    setErrors2307(f2307Errors);
                }
            });
    };

    const isEditing = !!existingOR;
    const show2307Form = form.form_2307_status === "issued";

    // Derive border colour for SI field based on check status
    const siInputClass = () => {
        if (errors.service_invoice_number)
            return "w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 border-red-400 bg-red-50";
        if (siStatus === "taken")
            return "w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 border-red-400";
        if (siStatus === "available")
            return "w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 border-green-400";
        return inputClass(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
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
                        {/* Service Invoice No. — with uniqueness check */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Service Invoice No.
                            </label>
                            <input
                                type="text"
                                name="service_invoice_number"
                                value={form.service_invoice_number}
                                onChange={handleChange}
                                placeholder="NO. 00001"
                                className={siInputClass()}
                            />
                            {/* Show validation error OR the live status badge — not both */}
                            {errors.service_invoice_number ? (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <FontAwesomeIcon
                                        icon={faTriangleExclamation}
                                    />
                                    {errors.service_invoice_number}
                                </p>
                            ) : (
                                <SIStatusBadge status={siStatus} />
                            )}
                        </div>

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
                            placeholder="No address on file"
                            className={readOnlyClass}
                        />
                    </Field>

                    {/* Project Name */}
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

                        {/* Total */}
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

                    {/* ── 2307 Section ── */}
                    <div className="border-t border-dashed border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                BIR Form 2307
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    2307 Issued?
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="form_2307_status"
                                        value="issued"
                                        checked={
                                            form.form_2307_status === "issued"
                                        }
                                        onChange={handleChange}
                                        className="accent-cyan-700"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Yes
                                    </span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="form_2307_status"
                                        value="pending"
                                        checked={
                                            form.form_2307_status === "pending"
                                        }
                                        onChange={handleChange}
                                        className="accent-cyan-700"
                                    />
                                    <span className="text-sm text-gray-700">
                                        No
                                    </span>
                                </label>
                            </div>
                        </div>

                        {show2307Form && (
                            <Form2307Section
                                form2307={form2307}
                                onChange={handle2307Change}
                                errors2307={errors2307}
                            />
                        )}

                        {!show2307Form && (
                            <p className="text-xs text-gray-400 italic">
                                Select "Yes" above to fill in the BIR 2307
                                details.
                            </p>
                        )}
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
                        disabled={
                            saving ||
                            siStatus === "checking" ||
                            siStatus === "taken"
                        }
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
    );
}
