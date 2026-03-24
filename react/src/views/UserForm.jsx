import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [errors, setErrors] = useState(null);
    const [loading, setLoading] = useState(false);
    const { setNotification } = useStateContext();
    const [formData, setFormData] = useState(null);
    const [user, setUser] = useState({
        id: null,
        name: "",
        email: "",
        role_name: "",
        password: "",
        password_confirmation: "",
    });

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        axiosClient
            .get(`/users/${id}`)
            .then(({ data }) => {
                setLoading(false);
                setUser(data);
                setFormData(data);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (user.id) {
            axiosClient
                .put(`/users/${user.id}`, user)
                .then(() => {
                    setNotification("Employee was successfully updated");
                    navigate("/users");
                })
                .catch((err) => {
                    const response = err.response;
                    if (response && response.status === 422) {
                        setErrors(response.data.errors);
                    }
                });
        } else {
            axiosClient
                .post(`/users`, user)
                .then(() => {
                    setNotification("Employee was successfully created");
                    navigate("/users");
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
        <>
            {user.id && (
                <h2 className="text-2xl font-bold text-gray-800 m-6">
                    Update Employee: {formData.name}
                </h2>
            )}
            {!user.id && (
                <h2 className="text-2xl font-bold text-gray-800 m-6">
                    New Employee
                </h2>
            )}

            <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
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
                        <div className="relative w-full">
                            <input
                                value={user.name}
                                onChange={(e) =>
                                    setUser({ ...user, name: e.target.value })
                                }
                                placeholder="Enter name of the employee"
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Name
                            </label>
                        </div>

                        <div className="relative w-full">
                            <input
                                type="email"
                                value={user.email}
                                onChange={(e) =>
                                    setUser({ ...user, email: e.target.value })
                                }
                                placeholder="xyz@example.com"
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Email
                            </label>
                        </div>

                        <div className="relative w-full">
                            <select
                                value={user.role_name}
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        role_name: e.target.value,
                                    })
                                }
                                className="block w-full border border-gray-300 rounded-md pl-2 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="" disabled>
                                    Select role
                                </option>
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Role
                            </label>
                        </div>

                        <div className="relative w-full">
                            <input
                                type="password"
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        password: e.target.value,
                                    })
                                }
                                placeholder="Enter password"
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Password
                            </label>
                        </div>

                        <div className="relative w-full">
                            <input
                                type="password"
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        password_confirmation: e.target.value,
                                    })
                                }
                                placeholder="Confirm password"
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Password Confirmation
                            </label>
                        </div>

                        <button className="w-full bg-cyan-800 text-white font-semibold py-2 rounded-md shadow hover:bg-cyan-900 hover:shadow-lg transition">
                            Save
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}
