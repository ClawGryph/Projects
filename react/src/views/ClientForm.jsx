import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setNotification } = useStateContext();

    const [errors, setErrors] = useState({});
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

    // Error Message
    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = "Client name is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        if (!form.phone_number) e.phone_number = "Phone number is required.";
        if (!form.company_name) e.company_name = "Company name is required.";
        if (!form.company_address)
            e.company_address = "Company address is required.";
        if (!form.company_type) e.company_type = "Company type is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    return (
        <>
            {client.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    Update Client: {formData.name}
                </h2>
            )}
            {!client.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    Add new client
                </h2>
            )}

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4 w-full max-w-2xl mx-auto">
                {loading && <div className="text-center">Loading...</div>}
                {!loading && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* FULL NAME INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Full Name
                            </label>
                            <input
                                value={client.name}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter full name"
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* EMAIL INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Email
                            </label>
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
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* PHONE NUMBER INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Phone Number
                            </label>
                            <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500">
                                <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm border-r">
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
                                    className="w-full px-3 py-2 text-sm outline-none"
                                />
                            </div>
                            {errors.phone_number && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.phone_number}
                                </p>
                            )}
                        </div>

                        {/* COMPANY NAME INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Company Name
                            </label>
                            <input
                                value={client.company_name}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        company_name: e.target.value,
                                    })
                                }
                                placeholder="Enter company name..."
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.company_name && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.company_name}
                                </p>
                            )}
                        </div>

                        {/* COMPANY ADDRESS INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Company Address
                            </label>
                            <input
                                value={client.company_address}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        company_address: e.target.value,
                                    })
                                }
                                placeholder="Enter company address..."
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.company_address && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.company_address}
                                </p>
                            )}
                        </div>

                        {/* COMPANY TYPE */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Company Type
                            </label>
                            <select
                                value={client.company_type ?? ""}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        company_type: e.target.value,
                                    })
                                }
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
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
                            {errors.company_type && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.company_type}
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
