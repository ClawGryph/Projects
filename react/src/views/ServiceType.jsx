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

export default function ServiceType() {
    const { setNotification, user } = useStateContext();
    const [serviceTypes, setServiceTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInput, setShowInput] = useState(false);
    const [newType, setNewType] = useState({ type: "", rate: "" });
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ type: "", rate: "" });

    useEffect(() => {
        fetchServiceTypes();
    }, []);

    const fetchServiceTypes = () => {
        setLoading(true);
        axiosClient
            .get("/service-types")
            .then(({ data }) => setServiceTypes(data.data ?? data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const onAdd = () => {
        if (!newType.type.trim() || newType.rate === "") return;
        setSaving(true);
        axiosClient
            .post("/service-types", {
                type: newType.type.trim(),
                rate: parseFloat(newType.rate),
            })
            .then(({ data }) => {
                setServiceTypes((prev) => [...prev, data.data ?? data]);
                setNewType({ type: "", rate: "" });
                setShowInput(false);
                setNotification("Service type added successfully.");
            })
            .catch(() => {})
            .finally(() => setSaving(false));
    };

    const onCancelAdd = () => {
        setShowInput(false);
        setNewType({ type: "", rate: "" });
    };

    const onEditSave = (id) => {
        if (!editData.type.trim() || editData.rate === "") return;
        axiosClient
            .put(`/service-types/${id}`, {
                type: editData.type.trim(),
                rate: parseFloat(editData.rate),
            })
            .then(() => {
                setServiceTypes((prev) =>
                    prev.map((t) =>
                        t.id === id
                            ? {
                                  ...t,
                                  type: editData.type.trim(),
                                  rate: editData.rate,
                              }
                            : t,
                    ),
                );
                setEditId(null);
                setEditData({ type: "", rate: "" });
                setNotification("Service type updated successfully.");
            })
            .catch(() => {});
    };

    const onDelete = (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this service type?",
            )
        )
            return;
        axiosClient
            .delete(`/service-types/${id}`)
            .then(() => {
                setServiceTypes((prev) => prev.filter((t) => t.id !== id));
                setNotification("Service type deleted successfully.");
            })
            .catch(() => {});
    };

    const isViewer = user?.role_name === "viewer";
    const isSuperAdmin = user?.role_name === "super_admin";
    const tableHeaders = ["Service Type", "Withholding Rate (%)", "Actions"];

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Withholding Rate
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage the types of services and their withholding tax
                        rates.
                    </p>
                </div>
                {!showInput && !isViewer && (
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
                                if (header === "Actions" && isViewer)
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
                                <td className="px-6 py-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newType.type}
                                        onChange={(e) =>
                                            setNewType({
                                                ...newType,
                                                type: e.target.value,
                                            })
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") onAdd();
                                            if (e.key === "Escape")
                                                onCancelAdd();
                                        }}
                                        placeholder="Enter service type name..."
                                        className="w-full border border-cyan-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center border border-cyan-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500 bg-white">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={newType.rate}
                                            onChange={(e) =>
                                                setNewType({
                                                    ...newType,
                                                    rate: e.target.value,
                                                })
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") onAdd();
                                                if (e.key === "Escape")
                                                    onCancelAdd();
                                            }}
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 text-sm outline-none"
                                        />
                                        <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm border-l">
                                            %
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={onAdd}
                                            disabled={
                                                saving ||
                                                !newType.type.trim() ||
                                                newType.rate === ""
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
                        ) : serviceTypes.length === 0 && !showInput ? (
                            <tr>
                                <td
                                    colSpan={tableHeaders.length}
                                    className="px-6 py-10 text-center text-gray-400"
                                >
                                    No service types yet. Click{" "}
                                    <strong>Add New</strong> to get started.
                                </td>
                            </tr>
                        ) : (
                            serviceTypes.map((type) => (
                                <tr
                                    key={type.id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    {/* Type Name cell */}
                                    <td className="px-6 py-3 text-gray-800 font-medium text-center">
                                        {editId === type.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editData.type}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        type: e.target.value,
                                                    })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        onEditSave(type.id);
                                                    if (e.key === "Escape") {
                                                        setEditId(null);
                                                        setEditData({
                                                            type: "",
                                                            rate: "",
                                                        });
                                                    }
                                                }}
                                                className="w-full border border-cyan-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        ) : (
                                            type.type
                                        )}
                                    </td>

                                    {/* Rate cell */}
                                    <td className="px-6 py-3 text-gray-700 text-center">
                                        {editId === type.id ? (
                                            <div className="flex items-center border border-cyan-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500 bg-white">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={editData.rate}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            rate: e.target
                                                                .value,
                                                        })
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter")
                                                            onEditSave(type.id);
                                                        if (
                                                            e.key === "Escape"
                                                        ) {
                                                            setEditId(null);
                                                            setEditData({
                                                                type: "",
                                                                rate: "",
                                                            });
                                                        }
                                                    }}
                                                    className="w-full px-3 py-1.5 text-sm outline-none"
                                                />
                                                <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm border-l">
                                                    %
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="inline-block bg-cyan-50 text-cyan-800 border border-cyan-100 rounded px-2 py-0.5 text-xs font-semibold">
                                                {parseFloat(type.rate).toFixed(
                                                    2,
                                                )}
                                                %
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions cell */}
                                    {!isViewer && (
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {editId === type.id ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                onEditSave(
                                                                    type.id,
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
                                                                setEditData({
                                                                    type: "",
                                                                    rate: "",
                                                                });
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
                                                                    type.id,
                                                                );
                                                                setEditData({
                                                                    type: type.type,
                                                                    rate: type.rate,
                                                                });
                                                            }}
                                                            className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPen}
                                                            />
                                                            Edit
                                                        </button>
                                                        {isSuperAdmin && (
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
