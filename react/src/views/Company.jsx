import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import logo from "../assets/logo1.png";

const COLORS = [
    ["#6c63ff", "#1a1640"],
    ["#34d399", "#0d2e21"],
    ["#f472b6", "#2e1020"],
    ["#facc15", "#2a2000"],
    ["#60a5fa", "#0d1e35"],
    ["#fb923c", "#2e1500"],
];

function initials(name) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

function colorFor(id) {
    return COLORS[id % COLORS.length];
}

export default function Company() {
    const { token, selectedCompany, setSelectedCompany } = useStateContext(); // ← add
    const [companies, setCompanies] = useState([]);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true); // ← add
    const [form, setForm] = useState({
        name: "",
        type: "",
        vat_type: "",
        wtax_rate: "",
    });

    // ← add guards
    if (!token) return <Navigate to="/login" />;
    if (selectedCompany) return <Navigate to="/dashboard" />;

    // ← fetch from API instead of local state
    useEffect(() => {
        axiosClient
            .get("/companies")
            .then(({ data }) => setCompanies(data))
            .finally(() => setLoading(false));
    }, []);

    // ← save to API instead of local state
    function saveCompany() {
        if (!form.name || !form.type || !form.vat_type || form.wtax_rate === "")
            return;
        axiosClient.post("/companies", form).then(({ data }) => {
            setCompanies((prev) => [...prev, data]);
            setSelected(data);
            setForm({ name: "", type: "", vat_type: "", wtax_rate: "" });
            setShowModal(false);
        });
    }

    // ← add proceed
    function proceed() {
        if (selected) setSelectedCompany(selected);
    }

    return (
        // ← wrap in full page layout
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="logo" className="h-16" />
                </div>
                <h1 className="text-xl font-bold text-center mb-1">
                    Welcome back
                </h1>
                <p className="text-sm text-gray-400 text-center mb-6">
                    Select a company to continue
                </p>

                <div className="relative w-full">
                    {/* Dropdown trigger */}
                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="w-full flex items-center justify-between border rounded-lg px-4 py-3 bg-white text-sm"
                    >
                        {selected ? (
                            <span className="font-medium">{selected.name}</span>
                        ) : (
                            <span className="text-gray-400">
                                {loading ? "Loading..." : "Select a company…"}
                            </span>
                        )}
                        <span>▾</span>
                    </button>

                    {/* Dropdown menu */}
                    {open && (
                        <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg overflow-hidden">
                            {companies.length === 0 && (
                                <li className="px-4 py-3 text-sm text-gray-400">
                                    No companies yet
                                </li>
                            )}
                            {companies.map((c) => {
                                const [fg, bg] = colorFor(c.id);
                                return (
                                    <li
                                        key={c.id}
                                        onClick={() => {
                                            setSelected(c);
                                            setOpen(false);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                                    >
                                        <span
                                            className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                                            style={{
                                                background: bg,
                                                color: fg,
                                            }}
                                        >
                                            {initials(c.name)}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {c.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {c.type} · {c.vat_type} ·{" "}
                                                {c.wtax_rate}% WHT
                                            </p>
                                        </div>
                                        {selected?.id === c.id && (
                                            <span className="ml-auto text-indigo-500">
                                                ✓
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* Add Company button */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-2 w-full border border-dashed rounded-lg py-2 text-sm text-gray-400 hover:border-cyan-400 hover:text-cyan-600 transition"
                    >
                        + Add Company
                    </button>

                    {/* Continue button ← add */}
                    <button
                        onClick={proceed}
                        disabled={!selected}
                        className="mt-2 w-full bg-cyan-800 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-900 transition"
                    >
                        Continue
                    </button>
                </div>

                {/* Modal — unchanged */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-base font-semibold mb-4">
                                New Company
                            </h2>
                            {[
                                {
                                    label: "Company Name",
                                    key: "name",
                                    type: "text",
                                    placeholder: "e.g. Acme Corp",
                                },
                                {
                                    label: "WHT Rate (%)",
                                    key: "wtax_rate",
                                    type: "number",
                                    placeholder: "e.g. 5",
                                },
                            ].map(({ label, key, type, placeholder }) => (
                                <div key={key} className="mb-3">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                        {label}
                                    </label>
                                    <input
                                        type={type}
                                        placeholder={placeholder}
                                        value={form[key]}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                [key]: e.target.value,
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                </div>
                            ))}
                            {[
                                {
                                    label: "Type",
                                    key: "type",
                                    options: [
                                        "Corporation",
                                        "Partnership",
                                        "Sole Proprietorship",
                                        "LLC",
                                        "Cooperative",
                                    ],
                                },
                                {
                                    label: "VAT Type",
                                    key: "vat_type",
                                    options: ["VAT", "Non-VAT", "Exempt"],
                                },
                            ].map(({ label, key, options }) => (
                                <div key={key} className="mb-3">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                        {label}
                                    </label>
                                    <select
                                        value={form[key]}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                [key]: e.target.value,
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                                    >
                                        <option value="">Select…</option>
                                        {options.map((o) => (
                                            <option key={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 border rounded-lg py-2 text-sm text-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveCompany}
                                    className="flex-[2] bg-cyan-800 text-white rounded-lg py-2 text-sm font-semibold"
                                >
                                    Save Company
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
