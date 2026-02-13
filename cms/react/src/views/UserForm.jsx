import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setNotification } = useStateContext();

    const [errors, setErrors] = useState(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState({
        id: null,
        name: "",
        email: "",
        phone_number: "",
        company_name: "",
        company_address: "",
    });
    const [formData, setFormData] = useState(null);

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
                    setNotification("Client was successfully updated");
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
                    setNotification("Client was successfully created");
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
                <h2 className="text-2xl font-bold text-gray-800 m-6 mb-0">
                    Update Client: {formData.name}
                </h2>
            )}
            {!user.id && (
                <h2 className="text-2xl font-bold text-gray-800 m-6 mb-0">
                    Add New Client
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
                            value={user.name}
                            onChange={(e) =>
                                setUser({ ...user, name: e.target.value })
                            }
                            placeholder="Name"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <input
                            type="email"
                            value={user.email}
                            onChange={(e) =>
                                setUser({ ...user, email: e.target.value })
                            }
                            placeholder="Email"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <input
                            value={user.phone_number}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    phone_number: e.target.value,
                                })
                            }
                            placeholder="Phone number"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <input
                            value={user.company_name}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    company_name: e.target.value,
                                })
                            }
                            placeholder="Company name"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <input
                            value={user.company_address}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    company_address: e.target.value,
                                })
                            }
                            placeholder="Company address"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />

                        <button className="w-full bg-cyan-800 text-white font-semibold py-2 rounded-md shadow hover:bg-cyan-900 hover:shadow-lg transition">
                            Save
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}
