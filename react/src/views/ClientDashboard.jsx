import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import StatusBadge from "../components/StatusBadge";

export default function ClientDashboard() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [assigns, setAssigns] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axiosClient.get(`/clients/${id}`).then(({ data }) => setClient(data));
        setLoading(true);
        axiosClient
            .get(`/clients/${id}/projects?page=1`)
            .then(({ data }) => {
                setAssigns(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const isWithin3Weeks = (dateStr) => {
        if (!dateStr) return false;
        const end = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 21;
    };

    const activeProjects = assigns.filter(
        (a) => a.project !== null && a.project?.status === "ongoing",
    );

    const activeSubscriptions = assigns.filter(
        (a) => a.subscription !== null && a.subscription?.status === "ongoing",
    );

    const aboutToEnd = assigns.filter((a) => {
        if (a.project !== null)
            return (
                a.project?.status === "ongoing" &&
                isWithin3Weeks(a.project?.end_date)
            );
        if (a.subscription !== null)
            return (
                a.subscription?.status === "ongoing" &&
                isWithin3Weeks(a.subscription?.end_coverage)
            );
        return false;
    });

    const activeServices = assigns.filter((a) => {
        const status = a.project?.status ?? a.subscription?.status;
        return ["ongoing", "hold", "delay", "pending"].includes(status);
    });

    const endedServices = assigns.filter((a) => {
        const status = a.project?.status ?? a.subscription?.status;
        return status === "complete";
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingPayments = assigns
        .flatMap((a) => {
            const schedules = a.payment_schedules || [];
            return schedules
                .filter((s) => {
                    if (
                        !s.due_date ||
                        s.status === "paid" ||
                        s.status === "ended"
                    )
                        return false;
                    const due = new Date(s.due_date);
                    due.setHours(0, 0, 0, 0);
                    return due >= today;
                })
                .map((s) => ({ ...a, _upcomingSchedule: s }));
        })
        .sort(
            (a, b) =>
                new Date(a._upcomingSchedule.due_date) -
                new Date(b._upcomingSchedule.due_date),
        )
        .slice(0, 8);

    const overduePayments = assigns
        .flatMap((a) => {
            const schedules = a.payment_schedules || [];
            return schedules
                .filter((s) => s.status === "overdue")
                .map((s) => ({ ...a, _lateSchedule: s }));
        })
        .sort(
            (a, b) =>
                new Date(b._lateSchedule.due_date) -
                new Date(a._lateSchedule.due_date),
        );

    const PAYMENT_TYPE_LABELS = {
        one_time: "One Time",
        installment: "Installment",
        monthly: "Monthly",
        quarterly: "Quarterly",
        half_yearly: "Half Yearly",
        yearly: "Yearly",
    };

    const ServiceTable = ({ data, emptyMessage }) => (
        <table className="w-full bg-white border-separate border-spacing-0">
            <thead>
                <tr className="bg-cyan-800">
                    {[
                        "Type",
                        "Service Name",
                        "Start Date",
                        "End Date",
                        "Payment Type",
                        "Status",
                    ].map((h) => (
                        <th
                            key={h}
                            className="px-4 py-2 text-white text-sm font-medium"
                        >
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? (
                    data.map((a) => {
                        const isProject = a.project !== null;
                        const serviceName = isProject
                            ? a.project?.title
                            : a.subscription?.title;
                        const startDate = isProject
                            ? a.project?.start_date
                            : a.subscription?.start_coverage;
                        const endDate = isProject
                            ? a.project?.end_date
                            : a.subscription?.end_coverage;
                        const paymentType = isProject
                            ? (PAYMENT_TYPE_LABELS[a.project?.payment_type] ??
                              "—")
                            : (PAYMENT_TYPE_LABELS[a.subscription?.frequency] ??
                              "—");
                        const status =
                            a.project?.status ?? a.subscription?.status;
                        const warning =
                            isWithin3Weeks(endDate) && status === "ongoing";

                        return (
                            <tr
                                key={a.id}
                                className="hover:bg-cyan-50 text-center"
                            >
                                <td className="border-b border-gray-200 px-4 py-2">
                                    <span
                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            isProject
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-purple-100 text-purple-700"
                                        }`}
                                    >
                                        {isProject ? "Project" : "Subscription"}
                                    </span>
                                </td>
                                <td className="border-b border-gray-200 px-4 py-2">
                                    {serviceName ?? "—"}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-2 text-sm">
                                    {startDate ?? "—"}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-2 text-sm">
                                    <span
                                        className={
                                            warning
                                                ? "text-amber-600 font-semibold"
                                                : ""
                                        }
                                    >
                                        {endDate ?? "—"}
                                        {warning && (
                                            <span className="ml-1.5 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">
                                                Ending soon
                                            </span>
                                        )}
                                    </span>
                                </td>
                                <td className="border-b border-gray-200 px-4 py-2 text-sm">
                                    {paymentType}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-2">
                                    <StatusBadge status={status} />
                                </td>
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td
                            colSpan={6}
                            className="px-4 py-6 text-center text-gray-500"
                        >
                            {emptyMessage}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 px-5 py-3">
                <Link
                    to="/clients"
                    className="text-gray-500 hover:text-cyan-700 hover:underline transition"
                >
                    Clients
                </Link>
                <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-[10px] text-gray-400"
                />
                <span className="text-gray-800 font-semibold">Dashboard</span>
            </div>

            {/* Page Title */}
            <div className="flex justify-between items-center px-5 mt-5 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {client ? `${client.name}'s Dashboard` : "Client Dashboard"}
                </h1>

                <Link
                    to={`/clients/assign/${id}`}
                    className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                >
                    Assign Services
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 mb-6">
                {/* Active Projects */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <svg
                                className="w-5 h-5 text-blue-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7h18M3 12h18M3 17h18"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">
                                Active Projects
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {activeProjects.length}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Active Subscriptions */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                            <svg
                                className="w-5 h-5 text-purple-700"
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
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">
                                Active Subscriptions
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {activeSubscriptions.length}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* About to End */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <svg
                                className="w-5 h-5 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">
                                About to End{" "}
                                <span className="text-xs text-gray-400">
                                    (within 3 weeks)
                                </span>
                            </p>
                            <h3 className="text-2xl font-bold text-amber-600">
                                {aboutToEnd.length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables */}
            <div className="flex flex-col gap-6 px-5 pb-8">
                {/* Active Services */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                        Active Services
                    </h2>
                    <div className="rounded-lg overflow-auto shadow-sm">
                        {loading ? (
                            <p className="text-center py-6 text-gray-500">
                                Loading...
                            </p>
                        ) : (
                            <ServiceTable
                                data={activeServices}
                                emptyMessage="No active services"
                            />
                        )}
                    </div>
                </div>

                {/* Ended Services */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                        Ended Services
                    </h2>
                    <div className="rounded-lg overflow-auto shadow-sm">
                        {loading ? (
                            <p className="text-center py-6 text-gray-500">
                                Loading...
                            </p>
                        ) : (
                            <ServiceTable
                                data={endedServices}
                                emptyMessage="No ended services"
                            />
                        )}
                    </div>
                </div>

                {/* UPCOMING & OVERDUE PAYMENTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-5 pb-8">
                    {/* Upcoming */}
                    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col h-[500px]">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Upcoming Payments
                        </h2>
                        <div className="flex-1 overflow-y-auto pr-1">
                            {upcomingPayments.length === 0 ? (
                                <p className="text-center text-gray-500 py-6">
                                    No upcoming payments
                                </p>
                            ) : (
                                upcomingPayments.map((a) => {
                                    const due = new Date(
                                        a._upcomingSchedule.due_date,
                                    );
                                    const dayFromNow = new Date(today);
                                    dayFromNow.setDate(today.getDate() + 1);
                                    const isUrgent = due <= dayFromNow;
                                    return (
                                        <div
                                            key={`${a.id}-${a._upcomingSchedule.id}`}
                                            className={`flex items-center justify-between mb-4 border-b border-gray-200 pb-2 mt-5 rounded-lg p-3 ${isUrgent ? "bg-red-50 hover:bg-red-100" : "hover:bg-cyan-50"} transition-colors`}
                                        >
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-800">
                                                    {a.project?.title ??
                                                        a.subscription?.title ??
                                                        "Untitled"}
                                                </h3>
                                                <p className="text-xs text-gray-400 font-mono">
                                                    {a._upcomingSchedule
                                                        .invoice_number ??
                                                        "No invoice no."}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {a._upcomingSchedule.status}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-800 font-bold">
                                                    ₱
                                                    {Number(
                                                        a._upcomingSchedule
                                                            .total_amount || 0,
                                                    ).toLocaleString()}
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Due:{" "}
                                                    {due.toLocaleDateString(
                                                        "en-CA",
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Overdue */}
                    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col h-[500px]">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Overdue Payments
                        </h2>
                        <div className="flex-1 overflow-y-auto pr-1">
                            {overduePayments.length === 0 ? (
                                <p className="text-center text-gray-500 py-6">
                                    No overdue payments
                                </p>
                            ) : (
                                overduePayments.map((a) => {
                                    const due = new Date(
                                        a._lateSchedule.due_date,
                                    );
                                    const MS_PER_DAY = 86400000;
                                    const daysLate =
                                        new Date() > due
                                            ? Math.floor(
                                                  (new Date() - due) /
                                                      MS_PER_DAY,
                                              )
                                            : 0;
                                    return (
                                        <div
                                            key={`${a.id}-${a._lateSchedule.id}`}
                                            className="flex items-center justify-between border-b border-gray-200 pb-2 mt-5 rounded-lg p-3 bg-red-50 hover:bg-red-100 transition-colors"
                                        >
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-800">
                                                    {a.project?.title ??
                                                        a.subscription?.title ??
                                                        "Untitled"}
                                                </h3>
                                                <p className="text-xs text-gray-400 font-mono">
                                                    {a._lateSchedule
                                                        .invoice_number ??
                                                        "No invoice no."}
                                                </p>
                                                <span className="text-xs font-semibold text-red-500">
                                                    {daysLate} day
                                                    {daysLate !== 1 ? "s" : ""}{" "}
                                                    late
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-red-600 font-bold">
                                                    ₱
                                                    {Number(
                                                        a._lateSchedule
                                                            .total_amount || 0,
                                                    ).toLocaleString()}
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Due:{" "}
                                                    {due.toLocaleDateString(
                                                        "en-CA",
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
