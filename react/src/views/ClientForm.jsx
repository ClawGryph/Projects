import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setNotification } = useStateContext();

    const [errors, setErrors] = useState(null);
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState({
        id: null,
        name: "",
        email: "",
        phone_number: "",
        company_name: "",
        company_address: "",
        company_type: "",
    });
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        axiosClient
            .get(`/clients/${id}`)
            .then(({ data }) => {
                setLoading(false);
                setClient(data);
                setFormData(data);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (client.id) {
            axiosClient
                .put(`/clients/${client.id}`, client)
                .then(() => {
                    setNotification("Client was successfully updated");
                    navigate("/clients");
                })
                .catch((err) => {
                    const response = err.response;
                    if (response && response.status === 422) {
                        setErrors(response.data.errors);
                    }
                });
        } else {
            axiosClient
                .post(`/clients`, client)
                .then(() => {
                    setNotification("Client was successfully created");
                    navigate("/clients");
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
            {client.id && (
                <h2 className="text-2xl font-bold text-gray-800 m-6">
                    Update Client: {formData.name}
                </h2>
            )}
            {!client.id && (
                <h2 className="text-2xl font-bold text-gray-800 m-6">
                    Add New Client
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
                        {/* FULL NAME INPUT */}
                        <div className="relative w-full">
                            <input
                                value={client.name}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter full name"
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Name
                            </label>
                        </div>

                        {/* EMAIL INPUT */}
                        <div className="relative w-full">
                            <input
                                type="email"
                                value={client.email}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        email: e.target.value,
                                    })
                                }
                                placeholder="xyz@example.com"
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Email
                            </label>
                        </div>

                        {/* PHONE NUMBER INPUT */}
                        <div className="relative w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-cyan-500">
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm pointer-events-none z-10">
                                Phone Number
                            </label>
                            <div className="flex items-center pt-6">
                                <span className="px-3 pb-2 text-gray-500 bg-gray-100 text-sm border-r self-stretch flex items-center rounded-l-md">
                                    +63
                                </span>
                                <input
                                    value={client.phone_number}
                                    onChange={(e) =>
                                        setClient({
                                            ...client,
                                            phone_number: e.target.value,
                                        })
                                    }
                                    placeholder="9xxxxxxxxx"
                                    className="block w-full pl-3 pr-3 pb-2 rounded-r-md focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* COMPANY NAME INPUT */}
                        <div className="relative w-full">
                            <input
                                value={client.company_name}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        company_name: e.target.value,
                                    })
                                }
                                placeholder="Enter company name..."
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Company Name
                            </label>
                        </div>

                        {/* COMPANY ADDRESS INPUT */}
                        <div className="relative w-full">
                            <input
                                value={client.company_address}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        company_address: e.target.value,
                                    })
                                }
                                placeholder="Enter company address..."
                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Company Address
                            </label>
                        </div>

                        {/* COMPANY TYPE */}
                        <div className="relative w-full">
                            <select
                                value={client.company_type ?? ""}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        company_type: e.target.value,
                                    })
                                }
                                className="block w-full border border-gray-300 rounded-md pl-2 pr-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="" disabled>
                                    Select Type
                                </option>
                                <option value="Private Individual">
                                    Private Individual
                                </option>
                                <option value="Private Corp">
                                    Private Corp
                                </option>
                                <option value="Government">Government</option>
                            </select>
                            <label className="absolute left-3 top-1 text-cyan-800 text-sm transition-all duration-200 pointer-events-none">
                                Company Type
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
