import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [errors, setErrors] = useState({});
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

    // Error Message
    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = "User name is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        if (!form.role_name) e.role_name = "Role is required.";
        if (!form.password) e.password = "Password is required.";
        if (!form.password_confirmation)
            e.password_confirmation = "Password confirmation is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    return (
        <>
            {user.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    Update Employee: {formData.name}
                </h2>
            )}
            {!user.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    New Employee
                </h2>
            )}

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4 w-full max-w-2xl mx-auto">
                {loading && <div className="text-center">Loading...</div>}
                {!loading && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Full Name{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                value={user.name}
                                onChange={(e) =>
                                    setUser({ ...user, name: e.target.value })
                                }
                                placeholder="Enter name of the employee"
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Email{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                type="email"
                                value={user.email}
                                onChange={(e) =>
                                    setUser({ ...user, email: e.target.value })
                                }
                                placeholder="xyz@example.com"
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Role{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <select
                                value={user.role_name}
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        role_name: e.target.value,
                                    })
                                }
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="" disabled>
                                    Select role
                                </option>
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            {errors.role_name && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.role_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Password{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                type="password"
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        password: e.target.value,
                                    })
                                }
                                placeholder="Enter password"
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Password Confirmation{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                type="password"
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        password_confirmation: e.target.value,
                                    })
                                }
                                placeholder="Confirm password"
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.password_confirmation && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.password_confirmation}
                                </p>
                            )}
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
