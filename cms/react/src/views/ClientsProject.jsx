import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge.jsx";

export default function ClientsProject() {
    const { id } = useParams(); // client ID from URL
    const { setNotification } = useStateContext();

    const [client, setClient] = useState(null);
    const [projects, setProjects] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [paymentType, setPaymentType] = useState("");
    const [recurringType, setRecurringType] = useState("");
    const [installmentMonths, setInstallmentMonths] = useState("");

    // Fetch client info
    useEffect(() => {
        if (!id) return;

        // Fetch client info
        axiosClient
            .get(`/clients/${id}`)
            .then(({ data }) => setClient(data))
            .catch(() => setNotification("Failed to load client data"));

        // Fetch projects
        getClientProjects();
    }, [id]);

    // Fetch client's projects
    useEffect(() => {
        if (!id) return;
        setLoading(true);

        axiosClient
            .get(`/clients/${id}/projects`)
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

    const getClientProjects = () => {
        setLoading(true);
        axiosClient
            .get(`/clients/${id}/projects`)
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

    const assignProjectToClient = () => {
        // Validation
        if (!selectedProject) {
            setErrors({ general: ["Please select a project first."] });
            return;
        }

        if (!paymentType) {
            setErrors({ general: ["Please select a payment first."] });
            return;
        }

        if (paymentType === "recurring" && !recurringType) {
            setErrors({ general: ["Please select a recurring type first."] });
            return;
        }

        if (paymentType === "installment" && !installmentMonths) {
            setErrors({ general: ["Please enter installment months first."] });
            return;
        }

        // API Request
        axiosClient
            .post(`/clients/${id}/projects`, {
                project_id: selectedProject,
                payment_type: paymentType,
                recurring_type:
                    paymentType === "recurring" ? recurringType : null,
                installments:
                    paymentType === "installment" ? installmentMonths : null,
                start_date: new Date().toISOString().slice(0, 10),
            })
            .then(() => {
                setNotification("Project assigned successfully");

                // Reset modal state
                setSelectedProject("");
                setPaymentType("");
                setRecurringType("");
                setInstallmentMonths("");

                closeModal();
                getClientProjects(); // Refresh projects
            })
            .catch((err) => {
                const response = err.response;

                if (!response) return;

                if (response.status === 422) {
                    if (response.data.errors) {
                        setErrors(response.data.errors);
                    } else if (response.data.message) {
                        setErrors({ general: [response.data.message] });
                    }
                }
            });
    };

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-3xl font-bold">
                    {client ? `${client.name}'s Projects` : "Projects"}
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
                <p className="text-gray-500">
                    This client has no projects yet.
                </p>
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
                                    {project.project.title}
                                </h2>

                                {/* Description */}
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                    {project.project.description}
                                </p>
                            </div>
                            {/* Status */}
                            <p className="text-gray-600 mb-4 line-clamp-2">
                                <StatusBadge status={project.project.status} />
                            </p>
                        </div>

                        {/* Price - highlighted */}
                        <div className="bg-blue-50 rounded-lg px-4 py-2 mb-4 inline-block">
                            <p className="text-2xl font-bold text-cyan-800">
                                ₱
                                {new Intl.NumberFormat("en-PH").format(
                                    project.project.price,
                                )}
                            </p>
                        </div>

                        {/* Dates */}
                        <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium text-gray-700">
                                    Start:
                                </span>
                                <span>{project.project.start_date || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium text-gray-700">
                                    End:
                                </span>
                                <span>{project.project.end_date || "-"}</span>
                            </div>
                        </div>

                        {/* Payment Type - badge style */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">
                                Payment:
                            </span>

                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                                        project.payment?.payment_type ===
                                        "one-time"
                                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                            : project.payment?.payment_type ===
                                                "recurring"
                                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                                              : project.payment
                                                      ?.payment_type ===
                                                  "installment"
                                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                : "bg-gray-100 text-gray-600 border border-gray-200"
                                    }`}
                                >
                                    {project.payment
                                        ? formatPaymentType(
                                              project.payment.payment_type,
                                          )
                                        : "Not Set"}
                                </span>

                                {project.payment?.payment_type ===
                                    "recurring" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium border border-blue-100">
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                        {project.payment.recurring_type}
                                    </span>
                                )}

                                {project.payment?.payment_type ===
                                    "installment" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium border border-purple-100">
                                        <svg
                                            className="w-3 h-3"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="font-semibold">
                                            {
                                                project.payment
                                                    .current_installment
                                            }
                                        </span>
                                        <span className="text-purple-400">
                                            /
                                        </span>
                                        <span>
                                            {project.payment.installments}
                                        </span>
                                    </span>
                                )}
                            </div>
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

                        {/* DISPLAY VALIDATION ERROR */}
                        {errors && (
                            <div className="px-4 py-3 mb-5 rounded shadow text-white bg-red-500 animate-slide-in">
                                {Object.keys(errors).map((key) => (
                                    <p key={key}>{errors[key][0]}</p>
                                ))}
                            </div>
                        )}

                        {/* CHOOSE PROJECT */}
                        <div className="relative w-full mb-2">
                            <select
                                value={selectedProject}
                                onChange={(e) =>
                                    setSelectedProject(e.target.value)
                                }
                                className="block w-full border border-gray-300 rounded-md pl-2 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Select a project</option>
                                {allProjects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.title}
                                    </option>
                                ))}
                            </select>
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Project
                            </label>
                        </div>

                        {/* PAYMENT TYPE */}
                        <div className="relative w-full mb-2">
                            <select
                                value={paymentType}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setPaymentType(value);
                                    setRecurringType("");
                                    setInstallmentMonths("");
                                }}
                                className="block w-full border border-gray-300 rounded-md pl-2 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="" disabled>
                                    Select payment type
                                </option>
                                <option value="one_time">One Time</option>
                                <option value="recurring">Recurring</option>
                                <option value="installment">Installment</option>
                            </select>
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Payment
                            </label>
                        </div>

                        {/* IF PAYMENT TYPE IS RECURRING SHOW */}
                        {paymentType === "recurring" && (
                            <div className="relative w-full mb-2">
                                <select
                                    value={recurringType}
                                    onChange={(e) =>
                                        setRecurringType(e.target.value)
                                    }
                                    className="block w-full border border-gray-300 rounded-md pl-2 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="" disabled>
                                        Select recurring type
                                    </option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                                <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                    Recurring Type
                                </label>
                            </div>
                        )}

                        {/* IF PAYMENT TYPE IS INSTALLMENT SHOW */}
                        {paymentType === "installment" && (
                            <div className="relative w-full mb-2">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={installmentMonths}
                                    onChange={(e) =>
                                        setInstallmentMonths(e.target.value)
                                    }
                                    className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                    Number of months
                                </label>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                closeModal();
                                setSelectedProject("");
                                setPaymentType("");
                                setRecurringType("");
                                setInstallmentMonths("");
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded cursor-pointer"
                        >
                            Close
                        </button>
                        <button
                            onClick={assignProjectToClient}
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
