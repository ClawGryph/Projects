import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { calcWithholdingTax } from "../utils/withholdingTax";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import PaymentSchedulesTable from "../components/PaymentSchedulesTable";

export default function Payments() {
    const [company, setCompany] = useState(null);
    const [paymentSchedules, setPaymentSchedules] = useState([]);
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

    const getPaymentSchedules = () => {
        setLoading(true);
        axiosClient
            .get("/payment-schedules", {
                params: { month: selectedMonth || undefined },
            })
            .then(({ data }) => {
                const schedules = data.data;
                setPaymentSchedules(schedules);
                setLoading(false);

                const requests = schedules.map((p) =>
                    axiosClient
                        .get("/manual-invoices", {
                            params: { schedule_id: p.id },
                        })
                        .then(({ data }) => {
                            const items = data.data?.line_items ?? [];
                            const total = items.reduce((sum, item) => {
                                if (!item.is_additional) return sum;
                                return (
                                    sum +
                                    (parseFloat(item.amount) || 0) +
                                    (parseFloat(item.vat_amount) || 0)
                                );
                            }, 0);
                            return { id: p.id, total };
                        })
                        .catch(() => ({ id: p.id, total: 0 })),
                );

                Promise.all(requests).then((results) => {
                    const totalsMap = {};
                    results.forEach(({ id, total }) => {
                        totalsMap[id] = total;
                    });
                    setManualInvoiceTotals(totalsMap);
                });
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        axiosClient
            .get("/company")
            .then(({ data }) => setCompany(data))
            .catch(() => setNotification("Failed to load company data"));
    }, []);

    useEffect(() => {
        getPaymentSchedules();
    }, [selectedMonth]);

    useEffect(() => {
        axiosClient.get("/projects").then(({ data }) => setProjects(data.data));
    }, []);

    useEffect(() => {
        axiosClient
            .get("/subscriptions")
            .then(({ data }) => setSubscriptions(data.data));
    }, []);

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
            const paymentType =
                p.clientsProject?.payment?.payment_type === "recurring"
                    ? p.clientsProject?.payment?.recurring_type
                    : p.clientsProject?.payment?.payment_type;
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

    const filteredSchedules = paymentSchedules.filter((p) => {
        const isPaid = p.status === "paid";
        const form2307Status = p.is_form2307_issued ? "issued" : "pending";
        const isProject = !!p.clientsProject?.project;

        const matchesStatus = !selectedStatus || p.status === selectedStatus;
        const matches2307 =
            !selected2307Status ||
            (isPaid && form2307Status === selected2307Status);
        const matchesServiceType =
            !selectedServiceType ||
            (selectedServiceType === "project" && isProject) ||
            (selectedServiceType === "subscription" && !isProject);
        const matchesServiceName =
            !selectedServiceName ||
            (selectedServiceType === "project" &&
                String(p.clientsProject?.project?.id) ===
                    String(selectedServiceName)) ||
            (selectedServiceType === "subscription" &&
                String(p.clientsProject?.subscription?.id) ===
                    String(selectedServiceName));

        return (
            matchesStatus &&
            matches2307 &&
            matchesServiceType &&
            matchesServiceName
        );
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 mt-5 gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Payments
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Service Type Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Service:
                        </label>
                        <select
                            value={selectedServiceType}
                            onChange={(e) => {
                                setSelectedServiceType(e.target.value);
                                setSelectedServiceName("");
                            }}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                            <option value="">All Services</option>
                            <option value="project">Project</option>
                            <option value="subscription">Subscription</option>
                        </select>
                    </div>

                    {/* Service Name Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Service Name:
                        </label>
                        <select
                            value={selectedServiceName}
                            onChange={(e) =>
                                setSelectedServiceName(e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            disabled={!selectedServiceType}
                        >
                            <option value="">
                                {selectedServiceType
                                    ? "All Names"
                                    : "Select a service type first"}
                            </option>
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
                    </div>

                    {/* Month Filter */}
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="month-filter"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Month:
                        </label>
                        <input
                            id="month-filter"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        />
                    </div>

                    {(selectedMonth ||
                        selectedServiceType ||
                        selectedServiceName) && (
                        <button
                            onClick={() => {
                                setSelectedMonth("");
                                setSelectedServiceType("");
                                setSelectedServiceName("");
                                setSelectedStatus("");
                                setSelected2307Status("");
                            }}
                            className="text-sm text-cyan-700 hover:underline dark:text-cyan-400"
                        >
                            Clear Filters
                        </button>
                    )}

                    <button
                        onClick={exportCSV}
                        disabled={paymentSchedules.length === 0}
                        className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                        <span className="hidden sm:inline ml-1">
                            Export CSV
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto p-5">
                <div className="max-w-[1300px] w-full overflow-auto rounded-lg hide-scrollbar max-height">
                    {loading ? (
                        <p className="text-center py-6 text-gray-500">
                            Loading...
                        </p>
                    ) : (
                        <PaymentSchedulesTable
                            paymentSchedules={filteredSchedules}
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
