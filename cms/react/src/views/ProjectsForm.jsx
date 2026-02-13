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
            <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
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
                        <input
                            value={project.title}
                            onChange={(e) =>
                                setProject({
                                    ...project,
                                    title: e.target.value,
                                })
                            }
                            placeholder="Title"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <textarea
                            value={project.description}
                            onChange={(e) =>
                                setProject({
                                    ...project,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Description"
                            rows={5}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none overflow-y-auto"
                        />
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
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
                                placeholder="Price"
                                className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div className="relative w-full">
                            <select
                                value={project.payment_type}
                                onChange={(e) =>
                                    setProject({
                                        ...project,
                                        payment_type: e.target.value,
                                    })
                                }
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                            >
                                <option value="" disabled>
                                    Select Payment Type
                                </option>
                                <option value="one_time">One Time</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
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
                                className="peer block w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label
                                className="absolute left-3 top-2 text-gray-400 text-sm transition-all duration-200
                                            peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                                            peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm"
                            >
                                Start Date
                            </label>
                        </div>
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
                                className="peer block w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label
                                className="absolute left-3 top-2 text-gray-400 text-sm transition-all duration-200
                                            peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                                            peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm"
                            >
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
