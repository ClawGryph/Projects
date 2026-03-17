import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
    const [client, setClient] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clientsProject, setClientsProject] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [overdueMonth, setOverdueMonth] = useState("all");
    const [overdueYear, setOverdueYear] = useState(new Date().getFullYear());
    const [currentPage, setCurrentPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [overdueModalPage, setOverdueModalPage] = useState(1);
    const [showPending2307Modal, setShowPending2307Modal] = useState(false);
    const [pending2307Page, setPending2307Page] = useState(1);
    const [metrics, setMetrics] = useState({
        clientChange: 0,
        projectsChange: 0,
        revenueChange: 0,
        monthlyRevenue: 0,
        overduePayments: 0,
        overdueCount: 0,
    });
    const rowsPerPage = 5;

    useEffect(() => {
        axiosClient
            .get("/transactions")
            .then(({ data }) => {
                setTransactions(data.data);
                console.log(data);
            })
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
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;

        // Only count transactions that are actually paid (have a paid_at date)
        const paidTransactions = transactionsData.filter((t) => !!t.paid_at);

        const currentMonthRevenue = paidTransactions
            .filter((t) => {
                const date = new Date(t.paid_at);
                return (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                );
            })
            .reduce((sum, t) => sum + Number(t.amount_paid || 0), 0);

        const lastMonthRevenue = paidTransactions
            .filter((t) => {
                const date = new Date(t.paid_at);
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

        // Overdue
        const overdueSchedulesThisMonth = clientsProjectsData
            .flatMap((cp) => cp.payment_schedules || [])
            .filter((s) => {
                if (!s.due_date) return false;

                const dueDate = new Date(s.due_date);

                return (
                    s.status === "overdue" &&
                    dueDate.getMonth() === currentMonth &&
                    dueDate.getFullYear() === currentYear
                );
            });

        const overdueCount =
            overdueSchedulesThisMonth.length > 0
                ? overdueSchedulesThisMonth.length
                : 0;

        const currentMonthClients = clientData.filter((c) => {
            if (!c.created_at) return false;
            const createdDate = new Date(c.created_at);
            return (
                createdDate.getMonth() === currentMonth &&
                createdDate.getFullYear() === currentYear
            );
        });

        const currentMonthProjects = projectsData.filter((p) => {
            if (!p.created_at) return false;
            const date = new Date(p.created_at);
            return (
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
            );
        });

        setMetrics({
            clientChange: currentMonthClients.length,
            projectsChange: currentMonthProjects.length,
            revenueChange: revenueChangePercent,
            monthlyRevenue: currentMonthRevenue,
            overdueCount: overdueCount,
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
                const activeOnly = data.data.filter(
                    (p) => p.status !== "complete",
                );
                setProjects(activeOnly);
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

    // View for all successful payments and filter
    const paidTransactions = transactions.filter((t) => t.paid_at);

    const filteredPayments = paidTransactions.filter((t) => {
        const paidDate = new Date(t.paid_at);

        const matchMonth =
            selectedMonth === "all"
                ? true
                : paidDate.getMonth() === Number(selectedMonth);

        const matchYear = paidDate.getFullYear() === Number(selectedYear);

        return matchMonth && matchYear;
    });

    // View for all overdue payments and filter
    const overduePayments = clientsProject.flatMap((cp) =>
        (cp.payment_schedules || [])
            .filter((s) => s.status === "overdue")
            .map((s) => ({
                id: s.id,
                client: cp.client,
                project: cp.project,
                expected_amount: s.expected_amount,
                due_date: s.due_date,
            })),
    );

    const filteredOverduePayments = overduePayments.filter((o) => {
        if (!o.due_date) return false;

        const dueDate = new Date(o.due_date);

        const matchMonth =
            overdueMonth === "all"
                ? true
                : dueDate.getMonth() === Number(overdueMonth);

        const matchYear = dueDate.getFullYear() === Number(overdueYear);

        return matchMonth && matchYear;
    });

    const getPaymentSummary = (project) => {
        const schedules = project.payment_schedules || [];
        const total = schedules.length;
        const paid = schedules.filter((s) => s.status === "paid").length;
        const anyOverdue = schedules.some((s) => s.status === "overdue");
        const anyEnded = schedules.some((s) => s.status === "ended");
        const allPaid = total > 0 && paid === total;

        // Overall status
        const overallStatus = allPaid
            ? "paid"
            : anyEnded
              ? "ended"
              : anyOverdue
                ? "overdue"
                : paid > 0
                  ? "active"
                  : "pending";

        // Cycle progress label
        const paymentType = project.payment?.payment_type;
        const recurringType = project.payment?.recurring_type;

        let cycleLabel = "";
        if (paymentType === "one_time") {
            cycleLabel = paid > 0 ? "Paid" : "Unpaid";
        } else {
            const unit =
                paymentType === "installment"
                    ? "installment"
                    : recurringType === "weekly"
                      ? "week"
                      : recurringType === "yearly"
                        ? "year"
                        : "month";
            cycleLabel = `${paid} / ${total} ${unit}${total !== 1 ? "s" : ""} paid`;
        }

        // Total cost paid
        const totalCostPaid = schedules
            .filter((s) => s.status === "paid")
            .reduce((sum, s) => sum + Number(s.expected_amount || 0), 0);

        return { overallStatus, cycleLabel, totalCostPaid };
    };

    // 2307
    const pending2307Payments = transactions.filter(
        (t) =>
            t.paid_at &&
            (!t.official_receipt ||
                t.official_receipt.form_2307_status === "pending"),
    );

    const totalPending2307Pages = Math.ceil(
        pending2307Payments.length / rowsPerPage,
    );
    const paginatedPending2307 = pending2307Payments.slice(
        (pending2307Page - 1) * rowsPerPage,
        pending2307Page * rowsPerPage,
    );

    // Function to export CSV
    const exportDashboardCSV = () => {
        const rows = [];

        // =========================
        // DASHBOARD SUMMARY
        // =========================
        rows.push(["DASHBOARD SUMMARY"]);
        rows.push(["Total Clients", client.length]);
        rows.push(["Active Projects", projects.length]);
        rows.push(["Monthly Revenue", metrics.monthlyRevenue]);
        rows.push(["Overdue Payments", metrics.overdueCount]);
        rows.push([]);

        // =========================
        // CLIENTS
        // =========================
        rows.push(["CLIENTS"]);
        rows.push(["Name", "Email", "Created At"]);
        client.forEach((c) => {
            rows.push([c.name || "", c.email || "", c.created_at || ""]);
        });
        rows.push([]);

        // =========================
        // PROJECTS
        // =========================
        rows.push(["PROJECTS"]);
        rows.push(["Title", "End Date", "Created At"]);
        projects.forEach((p) => {
            rows.push([p.title || "", p.end_date || "", p.created_at || ""]);
        });
        rows.push([]);

        // =========================
        // CLIENT PROJECTS
        // =========================
        rows.push(["CLIENT PROJECTS"]);
        rows.push([
            "Client",
            "Project",
            "Payment Type",
            "Total Paid",
            "Status",
        ]);

        clientsProject.forEach((cp) => {
            const summary = getPaymentSummary(cp);

            rows.push([
                cp.client?.name || "",
                cp.project?.title || "",
                formatPaymentType(
                    cp.payment?.payment_type === "recurring"
                        ? cp.payment?.recurring_type
                        : cp.payment?.payment_type,
                ),
                summary.totalCostPaid,
                summary.overallStatus,
            ]);
        });

        rows.push([]);

        // =========================
        // SUCCESSFUL PAYMENTS
        // =========================
        rows.push(["SUCCESSFUL PAYMENTS"]);
        rows.push(["Client", "Project", "Amount", "Paid At"]);

        transactions
            .filter((t) => t.paid_at)
            .forEach((t) => {
                rows.push([
                    t.client?.name || "",
                    t.project?.title || "",
                    t.amount_paid || 0,
                    t.paid_at || "",
                ]);
            });

        rows.push([]);

        // =========================
        // OVERDUE PAYMENTS
        // =========================
        rows.push(["OVERDUE PAYMENTS"]);
        rows.push(["Client", "Project", "Amount Due", "Due Date"]);

        overduePayments.forEach((o) => {
            rows.push([
                o.client?.name || "",
                o.project?.title || "",
                o.expected_amount || 0,
                o.due_date || "",
            ]);
        });

        // Convert to CSV
        const csvContent = rows
            .map((row) =>
                row
                    .map((item) => `"${String(item).replace(/"/g, '""')}"`)
                    .join(","),
            )
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const today = new Date().toISOString().split("T")[0];
        link.setAttribute("download", `dashboard_export_${today}.csv`);

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

    // UPCOMING PAYMENTS
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);

    const upcomingPayments = clientsProject
        .flatMap((project) => {
            const schedules = project.payment_schedules || [];
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
                .map((s) => ({ ...project, _upcomingSchedule: s }));
        })
        .sort(
            (a, b) =>
                new Date(a._upcomingSchedule.due_date) -
                new Date(b._upcomingSchedule.due_date),
        )
        .slice(0, 8);

    // LATE PAYMENTS
    const latePaymentsThisMonth = clientsProject
        .flatMap((project) => {
            const schedules = project.payment_schedules || [];
            return schedules
                .filter((s) => {
                    if (!s.due_date || s.status === "paid") return false;
                    const due = new Date(s.due_date);
                    due.setHours(0, 0, 0, 0);
                    return due < today;
                })
                .map((s) => ({ ...project, _lateSchedule: s }));
        })
        .sort(
            (a, b) =>
                new Date(b._lateSchedule.due_date) -
                new Date(a._lateSchedule.due_date),
        )
        .slice(0, 8);

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
                amount: t.amount_paid,
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

    const ongoingProjects = clientsProject.filter((project) => {
        return project.project?.status !== "complete";
    });

    const currentProjects = ongoingProjects.slice(
        indexOfFirstRow,
        indexOfLastRow,
    );

    const totalPages = Math.ceil(ongoingProjects.length / rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [clientsProject]);

    useEffect(() => {
        setPaymentsPage(1);
    }, [selectedMonth, selectedYear]);
    useEffect(() => {
        setOverdueModalPage(1);
    }, [overdueMonth, overdueYear]);

    const totalPaymentsPages = Math.ceil(filteredPayments.length / rowsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (paymentsPage - 1) * rowsPerPage,
        paymentsPage * rowsPerPage,
    );

    const totalOverdueModalPages = Math.ceil(
        filteredOverduePayments.length / rowsPerPage,
    );
    const paginatedOverduePayments = filteredOverduePayments.slice(
        (overdueModalPage - 1) * rowsPerPage,
        overdueModalPage * rowsPerPage,
    );

    return (
        <div className="p-6">
            <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mt-5 mb-5">
                <div className="flex flex-col min-w-0">
                    <h1 className="text-3xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-gray-500">
                        Welcome back! Here's what's happening today
                    </p>
                </div>
                <button
                    onClick={() => exportDashboardCSV(clientsProject)}
                    className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                    <FontAwesomeIcon icon={faDownload} />
                    <span className="hidden sm:inline ml-1">Export CSV</span>
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

                {/* Monthly Sales */}
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
                                    Monthly Sales
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    ₱
                                    {(() => {
                                        const now = new Date();
                                        const currentMonth = now.getMonth();
                                        const currentYear = now.getFullYear();
                                        return clientsProject
                                            .flatMap(
                                                (cp) =>
                                                    cp.payment_schedules || [],
                                            )
                                            .filter((s) => {
                                                if (
                                                    !s.due_date ||
                                                    s.status === "ended"
                                                )
                                                    return false;
                                                const due = new Date(
                                                    s.due_date,
                                                );
                                                return (
                                                    due.getMonth() ===
                                                        currentMonth &&
                                                    due.getFullYear() ===
                                                        currentYear
                                                );
                                            })
                                            .reduce(
                                                (sum, s) =>
                                                    sum +
                                                    Number(
                                                        s.expected_amount || 0,
                                                    ),
                                                0,
                                            )
                                            .toLocaleString();
                                    })()}
                                </h3>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPaymentsModal(true)}
                            className="bg-sky-400 text-white text-sm font-semibold hover:bg-sky-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faEye} className="pr-1" />
                            <span className="hidden sm:inline ml-1">View</span>
                        </button>
                    </div>

                    {/* Overview Breakdown */}
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                        {/* Count of paid payments this month */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                                Paid payments this month
                            </span>
                            <span className="text-xs font-semibold text-green-600">
                                {(() => {
                                    const now = new Date();
                                    const currentMonth = now.getMonth();
                                    const currentYear = now.getFullYear();
                                    return transactions.filter((t) => {
                                        if (!t.paid_at) return false;
                                        const d = new Date(t.paid_at);
                                        return (
                                            d.getMonth() === currentMonth &&
                                            d.getFullYear() === currentYear
                                        );
                                    }).length;
                                })()}{" "}
                                payments
                            </span>
                        </div>

                        {/* Sum of paid payments this month */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                Total collected this month
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">
                                ₱{metrics.monthlyRevenue.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                        {renderChangeIndicator(metrics.revenueChange, true)}
                        <span className="text-sm text-gray-500">
                            from last month
                        </span>
                    </div>
                </div>

                {/* Overdue Payments */}
                <div className="flex flex-col bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                                    ₱
                                    {(() => {
                                        const now = new Date();
                                        const currentMonth = now.getMonth();
                                        const currentYear = now.getFullYear();
                                        return clientsProject
                                            .flatMap(
                                                (cp) =>
                                                    cp.payment_schedules || [],
                                            )
                                            .filter((s) => {
                                                if (
                                                    !s.due_date ||
                                                    s.status !== "overdue"
                                                )
                                                    return false;
                                                const due = new Date(
                                                    s.due_date,
                                                );
                                                return (
                                                    due.getMonth() ===
                                                        currentMonth &&
                                                    due.getFullYear() ===
                                                        currentYear
                                                );
                                            })
                                            .reduce(
                                                (sum, s) =>
                                                    sum +
                                                    Number(
                                                        s.expected_amount || 0,
                                                    ),
                                                0,
                                            )
                                            .toLocaleString();
                                    })()}
                                </h3>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowOverdueModal(true)}
                            className="bg-sky-400 text-white text-sm font-semibold hover:bg-sky-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faEye} className="pr-1" />
                            <span className="hidden sm:inline ml-1">View</span>
                        </button>
                    </div>

                    {/* Overview Breakdown */}
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                        {/* Count of overdue payments this month */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                                Overdue payments this month
                            </span>
                            <span className="text-xs font-semibold text-red-600">
                                {(() => {
                                    const now = new Date();
                                    const currentMonth = now.getMonth();
                                    const currentYear = now.getFullYear();
                                    const count = clientsProject
                                        .flatMap(
                                            (cp) => cp.payment_schedules || [],
                                        )
                                        .filter((s) => {
                                            if (
                                                !s.due_date ||
                                                s.status !== "overdue"
                                            )
                                                return false;
                                            const due = new Date(s.due_date);
                                            return (
                                                due.getMonth() ===
                                                    currentMonth &&
                                                due.getFullYear() ===
                                                    currentYear
                                            );
                                        }).length;
                                    return `${count} ${count === 1 ? "payment" : "payments"}`;
                                })()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-auto mt-3">
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

                {/* 2307 Status */}
                {/* Pending 2307 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-amber-600"
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
                                    Pending BIR 2307
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {
                                        transactions.filter(
                                            (t) =>
                                                t.paid_at &&
                                                (!t.official_receipt ||
                                                    t.official_receipt
                                                        .form_2307_status ===
                                                        "pending"),
                                        ).length
                                    }
                                </h3>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPending2307Modal(true)}
                            className="bg-sky-400 text-white text-sm font-semibold hover:bg-sky-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faEye} className="pr-1" />
                            <span className="hidden sm:inline ml-1">View</span>
                        </button>
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                                No O.R. issued yet
                            </span>
                            {(() => {
                                const count = transactions.filter(
                                    (t) => t.paid_at && !t.official_receipt,
                                ).length;
                                return (
                                    <span className="text-xs font-semibold text-amber-600">
                                        {count}{" "}
                                        {count === 1 ? "payment" : "payments"}
                                    </span>
                                );
                            })()}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
                                O.R. issued, 2307 pending
                            </span>
                            {(() => {
                                const count = transactions.filter(
                                    (t) =>
                                        t.paid_at &&
                                        t.official_receipt &&
                                        t.official_receipt.form_2307_status ===
                                            "pending",
                                ).length;
                                return (
                                    <span className="text-xs font-semibold text-orange-600">
                                        {count}{" "}
                                        {count === 1 ? "payment" : "payments"}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                            {
                                transactions.filter(
                                    (t) =>
                                        t.paid_at &&
                                        (!t.official_receipt ||
                                            t.official_receipt
                                                .form_2307_status ===
                                                "pending"),
                                ).length
                            }{" "}
                            {transactions.filter(
                                (t) =>
                                    t.paid_at &&
                                    (!t.official_receipt ||
                                        t.official_receipt.form_2307_status ===
                                            "pending"),
                            ).length === 1
                                ? "payment"
                                : "payments"}
                        </span>
                        <span className="text-sm text-gray-500">
                            awaiting 2307
                        </span>
                    </div>
                </div>
            </div>

            {/* RECENT PROJECTS */}
            <div className="min-w-full bg-white rounded-xl overflow-x-auto shadow-sm p-6 mt-6">
                <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                    Projects
                </h2>
                <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse mt-5">
                    <thead>
                        <tr className="bg-cyan-800">
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Client Name
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Project Name
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                End Date
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Payment Type
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Payment Cycle
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Total Cost Paid
                            </th>
                            <th className="px-4 py-2 text-white text-sm font-medium text-gray-700">
                                Status
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
                                        {/* Client */}
                                        <td className="px-4 py-2">
                                            {project.client &&
                                            project.client.name
                                                ? project.client.name
                                                : "No Client"}
                                        </td>

                                        {/* Project Name */}
                                        <td className="px-4 py-2">
                                            {project.project.title ||
                                                "Untitled Project"}
                                        </td>

                                        {/* Project End Date */}
                                        <td className="px-4 py-2">
                                            {project.project.end_date || "-"}
                                        </td>

                                        {/* Payment Type */}
                                        <td className="px-4 py-2">
                                            {formatPaymentType(
                                                project.payment
                                                    ?.payment_type ===
                                                    "recurring"
                                                    ? project.payment
                                                          ?.recurring_type
                                                    : project.payment
                                                          ?.payment_type,
                                            )}
                                        </td>

                                        {/* Payment Progress */}
                                        <td className="px-4 py-2">
                                            {project.payment?.payment_type ===
                                                "installment" ||
                                            project.payment?.payment_type ===
                                                "recurring" ? (
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                                                        project.payment
                                                            ?.payment_type ===
                                                        "installment"
                                                            ? "bg-purple-50 text-purple-600 border-purple-100"
                                                            : "bg-blue-50 text-blue-600 border-blue-100"
                                                    }`}
                                                >
                                                    <svg
                                                        className="w-3 h-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span className="font-semibold">
                                                        {project.payment
                                                            ?.paid_installments_count ||
                                                            0}
                                                    </span>
                                                    <span
                                                        className={`${
                                                            project.payment
                                                                ?.payment_type ===
                                                            "installment"
                                                                ? "text-purple-400"
                                                                : "text-blue-400"
                                                        }`}
                                                    >
                                                        /
                                                    </span>
                                                    <span>
                                                        {project.payment
                                                            ?.number_of_cycles ||
                                                            0}
                                                    </span>
                                                </span>
                                            ) : (
                                                " - "
                                            )}
                                        </td>

                                        {/* Total Cost Paid */}
                                        <td className="px-4 py-2">
                                            ₱
                                            {getPaymentSummary(
                                                project,
                                            ).totalCostPaid.toLocaleString()}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-2">
                                            <StatusBadge
                                                status={
                                                    getPaymentSummary(project)
                                                        .overallStatus
                                                }
                                            />
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
                            className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
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
                            className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* UPCOMING & LATE PAYMENTS */}
            <div className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm p-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* UPCOMING PAYMENTS */}
                <div className="bg-white rounded-xl overflow-hidden flex flex-col shadow-sm p-6 h-[500px]">
                    <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                        Upcoming Payments
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-1">
                        {upcomingPayments.length === 0 ? (
                            <p className="text-center text-gray-500 py-6">
                                No upcoming payments
                            </p>
                        ) : (
                            upcomingPayments.map((project) => {
                                const nextPayment = new Date(
                                    project._upcomingSchedule.due_date,
                                );

                                const dayFromNow = new Date();
                                dayFromNow.setDate(today.getDate() + 1);

                                const isUrgent = nextPayment <= dayFromNow;

                                return (
                                    <div
                                        key={`${project.id}-${project._upcomingSchedule.id}`}
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
                                                    project._upcomingSchedule
                                                        .expected_amount || 0,
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
                </div>

                {/* LATE PAYMENTS */}
                <div className="bg-white rounded-xl overflow-hidden flex flex-col shadow-sm p-6 h-[500px]">
                    <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                        Late Payments
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-1">
                        {latePaymentsThisMonth.length === 0 ? (
                            <p className="text-center text-gray-500 py-6">
                                No late payments this month
                            </p>
                        ) : (
                            latePaymentsThisMonth.map((project) => {
                                const dueDate = new Date(
                                    project._lateSchedule.due_date,
                                );

                                const now = new Date();
                                const MS_PER_DAY = 86400000;

                                const daysLate =
                                    now > dueDate
                                        ? Math.floor(
                                              (now - dueDate) / MS_PER_DAY,
                                          )
                                        : 0;

                                return (
                                    <div
                                        key={`${project.id}-${project._lateSchedule.id}`}
                                        className="flex items-center justify-between border-b border-gray-200 pb-2 mt-5 rounded-lg p-3 bg-red-50 hover:bg-red-100 transition-colors"
                                    >
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {project.project.title}
                                            </h3>
                                            <p className="text-gray-500">
                                                {project.client?.name ||
                                                    "No Client"}
                                            </p>
                                            <span className="text-xs font-semibold text-red-500">
                                                {daysLate} day
                                                {daysLate !== 1 ? "s" : ""} late
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-red-600 font-bold">
                                                ₱
                                                {Number(
                                                    project._lateSchedule
                                                        .expected_amount || 0,
                                                ).toLocaleString()}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                Due:{" "}
                                                {dueDate.toLocaleDateString(
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

            {/* RECENT ACTIVITY */}
            <div className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm p-6 mt-6">
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

            {/* MODALS */}
            {showPaymentsModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                Successful Payments
                            </h2>
                            <button
                                onClick={() => setShowPaymentsModal(false)}
                                className="text-gray-500 hover:text-gray-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4 mb-4">
                            {/* Month */}
                            <select
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(e.target.value)
                                }
                                className="border rounded-lg px-3 py-2"
                            >
                                <option value="all">All Months</option>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <option key={i} value={i}>
                                        {new Date(0, i).toLocaleString(
                                            "default",
                                            {
                                                month: "long",
                                            },
                                        )}
                                    </option>
                                ))}
                            </select>

                            {/* Year */}
                            <select
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(e.target.value)
                                }
                                className="border rounded-lg px-3 py-2"
                            >
                                {[2024, 2025, 2026].map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Table */}
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                                <thead className="bg-cyan-800 text-white text-center">
                                    <tr>
                                        <th className="px-4 py-2">Client</th>
                                        <th className="px-4 py-2">Project</th>
                                        <th className="px-4 py-2">Amount</th>
                                        <th className="px-4 py-2">Paid At</th>
                                        <th className="px-4 py-2">OR No.</th>
                                        <th className="px-4 py-2">
                                            2307 Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedPayments.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="text-center py-4 text-gray-500"
                                            >
                                                No payments found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPayments.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="border-b border-gray-200"
                                            >
                                                <td className="px-4 py-2">
                                                    {t.client?.name || "Client"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {t.project?.title ||
                                                        "Project"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    ₱
                                                    {Number(
                                                        t.amount_paid,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {new Date(
                                                        t.paid_at,
                                                    ).toLocaleDateString(
                                                        "en-CA",
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {t.official_receipt
                                                        ?.or_number ? (
                                                        <span className="text-xs font-mono text-gray-700">
                                                            {
                                                                t
                                                                    .official_receipt
                                                                    .or_number
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            No O.R. issued
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <StatusBadge
                                                        status={
                                                            t.official_receipt
                                                                ?.form_2307_status ??
                                                            "pending"
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {totalPaymentsPages > 1 && (
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={() =>
                                        setPaymentsPage((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={paymentsPage === 1}
                                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {paymentsPage} of {totalPaymentsPages}
                                </span>

                                <button
                                    onClick={() =>
                                        setPaymentsPage((prev) =>
                                            Math.min(
                                                prev + 1,
                                                totalPaymentsPages,
                                            ),
                                        )
                                    }
                                    disabled={
                                        paymentsPage === totalPaymentsPages
                                    }
                                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showOverdueModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                Overdue Payments
                            </h2>
                            <button
                                onClick={() => setShowOverdueModal(false)}
                                className="text-gray-500 hover:text-gray-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4 mb-4">
                            {/* Month */}
                            <select
                                value={overdueMonth}
                                onChange={(e) =>
                                    setOverdueMonth(e.target.value)
                                }
                                className="border rounded-lg px-3 py-2"
                            >
                                <option value="all">All Months</option>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <option key={i} value={i}>
                                        {new Date(0, i).toLocaleString(
                                            "default",
                                            {
                                                month: "long",
                                            },
                                        )}
                                    </option>
                                ))}
                            </select>

                            {/* Year */}
                            <select
                                value={overdueYear}
                                onChange={(e) => setOverdueYear(e.target.value)}
                                className="border rounded-lg px-3 py-2"
                            >
                                {[2024, 2025, 2026].map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Table */}
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                                <thead className="bg-cyan-800 text-white text-center">
                                    <tr>
                                        <th className="px-4 py-2">Client</th>
                                        <th className="px-4 py-2">Project</th>
                                        <th className="px-4 py-2">
                                            Amount Due
                                        </th>
                                        <th className="px-4 py-2">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedOverduePayments.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="text-center py-4 text-gray-500"
                                            >
                                                No overdue payments found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOverduePayments.map((o) => (
                                            <tr
                                                key={o.id}
                                                className="border-b border-gray-200 bg-red-50"
                                            >
                                                <td className="px-4 py-2">
                                                    {o.client?.name || "Client"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {o.project?.title ||
                                                        "Project"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold text-red-600">
                                                    ₱
                                                    {Number(
                                                        o.expected_amount || 0,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {new Date(
                                                        o.due_date,
                                                    ).toLocaleDateString(
                                                        "en-CA",
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {totalOverdueModalPages > 1 && (
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={() =>
                                        setOverdueModalPage((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={overdueModalPage === 1}
                                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {overdueModalPage} of{" "}
                                    {totalOverdueModalPages}
                                </span>

                                <button
                                    onClick={() =>
                                        setOverdueModalPage((prev) =>
                                            Math.min(
                                                prev + 1,
                                                totalOverdueModalPages,
                                            ),
                                        )
                                    }
                                    disabled={
                                        overdueModalPage ===
                                        totalOverdueModalPages
                                    }
                                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2307 M0DAL */}
            {showPending2307Modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                Pending BIR 2307
                            </h2>
                            <button
                                onClick={() => setShowPending2307Modal(false)}
                                className="text-gray-500 hover:text-gray-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                                <thead className="bg-cyan-800 text-white text-center">
                                    <tr>
                                        <th className="px-4 py-2">Client</th>
                                        <th className="px-4 py-2">Project</th>
                                        <th className="px-4 py-2">Amount</th>
                                        <th className="px-4 py-2">Paid At</th>
                                        <th className="px-4 py-2">OR No.</th>
                                        <th className="px-4 py-2">
                                            2307 Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedPending2307.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="text-center py-4 text-gray-500"
                                            >
                                                All 2307s are accounted for 🎉
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPending2307.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="border-b border-gray-200 bg-amber-50"
                                            >
                                                <td className="px-4 py-2">
                                                    {t.client?.name || "Client"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {t.project?.title ||
                                                        "Project"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    ₱
                                                    {Number(
                                                        t.amount_paid,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {new Date(
                                                        t.paid_at,
                                                    ).toLocaleDateString(
                                                        "en-CA",
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {t.official_receipt
                                                        ?.or_number ? (
                                                        <span className="text-xs font-mono text-gray-700">
                                                            {
                                                                t
                                                                    .official_receipt
                                                                    .or_number
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            No O.R. issued
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <StatusBadge
                                                        status={
                                                            t.official_receipt
                                                                ?.form_2307_status ??
                                                            "pending"
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPending2307Pages > 1 && (
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={() =>
                                        setPending2307Page((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={pending2307Page === 1}
                                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {pending2307Page} of{" "}
                                    {totalPending2307Pages}
                                </span>
                                <button
                                    onClick={() =>
                                        setPending2307Page((prev) =>
                                            Math.min(
                                                prev + 1,
                                                totalPending2307Pages,
                                            ),
                                        )
                                    }
                                    disabled={
                                        pending2307Page ===
                                        totalPending2307Pages
                                    }
                                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
