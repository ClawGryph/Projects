import { useEffect, useState } from "react";
import { useStateContext } from "../context/ContextProvider";
import axiosClient from "../axios-client";

const BUSINESS_TYPES = [
    "Sole Proprietorship",
    "Partnership",
    "Corporation",
    "One Person Corporation",
];

export default function CompanyManagement() {
    const { selectedCompany, setSelectedCompany, setNotification } =
        useStateContext();
    const [form, setForm] = useState({
        name: "",
        business_type: "",
        vat_type: "",
        annual_gross: "",
    });
    const [isOther, setIsOther] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-fill form from selectedCompany
    useEffect(() => {
        if (!selectedCompany) return;
        const isKnown = BUSINESS_TYPES.includes(selectedCompany.business_type);
        setIsOther(!isKnown);
        setForm({
            name: selectedCompany.name ?? "",
            business_type: selectedCompany.business_type ?? "",
            vat_type: selectedCompany.vat_type ?? "",
            annual_gross: selectedCompany.annual_gross ?? "",
        });
    }, [selectedCompany]);

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = "Company name is required.";
        if (!form.business_type.trim())
            e.business_type = "Business type is required.";
        if (!form.vat_type) e.vat_type = "VAT type is required.";
        if (form.annual_gross === "")
            e.annual_gross = "Annual gross income is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleGrossChange(value) {
        const autoVat =
            parseFloat(value) >= 3000000 ? "vat_registered" : "non_vat";
        setForm((f) => ({
            ...f,
            annual_gross: value,
            vat_type: value === "" ? f.vat_type : autoVat,
        }));
    }

    function handleSave() {
        if (!validate()) return;
        setSaving(true);
        axiosClient
            .put(`/companies/${selectedCompany.id}`, form)
            .then(({ data }) => {
                setSelectedCompany(data);
                setNotification("Company was successfully updated");
            })
            .finally(() => setSaving(false));
    }

    function handleDiscard() {
        if (!selectedCompany) return;
        const isKnown = BUSINESS_TYPES.includes(selectedCompany.business_type);
        setIsOther(!isKnown);
        setForm({
            name: selectedCompany.name ?? "",
            business_type: selectedCompany.business_type ?? "",
            vat_type: selectedCompany.vat_type ?? "",
            annual_gross: selectedCompany.annual_gross ?? "",
        });
        setErrors({});
    }

    return (
        <div className="p-6 w-full">
            <div className="mb-5">
                <h2 className="text-lg font-semibold">Company Management</h2>
                <p className="text-sm text-gray-400">
                    Update your company profile and tax settings
                </p>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4 w-full max-w-2xl mx-auto">
                {/* Company Name */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Company Name
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    {errors.name && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Business Type */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Business Type
                    </label>
                    <select
                        value={isOther ? "Other" : form.business_type}
                        onChange={(e) => {
                            if (e.target.value === "Other") {
                                setIsOther(true);
                                setForm((f) => ({ ...f, business_type: "" }));
                            } else {
                                setIsOther(false);
                                setForm((f) => ({
                                    ...f,
                                    business_type: e.target.value,
                                }));
                            }
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                        <option value="">Select…</option>
                        {BUSINESS_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                        <option value="Other">Other</option>
                    </select>
                    {isOther && (
                        <input
                            type="text"
                            placeholder="Please specify"
                            value={form.business_type}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    business_type: e.target.value,
                                }))
                            }
                            className="mt-2 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                            autoFocus
                        />
                    )}
                    {errors.business_type && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.business_type}
                        </p>
                    )}
                </div>

                {/* Annual Gross */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        Annual Gross Income
                    </label>
                    <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300">
                        <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm border-r">
                            ₱
                        </span>
                        <input
                            type="number"
                            value={form.annual_gross}
                            onChange={(e) => handleGrossChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm outline-none"
                        />
                    </div>
                    {errors.annual_gross && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.annual_gross}
                        </p>
                    )}
                </div>

                {/* VAT Type */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                        VAT Type
                        {form.annual_gross !== "" && (
                            <span className="ml-2 normal-case text-cyan-800 font-normal">
                                (auto-selected based on gross income)
                            </span>
                        )}
                    </label>
                    <select
                        value={form.vat_type}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, vat_type: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                        <option value="">Select…</option>
                        <option value="vat_registered">VAT Registered</option>
                        <option value="non_vat">Non-VAT</option>
                    </select>
                    {errors.vat_type && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.vat_type}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleDiscard}
                        className="flex-1 border rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-[2] bg-cyan-800 text-white rounded-lg py-2 text-sm font-semibold hover:bg-cyan-900 disabled:opacity-40 transition"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
