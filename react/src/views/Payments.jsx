import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { calcWithholdingTax } from "../utils/withholdingTax";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import PaymentSchedulesTable from "../components/PaymentSchedulesTable";

export default function Payments() {
    const [company, setCompany] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [projects, setProjects] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [manualInvoiceTotals, setManualInvoiceTotals] = useState({});
    const [loading, setLoading] = useState(false);
    const { setNotification, user } = useStateContext();
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedServiceType, setSelectedServiceType] = useState("");
    const [selectedServiceName, setSelectedServiceName] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selected2307Status, setSelected2307Status] = useState("");

    useEffect(() => {
        axiosClient.get("/clients").then(({ data }) => setClients(data.data));
    }, []);

    useEffect(() => {
        axiosClient
            .get("/company")
            .then(({ data }) => setCompany(data))
            .catch(() => setNotification("Failed to load company data"));
    }, []);

    useEffect(() => {
        axiosClient.get("/projects").then(({ data }) => setProjects(data.data));
    }, []);

    useEffect(() => {
        axiosClient
            .get("/subscriptions")
            .then(({ data }) => setSubscriptions(data.data));
    }, []);

    const getPaymentSchedules = (resetPage = false) => {
        const currentPage = resetPage ? 1 : page;
        if (resetPage) setPage(1);

        setLoading(true);
        axiosClient
            .get("/payment-schedules", {
                params: {
                    page: currentPage,
                    month: selectedMonth || undefined,
                    client_id: selectedClient || undefined,
                    status: selectedStatus || undefined,
                    form2307_status: selected2307Status || undefined,
                    service_type: selectedServiceType || undefined,
                    service_id: selectedServiceName || undefined,
                },
            })
            .then(({ data }) => {
                const schedules = data.data;
                setPaymentSchedules(schedules);
                setPagination(data.pagination);

                const totalsMap = {};
                schedules.forEach((p) => {
                    totalsMap[p.id] = p.manualInvoice?.total ?? 0;
                });
                setManualInvoiceTotals(totalsMap);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    // Re-fetch when page changes
    useEffect(() => {
        getPaymentSchedules();
    }, [page]);

    // Reset to page 1 and re-fetch when filters change
    useEffect(() => {
        getPaymentSchedules(true);
    }, [
        selectedMonth,
        selectedClient,
        selectedStatus,
        selected2307Status,
        selectedServiceType,
        selectedServiceName,
    ]);

    const updateStatus = (scheduleId, newStatus, currentPayment) => {
        const wasPaid = currentPayment.status === "paid";
        const changingToPending = newStatus === "pending";

        const doUpdate = () => {
            const payload = { status: newStatus };

            if (newStatus === "paid") {
                const { tax: withholdingTax } = calcWithholdingTax({
                    clientType:
                        currentPayment.clientsProject?.client?.company_type ??
                        "",
                    annualGross: parseFloat(company?.annual_gross) || 0,
                    vatType: currentPayment.clientsProject?.vat_type ?? "",
                    baseAmount: parseFloat(currentPayment.base_amount) || 0,
                    totalAmount: parseFloat(currentPayment.total_amount) || 0,
                });

                payload.amount_paid =
                    parseFloat(currentPayment.total_amount) || 0;
                payload.wh_tax = withholdingTax;
            }

            axiosClient
                .put(`/payment-schedules/${scheduleId}/status`, payload)
                .then(() => {
                    getPaymentSchedules();
                    setNotification("Payment status updated");
                })
                .catch((err) => {
                    const response = err.response;
                    if (!response) return;
                    setNotification(
                        response.status === 422
                            ? (response.data.message ??
                                  "Failed to update payment status")
                            : "Failed to update payment status",
                    );
                });
        };

        if (wasPaid && changingToPending && currentPayment.transaction?.id) {
            axiosClient
                .delete(`/transactions/${currentPayment.transaction.id}`)
                .then(() => doUpdate())
                .catch(() =>
                    setNotification("Failed to remove paid transaction"),
                );
        } else {
            doUpdate();
        }
    };

    const formatPaymentType = (type) => {
        if (!type) return "";
        return type
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const exportCSV = () => {
        const headers = [
            "ID",
            "Client",
            "Project",
            "Cost",
            "Payment",
            "Due Date",
            "Status",
            "O.R. #",
            "2307 Status",
        ];

        const rows = paymentSchedules.map((p) => {
            const isProject = !!p.clientsProject?.project;
            const serviceName = isProject
                ? p.clientsProject?.project?.title
                : p.clientsProject?.subscription?.title;
            const serviceType = isProject ? "Project" : "Subscription";
            const paymentType = isProject
                ? p.clientsProject?.project?.payment_type
                : p.clientsProject?.subscription?.frequency;
            const isPaid = p.status === "paid";
            const SIOrACKNo = p.is_or_issued
                ? p.transaction?.officialReceipt?.service_invoice_number ||
                  p.transaction?.officialReceipt
                      ?.payment_acknowledgement_number ||
                  ""
                : "";

            return [
                p.id,
                p.clientsProject?.client?.name ?? "",
                `${serviceType}: ${serviceName ?? ""}`,
                p.total_amount,
                formatPaymentType(paymentType),
                p.due_date ?? "",
                p.status,
                isPaid ? SIOrACKNo || "No O.R. issued" : "-",
                p.is_form2307_issued ? "issued" : "pending",
            ];
        });

        const csvContent = [headers, ...rows]
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(","),
            )
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const filename = [
            "payments",
            selectedMonth || null,
            selectedServiceName && selectedServiceType === "project"
                ? projects.find(
                      (p) => String(p.id) === String(selectedServiceName),
                  )?.title
                : selectedServiceName && selectedServiceType === "subscription"
                  ? subscriptions.find(
                        (s) => String(s.id) === String(selectedServiceName),
                    )?.title
                  : null,
        ]
            .filter(Boolean)
            .join("_")
            .replace(/\s+/g, "-")
            .toLowerCase();

        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center px-5 pt-5 mt-5 pb-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Payments
                </h1>
                <button
                    onClick={exportCSV}
                    disabled={paymentSchedules.length === 0}
                    className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                >
                    <FontAwesomeIcon icon={faDownload} />
                    <span className="ml-1">Export CSV</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 px-5 pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Filters
                </span>

                {/* Client */}
                <label className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Client
                    </span>
                    <select
                        value={selectedClient}
                        onChange={(e) => {
                            setSelectedClient(e.target.value);
                            setSelectedServiceName("");
                        }}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    >
                        <option value="">All</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </label>

                {/* Service Type */}
                <label className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Type
                    </span>
                    <select
                        value={selectedServiceType}
                        onChange={(e) => {
                            setSelectedServiceType(e.target.value);
                            setSelectedServiceName("");
                        }}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    >
                        <option value="">All</option>
                        <option value="project">Project</option>
                        <option value="subscription">Subscription</option>
                    </select>
                </label>

                {/* Service Name */}
                <label className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Service
                    </span>
                    <select
                        value={selectedServiceName}
                        onChange={(e) => setSelectedServiceName(e.target.value)}
                        disabled={!selectedServiceType}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">All</option>
                        {selectedServiceType === "project" &&
                            projects.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                    {proj.title}
                                </option>
                            ))}
                        {selectedServiceType === "subscription" &&
                            subscriptions.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.title}
                                </option>
                            ))}
                    </select>
                </label>

                {/* Month */}
                <label className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Month
                    </span>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    />
                </label>

                {(selectedMonth ||
                    selectedServiceType ||
                    selectedServiceName ||
                    selectedClient ||
                    selectedStatus ||
                    selected2307Status) && (
                    <button
                        onClick={() => {
                            setSelectedMonth("");
                            setSelectedServiceType("");
                            setSelectedServiceName("");
                            setSelectedClient("");
                            setSelectedStatus("");
                            setSelected2307Status("");
                        }}
                        className="ml-auto text-xs text-cyan-700 hover:underline dark:text-cyan-400"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="flex flex-col flex-1 min-h-0 justify-start items-center px-5 pb-5">
                <div className="max-w-[1300px] w-full">
                    {loading ? (
                        <p className="text-center py-6 text-gray-500">
                            Loading...
                        </p>
                    ) : (
                        <PaymentSchedulesTable
                            paymentSchedules={paymentSchedules}
                            pagination={pagination}
                            onPageChange={setPage}
                            manualInvoiceTotals={manualInvoiceTotals}
                            company={company}
                            user={user}
                            onStatusUpdate={updateStatus}
                            onRefresh={getPaymentSchedules}
                            setNotification={setNotification}
                            showClientColumn={true}
                            selectedStatus={selectedStatus}
                            setSelectedStatus={setSelectedStatus}
                            selected2307Status={selected2307Status}
                            setSelected2307Status={setSelected2307Status}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
