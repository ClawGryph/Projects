import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faPen } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { setNotification, user } = useStateContext();
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        getProjects();
    }, []);

    const getProjects = (page = 1) => {
        setLoading(true);

        axiosClient
            .get(`/projects?page=${page}`)
            .then(({ data }) => {
                setLoading(false);
                setProjects(data.data);
                setMeta(data.meta);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const onDelete = (p) => {
        if (!window.confirm("Are you sure you want to delete this project?")) {
            return;
        }

        axiosClient.delete(`/projects/${p.id}`).then(() => {
            setNotification("Projects was successfully deleted");
            getProjects();
        });
    };

    const updateStatus = (projectId, newStatus) => {
        axiosClient
            .put(`/projects/${projectId}/status`, {
                status: newStatus,
            })
            .then(() => {
                getProjects(); // refresh list
                setNotification("Project status updated");
            });
    };

    useEffect(() => {
        const close = () => setEditingId(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    return (
        <>
            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Projects
                </h1>
                {user?.role_name !== "viewer" && (
                    <Link
                        to={"/projects/new"}
                        className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Add new
                    </Link>
                )}
            </div>
            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto p-5">
                <div className="max-w-[1100px] w-full overflow-auto rounded-lg max-height">
                    <table className="w-full bg-white shadow-sm border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-cyan-800">
                                <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                    ID
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                    Title
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                    Cost
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                    Start Date
                                </th>
                                <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                    End Date
                                </th>

                                <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                    Status
                                </th>
                                {user?.role_name !== "viewer" && (
                                    <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        Loading...
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && (
                            <tbody>
                                {projects.length > 0 ? (
                                    projects.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-cyan-50 text-center"
                                        >
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.id}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.title}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                ₱{" "}
                                                {new Intl.NumberFormat(
                                                    "en-PH",
                                                ).format(p.price)}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.start_date}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                {p.end_date}
                                            </td>

                                            <td className="border-b border-gray-200 px-4 py-2 relative">
                                                {editingId === p.id ? (
                                                    <div
                                                        style={{
                                                            position: "fixed",
                                                            top: dropdownPos.top,
                                                            left: dropdownPos.left,
                                                            transform:
                                                                "translateX(-50%)",
                                                        }}
                                                        className="bg-white border rounded shadow-md z-50"
                                                    >
                                                        {[
                                                            "pending",
                                                            "ongoing",
                                                            "complete",
                                                        ].map((status) => (
                                                            <div
                                                                key={status}
                                                                onClick={() => {
                                                                    updateStatus(
                                                                        p.id,
                                                                        status,
                                                                    );
                                                                    setEditingId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                                                            >
                                                                <StatusBadge
                                                                    status={
                                                                        status
                                                                    }
                                                                    isEnded={
                                                                        p.isEnded
                                                                    }
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect =
                                                                e.currentTarget.getBoundingClientRect();
                                                            setDropdownPos({
                                                                top:
                                                                    rect.bottom +
                                                                    window.scrollY -
                                                                    30,
                                                                left:
                                                                    rect.left +
                                                                    rect.width /
                                                                        2 +
                                                                    window.scrollX,
                                                            });
                                                            {
                                                                user?.role_name !==
                                                                    "viewer" &&
                                                                    setEditingId(
                                                                        p.id,
                                                                    );
                                                            }
                                                        }}
                                                        className={`flex justify-center ${
                                                            user?.role_name !==
                                                            "viewer"
                                                                ? "cursor-pointer"
                                                                : "cursor-default"
                                                        }`}
                                                    >
                                                        <StatusBadge
                                                            status={p.status}
                                                            isEnded={p.isEnded}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            {user?.role_name !== "viewer" && (
                                                <>
                                                    <td className="border-b border-gray-200 px-4 py-2 flex justify-center items-center gap-2">
                                                        {user?.role_name !==
                                                            "viewer" && (
                                                            <Link
                                                                to={
                                                                    "/projects/" +
                                                                    p.id
                                                                }
                                                                className="inline-block px-2 py-1 text-xs bg-cyan-800 text-white font-semibold rounded-md shadow hover:bg-cyan-900"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faPen}
                                                                />
                                                                Edit
                                                            </Link>
                                                        )}
                                                        {user?.role_name ===
                                                            "super_admin" && (
                                                            <button
                                                                onClick={() =>
                                                                    onDelete(p)
                                                                }
                                                                className="inline-block px-2 py-1 text-xs bg-red-700 text-white font-semibold rounded-md shadow hover:bg-red-800 cursor-pointer"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faTrash
                                                                    }
                                                                />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No projects
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        )}
                    </table>
                    <div className="flex justify-center items-center gap-2 mt-4">
                        {meta?.current_page > 1 && (
                            <button
                                onClick={() =>
                                    getProjects(meta.current_page - 1)
                                }
                                className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                            >
                                Previous
                            </button>
                        )}

                        {meta?.current_page && (
                            <span className="text-sm text-gray-600">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                        )}

                        {meta?.current_page < meta?.last_page && (
                            <button
                                onClick={() =>
                                    getProjects(meta.current_page + 1)
                                }
                                className="px-3 py-1 text-sm bg-cyan-800 text-white rounded hover:bg-cyan-900"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
