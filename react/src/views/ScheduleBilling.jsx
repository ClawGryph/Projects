import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { calcVat } from "../utils/vatCalculator";

export default function ScheduleBilling() {
    const { id, clientsProjectId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [generated, setGenerated] = useState(false);
    const [assignData, setAssignData] = useState(null);
    const { setNotification } = useStateContext();
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [pendingRowIndex, setPendingRowIndex] = useState(null);
    const [showExceedModal, setShowExceedModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [editingField, setEditingField] = useState({});
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [preEditSchedules, setPreEditSchedules] = useState(null);
    const [isInvoiceGenerated, setIsInvoiceGenerated] = useState(false);
    const [saveCount, setSaveCount] = useState(0);
    const [showSaveWarningModal, setShowSaveWarningModal] = useState(false);
    const [adjustedAlreadyGenerated, setAdjustedAlreadyGenerated] =
        useState(false);

    useEffect(() => {
        axiosClient.get(`/clients/${id}`).then(({ data }) => {
            setClient(data);
        });

        axiosClient
            .get(`/clients/${id}/projects/${clientsProjectId}`)
            .then(({ data }) => {
                setAssignData(data);

                // check if schedules already exist for this payment
                const paymentId = data?.payment?.id;
                if (paymentId) {
                    axiosClient
                        .get(`/payments/${paymentId}/schedules`)
                        .then(({ data: scheduleData }) => {
                            const existing = scheduleData.data ?? scheduleData;
                            if (existing.length > 0) {
                                setSchedules(
                                    existing.map((s) => ({
                                        id: s.id,
                                        due_date: s.due_date,
                                        start_coverage: s.start_coverage,
                                        end_coverage: s.end_coverage,
                                        rate: s.payment_rate,
                                        base_amount: s.base_amount,
                                        vat_amount: s.vat_amount,
                                        gross_amount: s.total_amount,
                                        status: s.status,
                                    })),
                                );
                                setIsInvoiceGenerated(
                                    existing.length > 0 &&
                                        existing.every(
                                            (s) => s.is_invoice_generated,
                                        ),
                                );
                                setGenerated(true);
                                setHasChanges(false);

                                // If adjusted dates exist and a schedule already covers that adjusted start,
                                // disable the generate button right away
                                const adjustedStart =
                                    data?.subscription?.adjusted_start_coverage;
                                if (adjustedStart) {
                                    const alreadyCovered = existing.some(
                                        (s) =>
                                            new Date(
                                                s.start_coverage,
                                            ).toDateString() ===
                                            new Date(
                                                adjustedStart,
                                            ).toDateString(),
                                    );
                                    if (alreadyCovered) {
                                        setAdjustedAlreadyGenerated(true);
                                    }
                                }
                            }
                        })
                        .catch(() => {}); // silently ignore if no schedules yet
                }
            });
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setEditingId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const hasAdjustedDates =
        assignData?.subscription?.adjusted_start_coverage != null ||
        assignData?.subscription?.adjusted_end_coverage != null;

    const handleSaveChanges = () => {
        // If already saved once before, show warning first
        if (saveCount >= 1) {
            setShowSaveWarningModal(true);
            return;
        }
        executeSaveChanges();
    };

    const executeSaveChanges = () => {
        setShowSaveWarningModal(false);

        const isProject = assignData?.project !== null;
        const service = isProject
            ? assignData.project
            : assignData.subscription;

        const hardEndDate = isProject
            ? (service?.adjusted_end_date ?? service?.end_date)
            : (service?.adjusted_end_coverage ?? service?.end_coverage);

        // Validate dates against service end date
        if (hardEndDate) {
            const dateExceeded = schedules.some(
                (s) =>
                    s.start_coverage > hardEndDate ||
                    s.end_coverage > hardEndDate,
            );
            if (dateExceeded) {
                setNotification(
                    `One or more dates exceed the allowed end date (${hardEndDate}). Please correct them before saving.`,
                );
                return;
            }
        }

        const invalidRows = schedules.reduce((acc, s, i) => {
            const missing = [];
            if (!s.due_date) missing.push("Due Date");
            if (!s.start_coverage) missing.push("Start Coverage");
            if (!s.end_coverage) missing.push("End Coverage");
            if (
                s.base_amount === "" ||
                s.base_amount === null ||
                s.base_amount === undefined
            )
                missing.push("Base Amount");
            if (missing.length > 0) acc.push({ row: i + 1, missing });
            return acc;
        }, []);

        if (invalidRows.length > 0) {
            const messages = invalidRows
                .map((r) => `Row ${r.row}: ${r.missing.join(", ")}`)
                .join(" | ");
            setNotification(`Please fill in required fields — ${messages}`);
            return;
        }

        setSaving(true);
        const paymentId = assignData.payment.id;
        const payload = {
            schedules: schedules.map((s) => ({
                id: s.id ?? null,
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
            .put(`/payments/${paymentId}/schedules`, payload)
            .then(() => {
                setNotification("Schedule updated successfully.");
                setSaveCount((prev) => prev + 1);
                return axiosClient.get(`/payments/${paymentId}/schedules`);
            })
            .then(({ data }) => {
                const existing = data.data ?? data;
                const newTotalCost = existing.reduce(
                    (sum, s) => sum + parseFloat(s.total_amount || 0),
                    0,
                );

                setSchedules(
                    existing.map((s) => ({
                        id: s.id,
                        due_date: s.due_date,
                        start_coverage: s.start_coverage,
                        end_coverage: s.end_coverage,
                        rate: s.payment_rate,
                        base_amount: s.base_amount,
                        vat_amount: s.vat_amount,
                        gross_amount: s.total_amount,
                        status: s.status,
                    })),
                );
                setIsInvoiceGenerated(
                    existing.length > 0 &&
                        existing.every((s) => s.is_invoice_generated),
                );
                setAssignData((prev) => ({
                    ...prev,
                    payment: {
                        ...prev.payment,
                        number_of_cycles: existing.length,
                        total_cost: newTotalCost,
                    },
                }));
                setHasChanges(false);
            })
            .catch((err) => {
                const msg =
                    err.response?.data?.message ?? "Something went wrong.";
                setNotification(msg);
            })
            .finally(() => setSaving(false));
    };

    const handleGenerateInvoice = () => {
        setSaving(true);
        const paymentId = assignData.payment.id;

        axiosClient
            .post(`/payments/${paymentId}/schedules/generate-invoice`)
            .then(() => {
                setNotification("Invoice generated successfully.");
                setIsInvoiceGenerated(true);
                navigate("/payments");
            })
            .catch((err) => {
                const msg =
                    err.response?.data?.message ?? "Something went wrong.";
                setNotification(msg);
            })
            .finally(() => setSaving(false));
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString("en-CA");
    const fmtNumber = (n) =>
        n === "" || n === null || n === undefined
            ? ""
            : new Intl.NumberFormat("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              }).format(n);
    const parseNumber = (v) => parseFloat(v.replace(/,/g, "")) || 0;

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

    const updatePaymentCycles = (count) => {
        const paymentId = assignData.payment.id;
        axiosClient
            .patch(`/payments/${paymentId}`, { number_of_cycles: count })
            .catch((err) => console.error("Failed to update cycles:", err));
    };

    const recalculateFromIndex = (rows, fromIndex, recurringType) => {
        const result = [...rows];

        for (let i = fromIndex; i < result.length; i++) {
            if (i === 0) continue;

            const prevRow = result[i - 1];

            // Stop if previous row has no end_coverage
            if (!prevRow.end_coverage) break;

            // Stop if this row already has a real DB id (saved row) or is a blank new row
            if (
                result[i].id ||
                (!result[i].due_date && !result[i].start_coverage)
            ) {
                break;
            }

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
        setHasChanges(true);
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

    const getRawOrFormatted = (index, field, value) => {
        const key = `${index}-${field}`;
        return editingField[key] !== undefined
            ? editingField[key]
            : fmtNumber(value);
    };

    const checkExceedOnBlur = (updatedSchedules) => {
        const actualGross = updatedSchedules.reduce(
            (sum, s) => sum + parseFloat(s.gross_amount || 0),
            0,
        );
        const expectedGross = parseFloat(assignData?.payment?.total_cost ?? 0);
        if (actualGross > expectedGross) {
            setPreEditSchedules((snap) => snap); // already set before change
            setShowExceedModal(true);
        }
    };

    const handleAddRow = (index) => {
        setHasChanges(true);
        const ref = schedules[index];

        const isProject = assignData?.project !== null;
        const service = isProject
            ? assignData.project
            : assignData.subscription;
        const recurringType = service?.frequency ?? service?.type ?? "monthly";

        const newStartCoverage = new Date(ref.end_coverage);
        newStartCoverage.setDate(newStartCoverage.getDate() + 1);

        const newEndCoverage = new Date(
            addPeriod(newStartCoverage, recurringType),
        );
        newEndCoverage.setDate(newEndCoverage.getDate() - 1);

        const newDueDate = new Date(ref.end_coverage);
        newDueDate.setDate(newDueDate.getDate() + 1);

        const newRow = {
            id: null,
            _tempKey: `temp-${Date.now()}-${Math.random()}`,
            due_date: "",
            start_coverage: "",
            end_coverage: "",
            rate: "",
            base_amount: "",
            vat_amount: "",
            gross_amount: "",
        };

        const newSchedules = [
            ...schedules.slice(0, index + 1),
            newRow,
            ...schedules.slice(index + 1),
        ];

        setSchedules(newSchedules);
    };

    const handleDeleteRow = (index) => {
        setHasChanges(true);
        setSchedules((prev) => prev.filter((_, i) => i !== index));
    };

    const handleExceedProceed = () => {
        setPreEditSchedules(null);
        setShowExceedModal(false);
        setPendingRowIndex(null);
    };

    const handleExceedCancel = () => {
        if (preEditSchedules !== null) {
            setSchedules(preEditSchedules);
        }
        setPreEditSchedules(null);
        setShowExceedModal(false);
        setPendingRowIndex(null);
    };

    const handleGenerateAndSave = () => {
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
        const firstStart = isProject
            ? (service?.adjusted_start_date ?? service?.start_date)
            : (service?.adjusted_start_coverage ?? service?.start_coverage);

        if (!billingStartDate || numberOfCycles === 0) return;

        const existingCount = schedules.filter(
            (s) => s.id && typeof s.id === "number",
        ).length;
        const isRenewal = existingCount > 0 && hasAdjustedDates;

        let cyclesToGenerate = numberOfCycles;
        if (isRenewal) {
            const adjustedStart = new Date(
                service?.adjusted_start_coverage ??
                    service?.adjusted_start_date,
            );
            const adjustedEnd = new Date(
                service?.adjusted_end_coverage ?? service?.adjusted_end_date,
            );

            if (paymentType === "one_time") {
                cyclesToGenerate = 1;
            } else {
                let count = 0;
                let cursor = new Date(adjustedStart);
                while (cursor <= adjustedEnd) {
                    cursor = new Date(addPeriod(cursor, recurringType));
                    count++;
                }
                cyclesToGenerate = count;
            }
        }

        const effectiveCycles = isRenewal ? cyclesToGenerate : numberOfCycles;
        const equalRate =
            paymentType === "installment"
                ? parseFloat((100 / effectiveCycles).toFixed(2))
                : 100;

        const rows = [];
        let dueDate = new Date(billingStartDate);

        if (isRenewal && schedules.length > 0) {
            const lastExisting = schedules[schedules.length - 1];
            const lastEnd = new Date(lastExisting.end_coverage);
            lastEnd.setDate(lastEnd.getDate() + 1);
            dueDate = lastEnd;
        }

        for (let i = 0; i < cyclesToGenerate; i++) {
            const rate =
                paymentType === "installment" && i === effectiveCycles - 1
                    ? parseFloat(
                          (100 - equalRate * (effectiveCycles - 1)).toFixed(2),
                      )
                    : equalRate;
            const adjustedPrice = (price * rate) / 100;
            const { base_amount, vat_amount, total_amount } = calcVat(
                adjustedPrice,
                vatType,
            );

            let startCoverage, endCoverage;

            if (i === 0) {
                const firstStartDate = new Date(firstStart ?? dueDate);
                const firstEndDate = new Date(
                    addPeriod(firstStartDate, recurringType),
                );
                firstEndDate.setDate(firstEndDate.getDate() - 1);
                startCoverage = firstStart ?? fmtDate(dueDate);
                endCoverage = fmtDate(firstEndDate);
            } else {
                const prevEnd = new Date(rows[i - 1].end_coverage);
                const newStart = new Date(prevEnd);
                newStart.setDate(newStart.getDate() + 1);
                const newEnd = new Date(addPeriod(newStart, recurringType));
                newEnd.setDate(newEnd.getDate() - 1);
                startCoverage = fmtDate(newStart);
                endCoverage = fmtDate(newEnd);
            }

            if (isRenewal) {
                const adjustedEnd =
                    service?.adjusted_end_coverage ??
                    service?.adjusted_end_date;
                if (adjustedEnd && endCoverage > adjustedEnd) {
                    endCoverage = adjustedEnd;
                }
            }

            rows.push({
                due_date: fmtDate(dueDate),
                start_coverage: startCoverage,
                end_coverage: endCoverage,
                rate,
                base_amount,
                vat_amount,
                gross_amount: total_amount,
            });

            dueDate = new Date(rows[i].end_coverage);
            dueDate.setDate(dueDate.getDate() + 1);
        }

        setSaving(true);
        const paymentId = assignData.payment.id;
        const payload = {
            schedules: rows.map((s) => ({
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
            .then(({ data: postData }) => {
                if (postData.message === "No new schedules to add.") {
                    setNotification("No new schedules to add.");
                    return null;
                }
                setNotification("Billing schedule generated and saved.");
                return axiosClient.get(`/payments/${paymentId}/schedules`);
            })
            .then((res) => {
                if (!res) return;
                const { data: scheduleData } = res;
                const existing = scheduleData.data ?? scheduleData;
                const newTotalCost = existing.reduce(
                    (sum, s) => sum + parseFloat(s.total_amount || 0),
                    0,
                );
                setSchedules(
                    existing.map((s) => ({
                        id: s.id,
                        due_date: s.due_date,
                        start_coverage: s.start_coverage,
                        end_coverage: s.end_coverage,
                        rate: s.payment_rate,
                        base_amount: s.base_amount,
                        vat_amount: s.vat_amount,
                        gross_amount: s.total_amount,
                        status: s.status,
                    })),
                );
                setAssignData((prev) => ({
                    ...prev,
                    payment: {
                        ...prev.payment,
                        number_of_cycles: existing.length,
                        total_cost: newTotalCost,
                    },
                }));
                setIsInvoiceGenerated(
                    existing.length > 0 &&
                        existing.every((s) => s.is_invoice_generated),
                );
                setGenerated(true);
                setHasChanges(false);
                if (isRenewal) {
                    setAdjustedAlreadyGenerated(true);
                }
            })
            .catch((err) => {
                const msg =
                    err.response?.data?.message ?? "Something went wrong.";
                setNotification(msg);
            })
            .finally(() => setSaving(false));
    };

    const existingSchedules = schedules.filter(
        (s) => s.id && typeof s.id === "number" && s.id > 100,
    );

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
                    to={`/clients/${id}/dashboard`}
                    className="text-gray-500 hover:text-cyan-700 hover:underline transition"
                >
                    Dashboard
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
                        ? `${assignData.project?.title ?? assignData.subscription?.title}`
                        : "Billing Schedule"}
                </h1>
                <button
                    onClick={handleGenerateAndSave}
                    disabled={
                        !assignData ||
                        saving ||
                        (generated && !hasAdjustedDates) ||
                        (generated &&
                            hasAdjustedDates &&
                            adjustedAlreadyGenerated)
                    }
                    className={`flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                        !assignData ||
                        saving ||
                        (generated && !hasAdjustedDates) ||
                        (generated &&
                            hasAdjustedDates &&
                            adjustedAlreadyGenerated)
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-sky-400 hover:bg-sky-500 cursor-pointer"
                    }`}
                >
                    {saving
                        ? "Generating..."
                        : (generated && !hasAdjustedDates) ||
                            (generated &&
                                hasAdjustedDates &&
                                adjustedAlreadyGenerated)
                          ? "Already Generated"
                          : "Generate Billing Schedule"}
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
                                {schedules.length ||
                                    (assignData.payment?.number_of_cycles ??
                                        "—")}
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
                    <div className="px-5 mb-3 flex justify-end gap-2">
                        {/* Save Changes button — only shown when user edits existing schedule */}
                        {hasChanges && (
                            <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className={`flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                                    saving
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
                                }`}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        )}

                        {/* Generate Invoice button */}
                        <button
                            onClick={handleGenerateInvoice}
                            disabled={
                                saving || hasChanges || isInvoiceGenerated
                            }
                            className={`flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                                saving || hasChanges || isInvoiceGenerated
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-sky-400 hover:bg-sky-500 cursor-pointer"
                            }`}
                        >
                            {isInvoiceGenerated
                                ? "Invoices Generated"
                                : "Generate Invoices"}
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
                                                key={s._tempKey ?? s.id}
                                                className={`text-center ${s.status === "paid" ? "bg-green-50" : "hover:bg-cyan-50"}`}
                                            >
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {index + 1}
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="date"
                                                        value={s.due_date}
                                                        disabled={
                                                            s.status === "paid"
                                                        }
                                                        onChange={(e) =>
                                                            s.status !==
                                                                "paid" &&
                                                            handleScheduleChange(
                                                                index,
                                                                "due_date",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                            s.status === "paid"
                                                                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                                                : ""
                                                        }`}
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="date"
                                                        value={s.start_coverage}
                                                        disabled={
                                                            s.status === "paid"
                                                        }
                                                        onChange={(e) =>
                                                            s.status !==
                                                                "paid" &&
                                                            handleScheduleChange(
                                                                index,
                                                                "start_coverage",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                            s.status === "paid"
                                                                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                                                : ""
                                                        }`}
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="date"
                                                        value={s.end_coverage}
                                                        disabled={
                                                            s.status === "paid"
                                                        }
                                                        onChange={(e) =>
                                                            s.status !==
                                                                "paid" &&
                                                            handleScheduleChange(
                                                                index,
                                                                "end_coverage",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                            s.status === "paid"
                                                                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                                                : ""
                                                        }`}
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={s.rate}
                                                        disabled={
                                                            s.status === "paid"
                                                        }
                                                        onChange={(e) =>
                                                            s.status !==
                                                                "paid" &&
                                                            handleScheduleChange(
                                                                index,
                                                                "rate",
                                                                e.target.value,
                                                            )
                                                        }
                                                        onFocus={() =>
                                                            setPreEditSchedules(
                                                                schedules,
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            setSchedules(
                                                                (current) => {
                                                                    checkExceedOnBlur(
                                                                        current,
                                                                    );
                                                                    return current;
                                                                },
                                                            );
                                                        }}
                                                        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                            s.status === "paid"
                                                                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                                                : ""
                                                        }`}
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            editingField[
                                                                `${index}-base_amount`
                                                            ] !== undefined
                                                                ? editingField[
                                                                      `${index}-base_amount`
                                                                  ]
                                                                : fmtNumber(
                                                                      s.base_amount,
                                                                  )
                                                        }
                                                        disabled={
                                                            s.status === "paid"
                                                        }
                                                        onFocus={() => {
                                                            const key = `${index}-base_amount`;
                                                            setPreEditSchedules(
                                                                schedules,
                                                            );
                                                            setEditingField(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [key]:
                                                                        s.base_amount ??
                                                                        "",
                                                                }),
                                                            );
                                                        }}
                                                        onChange={(e) => {
                                                            const key = `${index}-base_amount`;
                                                            const raw =
                                                                e.target.value.replace(
                                                                    /[^0-9.]/g,
                                                                    "",
                                                                );
                                                            s.status !==
                                                                "paid" &&
                                                                setEditingField(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [key]: raw,
                                                                    }),
                                                                );
                                                        }}
                                                        onBlur={(e) => {
                                                            const key = `${index}-base_amount`;
                                                            const parsed =
                                                                parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ) || 0;
                                                            const vat =
                                                                parseFloat(
                                                                    s.vat_amount,
                                                                ) || 0;
                                                            const newGross =
                                                                parseFloat(
                                                                    (
                                                                        parsed +
                                                                        vat
                                                                    ).toFixed(
                                                                        2,
                                                                    ),
                                                                );

                                                            setSchedules(
                                                                (prev) => {
                                                                    const updated =
                                                                        prev.map(
                                                                            (
                                                                                row,
                                                                                i,
                                                                            ) =>
                                                                                i ===
                                                                                index
                                                                                    ? {
                                                                                          ...row,
                                                                                          base_amount:
                                                                                              parsed,
                                                                                          gross_amount:
                                                                                              newGross,
                                                                                      }
                                                                                    : row,
                                                                        );
                                                                    checkExceedOnBlur(
                                                                        updated,
                                                                    );
                                                                    return updated;
                                                                },
                                                            );
                                                            setEditingField(
                                                                (prev) => {
                                                                    const next =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete next[
                                                                        key
                                                                    ];
                                                                    return next;
                                                                },
                                                            );
                                                            setHasChanges(true);
                                                        }}
                                                        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                            s.status === "paid"
                                                                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                                                : ""
                                                        }`}
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={fmtNumber(
                                                            s.vat_amount,
                                                        )}
                                                        disabled={
                                                            s.status === "paid"
                                                        }
                                                        onFocus={() =>
                                                            setPreEditSchedules(
                                                                schedules,
                                                            )
                                                        }
                                                        onChange={(e) =>
                                                            s.status !==
                                                                "paid" &&
                                                            handleScheduleChange(
                                                                index,
                                                                "vat_amount",
                                                                parseNumber(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            setSchedules(
                                                                (current) => {
                                                                    checkExceedOnBlur(
                                                                        current,
                                                                    );
                                                                    return current;
                                                                },
                                                            );
                                                        }}
                                                        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                            s.status === "paid"
                                                                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                                                : ""
                                                        }`}
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={fmtNumber(
                                                            s.gross_amount,
                                                        )}
                                                        disabled={
                                                            s.status === "paid"
                                                        }
                                                        onFocus={() =>
                                                            setPreEditSchedules(
                                                                schedules,
                                                            )
                                                        }
                                                        onChange={(e) =>
                                                            s.status !==
                                                                "paid" &&
                                                            handleScheduleChange(
                                                                index,
                                                                "gross_amount",
                                                                parseNumber(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            setSchedules(
                                                                (current) => {
                                                                    checkExceedOnBlur(
                                                                        current,
                                                                    );
                                                                    return current;
                                                                },
                                                            );
                                                        }}
                                                        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                            s.status === "paid"
                                                                ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                                                : ""
                                                        }`}
                                                    />
                                                </td>
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {s.status !== "paid" && (
                                                        <div className="relative flex justify-center">
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    const rect =
                                                                        e.currentTarget.getBoundingClientRect();
                                                                    const dropdownHeight = 65;
                                                                    const spaceBelow =
                                                                        window.innerHeight -
                                                                        rect.bottom;
                                                                    setDropdownPos(
                                                                        {
                                                                            top:
                                                                                spaceBelow <
                                                                                dropdownHeight
                                                                                    ? rect.top -
                                                                                      dropdownHeight
                                                                                    : rect.bottom,
                                                                            left: rect.right,
                                                                        },
                                                                    );
                                                                    setEditingId(
                                                                        editingId ===
                                                                            `action-${s._tempKey ?? s.id}`
                                                                            ? null
                                                                            : `action-${s._tempKey ?? s.id}`,
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
                                                                `action-${s._tempKey ?? s.id}` && (
                                                                <div
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
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
                                                                        + Add
                                                                        Row
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
                                                    )}
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

            {showSaveWarningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-orange-500"
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
                                Schedule Already Updated
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">
                            You have already changed the payment schedule once.
                            Do you still wish to update it?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowSaveWarningModal(false)}
                                className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeSaveChanges}
                                className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition cursor-pointer"
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
