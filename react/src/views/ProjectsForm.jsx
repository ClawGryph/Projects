import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function ProjectsForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setNotification } = useStateContext();

    const [errors, setErrors] = useState({});
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState({
        id: null,
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        adjusted_start_date: "",
        adjusted_end_date: "",
        cr_no: "",
        payment_type: "",
        price: "",
    });
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        axiosClient
            .get(`/projects/${id}`)
            .then(({ data }) => {
                setLoading(false);
                setProject(data);
                setFormData(data);
            })
            .catch(() => setLoading(false));

        // fetch logs
        axiosClient
            .get(`/projects/${id}/logs`)
            .then(({ data }) => setLogs(data));
    }, [id]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (project.id) {
            axiosClient
                .put(`/projects/${project.id}`, project)
                .then(() => {
                    setNotification("Project was successfully updated");
                    navigate("/projects");
                })
                .catch((err) => {
                    const response = err.response;
                    if (response && response.status === 422) {
                        setErrors(response.data.errors);
                    }
                });
        } else {
            axiosClient
                .post(`/projects`, project)
                .then(() => {
                    setNotification("Project was successfully created");
                    navigate("/projects");
                })
                .catch((err) => {
                    const response = err.response;
                    if (response && response.status === 422) {
                        setErrors(response.data.errors);
                    }
                });
        }
    };

    // Error Message
    function validate() {
        const e = {};
        if (!form.title.trim()) e.title = "Title is required.";
        if (!form.description.trim())
            e.description = "Description is required.";
        if (form.price === "") e.price = "Cost is required.";
        if (!form.start_date) e.start_date = "Start date is required.";
        if (!form.end_date) e.end_date = "End date is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    const FIELD_LABELS = {
        start_date: "Start Date",
        end_date: "End Date",
        adjusted_start_date: "Adjusted Start Date",
        adjusted_end_date: "Adjusted End Date",
    };

    return (
        <>
            {project.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    Update project: {formData.title}
                </h2>
            )}
            {!project.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    Add new project
                </h2>
            )}

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4 w-full max-w-2xl mx-auto">
                {loading && <div className="text-center">Loading...</div>}
                {!loading && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* TITLE INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Title{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                value={project.title}
                                onChange={(e) =>
                                    setProject({
                                        ...project,
                                        title: e.target.value,
                                    })
                                }
                                placeholder="Enter title..."
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.title && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* DESCRIPTION INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Description{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <textarea
                                value={project.description}
                                onChange={(e) =>
                                    setProject({
                                        ...project,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Enter description..."
                                rows={5}
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.description && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* COST INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Cost{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500">
                                <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm border-r">
                                    ₱
                                </span>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={project.price}
                                    onChange={(e) =>
                                        setProject({
                                            ...project,
                                            price: e.target.value,
                                        })
                                    }
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            {errors.price && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.price}
                                </p>
                            )}
                        </div>

                        {/* START DATE */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Start date{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                type="date"
                                value={project.start_date}
                                onChange={(e) =>
                                    setProject({
                                        ...project,
                                        start_date: e.target.value,
                                    })
                                }
                                placeholder=" "
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.start_date && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.start_date}
                                </p>
                            )}
                        </div>

                        {/* END DATE */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                End date{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                type="date"
                                value={project.end_date}
                                onChange={(e) =>
                                    setProject({
                                        ...project,
                                        end_date: e.target.value,
                                    })
                                }
                                placeholder=" "
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.end_date && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.end_date}
                                </p>
                            )}
                        </div>

                        {/* ADJUSTED DATES & CR NO. — edit mode only */}
                        {project.id && (
                            <>
                                {/* Section Divider */}
                                <div className="border-t pt-4">
                                    <h3 className="text-xs font-semibold text-cyan-800 uppercase tracking-wider mb-4">
                                        Adjustments & Reference
                                    </h3>

                                    {/* ADJUSTED START DATE */}
                                    <div className="space-y-4 rounded-xl p-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                Adjusted Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={
                                                    project.adjusted_start_date ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setProject({
                                                        ...project,
                                                        adjusted_start_date:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                            {errors.adjusted_start_date && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.adjusted_start_date}
                                                </p>
                                            )}
                                        </div>

                                        {/* ADJUSTED END DATE */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                Adjusted End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={
                                                    project.adjusted_end_date ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setProject({
                                                        ...project,
                                                        adjusted_end_date:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                            {errors.adjusted_end_date && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.adjusted_end_date}
                                                </p>
                                            )}
                                        </div>

                                        {/* CR NO. */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                CR No.{" "}
                                                <span className="text-red-500 text-xs">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={project.cr_no ?? ""}
                                                onChange={(e) =>
                                                    setProject({
                                                        ...project,
                                                        cr_no: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter CR number..."
                                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                            {errors.cr_no && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.cr_no}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <button className="w-full bg-cyan-800 text-white font-semibold py-2 rounded-md shadow hover:bg-cyan-900 hover:shadow-lg transition">
                            Save
                        </button>
                    </form>
                )}
            </div>

            {/* RIGHT - PROJECT LOGS */}
            {project.id && logs.length > 0 && (
                <div className="flex-1 p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Adjusted date logs
                    </h3>
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Timestamp
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        User
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Field
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Previous
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        New
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        CR No.
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(
                                                log.created_at,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-700">
                                            {log.user?.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {FIELD_LABELS[log.field] ??
                                                log.field}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-red-50 text-red-600 border border-red-100 rounded px-2 py-0.5 text-xs">
                                                {log.old_value ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-green-50 text-green-700 border border-green-100 rounded px-2 py-0.5 text-xs">
                                                {log.new_value ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {log.cr_no ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
