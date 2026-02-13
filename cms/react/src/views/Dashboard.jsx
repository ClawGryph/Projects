import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
    const [user, setUser] = useState([]);
    const [projects, setProjects] = useState([]);
    const [usersProject, setUsersProject] = useState([]);

    // Fetch Clients
    useEffect(() => {
        axiosClient
            .get("/users")
            .then(({ data }) => setUser(data.data))
            .catch(() => setNotification("Failed to load clients"));
    }, []);

    // Fetch Projects
    useEffect(() => {
        axiosClient
            .get("/projects")
            .then(({ data }) => setProjects(data.data))
            .catch(() => setNotification("Failed to load projects"));
    }, []);

    // Fetch All projects belong to clients
    useEffect(() => {
        axiosClient
            .get("/client-projects")
            .then(({ data }) => setUsersProject(data.data));
    }, []);

    // Function to export CSV
    const exportDashboardCSV = (projectsData) => {
        if (!projectsData || projectsData.length === 0) {
            alert("No data to export");
            return;
        }

        // Prepare CSV headers
        const headers = [
            "Project Name",
            "Client",
            "Payment Type",
            "Status",
            "Amount",
        ];

        // Prepare CSV rows
        const rows = projectsData.map((project) => [
            project.title,
            project.users && project.users.length > 0
                ? project.users.map((u) => u.name).join(", ")
                : "No Client",
            project.payment_type,
            project.status,
            project.price,
        ]);

        // Convert to CSV string
        const csvContent = [headers, ...rows]
            .map((row) => row.map((item) => `"${item}"`).join(",")) // wrap in quotes
            .join("\n");

        // Create a Blob and trigger download
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mt-5 mb-5">
                <div className="flex flex-col">
                    <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-gray-500">
                        Welcome back! Here's what's happening today
                    </p>
                </div>
                <button
                    onClick={() => exportDashboardCSV(usersProject)}
                    className="w-20 bg-sky-400 text-xs text-white cta-btn font-semibold py-2 rounded-br-lg rounded-bl-lg rounded-tr-lg shadow-lg hover:shadow-xl hover:bg-sky-500 flex items-center justify-center cursor-pointer"
                >
                    <FontAwesomeIcon icon={faFileExport} />
                    Export
                </button>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Clients */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-cyan-800"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    Total Clients
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {user.length}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            +8.2%
                        </span>
                        <span className="text-sm text-gray-500">
                            from last month
                        </span>
                    </div>
                </div>

                {/* Projects */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    Active Projects
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {projects.length}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            +5
                        </span>
                        <span className="text-sm text-gray-500">
                            new this month
                        </span>
                    </div>
                </div>

                {/* Monthly Revenue */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    Monthly Revenue
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    ₱45,231
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            +12.5%
                        </span>
                        <span className="text-sm text-gray-500">
                            from last month
                        </span>
                    </div>
                </div>

                {/* Overdue Payments */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    Overdue Payments
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    ₱8,420
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                            3 invoices
                        </span>
                        <span className="text-sm text-gray-500">
                            need attention
                        </span>
                    </div>
                </div>
            </div>

            {/* RECENT PROJECTS */}
            <div className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm p-6 mt-6">
                <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                    Recent Projects
                </h2>
                <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse mt-5">
                    <thead>
                        <tr className="bg-cyan-800">
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Project Name
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Client
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Payment Type
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Status
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersProject.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="text-center py-4 text-gray-500"
                                >
                                    No recent projects found
                                </td>
                            </tr>
                        ) : (
                            usersProject.slice(0, 5).map((project) => (
                                <tr
                                    key={project.id}
                                    className="border-b border-gray-200 hover:bg-cyan-50 text-center"
                                >
                                    <td className="px-4 py-2">
                                        {project.title}
                                    </td>

                                    <td className="px-4 py-2">
                                        {project.users &&
                                        project.users.length > 0
                                            ? project.users
                                                  .map((u) => u.name)
                                                  .join(", ")
                                            : "No Client"}
                                    </td>

                                    <td className="px-4 py-2">
                                        {formatPaymentType(
                                            project.payment_type,
                                        )}
                                    </td>

                                    <td className="px-4 py-2">
                                        <StatusBadge status={project.status} />
                                    </td>

                                    <td className="px-4 py-2">
                                        ₱
                                        {Number(project.price).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ACTIVITIES */}
            <div className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm p-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* UPCOMING PAYMENTS */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm p-6">
                    <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                        Upcoming Payments
                    </h2>
                    {usersProject.slice(0, 5).map((project) => (
                        <div
                            key={project.id}
                            className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2 mt-5"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {project.title}
                                </h3>
                                <p className="text-gray-500">
                                    {project.users.length > 0
                                        ? project.users
                                              .map((u) => u.name)
                                              .join(", ")
                                        : "No Client"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-800 font-bold">
                                    ₱{Number(project.price).toLocaleString()}
                                </p>
                                <p className="text-gray-500">
                                    Due: Payment Due Date
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RECENT ACTIVITIES */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm p-6">
                    <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {/* Payment Received */}
                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    Payment Received
                                </p>
                                <p className="text-sm text-gray-500">
                                    ₱15,000 from Acme Corporation
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    2 hours ago
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                                +₱15,000
                            </span>
                        </div>

                        {/* Payment Overdue */}
                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    Payment Overdue
                                </p>
                                <p className="text-sm text-gray-500">
                                    Invoice #1234 - Tech Solutions Ltd.
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    5 hours ago
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-red-600">
                                ₱5,420
                            </span>
                        </div>

                        {/* Invoice Sent */}
                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    Invoice Sent
                                </p>
                                <p className="text-sm text-gray-500">
                                    Invoice #1235 - Global Enterprises
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    2 days ago
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-gray-600">
                                ₱12,500
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
