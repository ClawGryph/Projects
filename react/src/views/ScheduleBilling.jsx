import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { calcVat } from "../utils/vatCalculator";

export default function ScheduleBilling() {
    const { id, clientsProjectId } = useParams();
    const [client, setClient] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [generated, setGenerated] = useState(false);
    const [assignData, setAssignData] = useState(null);
    const { setNotification } = useStateContext();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axiosClient.get(`/clients/${id}`).then(({ data }) => {
            setClient(data);
        });

        axiosClient
            .get(`/clients/${id}/projects/${clientsProjectId}`)
            .then(({ data }) => {
                setAssignData(data);
            });
    }, []);

    const handleSaveSchedule = () => {
        setSaving(true);

        const paymentId = assignData.payment.id;

        const payload = {
            schedules: schedules.map((s) => ({
                due_date: s.due_date,
                start_coverage: s.start_coverage,
                end_coverage: s.end_coverage,
                payment_rate: s.rate,
                base_amount: s.base_amount,
                vat_amount: s.vat_amount,
                total_amount: s.gross_amount,
            })),
        };

        axiosClient
            .post(`/payments/${paymentId}/schedules`, payload)
            .then(() => {
                setNotification("Billing schedule saved successfully.");
            })
            .catch((err) => {
                const msg =
                    err.response?.data?.message ?? "Something went wrong.";
                setNotification(msg);
            })
            .finally(() => setSaving(false));
    };

    const handleGenerate = () => {
        if (!assignData) return;

        const isProject = assignData.project !== null;
        const service = isProject
            ? assignData.project
            : assignData.subscription;
        const payment = assignData.payment;

        const numberOfCycles = payment?.number_of_cycles ?? 0;
        const billingStartDate = service?.billing_start_date;
        const recurringType = service?.frequency ?? service?.type ?? "monthly";
        const vatType = service?.vat_type ?? "vat_exempt";
        const price = isProject
            ? parseFloat(service?.price ?? 0)
            : parseFloat(service?.cost ?? 0);

        const paymentType = service?.payment_type ?? "";
        const equalRate =
            paymentType === "installment"
                ? parseFloat((100 / numberOfCycles).toFixed(2))
                : 100;

        const firstStart = isProject
            ? (service?.adjusted_start_date ?? service?.start_date)
            : (service?.adjusted_start_coverage ?? service?.start_coverage);

        if (!billingStartDate || numberOfCycles === 0) return;

        const addPeriod = (date, type) => {
            const d = new Date(date);
            if (type === "monthly") d.setMonth(d.getMonth() + 1);
            else if (type === "quarterly") d.setMonth(d.getMonth() + 3);
            else if (type === "half_yearly") d.setMonth(d.getMonth() + 6);
            else if (type === "yearly") d.setFullYear(d.getFullYear() + 1);
            else if (type === "weekly") d.setDate(d.getDate() + 7);
            return d;
        };

        const fmtDate = (d) => new Date(d).toLocaleDateString("en-CA");

        const rows = [];
        let dueDate = new Date(billingStartDate);

        for (let i = 0; i < numberOfCycles; i++) {
            const rate =
                paymentType === "installment" && i === numberOfCycles - 1
                    ? parseFloat(
                          (100 - equalRate * (numberOfCycles - 1)).toFixed(2),
                      )
                    : equalRate;
            const adjustedPrice = (price * rate) / 100;
            const { base_amount, vat_amount, total_amount } = calcVat(
                adjustedPrice,
                vatType,
            );

            if (i === 0) {
                const firstStartDate = new Date(firstStart ?? dueDate);
                const firstEndDate = new Date(
                    addPeriod(firstStartDate, recurringType),
                );
                firstEndDate.setDate(firstEndDate.getDate() - 1);

                rows.push({
                    id: i + 1,
                    due_date: fmtDate(dueDate),
                    start_coverage: firstStart ?? fmtDate(dueDate),
                    end_coverage: fmtDate(firstEndDate),
                    rate,
                    base_amount,
                    vat_amount,
                    gross_amount: total_amount,
                });
            } else {
                const prevEnd = new Date(rows[i - 1].end_coverage);
                const startCoverage = new Date(prevEnd);
                startCoverage.setDate(startCoverage.getDate() + 1);

                const endCoverage = new Date(
                    addPeriod(startCoverage, recurringType),
                );
                endCoverage.setDate(endCoverage.getDate() - 1);

                rows.push({
                    id: i + 1,
                    due_date: fmtDate(dueDate),
                    start_coverage: fmtDate(startCoverage),
                    end_coverage: fmtDate(endCoverage),
                    rate,
                    base_amount,
                    vat_amount,
                    gross_amount: total_amount,
                });
            }

            dueDate = new Date(rows[i].end_coverage);
            dueDate.setDate(dueDate.getDate() + 1);
        }

        setSchedules(rows);
        setGenerated(true);
    };

    const handleScheduleChange = (index, field, value) => {
        setSchedules((prev) =>
            prev.map((s, i) => {
                if (i !== index) return s;

                const updated = { ...s, [field]: value };

                if (field === "rate") {
                    const isProject = assignData?.project !== null;
                    const service = isProject
                        ? assignData.project
                        : assignData.subscription;
                    const vatType = service?.vat_type ?? "vat_exempt";

                    const price = isProject
                        ? parseFloat(service?.price ?? 0)
                        : parseFloat(service?.cost ?? 0);

                    const rate = parseFloat(value) || 0;
                    const adjustedPrice = (price * rate) / 100;

                    const { base_amount, vat_amount, total_amount } = calcVat(
                        adjustedPrice,
                        vatType,
                    );

                    updated.base_amount = base_amount;
                    updated.vat_amount = vat_amount;
                    updated.gross_amount = total_amount;
                }

                return updated;
            }),
        );
    };

    const fmt = (n) =>
        "₱" +
        new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(n);

    const tableHeaders = [
        "Due Date",
        "Start Coverage",
        "End Coverage",
        "Rate",
        "Base Amount",
        "VAT Amount",
        "Gross Amount",
    ];

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

                <Link
                    to={`/clients/assign/${id}`}
                    className="text-gray-500 hover:text-cyan-700 hover:underline transition"
                >
                    Assign
                </Link>

                <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-[10px] text-gray-400"
                />

                <span className="text-gray-800 font-semibold">
                    Schedule Billing
                </span>
            </div>

            <div className="flex justify-between items-center p-5 mt-5">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {assignData
                        ? `${assignData.project?.title ?? assignData.subscription?.title}: Billing Schedule`
                        : "Billing Schedule"}
                </h1>
                <button
                    onClick={handleGenerate}
                    disabled={generated || !assignData}
                    className={`flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                        generated || !assignData
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-sky-400 hover:bg-sky-500 cursor-pointer"
                    }`}
                >
                    Generate Billing Schedule
                </button>
            </div>

            {/* Service Info */}
            {assignData && (
                <div className="px-5 mb-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex gap-6">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Service Type
                            </p>
                            <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    assignData.project !== null
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                }`}
                            >
                                {assignData.project !== null
                                    ? "Project"
                                    : "Subscription"}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Payment Type
                            </p>
                            <p className="text-sm font-semibold text-gray-800 capitalize">
                                {assignData.project !== null
                                    ? (assignData.project?.payment_type?.replace(
                                          /_/g,
                                          " ",
                                      ) ?? "—")
                                    : (assignData.subscription?.frequency?.replace(
                                          /_/g,
                                          " ",
                                      ) ?? "—")}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                VAT Type
                            </p>
                            <p className="text-sm font-semibold text-gray-800 capitalize">
                                {(
                                    assignData.project?.vat_type ??
                                    assignData.subscription?.vat_type
                                )?.replace(/_/g, " ") ?? "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Payment Cycle
                            </p>
                            <p className="text-sm font-semibold text-gray-800 capitalize">
                                {assignData.payment?.number_of_cycles ?? "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Total Gross Amount
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {fmt(
                                    schedules.reduce(
                                        (sum, s) =>
                                            sum +
                                            parseFloat(s.gross_amount || 0),
                                        0,
                                    ),
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Table */}
            {generated && (
                <>
                    <div className="px-5 mb-3 flex justify-end">
                        <button
                            onClick={handleSaveSchedule}
                            disabled={saving}
                            className={`flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                                saving
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-sky-400 hover:bg-sky-500 cursor-pointer"
                            }`}
                        >
                            {saving ? "Saving..." : "Generate Invoice"}
                        </button>
                    </div>

                    <div className="px-5">
                        <div className="overflow-auto rounded-lg shadow-sm">
                            <table className="w-full bg-white border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-cyan-800">
                                        {tableHeaders.map((header) => (
                                            <th
                                                key={header}
                                                className="px-4 py-2 text-white text-sm font-medium text-center"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.length > 0 ? (
                                        schedules.map((s, index) => (
                                            <tr
                                                key={s.id}
                                                className="hover:bg-cyan-50 text-center"
                                            >
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="date"
                                                        value={s.due_date}
                                                        onChange={(e) =>
                                                            handleScheduleChange(
                                                                index,
                                                                "due_date",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="date"
                                                        value={s.start_coverage}
                                                        onChange={(e) =>
                                                            handleScheduleChange(
                                                                index,
                                                                "start_coverage",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="date"
                                                        value={s.end_coverage}
                                                        onChange={(e) =>
                                                            handleScheduleChange(
                                                                index,
                                                                "end_coverage",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={s.rate}
                                                        onChange={(e) =>
                                                            handleScheduleChange(
                                                                index,
                                                                "rate",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={s.base_amount}
                                                        onChange={(e) =>
                                                            handleScheduleChange(
                                                                index,
                                                                "base_amount",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={s.vat_amount}
                                                        onChange={(e) =>
                                                            handleScheduleChange(
                                                                index,
                                                                "vat_amount",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={s.gross_amount}
                                                        onChange={(e) =>
                                                            handleScheduleChange(
                                                                index,
                                                                "gross_amount",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={tableHeaders.length}
                                                className="px-4 py-6 text-center text-gray-500"
                                            >
                                                No schedules found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
