import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faFloppyDisk,
    faTriangleExclamation,
    faFileInvoiceDollar,
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

const pesoInputClass = (hasError) =>
    `w-full border rounded-lg pl-7 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 ${
        hasError ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

export default function Form2307Modal({ payment, onClose, onSaved }) {
    const existingOR = payment?.transaction?.officialReceipt;
    const existing2307 = existingOR?.form2307;
    const isEditing = !!existing2307;

    const clientName = payment?.clientsProject?.client?.name ?? "";
    const projectName = payment?.clientsProject?.project?.title ?? "";

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
    const [saving, setSaving] = useState(false);

    useEffect(() => {
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
    }, [existing2307]);

    const totalIncome = (
        (parseFloat(form2307.month1_amount) || 0) +
        (parseFloat(form2307.month2_amount) || 0) +
        (parseFloat(form2307.month3_amount) || 0)
    ).toFixed(2);

    const totalIncomeWithTax = (
        parseFloat(totalIncome) + (parseFloat(form2307.tax_withheld) || 0)
    ).toFixed(2);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm2307((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errs = {};
        if (!form2307.period_from) errs.period_from = "Required.";
        if (!form2307.period_to) errs.period_to = "Required.";
        if (!form2307.payee_tin) errs.payee_tin = "Payee TIN is required.";
        if (!form2307.atc_code) errs.atc_code = "ATC code is required.";
        if (!form2307.tax_withheld || isNaN(form2307.tax_withheld))
            errs.tax_withheld = "Tax withheld amount is required.";
        return errs;
    };

    const handleSubmit = () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSaving(true);

        const payload = {
            ...form2307,
            total_income: totalIncome,
            official_receipt_id: existingOR.id,
        };

        const request = existing2307
            ? axiosClient.put(`/form-2307s/${existing2307.id}`, payload)
            : axiosClient.post("/form-2307s", payload);

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
                <div className="bg-amber-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/15 rounded-lg p-2">
                            <FontAwesomeIcon
                                icon={faFileInvoiceDollar}
                                className="text-white text-lg"
                            />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-base leading-tight">
                                {isEditing
                                    ? "Edit BIR Form 2307"
                                    : "Issue BIR Form 2307"}
                            </h2>
                            <p className="text-amber-200 text-xs mt-0.5">
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
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                        <FontAwesomeIcon
                            icon={faFileInvoiceDollar}
                            className="text-amber-600 text-sm"
                        />
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                            BIR Form 2307 — Certificate of Creditable Tax
                            Withheld at Source
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            label="Period — From"
                            required
                            error={errors.period_from}
                        >
                            <input
                                type="date"
                                name="period_from"
                                value={form2307.period_from}
                                onChange={handleChange}
                                className={inputClass(!!errors.period_from)}
                            />
                        </Field>
                        <Field
                            label="Period — To"
                            required
                            error={errors.period_to}
                        >
                            <input
                                type="date"
                                name="period_to"
                                value={form2307.period_to}
                                onChange={handleChange}
                                className={inputClass(!!errors.period_to)}
                            />
                        </Field>
                    </div>

                    <Field label="Payee TIN" required error={errors.payee_tin}>
                        <input
                            type="text"
                            name="payee_tin"
                            value={form2307.payee_tin}
                            onChange={handleChange}
                            placeholder="000-000-000-000"
                            className={inputClass(!!errors.payee_tin)}
                        />
                    </Field>

                    <Field label="ATC Code" required error={errors.atc_code}>
                        <input
                            type="text"
                            name="atc_code"
                            value={form2307.atc_code}
                            onChange={handleChange}
                            placeholder="e.g. WC158"
                            className={inputClass(!!errors.atc_code)}
                        />
                    </Field>

                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Amount of Income Payments
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    field: "month1_amount",
                                    label: "1st Month of the Quarter",
                                },
                                {
                                    field: "month2_amount",
                                    label: "2nd Month of the Quarter",
                                },
                                {
                                    field: "month3_amount",
                                    label: "3rd Month of the Quarter",
                                },
                            ].map(({ field, label }) => (
                                <Field
                                    key={field}
                                    label={label}
                                    labelSize="text-[10px]"
                                >
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                            ₱
                                        </span>
                                        <input
                                            type="number"
                                            name={field}
                                            value={form2307[field]}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className={pesoInputClass(false)}
                                        />
                                    </div>
                                </Field>
                            ))}
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
                            error={errors.tax_withheld}
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                    ₱
                                </span>
                                <input
                                    type="number"
                                    name="tax_withheld"
                                    value={form2307.tax_withheld}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={pesoInputClass(
                                        !!errors.tax_withheld,
                                    )}
                                />
                            </div>
                        </Field>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Total (Income + Tax)
                            </label>
                            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 font-mono">
                                ₱
                                {new Intl.NumberFormat("en-PH", {
                                    minimumFractionDigits: 2,
                                }).format(totalIncomeWithTax || 0)}
                            </div>
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
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FontAwesomeIcon icon={faFloppyDisk} />
                        {saving
                            ? "Saving..."
                            : isEditing
                              ? "Update 2307"
                              : "Issue 2307"}
                    </button>
                </div>
            </div>
        </div>
    );
}
