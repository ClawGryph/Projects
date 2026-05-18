import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../axios-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
    const [client, setClient] = useState([]);
    const [clientsProject, setClientsProject] = useState([]);
    const [ongoingProjectsCount, setOngoingProjectsCount] = useState(0);
    const [ongoingSubscriptionsCount, setOngoingSubscriptionsCount] =
        useState(0);
    const [transactions, setTransactions] = useState([]);
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [overdueMonth, setOverdueMonth] = useState("all");
    const [overdueYear, setOverdueYear] = useState(new Date().getFullYear());
    const [currentPage, setCurrentPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [pending2307Filter, setPending2307Filter] = useState("no_or");
    const [overdueModalPage, setOverdueModalPage] = useState(1);
    const [showPending2307Modal, setShowPending2307Modal] = useState(false);
    const [pending2307Page, setPending2307Page] = useState(1);
    const [showNoORModal, setShowNoORModal] = useState(false);
    const [noORPage, setNoORPage] = useState(1);
    const [metrics, setMetrics] = useState({
        clientChange: 0,
        projectsChange: 0,
        revenueChange: 0,
        monthlyRevenue: 0,
        overduePayments: 0,
        overdueCount: 0,
    });

    // ── New modal states for file upload cards ──
    const [showNoORFileModal, setShowNoORFileModal] = useState(false);
    const [noORFilePage, setNoORFilePage] = useState(1);
    const [showNo2307FileModal, setShowNo2307FileModal] = useState(false);
    const [no2307FilePage, setNo2307FilePage] = useState(1);

    const rowsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        axiosClient
            .get("/transactions")
            .then(({ data }) => {
                setTransactions(data.data);
            })
            .catch(() => console.error("Failed to load payment transactions"));
    }, []);

    // Fetch ongoing projects count
    useEffect(() => {
        axiosClient
            .get("/projects")
            .then(({ data }) => {
                const ongoing = data.data.filter((p) => p.status === "ongoing");
                setOngoingProjectsCount(ongoing.length);
            })
            .catch(() => console.error("Failed to load projects"));
    }, []);

    // Fetch ongoing subscriptions count
    useEffect(() => {
        axiosClient
            .get("/subscriptions")
            .then(({ data }) => {
                const ongoing = data.data.filter((s) => s.status === "ongoing");
                setOngoingSubscriptionsCount(ongoing.length);
            })
            .catch(() => console.error("Failed to load subscriptions"));
    }, []);

    // Fetch Clients
    useEffect(() => {
        axiosClient
            .get("/clients")
            .then(({ data }) => setClient(data.data))
            .catch(() => console.error("Failed to load client"));
    }, []);

    // Fetch All projects belong to client
    useEffect(() => {
        axiosClient.get("/clients-projects").then(({ data }) => {
            setClientsProject(data.data);
        });
    }, []);

    // Calculate metrics when data changes
    useEffect(() => {
        if (
            client.length > 0 ||
            clientsProject.length > 0 ||
            transactions.length > 0
        ) {
            calculateMetrics(client, clientsProject, transactions);
        }
    }, [client, clientsProject, transactions]);

    const activeServicesCount =
        ongoingProjectsCount + ongoingSubscriptionsCount;

    // Calculate metrics from data
    const calculateMetrics = (
        clientData,
        clientsProjectsData,
        transactionsData,
    ) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;

        const paidTransactions = transactionsData.filter((t) => !!t.paid_at);

        const currentMonthRevenue = paidTransactions
            .filter((t) => {
                const date = new Date(t.paid_at);
                return (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                );
            })
            .reduce((sum, t) => sum + Number(t.net_amount || 0), 0);

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

        const currentMonthProjects = clientsProjectsData.filter((cp) => {
            if (!cp.created_at) return false;
            const date = new Date(cp.created_at);
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

    const overduePayments = clientsProject.flatMap((cp) =>
        (cp.payment_schedules || [])
            .filter((s) => s.status === "overdue")
            .map((s) => ({
                id: s.id,
                client: cp.client,
                project: cp.project,
                subscription: cp.subscription,
                total_amount: s.total_amount,
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

        const overallStatus = allPaid
            ? "paid"
            : anyEnded
              ? "ended"
              : anyOverdue
                ? "overdue"
                : paid > 0
                  ? "active"
                  : "pending";

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

        const totalCostPaid = schedules
            .filter((s) => s.status === "paid")
            .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

        return { overallStatus, cycleLabel, totalCostPaid };
    };

    // No O.R. Issued — paid but no official_receipt record at all
    const noORPayments = transactions.filter(
        (t) => t.paid_at && !t.is_or_issued,
    );

    // Pending BIR 2307 — has O.R. with SI number, but no form2307 linked
    const pendingForm2307Payments = transactions.filter(
        (t) => t.paid_at && t.is_or_issued && !t.is_form2307_issued,
    );

    const active2307List =
        pending2307Filter === "no_or" ? noORPayments : pendingForm2307Payments;

    // O.R. File not uploaded — has an official_receipt record but no file
    const noORFilePayments = transactions.filter(
        (t) => t.paid_at && t.is_or_issued && !t.officialReceipt?.or_file_url,
    );

    // 2307 File not uploaded — has form2307 linked but no file uploaded
    const no2307FilePayments = transactions.filter(
        (t) =>
            t.paid_at &&
            t.is_form2307_issued &&
            !t.officialReceipt?.form2307_file_url,
    );

    const totalNoORPages = Math.ceil(noORPayments.length / rowsPerPage);
    const paginatedNoOR = noORPayments.slice(
        (noORPage - 1) * rowsPerPage,
        noORPage * rowsPerPage,
    );

    const totalPending2307Pages = Math.ceil(
        active2307List.length / rowsPerPage,
    );
    const paginatedPending2307 = active2307List.slice(
        (pending2307Page - 1) * rowsPerPage,
        pending2307Page * rowsPerPage,
    );

    // ── Pagination for new modals ──
    const totalNoORFilePages = Math.ceil(noORFilePayments.length / rowsPerPage);
    const paginatedNoORFile = noORFilePayments.slice(
        (noORFilePage - 1) * rowsPerPage,
        noORFilePage * rowsPerPage,
    );

    const totalNo2307FilePages = Math.ceil(
        no2307FilePayments.length / rowsPerPage,
    );
    const paginatedNo2307File = no2307FilePayments.slice(
        (no2307FilePage - 1) * rowsPerPage,
        no2307FilePage * rowsPerPage,
    );

    // Function to export CSV
    const exportDashboardCSV = () => {
        const rows = [];

        rows.push(["DASHBOARD SUMMARY"]);
        rows.push(["Total Clients", client.length]);
        rows.push(["Active Services", activeServicesCount]);
        rows.push(["Monthly Revenue", metrics.monthlyRevenue]);
        rows.push(["Overdue Payments", metrics.overdueCount]);
        rows.push([]);

        rows.push(["CLIENTS"]);
        rows.push(["Name", "Email", "Created At"]);
        client.forEach((c) => {
            rows.push([c.name || "", c.email || "", c.created_at || ""]);
        });
        rows.push([]);

        rows.push(["SERVICES"]);
        rows.push(["Title", "End Date", "Created At"]);
        clientsProject
            .filter(
                (cp) =>
                    cp.project?.status === "ongoing" ||
                    cp.subscription?.status === "ongoing",
            )
            .forEach((cp) => {
                const title = cp.project?.title || cp.subscription?.title || "";
                const endDate =
                    cp.project?.end_date || cp.subscription?.end_coverage || "";
                rows.push([title, endDate, cp.created_at || ""]);
            });

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

        rows.push(["SUCCESSFUL PAYMENTS"]);
        rows.push(["Client", "Project", "Amount", "Paid At"]);
        transactions
            .filter((t) => t.paid_at)
            .forEach((t) => {
                rows.push([
                    t.client?.name || "",
                    t.project?.title || t.subscription?.title || "",
                    t.net_amount || 0,
                    t.paid_at || "",
                ]);
            });

        rows.push([]);

        rows.push(["OVERDUE PAYMENTS"]);
        rows.push(["Client", "Project", "Amount Due", "Due Date"]);
        overduePayments.forEach((o) => {
            rows.push([
                o.client?.name || "",
                o.project?.title || o.subscription?.title || "",
                o.total_amount || 0,
                o.due_date || "",
            ]);
        });

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
        const formatted = type.replace(/_/g, " ");
        return formatted
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

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

    const latePaymentsThisMonth = clientsProject
        .flatMap((project) => {
            const schedules = project.payment_schedules || [];
            return schedules
                .filter((s) => s.status === "overdue")
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

        clientsProject.forEach((cp) => {
            if (!cp.created_at) return;
            activities.push({
                id: `project-${cp.id}`,
                type: "project_created",
                title: "New Project Created",
                description: `${cp.project?.title || cp.subscription?.title || "Untitled"} - ${cp.client?.name || "No Client"}`,
                amount: null,
                date: new Date(cp.created_at),
            });
        });

        transactions.forEach((t) => {
            if (!t.paid_at) return;
            activities.push({
                id: `payment-${t.id}`,
                type: "payment_received",
                title: "Payment Received",
                description: `From ${t.client?.name || "Client"}`,
                amount: t.net_amount,
                date: new Date(t.paid_at),
            });
        });

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
                    description: `${cp.project?.title || cp.subscription?.title || "Project"} - ${cp.client?.name || ""}`,
                    amount: cp.payment_transaction?.amount || 0,
                    date: new Date(cp.payment.next_payment_date),
                });
            }
        });

        return activities.sort((a, b) => b.date - a.date).slice(0, 6);
    };

    const activities = buildActivities().slice(0, 5);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;

    const ongoingProjects = clientsProject.filter((project) => {
        return (
            project.project?.status !== "complete" ||
            project.subscription !== null
        );
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

    // ── Reusable pagination controls ──
    function Pagination({ page, total, onPrev, onNext }) {
        if (total <= 1) return null;
        return (
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={onPrev}
                    disabled={page === 1}
                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">
                    Page {page} of {total}
                </span>
                <button
                    onClick={onNext}
                    disabled={page === total}
                    className="px-4 py-2 bg-cyan-800 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                >
                    Next
                </button>
            </div>
        );
    }

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
                                    Active Services
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {activeServicesCount}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {renderChangeIndicator(metrics.projectsChange)}
                        <span className="text-sm text-gray-500">
                            new assignments this month
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
                                                    Number(s.total_amount || 0),
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
                    <div className="space-y-2 border-t border-gray-100 pt-3">
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
                                                    Number(s.total_amount || 0),
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
                    <div className="space-y-2 border-t border-gray-100 pt-3">
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

                {/* No O.R. Issued */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-orange-600"
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
                                    No O.R. Issued
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {noORPayments.length}
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowNoORModal(true);
                                setPending2307Filter("no_or");
                            }}
                            className="bg-sky-400 text-white text-sm font-semibold hover:bg-sky-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faEye} className="pr-1" />
                            <span className="hidden sm:inline ml-1">View</span>
                        </button>
                    </div>
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
                                Paid but no official receipt yet
                            </span>
                            <span className="text-xs font-semibold text-orange-600">
                                {noORPayments.length}{" "}
                                {noORPayments.length === 1
                                    ? "payment"
                                    : "payments"}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                            {noORPayments.length}{" "}
                            {noORPayments.length === 1 ? "payment" : "payments"}
                        </span>
                        <span className="text-sm text-gray-500">
                            awaiting O.R.
                        </span>
                    </div>
                </div>

                {/* O.R. Issued, 2307 Pending */}
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
                                    {pendingForm2307Payments.length}
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowPending2307Modal(true);
                                setPending2307Filter("pending_2307");
                            }}
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
                                O.R. issued, 2307 not yet submitted
                            </span>
                            <span className="text-xs font-semibold text-amber-600">
                                {pendingForm2307Payments.length}{" "}
                                {pendingForm2307Payments.length === 1
                                    ? "payment"
                                    : "payments"}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                            {pendingForm2307Payments.length}{" "}
                            {pendingForm2307Payments.length === 1
                                ? "payment"
                                : "payments"}
                        </span>
                        <span className="text-sm text-gray-500">
                            awaiting 2307
                        </span>
                    </div>
                </div>

                {/* O.R. File Not Uploaded */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-rose-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    O.R. File Not Uploaded
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {noORFilePayments.length}
                                </h3>
                            </div>
                        </div>
                        {/* ── NEW View button ── */}
                        <button
                            onClick={() => {
                                setShowNoORFileModal(true);
                                setNoORFilePage(1);
                            }}
                            className="bg-sky-400 text-white text-sm font-semibold hover:bg-sky-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faEye} className="pr-1" />
                            <span className="hidden sm:inline ml-1">View</span>
                        </button>
                    </div>
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                                O.R. issued but file not attached
                            </span>
                            <span className="text-xs font-semibold text-rose-600">
                                {(() => {
                                    const count = transactions.filter(
                                        (t) =>
                                            t.paid_at &&
                                            t.is_or_issued &&
                                            !t.officialReceipt?.or_file_url,
                                    ).length;
                                    return `${count} ${count === 1 ? "payment" : "payments"}`;
                                })()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2307 File Not Uploaded */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-violet-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    2307 File Not Uploaded
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {no2307FilePayments.length}
                                </h3>
                            </div>
                        </div>
                        {/* ── NEW View button ── */}
                        <button
                            onClick={() => {
                                setShowNo2307FileModal(true);
                                setNo2307FilePage(1);
                            }}
                            className="bg-sky-400 text-white text-sm font-semibold hover:bg-sky-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faEye} className="pr-1" />
                            <span className="hidden sm:inline ml-1">View</span>
                        </button>
                    </div>
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-violet-400 inline-block"></span>
                                2307 linked but file not attached
                            </span>
                            <span className="text-xs font-semibold text-violet-600">
                                {(() => {
                                    const count = transactions.filter(
                                        (t) =>
                                            t.paid_at &&
                                            t.is_form2307_issued &&
                                            !t.officialReceipt
                                                ?.form2307_file_url,
                                    ).length;
                                    return `${count} ${count === 1 ? "payment" : "payments"}`;
                                })()}
                            </span>
                        </div>
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
                                Service Name
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
                                const isProject = !!project.project;
                                const paidCount = (
                                    project.payment_schedules || []
                                ).filter((s) => s.status === "paid").length;
                                const totalCount =
                                    project.payment?.number_of_cycles || 0;
                                const isOverdue =
                                    project.payment?.next_payment_date &&
                                    new Date(
                                        project.payment.next_payment_date,
                                    ) < new Date() &&
                                    project.payment?.status !== "completed";

                                return (
                                    <tr
                                        key={project.id}
                                        className={`border-b border-gray-200 text-center ${isOverdue ? "bg-red-50 hover:bg-red-100" : "hover:bg-cyan-50"}`}
                                    >
                                        <td className="px-4 py-2">
                                            {project.client?.name ||
                                                "No Client"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() =>
                                                    navigate("/clients", {
                                                        state: {
                                                            openService:
                                                                project,
                                                        },
                                                    })
                                                }
                                                className="text-cyan-800 hover:text-cyan-600 font-medium hover:underline transition-colors"
                                            >
                                                {project.project?.title ||
                                                    project.subscription
                                                        ?.title ||
                                                    "Untitled"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2">
                                            {project.project?.end_date ||
                                                project.subscription
                                                    ?.adjusted_end_coverage ||
                                                project.subscription
                                                    ?.end_coverage ||
                                                "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                            {formatPaymentType(
                                                isProject
                                                    ? project.project
                                                          ?.payment_type
                                                    : project.subscription
                                                          ?.frequency,
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {(() => {
                                                if (isProject) {
                                                    const paymentType =
                                                        project.project
                                                            ?.payment_type;
                                                    if (
                                                        paymentType ===
                                                        "installment"
                                                    ) {
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-purple-50 text-purple-600 border-purple-100">
                                                                <span className="font-semibold">
                                                                    {paidCount}
                                                                </span>
                                                                <span className="text-purple-400">
                                                                    /
                                                                </span>
                                                                <span>
                                                                    {totalCount}
                                                                </span>
                                                                <span className="text-xs opacity-60">
                                                                    installments
                                                                </span>
                                                            </span>
                                                        );
                                                    }
                                                    if (
                                                        paymentType ===
                                                        "one_time"
                                                    ) {
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-50 text-gray-600 border-gray-100">
                                                                One Time
                                                            </span>
                                                        );
                                                    }
                                                    return <span>-</span>;
                                                } else {
                                                    const frequency =
                                                        project.subscription
                                                            ?.frequency;
                                                    if (!frequency)
                                                        return <span>-</span>;
                                                    const unit = frequency
                                                        .replace(/_/g, " ")
                                                        .replace(/\b\w/g, (c) =>
                                                            c.toUpperCase(),
                                                        );
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-blue-50 text-blue-600 border-blue-100">
                                                            <span className="font-semibold">
                                                                {paidCount}
                                                            </span>
                                                            <span className="text-blue-400">
                                                                /
                                                            </span>
                                                            <span>
                                                                {totalCount}
                                                            </span>
                                                            <span className="text-xs opacity-60">
                                                                {unit}
                                                            </span>
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </td>
                                        <td className="px-4 py-2">
                                            ₱
                                            {getPaymentSummary(
                                                project,
                                            ).totalCostPaid.toLocaleString()}
                                        </td>
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
                    <Pagination
                        page={currentPage}
                        total={totalPages}
                        onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        onNext={() =>
                            setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                    />
                )}
            </div>

            {/* UPCOMING & LATE PAYMENTS */}
            <div className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm p-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        className={`flex items-center justify-between mb-4 border-b border-gray-200 pb-2 mt-5 rounded-lg p-3 ${isUrgent ? "bg-red-50 hover:bg-red-100" : "hover:bg-cyan-50"} transition-colors`}
                                    >
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {project.project?.title ||
                                                    project.subscription
                                                        ?.title ||
                                                    "Untitled"}
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
                                                        .total_amount || 0,
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

                <div className="bg-white rounded-xl overflow-hidden flex flex-col shadow-sm p-6 h-[500px]">
                    <h2 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">
                        Overdue Payments
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-1">
                        {latePaymentsThisMonth.length === 0 ? (
                            <p className="text-center text-gray-500 py-6">
                                No overdue payments this month
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
                                                {project.project?.title ||
                                                    project.subscription
                                                        ?.title ||
                                                    "Untitled"}
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
                                                        .total_amount || 0,
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
                                                className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
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

            {/* ══════════════════════════════════════════════════════════════════
                MODALS
            ══════════════════════════════════════════════════════════════════ */}

            {/* Successful Payments Modal */}
            {showPaymentsModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
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
                        <div className="flex gap-4 mb-4">
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
                                            { month: "long" },
                                        )}
                                    </option>
                                ))}
                            </select>
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
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                                <thead className="bg-cyan-800 text-white text-center">
                                    <tr>
                                        <th className="px-4 py-2">Client</th>
                                        <th className="px-4 py-2">Project</th>
                                        <th className="px-4 py-2">Amount</th>
                                        <th className="px-4 py-2">Paid At</th>
                                        <th className="px-4 py-2">
                                            S.I/ACK No.
                                        </th>
                                        <th className="px-4 py-2">
                                            2307 Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedPayments.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
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
                                                        t.subscription?.title ||
                                                        "—"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    ₱
                                                    {Number(
                                                        t.net_amount,
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
                                                    {t.officialReceipt
                                                        ?.service_invoice_number ||
                                                    t.officialReceipt
                                                        ?.payment_acknowledgement_number ? (
                                                        <span className="text-xs font-mono text-gray-700">
                                                            {t.officialReceipt
                                                                ?.service_invoice_number ||
                                                                t
                                                                    .officialReceipt
                                                                    ?.payment_acknowledgement_number}
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
                                                            t.is_form2307_issued
                                                                ? "issued"
                                                                : "pending"
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={paymentsPage}
                            total={totalPaymentsPages}
                            onPrev={() =>
                                setPaymentsPage((p) => Math.max(p - 1, 1))
                            }
                            onNext={() =>
                                setPaymentsPage((p) =>
                                    Math.min(p + 1, totalPaymentsPages),
                                )
                            }
                        />
                    </div>
                </div>
            )}

            {/* Overdue Payments Modal */}
            {showOverdueModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
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
                        <div className="flex gap-4 mb-4">
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
                                            { month: "long" },
                                        )}
                                    </option>
                                ))}
                            </select>
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
                                                        o.subscription?.title ||
                                                        "—"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold text-red-600">
                                                    ₱
                                                    {Number(
                                                        o.total_amount || 0,
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
                        <Pagination
                            page={overdueModalPage}
                            total={totalOverdueModalPages}
                            onPrev={() =>
                                setOverdueModalPage((p) => Math.max(p - 1, 1))
                            }
                            onNext={() =>
                                setOverdueModalPage((p) =>
                                    Math.min(p + 1, totalOverdueModalPages),
                                )
                            }
                        />
                    </div>
                </div>
            )}

            {/* No O.R. Issued Modal */}
            {showNoORModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                No O.R. Issued
                            </h2>
                            <button
                                onClick={() => setShowNoORModal(false)}
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
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedNoOR.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="text-center py-4 text-gray-500"
                                            >
                                                All payments have O.R. 🎉
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedNoOR.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="border-b border-gray-200 bg-orange-50"
                                            >
                                                <td className="px-4 py-2">
                                                    {t.client?.name || "Client"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {t.project?.title ||
                                                        t.subscription?.title ||
                                                        "—"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    ₱
                                                    {Number(
                                                        t.net_amount,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {new Date(
                                                        t.paid_at,
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
                        <Pagination
                            page={noORPage}
                            total={totalNoORPages}
                            onPrev={() =>
                                setNoORPage((p) => Math.max(p - 1, 1))
                            }
                            onNext={() =>
                                setNoORPage((p) =>
                                    Math.min(p + 1, totalNoORPages),
                                )
                            }
                        />
                    </div>
                </div>
            )}

            {/* Pending BIR 2307 Modal */}
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
                                        <th className="px-4 py-2">
                                            S.I/ACK No.
                                        </th>
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
                                                        t.subscription?.title ||
                                                        "—"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    ₱
                                                    {Number(
                                                        t.net_amount,
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
                                                    {t.officialReceipt
                                                        ?.service_invoice_number ? (
                                                        <span className="text-xs font-mono text-gray-700">
                                                            {
                                                                t
                                                                    .officialReceipt
                                                                    .service_invoice_number
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
                                                            t.is_form2307_issued
                                                                ? "issued"
                                                                : "pending"
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={pending2307Page}
                            total={totalPending2307Pages}
                            onPrev={() =>
                                setPending2307Page((p) => Math.max(p - 1, 1))
                            }
                            onNext={() =>
                                setPending2307Page((p) =>
                                    Math.min(p + 1, totalPending2307Pages),
                                )
                            }
                        />
                    </div>
                </div>
            )}

            {/* ── O.R. File Not Uploaded Modal ── */}
            {showNoORFileModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    O.R. File Not Uploaded
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Paid transactions missing an O.R. file
                                    attachment
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNoORFileModal(false)}
                                className="text-gray-500 hover:text-gray-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                                <thead className="bg-rose-700 text-white text-center">
                                    <tr>
                                        <th className="px-4 py-2">Client</th>
                                        <th className="px-4 py-2">Project</th>
                                        <th className="px-4 py-2">Amount</th>
                                        <th className="px-4 py-2">Paid At</th>
                                        <th className="px-4 py-2">
                                            S.I/ACK No.
                                        </th>
                                        <th className="px-4 py-2">
                                            File Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedNoORFile.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="text-center py-4 text-gray-500"
                                            >
                                                All O.R. files are uploaded 🎉
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedNoORFile.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="border-b border-gray-200 bg-rose-50"
                                            >
                                                <td className="px-4 py-2">
                                                    {t.client?.name || "Client"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {t.project?.title ||
                                                        t.subscription?.title ||
                                                        "—"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    ₱
                                                    {Number(
                                                        t.net_amount || 0,
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
                                                    {t.officialReceipt
                                                        ?.service_invoice_number ||
                                                    t.officialReceipt
                                                        ?.payment_acknowledgement_number ? (
                                                        <span className="text-xs font-mono text-gray-700">
                                                            {t.officialReceipt
                                                                ?.service_invoice_number ||
                                                                t
                                                                    .officialReceipt
                                                                    ?.payment_acknowledgement_number}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            No O.R. issued
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                                        File Missing
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={noORFilePage}
                            total={totalNoORFilePages}
                            onPrev={() =>
                                setNoORFilePage((p) => Math.max(p - 1, 1))
                            }
                            onNext={() =>
                                setNoORFilePage((p) =>
                                    Math.min(p + 1, totalNoORFilePages),
                                )
                            }
                        />
                    </div>
                </div>
            )}

            {/* ── 2307 File Not Uploaded Modal ── */}
            {showNo2307FileModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">
                                    2307 File Not Uploaded
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Transactions with a linked 2307 but no file
                                    attached
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNo2307FileModal(false)}
                                className="text-gray-500 hover:text-gray-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg border-collapse">
                                <thead className="bg-violet-700 text-white text-center">
                                    <tr>
                                        <th className="px-4 py-2">Client</th>
                                        <th className="px-4 py-2">Project</th>
                                        <th className="px-4 py-2">Amount</th>
                                        <th className="px-4 py-2">Paid At</th>
                                        <th className="px-4 py-2">
                                            S.I/ACK No.
                                        </th>
                                        <th className="px-4 py-2">
                                            File Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedNo2307File.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="text-center py-4 text-gray-500"
                                            >
                                                All 2307 files are uploaded 🎉
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedNo2307File.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="border-b border-gray-200 bg-violet-50"
                                            >
                                                <td className="px-4 py-2">
                                                    {t.client?.name || "Client"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {t.project?.title ||
                                                        t.subscription?.title ||
                                                        "—"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    ₱
                                                    {Number(
                                                        t.net_amount || 0,
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
                                                    {t.officialReceipt
                                                        ?.service_invoice_number ? (
                                                        <span className="text-xs font-mono text-gray-700">
                                                            {
                                                                t
                                                                    .officialReceipt
                                                                    .service_invoice_number
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                                        File Missing
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={no2307FilePage}
                            total={totalNo2307FilePages}
                            onPrev={() =>
                                setNo2307FilePage((p) => Math.max(p - 1, 1))
                            }
                            onNext={() =>
                                setNo2307FilePage((p) =>
                                    Math.min(p + 1, totalNo2307FilePages),
                                )
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
