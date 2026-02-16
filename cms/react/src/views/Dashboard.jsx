import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
    const [client, setClient] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clientsProject, setClientsProject] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [metrics, setMetrics] = useState({
        clientChange: 0,
        projectsChange: 0,
        revenueChange: 0,
        monthlyRevenue: 0,
        overduePayments: 0,
        overdueCount: 0,
    });
    const rowsPerPage = 10;

    useEffect(() => {
        axiosClient
            .get("/transactions")
            .then(({ data }) => setTransactions(data.data))
            .catch(() => console.error("Failed to load payment transactions"));
    }, []);

    // Calculate metrics from data
    const calculateMetrics = (
        clientData,
        projectsData,
        clientsProjectsData,
        transactionsData,
    ) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get last month
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;

        // Filter projects by date
        const currentMonthProjects = projectsData.filter((p) => {
            if (!p.created_at) return false;
            const date = new Date(p.created_at);

            return (
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
            );
        });

        // Calculate revenue
        const currentMonthRevenue = transactionsData
            .filter((t) => {
                const date = new Date(t.paid_at || t.created_at);
                return (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                );
            })
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const lastMonthRevenue = transactionsData
            .filter((t) => {
                const date = new Date(t.paid_at || t.created_at);
                return (
                    date.getMonth() === lastMonth &&
                    date.getFullYear() === lastMonthYear
                );
            })
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const revenueChangePercent =
            lastMonthRevenue > 0
                ? (
                      ((currentMonthRevenue - lastMonthRevenue) /
                          lastMonthRevenue) *
                      100
                  ).toFixed(1)
                : currentMonthRevenue > 0
                  ? 100
                  : 0;

        // Calculate overdue payments
        const overduePayments = transactionsData.filter((t) => {
            const payment = t.payment;
            return (
                payment &&
                new Date(payment.next_payment_date) < now &&
                payment.status !== "paid" &&
                payment.status !== "completed"
            );
        });
        const overdueTotal = overduePayments.reduce(
            (sum, t) => sum + Number(t.amount || 0),
            0,
        );

        // Calculate client change (you may need to adjust this based on your data structure)
        // This assumes client have a created_at field
        const currentMonthClients = clientData.filter((c) => {
            if (!c.created_at) return false;
            const createdDate = new Date(c.created_at);
            return (
                createdDate.getMonth() === currentMonth &&
                createdDate.getFullYear() === currentYear
            );
        });

        setMetrics({
            clientChange: currentMonthClients.length,
            projectsChange: currentMonthProjects.length,
            revenueChange: revenueChangePercent,
            monthlyRevenue: currentMonthRevenue,
            overduePayments: overdueTotal,
            overdueCount: overduePayments.length,
        });
    };

    // Fetch Clients
    useEffect(() => {
        axiosClient
            .get("/clients")
            .then(({ data }) => setClient(data.data))
            .catch(() => console.error("Failed to load client"));
    }, []);

    // Fetch Projects
    useEffect(() => {
        axiosClient
            .get("/projects")
            .then(({ data }) => {
                setProjects(data.data);
            })
            .catch(() => console.error("Failed to load projects"));
    }, []);

    // Fetch All projects belong to client
    useEffect(() => {
        axiosClient
            .get("/client-projects")
            .then(({ data }) => setClientsProject(data.data));
    }, []);

    // Calculate metrics when data changes
    useEffect(() => {
        if (
            client.length > 0 ||
            projects.length > 0 ||
            clientsProject.length > 0 ||
            transactions.length > 0
        ) {
            calculateMetrics(client, projects, clientsProject, transactions);
        }
    }, [client, projects, clientsProject, transactions]);

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
        const rows = projectsData.map((project) => {
            const title = project.project?.title ?? "Untitled Project";
            const clientName = project.client?.name ?? "No Client";
            const paymentType =
                formatPaymentType(project.payment?.payment_type) ?? "-";
            const status = project.payment?.status ?? "-";
            const amount = project.payment_transaction?.amount ?? 0;

            return [title, clientName, paymentType, status, amount];
        });

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

    // Helper function to format the change display
    const renderChangeIndicator = (value, isPercentage = false) => {
        const numValue = Number(value);
        const isPositive = numValue >= 0;
        const displayValue = isPercentage
            ? `${isPositive ? "+" : ""}${numValue}%`
            : `${isPositive ? "+" : ""}${numValue}`;
        const colorClass = isPositive
            ? "text-green-600 bg-green-50"
            : "text-red-600 bg-red-50";

        return (
            <span
                className={`text-sm font-semibold ${colorClass} px-2 py-1 rounded-lg`}
            >
                {displayValue}
            </span>
        );
    };

    // ================== UPCOMING PAYMENTS ==================
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    const upcomingPayments = clientsProject
        .filter((project) => {
            if (!project.payment?.next_payment_date) return false;

            if (
                ["paid", "partial", "active"].includes(
                    project.payment.status?.toLowerCase(),
                )
            )
                return false;

            const nextPayment = new Date(project.payment.next_payment_date);

            return nextPayment >= now && nextPayment <= oneWeekFromNow;
        })
        // Sort by nearest due date first
        .sort(
            (a, b) =>
                new Date(a.payment.next_payment_date) -
                new Date(b.payment.next_payment_date),
        )
        .slice(0, 5);

    const buildActivities = () => {
        const activities = [];

        // New Projects
        clientsProject.forEach((cp) => {
            if (!cp.created_at) return;

            activities.push({
                id: `project-${cp.id}`,
                type: "project_created",
                title: "New Project Created",
                description: `${cp.project?.title || "Untitled"} - ${
                    cp.client?.name || "No Client"
                }`,
                amount: null,
                date: new Date(cp.created_at),
            });
        });

        // Payments Received
        transactions.forEach((t) => {
            if (!t.paid_at) return;

            activities.push({
                id: `payment-${t.id}`,
                type: "payment_received",
                title: "Payment Received",
                description: `From ${t.client?.name || "Client"}`,
                amount: t.amount,
                date: new Date(t.paid_at),
            });
        });

        // Overdue Payments
        clientsProject.forEach((cp) => {
            if (
                cp.payment?.next_payment_date &&
                new Date(cp.payment.next_payment_date) < new Date() &&
                cp.payment.status !== "completed"
            ) {
                activities.push({
                    id: `overdue-${cp.id}`,
                    type: "payment_overdue",
                    title: "Payment Overdue",
                    description: `${cp.project?.title || "Project"} - ${
                        cp.client?.name || ""
                    }`,
                    amount: cp.payment_transaction?.amount || 0,
                    date: new Date(cp.payment.next_payment_date),
                });
            }
        });

        // Sort newest first
        return activities.sort((a, b) => b.date - a.date).slice(0, 6); // show latest 6
    };

    const activities = buildActivities().slice(0, 5);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;

    const currentProjects = clientsProject.slice(
        indexOfFirstRow,
        indexOfLastRow,
    );

    const totalPages = Math.ceil(clientsProject.length / rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [clientsProject]);

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
                    onClick={() => exportDashboardCSV(clientsProject)}
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
                                    {client.length}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {renderChangeIndicator(metrics.clientChange)}
                        <span className="text-sm text-gray-500">
                            new this month
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
                        {renderChangeIndicator(metrics.projectsChange)}
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
                                    ₱{metrics.monthlyRevenue.toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {renderChangeIndicator(metrics.revenueChange, true)}
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
                                    ₱{metrics.overduePayments.toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                            {metrics.overdueCount}{" "}
                            {metrics.overdueCount === 1
                                ? "invoice"
                                : "invoices"}
                        </span>
                        <span className="text-sm text-gray-500">
                            {metrics.overdueCount > 0
                                ? "need attention"
                                : "all clear"}
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
                                Payment Status
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Due Date
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
                        {clientsProject.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="text-center py-4 text-gray-500"
                                >
                                    No recent projects found
                                </td>
                            </tr>
                        ) : (
                            currentProjects.map((project) => {
                                const isOverdue =
                                    project.payment.next_payment_date &&
                                    new Date(
                                        project.payment.next_payment_date,
                                    ) < new Date() &&
                                    project.payment.status !== "completed";

                                return (
                                    <tr
                                        key={project.id}
                                        className={`border-b border-gray-200 text-center ${
                                            isOverdue
                                                ? "bg-red-50 hover:bg-red-100"
                                                : "hover:bg-cyan-50"
                                        }`}
                                    >
                                        {/* Project Name */}
                                        <td className="px-4 py-2">
                                            {project.project.title ||
                                                "Untitled Project"}
                                        </td>

                                        {/* Client */}
                                        <td className="px-4 py-2">
                                            {project.client &&
                                            project.client.name
                                                ? project.client.name
                                                : "No Client"}
                                        </td>

                                        {/* Payment Type */}
                                        <td className="px-4 py-2">
                                            {formatPaymentType(
                                                project.payment.payment_type,
                                            )}
                                        </td>

                                        {/* Payment Status / Progress */}
                                        <td className="px-4 py-2">
                                            {project.payment.payment_type ===
                                                "installment" &&
                                            project.payment.installments
                                                ? `${project.payment.current_installment}/${project.payment.installments}`
                                                : project.payment
                                                        .payment_type ===
                                                    "recurring"
                                                  ? `${formatPaymentType(project.payment.recurring_type)}`
                                                  : project.payment.status ===
                                                          "Paid" ||
                                                      "Active" ||
                                                      "Partial"
                                                    ? "Paid"
                                                    : "Pending"}
                                        </td>

                                        {/* Due Date */}
                                        <td className="px-4 py-2">
                                            {project.payment &&
                                            project.payment.next_payment_date
                                                ? new Date(
                                                      project.payment
                                                          .next_payment_date,
                                                  )
                                                      .toISOString()
                                                      .split("T")[0] // gets YYYY-MM-DD
                                                : " - "}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-2">
                                            <StatusBadge
                                                status={project.payment.status}
                                            />
                                        </td>

                                        {/* Amount */}
                                        <td className="px-4 py-2">
                                            ₱
                                            {Number(
                                                project.payment_transaction
                                                    .amount || 0,
                                            ).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages),
                                )
                            }
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* ACTIVITIES */}
            <div className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm p-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* UPCOMING PAYMENTS */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm p-6">
                    <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                        Upcoming Payments
                    </h2>

                    {upcomingPayments.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">
                            No upcoming payments
                        </p>
                    ) : (
                        upcomingPayments.map((project) => {
                            const nextPayment = new Date(
                                project.payment.next_payment_date,
                            );

                            const threeDaysFromNow = new Date();
                            threeDaysFromNow.setDate(now.getDate() + 3);

                            const isUrgent = nextPayment <= threeDaysFromNow;

                            return (
                                <div
                                    key={project.id}
                                    className={`flex items-center justify-between mb-4 border-b border-gray-200 pb-2 mt-5 rounded-lg p-3 ${
                                        isUrgent
                                            ? "bg-red-50 hover:bg-red-100"
                                            : "hover:bg-cyan-50"
                                    } transition-colors`}
                                >
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {project.project.title}
                                        </h3>
                                        <p className="text-gray-500">
                                            {project.client?.name ||
                                                "No Client"}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-gray-800 font-bold">
                                            ₱
                                            {Number(
                                                project.payment_transaction
                                                    ?.amount || 0,
                                            ).toLocaleString()}
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            Due:{" "}
                                            {nextPayment.toLocaleDateString(
                                                "en-CA",
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* RECENT ACTIVITIES */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm p-6">
                    <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <p className="text-center text-gray-500 py-6">
                                No recent activity
                            </p>
                        ) : (
                            activities.map((activity) => {
                                const isPositive =
                                    activity.type === "payment_received";

                                const iconColor =
                                    activity.type === "payment_received"
                                        ? "bg-green-100 text-green-600"
                                        : activity.type === "payment_overdue"
                                          ? "bg-red-100 text-red-600"
                                          : "bg-purple-100 text-purple-600";

                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}
                                        >
                                            <span className="text-sm font-bold">
                                                {activity.type ===
                                                "payment_received"
                                                    ? "+"
                                                    : activity.type ===
                                                        "payment_overdue"
                                                      ? "!"
                                                      : "✓"}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {activity.title}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {activity.date.toLocaleString()}
                                            </p>
                                        </div>

                                        {activity.amount && (
                                            <span
                                                className={`text-sm font-semibold ${
                                                    isPositive
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {isPositive ? "+" : ""}₱
                                                {Number(
                                                    activity.amount,
                                                ).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
