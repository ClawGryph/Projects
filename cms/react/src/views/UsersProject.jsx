import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge.jsx";

export default function UsersProject() {
    const { id } = useParams(); // user ID from URL
    const { setNotification } = useStateContext();

    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch user info
    useEffect(() => {
        if (!id) return;

        // Fetch user info
        axiosClient
            .get(`/users/${id}`)
            .then(({ data }) => setUser(data))
            .catch(() => setNotification("Failed to load user data"));

        // Fetch projects
        getUserProjects();
    }, [id]);

    // Fetch user's projects
    useEffect(() => {
        if (!id) return;
        setLoading(true);

        axiosClient
            .get(`/users/${id}/projects`)
            .then(({ data }) => {
                setProjects(data.data);
                setLoading(false);
            })
            .catch((err) => {
                setNotification("Failed to load projects");
                setLoading(false);
            });
    }, [id]);

    // Fetch Projects
    useEffect(() => {
        axiosClient
            .get("/projects")
            .then(({ data }) => setAllProjects(data.data))
            .catch(() => setNotification("Failed to load projects"));
    }, []);

    if (loading) {
        return (
            <div className="text-center mt-10 text-gray-500">Loading...</div>
        );
    }

    const getUserProjects = () => {
        setLoading(true);
        axiosClient
            .get(`/users/${id}/projects`)
            .then(({ data }) => setProjects(data.data))
            .catch(() => setNotification("Failed to load projects"))
            .finally(() => setLoading(false));
    };

    const formatPaymentType = (type) => {
        if (!type) return "";

        // Replace underscores with spaces
        const formatted = type.replace(/_/g, " ");

        // Capitalize first letter of every word
        return formatted
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-3xl font-bold">
                    {user ? `${user.name}'s Projects` : "Projects"}
                </h1>
                <button
                    onClick={openModal}
                    className="w-25 bg-sky-400 text-xs text-white cta-btn font-semibold py-2 rounded-br-lg rounded-bl-lg rounded-tr-lg shadow-lg hover:shadow-xl hover:bg-sky-500 flex items-center justify-center cursor-pointer"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Add project
                </button>
            </div>

            {projects.length === 0 && (
                <p className="text-gray-500">This user has no projects yet.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="flex justify-between">
                            <div>
                                {/* Title */}
                                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-800 transition-colors">
                                    {project.title}
                                </h2>

                                {/* Description */}
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                    {project.description}
                                </p>
                            </div>
                            {/* Status */}
                            <p className="text-gray-600 mb-4 line-clamp-2">
                                <StatusBadge status={project.status} />
                            </p>
                        </div>

                        {/* Price - highlighted */}
                        <div className="bg-blue-50 rounded-lg px-4 py-2 mb-4 inline-block">
                            <p className="text-2xl font-bold text-cyan-800">
                                ₱
                                {new Intl.NumberFormat("en-PH").format(
                                    project.price,
                                )}
                            </p>
                        </div>

                        {/* Dates */}
                        <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium text-gray-700">
                                    Start:
                                </span>
                                <span>{project.start_date || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium text-gray-700">
                                    End:
                                </span>
                                <span>{project.end_date || "-"}</span>
                            </div>
                        </div>

                        {/* Payment Type - badge style */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">
                                Payment:
                            </span>
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                                {formatPaymentType(project.payment_type) || "-"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-50/70">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">
                            Add project to client
                        </h2>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 mb-4"
                        >
                            <option value="">Select a project</option>
                            {allProjects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.title}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 bg-red-500 text-white rounded cursor-pointer"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                if (!selectedProject)
                                    return setNotification(
                                        "Select a project first",
                                    );

                                axiosClient
                                    .post(`/users/${id}/projects`, {
                                        project_id: selectedProject,
                                    })
                                    .then(() => {
                                        setNotification(
                                            "Project assigned successfully",
                                        );
                                        setSelectedProject(""); // reset dropdown
                                        closeModal(); // close modal
                                        getUserProjects(); // refresh projects list!
                                    })
                                    .catch(() =>
                                        setNotification(
                                            "Failed to assign project",
                                        ),
                                    );
                            }}
                            className="px-4 py-2 bg-sky-400 text-white rounded ml-2 cursor-pointer"
                        >
                            Assign Project
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
