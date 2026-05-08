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
    const [editingId, setEditingId] = useState(null);
    const [pendingRowIndex, setPendingRowIndex] = useState(null);
    const [showExceedModal, setShowExceedModal] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

    useEffect(() => {
        const handleClickOutside = () => setEditingId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
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

    const fmtDate = (d) => new Date(d).toLocaleDateString("en-CA");

    // calculate a billing cycle
    const addPeriod = (date, type) => {
        const d = new Date(date);
        if (type === "monthly") d.setMonth(d.getMonth() + 1);
        else if (type === "quarterly") d.setMonth(d.getMonth() + 3);
        else if (type === "half_yearly") d.setMonth(d.getMonth() + 6);
        else if (type === "yearly") d.setFullYear(d.getFullYear() + 1);
        else if (type === "weekly") d.setDate(d.getDate() + 7);
        return d;
    };

    const recalculateFromIndex = (rows, fromIndex, recurringType) => {
        const result = [...rows];

        for (let i = fromIndex; i < result.length; i++) {
            if (i === 0) continue;

            const prevRow = result[i - 1]; // ✅ always reads the already-updated prev row

            const newStartCoverage = new Date(prevRow.end_coverage);
            newStartCoverage.setDate(newStartCoverage.getDate() + 1);

            const newEndCoverage = new Date(
                addPeriod(newStartCoverage, recurringType),
            );
            newEndCoverage.setDate(newEndCoverage.getDate() - 1);

            const newDueDate = new Date(prevRow.end_coverage);
            newDueDate.setDate(newDueDate.getDate() + 1);

            result[i] = {
                ...result[i],
                due_date: fmtDate(newDueDate),
                start_coverage: fmtDate(newStartCoverage),
                end_coverage: fmtDate(newEndCoverage),
            };
        }

        return result;
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
        setSchedules((prev) => {
            const mapped = prev.map((s, i) => {
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

                if (field === "vat_amount") {
                    const base = parseFloat(s.base_amount) || 0;
                    const vat = parseFloat(value) || 0;
                    updated.vat_amount = vat;
                    updated.gross_amount = parseFloat((base + vat).toFixed(2));
                }

                if (field === "gross_amount") {
                    const isProject = assignData?.project !== null;
                    const service = isProject
                        ? assignData.project
                        : assignData.subscription;
                    const vatType = service?.vat_type ?? "vat_exempt";
                    const gross = parseFloat(value) || 0;
                    const originalPrice =
                        vatType === "vat_exclusive" ? gross / 1.12 : gross;
                    const { base_amount, vat_amount } = calcVat(
                        originalPrice,
                        vatType,
                    );
                    updated.base_amount = base_amount;
                    updated.vat_amount = vat_amount;
                    updated.gross_amount = gross;
                }

                return updated;
            });

            // If end_coverage changed, cascade due_date to the next row
            if (field === "end_coverage") {
                const isProject = assignData?.project !== null;
                const service = isProject
                    ? assignData.project
                    : assignData.subscription;
                const recurringType =
                    service?.frequency ?? service?.type ?? "monthly";
                // cascade from the NEXT row onward
                return recalculateFromIndex(mapped, index + 1, recurringType);
            }

            return mapped;
        });
    };

    const handleAddRow = (index) => {
        const ref = schedules[index]; // the row that was clicked

        const isProject = assignData?.project !== null;
        const service = isProject
            ? assignData.project
            : assignData.subscription;
        const recurringType = service?.frequency ?? service?.type ?? "monthly";

        // new row starts the day after ref's end_coverage
        const newStartCoverage = new Date(ref.end_coverage);
        newStartCoverage.setDate(newStartCoverage.getDate() + 1);

        const newEndCoverage = new Date(
            addPeriod(newStartCoverage, recurringType),
        );
        newEndCoverage.setDate(newEndCoverage.getDate() - 1);

        const newDueDate = new Date(ref.end_coverage);
        newDueDate.setDate(newDueDate.getDate() + 1);

        const newRow = {
            id: Date.now(),
            due_date: fmtDate(newDueDate),
            start_coverage: fmtDate(newStartCoverage),
            end_coverage: fmtDate(newEndCoverage),
            rate: ref.rate,
            base_amount: ref.base_amount,
            vat_amount: ref.vat_amount,
            gross_amount: ref.gross_amount,
        };

        const inserted = [
            ...schedules.slice(0, index + 1),
            newRow,
            ...schedules.slice(index + 1),
        ];

        // ✅ recalculate from index + 2 (rows AFTER the new row)
        // using the iterative version so each row reads the correctly updated prev row
        const newSchedules = recalculateFromIndex(
            inserted,
            index + 2,
            recurringType,
        );

        const actualGross = newSchedules.reduce(
            (sum, s) => sum + parseFloat(s.gross_amount || 0),
            0,
        );
        const expectedGross = parseFloat(assignData?.payment?.total_cost ?? 0);

        if (actualGross > expectedGross) {
            setSchedules(newSchedules);
            setPendingRowIndex(index + 1);
            setShowExceedModal(true);
        } else {
            setSchedules(newSchedules);
        }
    };

    const handleDeleteRow = (index) => {
        setSchedules((prev) => {
            const isProject = assignData?.project !== null;
            const service = isProject
                ? assignData.project
                : assignData.subscription;
            const recurringType =
                service?.frequency ?? service?.type ?? "monthly";

            const filtered = prev.filter((_, i) => i !== index);
            return recalculateFromIndex(
                filtered,
                Math.max(1, index),
                recurringType,
            );
        });
    };

    const handleExceedProceed = () => {
        setShowExceedModal(false);
        setPendingRowIndex(null);
    };

    const handleExceedCancel = () => {
        if (pendingRowIndex !== null) {
            setSchedules((prev) =>
                prev.filter((_, i) => i !== pendingRowIndex),
            );
        }
        setShowExceedModal(false);
        setPendingRowIndex(null);
    };

    const fmt = (n) =>
        "₱" +
        new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(n);

    const tableHeaders = [
        "No.",
        "Due Date",
        "Start Coverage",
        "End Coverage",
        "Rate",
        "Base Amount",
        "VAT Amount",
        "Gross Amount",
        "Action",
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
                                Expected Gross Amount
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {fmt(assignData.payment?.total_cost)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                Actual Gross Amount
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
                                                    {index + 1}
                                                </td>
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
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <div className="relative flex justify-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rect =
                                                                    e.currentTarget.getBoundingClientRect();
                                                                const dropdownHeight = 65;
                                                                const spaceBelow =
                                                                    window.innerHeight -
                                                                    rect.bottom;
                                                                setDropdownPos({
                                                                    top:
                                                                        spaceBelow <
                                                                        dropdownHeight
                                                                            ? rect.top -
                                                                              dropdownHeight
                                                                            : rect.bottom,
                                                                    left: rect.right,
                                                                });
                                                                setEditingId(
                                                                    editingId ===
                                                                        `action-${s.id}`
                                                                        ? null
                                                                        : `action-${s.id}`,
                                                                );
                                                            }}
                                                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                            >
                                                                <circle
                                                                    cx="12"
                                                                    cy="5"
                                                                    r="1.5"
                                                                />
                                                                <circle
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="1.5"
                                                                />
                                                                <circle
                                                                    cx="12"
                                                                    cy="19"
                                                                    r="1.5"
                                                                />
                                                            </svg>
                                                        </button>

                                                        {editingId ===
                                                            `action-${s.id}` && (
                                                            <div
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                style={{
                                                                    position:
                                                                        "fixed",
                                                                    top: dropdownPos.top,
                                                                    left: dropdownPos.left,
                                                                    transform:
                                                                        "translateX(-100%)",
                                                                }}
                                                                className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-md min-w-[130px]"
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        handleAddRow(
                                                                            index,
                                                                        );
                                                                        setEditingId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                                >
                                                                    + Add Row
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleDeleteRow(
                                                                            index,
                                                                        );
                                                                        setEditingId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 cursor-pointer"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
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

            {showExceedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-yellow-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-base font-semibold text-gray-800">
                                Amount Exceeded
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">
                            You have exceeded the expected amount. Do you wish
                            to proceed?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleExceedCancel}
                                className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExceedProceed}
                                className="px-4 py-1.5 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 transition cursor-pointer"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
