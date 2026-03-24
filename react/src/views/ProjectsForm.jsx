import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function ProjectsForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setNotification } = useStateContext();

    const [errors, setErrors] = useState(null);
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState({
        id: null,
        title: "",
        description: "",
        start_date: "",
        end_date: "",
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

    return (
        <div className="overflow-y-auto">
            {project.id && (
                <h2 className="text-2xl font-bold text-gray-800 m-6">
                    Update Project: {formData.title}
                </h2>
            )}
            {!project.id && (
                <h2 className="text-2xl font-bold text-gray-800 m-6">
                    Add New Project
                </h2>
            )}
            <div className="w-full max-w-2xl mx-auto  p-6 bg-white rounded-xl shadow-lg">
                {loading && <div className="text-center">Loading...</div>}
                {errors && (
                    <div className="px-4 py-3 mb-5 rounded shadow text-white bg-red-500 animate-slide-in">
                        {Object.keys(errors).map((key) => (
                            <p key={key}>{errors[key][0]}</p>
                        ))}
                    </div>
                )}
                {!loading && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* TITLE INPUT */}
                        <div className="relative w-full">
                            <input
                                value={project.title}
                                onChange={(e) =>
                                    setProject({
                                        ...project,
                                        title: e.target.value,
                                    })
                                }
                                placeholder="Enter title..."
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Title
                            </label>
                        </div>

                        {/* DESCRIPTION INPUT */}
                        <div className="relative w-full">
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
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Description
                            </label>
                        </div>

                        {/* COST INPUT */}
                        <div className="relative w-full">
                            <span className="absolute left-3 top-8 -translate-y-1/2 text-gray-700 font-semibold pointer-events-none">
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
                                className="block w-full border border-gray-300 rounded-md pl-8 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />

                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Client Cost
                            </label>
                        </div>

                        {/* START DATE */}
                        <div className="relative w-full">
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
                                className="block w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Start Date
                            </label>
                        </div>

                        {/* END DATE */}
                        <div className="relative w-full">
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
                                className="block w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                End Date
                            </label>
                        </div>

                        <button className="w-full bg-cyan-800 text-white font-semibold py-2 rounded-md shadow hover:bg-cyan-900 hover:shadow-lg transition">
                            Save
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
