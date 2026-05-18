import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faCheck,
    faXmark,
    faTrash,
    faPen,
} from "@fortawesome/free-solid-svg-icons";

export default function CompanyPaymentDetails() {
    const { setNotification, user } = useStateContext();
    const [paymentDetails, setPaymentDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInput, setShowInput] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);

    const emptyForm = {
        type: "tin",
        bank_name: "",
        account_name: "",
        account_number: "",
    };

    const [newEntry, setNewEntry] = useState(emptyForm);
    const [editEntry, setEditEntry] = useState(emptyForm);

    const fieldConfig = {
        bank_name: { maxLength: 150 },
        account_name: { maxLength: 150 },
        account_number: {
            inputMode: "numeric",
            pattern: "[0-9]*",
            maxLength: 20,
        },
    };

    const onlyNumbers = (e) => {
        if (
            !/[0-9]/.test(e.key) &&
            ![
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
                "Enter",
                "Escape",
            ].includes(e.key)
        ) {
            e.preventDefault();
        }
    };

    useEffect(() => {
        fetchPaymentDetails();
    }, []);

    const fetchPaymentDetails = () => {
        setLoading(true);
        axiosClient
            .get("/company-payment-details")
            .then(({ data }) => setPaymentDetails(data.data ?? data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const onAdd = () => {
        setSaving(true);
        axiosClient
            .post("/company-payment-details", newEntry)
            .then(({ data }) => {
                setPaymentDetails((prev) => [...prev, data.data ?? data]);
                setNewEntry(emptyForm);
                setShowInput(false);
                setNotification("Payment detail added successfully.");
            })
            .catch(() => {})
            .finally(() => setSaving(false));
    };

    const onCancelAdd = () => {
        setShowInput(false);
        setNewEntry(emptyForm);
    };

    const onEditSave = (id) => {
        axiosClient
            .put(`/company-payment-details/${id}`, editEntry)
            .then(() => {
                setPaymentDetails((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, ...editEntry } : p)),
                );
                setEditId(null);
                setEditEntry(emptyForm);
                setNotification("Payment detail updated successfully.");
            })
            .catch(() => {});
    };

    const onDelete = (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this payment detail?",
            )
        )
            return;
        axiosClient
            .delete(`/company-payment-details/${id}`)
            .then(() => {
                setPaymentDetails((prev) => prev.filter((p) => p.id !== id));
                setNotification("Payment detail deleted successfully.");
            })
            .catch(() => {});
    };

    const tableHeaders = [
        "Type",
        "Bank Name",
        "Account Name",
        "Account Number",
        "Actions",
    ];
    const fields = ["type", "bank_name", "account_name", "account_number"];

    const TypeDropdown = ({ value, onChange, onKeyDown }) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full border border-cyan-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
            <option value="tin">TIN</option>
            <option value="bank">Bank</option>
        </select>
    );

    const renderAddCell = (field) => {
        if (field === "type") {
            return (
                <TypeDropdown
                    value={newEntry.type}
                    onChange={(val) =>
                        setNewEntry((prev) => ({ ...prev, type: val }))
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onAdd();
                        if (e.key === "Escape") onCancelAdd();
                    }}
                />
            );
        }
        const config = fieldConfig[field];
        return (
            <input
                type="text"
                inputMode={config.inputMode}
                pattern={config.pattern}
                maxLength={config.maxLength}
                value={newEntry[field]}
                onChange={(e) =>
                    setNewEntry((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                    }))
                }
                onKeyDown={(e) => {
                    if (config.inputMode === "numeric") onlyNumbers(e);
                    if (e.key === "Enter") onAdd();
                    if (e.key === "Escape") onCancelAdd();
                }}
                placeholder={tableHeaders[fields.indexOf(field)]}
                className="w-full border border-cyan-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
        );
    };

    const renderEditCell = (field, detail) => {
        if (field === "type") {
            return (
                <TypeDropdown
                    value={editEntry.type}
                    onChange={(val) =>
                        setEditEntry((prev) => ({ ...prev, type: val }))
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onEditSave(detail.id);
                        if (e.key === "Escape") {
                            setEditId(null);
                            setEditEntry(emptyForm);
                        }
                    }}
                />
            );
        }
        const config = fieldConfig[field];
        return (
            <input
                type="text"
                inputMode={config.inputMode}
                pattern={config.pattern}
                maxLength={config.maxLength}
                value={editEntry[field]}
                onChange={(e) =>
                    setEditEntry((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                    }))
                }
                onKeyDown={(e) => {
                    if (config.inputMode === "numeric") onlyNumbers(e);
                    if (e.key === "Enter") onEditSave(detail.id);
                    if (e.key === "Escape") {
                        setEditId(null);
                        setEditEntry(emptyForm);
                    }
                }}
                className="w-full border border-cyan-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
        );
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Company Payment Details
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage TIN and bank account information for companies.
                    </p>
                </div>
                {!showInput && user?.role_name !== "viewer" && (
                    <button
                        onClick={() => setShowInput(true)}
                        className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Add New
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-cyan-800 text-white text-center uppercase text-xs tracking-wider">
                        <tr>
                            {tableHeaders.map((header) => {
                                if (
                                    header === "Actions" &&
                                    user?.role_name === "viewer"
                                )
                                    return null;
                                return (
                                    <th
                                        key={header}
                                        className="px-4 py-2 text-white text-sm font-medium"
                                    >
                                        {header}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Add New Row */}
                        {showInput && (
                            <tr className="bg-cyan-50">
                                {fields.map((field) => (
                                    <td key={field} className="px-4 py-3">
                                        {renderAddCell(field)}
                                    </td>
                                ))}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={onAdd}
                                            disabled={saving}
                                            className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-900 disabled:opacity-50 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                        >
                                            {saving ? (
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <FontAwesomeIcon
                                                    icon={faCheck}
                                                />
                                            )}
                                            Save
                                        </button>
                                        <button
                                            onClick={onCancelAdd}
                                            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                            Cancel
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Existing Rows */}
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={tableHeaders.length}
                                    className="px-6 py-10 text-center text-gray-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : paymentDetails.length === 0 && !showInput ? (
                            <tr>
                                <td
                                    colSpan={tableHeaders.length}
                                    className="px-6 py-10 text-center text-gray-400"
                                >
                                    No payment details yet. Click{" "}
                                    <strong>Add New</strong> to get started.
                                </td>
                            </tr>
                        ) : (
                            paymentDetails.map((detail) => (
                                <tr
                                    key={detail.id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    {fields.map((field) => (
                                        <td
                                            key={field}
                                            className="px-4 py-3 text-gray-800 font-medium text-center"
                                        >
                                            {editId === detail.id ? (
                                                renderEditCell(field, detail)
                                            ) : field === "type" ? (
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        detail.type === "tin"
                                                            ? "bg-purple-100 text-purple-700"
                                                            : "bg-blue-100 text-blue-700"
                                                    }`}
                                                >
                                                    {detail.type === "tin"
                                                        ? "TIN"
                                                        : "Bank"}
                                                </span>
                                            ) : (
                                                detail[field]
                                            )}
                                        </td>
                                    ))}
                                    {user?.role_name !== "viewer" && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {editId === detail.id ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                onEditSave(
                                                                    detail.id,
                                                                )
                                                            }
                                                            className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faCheck}
                                                            />
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditId(null);
                                                                setEditEntry(
                                                                    emptyForm,
                                                                );
                                                            }}
                                                            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faXmark}
                                                            />
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditId(
                                                                    detail.id,
                                                                );
                                                                setEditEntry({
                                                                    type: detail.type,
                                                                    bank_name:
                                                                        detail.bank_name,
                                                                    account_name:
                                                                        detail.account_name,
                                                                    account_number:
                                                                        detail.account_number,
                                                                });
                                                            }}
                                                            className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />
                                                            Edit
                                                        </button>
                                                        {user?.role_name ===
                                                            "super_admin" && (
                                                            <button
                                                                onClick={() =>
                                                                    onDelete(
                                                                        detail.id,
                                                                    )
                                                                }
                                                                className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faTrash
                                                                    }
                                                                />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
