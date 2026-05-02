import { useState, useEffect, useRef } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faReceipt,
    faFloppyDisk,
    faTriangleExclamation,
    faCircleCheck,
    faCircleXmark,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// Dynamic input field
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

// Dynamic css classname for styling form inputs based on validation state
const inputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 ${
        hasError ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

const disabledInputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-100 cursor-not-allowed opacity-60";

const readOnlyClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-default select-none";

// Dynamic css classname for currency input field based on validation state
const pesoInputClass = (hasError) =>
    `w-full border rounded-lg pl-7 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 ${
        hasError ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

const pesoReadOnlyClass =
    "w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-default select-none";

// ─── Uniqueness Status Badge (reusable) ──────────────────────────────────────

const StatusBadge = ({ status, label = "Number" }) => {
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
                {label} is available
            </p>
        );
    }

    if (status === "taken") {
        return (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faCircleXmark} />
                This {label} is already in use
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

// ─── Styled input class based on uniqueness status ────────────────────────────

const statusInputClass = (status, hasError) => {
    if (hasError)
        return "w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 border-red-400 bg-red-50";
    if (status === "taken")
        return "w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 border-red-400";
    if (status === "available")
        return "w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 border-green-400";
    return inputClass(false);
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function OfficialReceiptModal({
    payment,
    scheduleIndex,
    onClose,
    onSaved,
    company,
}) {
    const existingOR = payment?.transaction?.officialReceipt;

    const clientName = payment?.clientsProject?.client?.name ?? "";
    const clientAddress =
        payment?.clientsProject?.client?.company_address ?? "";
    const projectName =
        payment?.clientsProject?.project?.title ??
        payment?.clientsProject?.subscription?.title ??
        "";

    const [form, setForm] = useState({
        service_invoice_number: "",
        payment_acknowledgement_number: "",
        or_date: "",
        billing_statement_number: "",
        amount: "",
        vat_amount: "",
        other: "",
        other_label: "",
        notes: "",
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // ── Uniqueness check statuses ──────────────────────────────────────────
    const [siStatus, setSiStatus] = useState("idle");
    const [panStatus, setPanStatus] = useState("idle");
    const [bsStatus, setBsStatus] = useState("idle");

    const siDebounceRef = useRef(null);
    const panDebounceRef = useRef(null);
    const bsDebounceRef = useRef(null);

    const invoiceNumber = payment.invoice_number;
    const vatType = payment?.clientsProject?.vat_type ?? "vat_exempt";
    const isVatExclusive = vatType === "vat_exclusive";
    const isVatInclusive = vatType === "vat_inclusive";
    const isVatable = isVatExclusive || isVatInclusive;
    const clientType = payment?.clientsProject?.client?.company_type ?? "";

    useEffect(() => {
        const expectedAmount = parseFloat(payment?.expected_amount) || 0;

        const subtotal = isVatable
            ? parseFloat((expectedAmount / 1.12).toFixed(2))
            : expectedAmount;
        const autoVat = isVatable
            ? parseFloat((subtotal * 0.12).toFixed(2))
            : 0;

        const str = (val) => val ?? "";
        const num = (val) => (val != null ? String(val) : "");

        if (existingOR) {
            // If there is an existing O.R. populate the form with existing data
            setForm({
                service_invoice_number: str(existingOR.service_invoice_number),
                payment_acknowledgement_number: str(
                    existingOR.payment_acknowledgement_number,
                ),
                or_date: str(existingOR.or_date),
                billing_statement_number: str(
                    existingOR.billing_statement_number,
                ),
                amount: num(existingOR.amount),
                vat_amount: num(existingOR.vat_amount),
                other: num(existingOR.other),
                other_label: str(existingOR.other_label),
                notes: str(existingOR.notes),
            });
        } else {
            setForm((prev) => ({
                ...prev,
                amount: subtotal > 0 ? String(subtotal) : "",
                vat_amount: autoVat > 0 ? String(autoVat) : "",
            }));
        }
    }, [existingOR, payment]);

    // ── Generic uniqueness checker factory ────────────────────────────────
    const makeChecker =
        (endpoint, setStatus, debounceRef, excludeId) => (value) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);

            if (!value.trim()) {
                setStatus("idle");
                return;
            }

            setStatus("checking");

            debounceRef.current = setTimeout(async () => {
                try {
                    const params = new URLSearchParams({
                        number: value.trim(),
                    });
                    if (excludeId) params.append("exclude_id", excludeId);

                    const { data } = await axiosClient.get(
                        `${endpoint}?${params.toString()}`,
                    );

                    setStatus(data.available ? "available" : "taken");
                } catch {
                    setStatus("error");
                }
            }, 600);
        };

    const checkSI = makeChecker(
        "/official-receipts/check-si",
        setSiStatus,
        siDebounceRef,
        existingOR?.id,
    );
    const checkPAN = makeChecker(
        "/official-receipts/check-pan",
        setPanStatus,
        panDebounceRef,
        existingOR?.id,
    );
    const checkBS = makeChecker(
        "/official-receipts/check-bs",
        setBsStatus,
        bsDebounceRef,
        existingOR?.id,
    );

    const totalAmount = (
        (parseFloat(form.amount) || 0) +
        (parseFloat(form.vat_amount) || 0) +
        (parseFloat(form.other) || 0)
    ).toFixed(2);

    // Company annual gross
    const annualGross = parseFloat(company?.annual_gross) || 0;

    // Determines withholding tax rate based on client type and companies annual gross
    const getWithholdingRate = () => {
        if (clientType === "Private Corporation") {
            return annualGross >= 3_000_000 ? 0.02 : 0.01;
        }
        if (clientType === "Government") return 0.01;
        return 0;
    };

    const withholdingRate = getWithholdingRate();
    // Private Corp → based on subtotal (excluding VAT)
    // Government → based on total (including VAT)
    const withholdingBase =
        clientType === "Government"
            ? parseFloat(totalAmount)
            : parseFloat(form.amount) || 0;
    const withholdingTax = withholdingBase * withholdingRate;
    const netAmountDue = parseFloat(totalAmount) - withholdingTax;

    // Updates form state and clears validation errors and triggers real-time validation checks
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null }));

        if (name === "service_invoice_number") checkSI(value);
        if (name === "payment_acknowledgement_number") checkPAN(value);
        if (name === "billing_statement_number") checkBS(value);
    };

    const validate = () => {
        const newErrors = {};
        if (!form.or_date) newErrors.or_date = "O.R. issued date is required.";
        if (!form.amount || isNaN(form.amount))
            newErrors.amount = "Valid amount is required.";
        return newErrors;
    };

    // ── Block save if any checker is still running / found a conflict ──────
    const blockingStatuses = [
        {
            field: "service_invoice_number",
            status: siStatus,
            label: "Service Invoice No.",
        },
        {
            field: "payment_acknowledgement_number",
            status: panStatus,
            label: "Payment Acknowledgement No.",
        },
        {
            field: "billing_statement_number",
            status: bsStatus,
            label: "Billing Statement No.",
        },
    ];

    const handleSubmit = () => {
        const newErrors = {};

        for (const { field, status, label } of blockingStatuses) {
            if (status === "checking") {
                newErrors[field] =
                    `Please wait — checking ${label} availability…`;
            } else if (status === "taken") {
                newErrors[field] = `This ${label} is already in use.`;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...newErrors }));
            return;
        }

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);

        const transactionId = payment?.transaction?.id;

        const payload = {
            ...form,
            service_invoice_number: form.service_invoice_number.trim() || null,
            payment_acknowledgement_number:
                form.payment_acknowledgement_number.trim() || null,
            billing_statement_number:
                form.billing_statement_number.trim() || null,
            other_label: form.other_label.trim() || null,
            notes: form.notes.trim() || null,
            other: form.other !== "" ? form.other : null,
            total_amount: totalAmount,
            payment_transaction_id: transactionId,
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

    // Mutually exclusive: SI ↔ PAN
    const siHasValue = form.service_invoice_number.trim() !== "";
    const panHasValue = form.payment_acknowledgement_number.trim() !== "";
    const siDisabled = panHasValue;
    const panDisabled = siHasValue;

    const siInputClass = () => {
        if (siDisabled) return disabledInputClass;
        return statusInputClass(siStatus, !!errors.service_invoice_number);
    };

    const panInputClass = () => {
        if (panDisabled) return disabledInputClass;
        return statusInputClass(
            panStatus,
            !!errors.payment_acknowledgement_number,
        );
    };

    const isSaveBlocked =
        saving ||
        blockingStatuses.some(
            ({ status }) => status === "checking" || status === "taken",
        );

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
                    {/* Row 1: Service Invoice No. + Payment Acknowledgement No. */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Service Invoice No. */}
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
                                disabled={siDisabled}
                                className={siInputClass()}
                            />
                            {siDisabled ? (
                                <p className="text-gray-400 text-xs mt-1">
                                    Clear Payment Acknowledgement No. to use
                                    this field.
                                </p>
                            ) : errors.service_invoice_number ? (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <FontAwesomeIcon
                                        icon={faTriangleExclamation}
                                    />
                                    {errors.service_invoice_number}
                                </p>
                            ) : (
                                <StatusBadge
                                    status={siStatus}
                                    label="Service Invoice No."
                                />
                            )}
                        </div>

                        {/* Payment Acknowledgement No. */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Payment Acknowledgement No.
                            </label>
                            <input
                                type="text"
                                name="payment_acknowledgement_number"
                                value={form.payment_acknowledgement_number}
                                onChange={handleChange}
                                placeholder="NO. 00001"
                                disabled={panDisabled}
                                className={panInputClass()}
                            />
                            {panDisabled ? (
                                <p className="text-gray-400 text-xs mt-1">
                                    Clear Service Invoice No. to use this field.
                                </p>
                            ) : errors.payment_acknowledgement_number ? (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <FontAwesomeIcon
                                        icon={faTriangleExclamation}
                                    />
                                    {errors.payment_acknowledgement_number}
                                </p>
                            ) : (
                                <StatusBadge
                                    status={panStatus}
                                    label="Payment Acknowledgement No."
                                />
                            )}
                        </div>
                    </div>

                    {/* Row: Billing Statement No. + Invoice No. + O.R. Issued Date */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Billing Statement No. — now with uniqueness check */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Billing Statement No.
                            </label>
                            <input
                                type="text"
                                name="billing_statement_number"
                                value={form.billing_statement_number}
                                onChange={handleChange}
                                placeholder="NO. 00001"
                                className={statusInputClass(
                                    bsStatus,
                                    !!errors.billing_statement_number,
                                )}
                            />
                            {errors.billing_statement_number ? (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <FontAwesomeIcon
                                        icon={faTriangleExclamation}
                                    />
                                    {errors.billing_statement_number}
                                </p>
                            ) : (
                                <StatusBadge
                                    status={bsStatus}
                                    label="Billing Statement No."
                                />
                            )}
                        </div>

                        <Field label="Invoice No.">
                            <input
                                type="text"
                                value={invoiceNumber}
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

                    {/* Company Type — read only */}
                    <Field label="Company Type">
                        <input
                            type="text"
                            value={clientType}
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
                            {/* Amount — read-only */}
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
                                        readOnly
                                        placeholder="0.00"
                                        className={pesoReadOnlyClass}
                                    />
                                </div>
                            </Field>

                            {/* VAT Amount — read-only */}
                            <Field
                                label={
                                    vatType === "vat_inclusive"
                                        ? "VAT Amount (Inclusive 12%)"
                                        : vatType === "vat_exclusive"
                                          ? "VAT Amount (Exclusive 12%)"
                                          : "VAT Amount (Exempt)"
                                }
                            >
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        name="vat_amount"
                                        value={form.vat_amount}
                                        readOnly
                                        placeholder="0.00"
                                        className={pesoReadOnlyClass}
                                    />
                                </div>
                            </Field>

                            {/* Others — editable with label */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Others
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="other_label"
                                        value={form.other_label}
                                        onChange={handleChange}
                                        placeholder="Label (e.g. Handling fee)"
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                                    />
                                    <div className="relative w-40 shrink-0">
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
                                </div>
                            </div>
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
                                }).format(totalAmount)}
                            </span>
                        </div>

                        {/* Notes */}
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Add any remarks or additional information…"
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 resize-none"
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
                        disabled={isSaveBlocked}
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
