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
    faBuilding,
} from "@fortawesome/free-solid-svg-icons";

export default function CompanyType() {
    const { setNotification, user } = useStateContext();
    const [companyTypes, setCompanyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInput, setShowInput] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        fetchCompanyTypes();
    }, []);

    const fetchCompanyTypes = () => {
        setLoading(true);
        axiosClient
            .get("/company-types")
            .then(({ data }) => setCompanyTypes(data.data ?? data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const onAdd = () => {
        if (!newTypeName.trim()) return;
        setSaving(true);
        axiosClient
            .post("/company-types", { name: newTypeName.trim() })
            .then(({ data }) => {
                setCompanyTypes((prev) => [...prev, data.data ?? data]);
                setNewTypeName("");
                setShowInput(false);
                setNotification("Company type added successfully.");
            })
            .catch(() => {})
            .finally(() => setSaving(false));
    };

    const onCancelAdd = () => {
        setShowInput(false);
        setNewTypeName("");
    };

    const onEditSave = (id) => {
        if (!editName.trim()) return;
        axiosClient
            .put(`/company-types/${id}`, { name: editName.trim() })
            .then(({ data }) => {
                setCompanyTypes((prev) =>
                    prev.map((t) =>
                        t.id === id ? { ...t, name: editName.trim() } : t,
                    ),
                );
                setEditId(null);
                setEditName("");
                setNotification("Company type updated successfully.");
            })
            .catch(() => {});
    };

    const onDelete = (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this company type?",
            )
        )
            return;
        axiosClient
            .delete(`/company-types/${id}`)
            .then(() => {
                setCompanyTypes((prev) => prev.filter((t) => t.id !== id));
                setNotification("Company type deleted successfully.");
            })
            .catch(() => {});
    };

    const tableHeaders = ["Type Name", "Actions"];

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Business Types
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage the types of companies available for clients.
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
                    <thead className="bg-cyan-800 text-gray-600 text-center uppercase text-xs tracking-wider">
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
                                <td className="px-6 py-3 flex justify-center">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTypeName}
                                        onChange={(e) =>
                                            setNewTypeName(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") onAdd();
                                            if (e.key === "Escape")
                                                onCancelAdd();
                                        }}
                                        placeholder="Enter company type name..."
                                        className="w-full border border-cyan-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </td>
                                <td text-center className="px-6 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={onAdd}
                                            disabled={
                                                saving || !newTypeName.trim()
                                            }
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
                        ) : companyTypes.length === 0 && !showInput ? (
                            <tr>
                                <td
                                    colSpan={tableHeaders.length}
                                    className="px-6 py-10 text-center text-gray-400"
                                >
                                    No business types yet. Click{" "}
                                    <strong>Add New</strong> to get started.
                                </td>
                            </tr>
                        ) : (
                            companyTypes.map((type, index) => (
                                <tr
                                    key={type.id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <td className="px-6 py-3 text-gray-800 font-medium text-center">
                                        {editId === type.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editName}
                                                onChange={(e) =>
                                                    setEditName(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        onEditSave(type.id);
                                                    if (e.key === "Escape") {
                                                        setEditId(null);
                                                        setEditName("");
                                                    }
                                                }}
                                                className="w-full border border-cyan-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        ) : (
                                            type.name
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            {editId === type.id ? (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            onEditSave(type.id)
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
                                                            setEditName("");
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
                                                    {user?.role_name !==
                                                        "viewer" && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditId(
                                                                        type.id,
                                                                    );
                                                                    setEditName(
                                                                        type.name,
                                                                    );
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
                                                                            type.id,
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
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
