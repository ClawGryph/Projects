import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";

export default function SubscriptionsForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setNotification } = useStateContext();

    const [errors, setErrors] = useState({});
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState({
        id: null,
        subscription_id: "",
        title: "",
        description: "",
        start_coverage: "",
        end_coverage: "",
        type: "",
        adjusted_start_coverage: "",
        adjusted_end_coverage: "",
        cr_no: "",
        payment_type: "",
        cost: "",
    });

    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        axiosClient
            .get(`/subscriptions/${id}`)
            .then(({ data }) => {
                setLoading(false);
                setSubscription(data);
                setFormData(data);
            })
            .catch(() => setLoading(false));

        // fetch logs
        axiosClient
            .get(`/subscriptions/${id}/logs`)
            .then(({ data }) => setLogs(data));
    }, [id]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (subscription.id) {
            axiosClient
                .put(`/subscriptions/${subscription.id}`, subscription)
                .then(() => {
                    setNotification("Subscription was successfully updated");
                    navigate("/subscriptions");
                })
                .catch((err) => {
                    const response = err.response;
                    if (response && response.status === 422) {
                        setErrors(response.data.errors);
                    }
                });
        } else {
            axiosClient
                .post(`/subscriptions`, subscription)
                .then(() => {
                    setNotification("Subscription was successfully created");
                    navigate("/subscriptions");
                })
                .catch((err) => {
                    const response = err.response;
                    if (response && response.status === 422) {
                        setErrors(response.data.errors);
                    }
                });
        }
    };

    const inferType = (start, end) => {
        if (!start || !end) return "";
        const days = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
        if (days <= 10) return "weekly";
        if (days <= 35) return "monthly";
        return "yearly";
    };

    const FIELD_LABELS = {
        start_date: "Start Date",
        end_date: "End Date",
        adjusted_start_date: "Adjusted Start Date",
        adjusted_end_date: "Adjusted End Date",
    };

    return (
        <>
            {subscription.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    Update subscriptiont: {formData.title}
                </h2>
            )}
            {!subscription.id && (
                <h2 className="p-6 w-full text-lg font-semibold">
                    Add new subscription
                </h2>
            )}

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4 w-full max-w-2xl mx-auto">
                {loading && <div className="text-center">Loading...</div>}
                {!loading && (
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* TITLE INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Title{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                value={subscription.title}
                                onChange={(e) =>
                                    setSubscription({
                                        ...subscription,
                                        title: e.target.value,
                                    })
                                }
                                placeholder="Enter title..."
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.title && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* DESCRIPTION INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Description{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <textarea
                                value={subscription.description}
                                onChange={(e) =>
                                    setSubscription({
                                        ...subscription,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Enter description..."
                                rows={5}
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.description && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* COST INPUT */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Cost{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500">
                                <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm border-r">
                                    ₱
                                </span>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={subscription.cost ?? ""}
                                    onChange={(e) =>
                                        setSubscription({
                                            ...subscription,
                                            cost: e.target.value,
                                        })
                                    }
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            {errors.cost && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.cost}
                                </p>
                            )}
                        </div>

                        {/* START COVERAGE */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Start coverage{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                type="date"
                                value={subscription.start_coverage}
                                onChange={(e) => {
                                    const start = e.target.value;
                                    setSubscription({
                                        ...subscription,
                                        start_coverage: start,
                                        type: inferType(
                                            start,
                                            subscription.end_coverage,
                                        ),
                                    });
                                }}
                                placeholder=" "
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.start_coverage && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.start_coverage}
                                </p>
                            )}
                        </div>

                        {/* END COVERAGE */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                End coverage{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <input
                                type="date"
                                value={subscription.end_coverage}
                                onChange={(e) => {
                                    const end = e.target.value;
                                    setSubscription({
                                        ...subscription,
                                        end_coverage: end,
                                        type: inferType(
                                            subscription.start_coverage,
                                            end,
                                        ),
                                    });
                                }}
                                placeholder=" "
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.end_coverage && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.end_coverage}
                                </p>
                            )}
                        </div>

                        {/* TYPE */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Type{" "}
                                <span className="text-red-500 text-xs">*</span>
                            </label>
                            <select
                                value={subscription.type}
                                onChange={(e) =>
                                    setSubscription({
                                        ...subscription,
                                        type: e.target.value,
                                    })
                                }
                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="" disabled>
                                    Select type
                                </option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                            {errors.type && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.type}
                                </p>
                            )}
                        </div>

                        {/* ADJUSTED DATES & CR NO. — edit mode only */}
                        {subscription.id && (
                            <>
                                {/* Section Divider */}
                                <div className="border-t pt-4">
                                    <h3 className="text-xs font-semibold text-cyan-800 uppercase tracking-wider mb-4">
                                        Adjustments & Reference
                                    </h3>

                                    {/* ADJUSTED START COVERAGE */}
                                    <div className="space-y-4 rounded-xl p-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                Adjusted Start Coverage
                                            </label>
                                            <input
                                                type="date"
                                                value={
                                                    subscription.adjusted_start_coverage ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setSubscription({
                                                        ...subscription,
                                                        adjusted_start_coverage:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                            {errors.adjusted_start_coverage && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {
                                                        errors.adjusted_start_coverage
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        {/* ADJUSTED END COVERAGE */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                Adjusted End Coverage
                                            </label>
                                            <input
                                                type="date"
                                                value={
                                                    subscription.adjusted_end_coverage ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setSubscription({
                                                        ...subscription,
                                                        adjusted_end_coverage:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                            {errors.adjusted_end_coverage && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {
                                                        errors.adjusted_end_coverage
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        {/* CR NO. */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                CR No.{" "}
                                                <span className="text-red-500 text-xs">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={subscription.cr_no ?? ""}
                                                onChange={(e) =>
                                                    setSubscription({
                                                        ...subscription,
                                                        cr_no: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter CR number..."
                                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                            {errors.cr_no && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.cr_no}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <button className="w-full bg-cyan-800 text-white font-semibold py-2 rounded-md shadow hover:bg-cyan-900 hover:shadow-lg transition">
                            Save
                        </button>
                    </form>
                )}
            </div>

            {/* RIGHT - subscription LOGS */}
            {subscription.id && logs.length > 0 && (
                <div className="flex-1 p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Adjusted coverage date logs
                    </h3>
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Timestamp
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        User
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Field
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        Previous
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        New
                                    </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                        CR No.
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(
                                                log.created_at,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-700">
                                            {log.user?.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {FIELD_LABELS[log.field] ??
                                                log.field}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-red-50 text-red-600 border border-red-100 rounded px-2 py-0.5 text-xs">
                                                {log.old_value ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-green-50 text-green-700 border border-green-100 rounded px-2 py-0.5 text-xs">
                                                {log.new_value ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {log.cr_no ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
