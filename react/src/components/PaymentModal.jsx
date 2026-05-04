import { useState, useEffect, useRef } from "react";
import axiosClient from "../axios-client.js";
import { useStateContext } from "../context/ContextProvider.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

/**
 * PaymentModal
 *
 * Props:
 *  - isOpen    : boolean
 *  - onClose   : () => void
 *  - onSuccess : () => void  — called after a successful assignment
 *  - mode      : "project" | "subscription"
 */

// ── Sub-components ───────────────────────────────────────────────────
const FloatField = ({ label, children }) => (
    <div className="relative w-full mb-2">
        {children}
        <label className="absolute left-3 top-1 text-cyan-800 text-xs pointer-events-none">
            {label}
        </label>
    </div>
);

const ReadonlyInput = ({ label, value }) => (
    <FloatField label={label}>
        <input
            type="text"
            readOnly
            value={value}
            className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 bg-gray-50 text-gray-700 text-sm cursor-not-allowed focus:outline-none"
        />
    </FloatField>
);

export default function PaymentModal({
    isOpen,
    onClose,
    onSuccess,
    mode,
    editData,
    renewData,
}) {
    const { setNotification } = useStateContext();

    // ── Client autocomplete ──────────────────────────────────────────────
    const [clientInput, setClientInput] = useState("");
    const [allClients, setAllClients] = useState([]);
    const [clientSuggestions, setClientSuggestions] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef(null);
    const clientInputRef = useRef(null);

    // ── Service list (projects or subscriptions) ─────────────────────────
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState("");

    // ── Payment shared ───────────────────────────────────────────────────
    const [paymentType, setPaymentType] = useState("");
    const [vatType, setVatType] = useState("vat_exempt");

    // ── Installment ──────────────────────────────────────────────────────
    const [installmentMonths, setInstallmentMonths] = useState("");
    const [installmentSchedule, setInstallmentSchedule] = useState([]);

    // ── Recurring (subscription only) ────────────────────────────────────
    const [recurringType, setRecurringType] = useState("");
    const [recurringCycles, setRecurringCycles] = useState("");
    const [recurringRate, setRecurringRate] = useState("");

    // ── Misc ─────────────────────────────────────────────────────────────
    const [company, setCompany] = useState(null);
    const [errors, setErrors] = useState(null);

    const isProject = mode === "project";
    const isEditing = !!editData;

    const [adjustedStartCoverage, setAdjustedStartCoverage] = useState("");
    const [adjustedEndCoverage, setAdjustedEndCoverage] = useState("");
    const [crNo, setCrNo] = useState("");

    // ── Fetch on open ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        resetForm();

        axiosClient
            .get("/clients")
            .then(({ data }) => setAllClients(data.data ?? []))
            .catch(() => {});
        axiosClient
            .get("/company")
            .then(({ data }) => setCompany(data))
            .catch(() => {});

        axiosClient
            .get(isProject ? "/projects" : "/subscriptions")
            .then(({ data }) => {
                setServices(data.data ?? []);

                // Pre-fill if editing
                if (editData) {
                    const service = isProject
                        ? editData.project
                        : editData.subscription;
                    const payment = editData.payment;

                    setClientInput(editData.client?.name ?? "");
                    setSelectedClient(editData.client ?? null);
                    setSelectedService(String(service?.id ?? ""));
                    setPaymentType(payment?.payment_type ?? "");
                    setVatType(editData.vat_type ?? "vat_exempt");

                    if (payment?.payment_type === "recurring") {
                        setRecurringType(payment?.recurring_type ?? "");
                    }

                    if (payment?.payment_type === "installment") {
                        setInstallmentMonths(payment?.number_of_cycles ?? "");
                        // rebuild schedule from payment_schedules
                        const schedules = editData.payment_schedules ?? [];
                        setInstallmentSchedule(
                            schedules.map((s) => ({
                                id: s.id,
                                due_date: s.due_date ?? "",
                                payment_rate: s.payment_rate ?? "",
                            })),
                        );
                    }
                }

                if (renewData && !editData) {
                    const service = renewData.subscription;
                    setClientInput(renewData.client?.name ?? "");
                    setSelectedClient(renewData.client ?? null);
                    setSelectedService(String(service?.id ?? ""));
                    setPaymentType("recurring");
                    setVatType(renewData.vat_type ?? "vat_exempt");
                    setRecurringType(service?.type ?? "");
                }
            })
            .catch(() => {});
    }, [isOpen, mode]);

    // ── Close suggestions on outside click ──────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target) &&
                clientInputRef.current &&
                !clientInputRef.current.contains(e.target)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Autofill recurring type from subscription ────────────────────────
    useEffect(() => {
        if (!isProject && selectedService && paymentType === "recurring") {
            const subscription = services.find(
                (s) => String(s.id) === String(selectedService),
            );
            if (subscription?.type) {
                setRecurringType(subscription.type);
            }
        }
    }, [selectedService, paymentType]);

    // ── Auto-fill adjusted coverage dates on renew ───────────────────
    useEffect(() => {
        if (!renewData || editData) return;
        if (adjustedStartCoverage || adjustedEndCoverage) return; // don't overwrite if already set

        const prevEndDate = renewData.subscription?.end_coverage;
        if (!prevEndDate || !recurringType) return;

        const start = new Date(prevEndDate);
        start.setDate(start.getDate() + 1); // start the day after the last coverage ends

        const end = new Date(start);
        if (recurringType === "weekly") {
            end.setDate(end.getDate() + 6);
        } else if (recurringType === "monthly") {
            end.setMonth(end.getMonth() + 1);
            end.setDate(end.getDate() - 1);
        } else if (recurringType === "yearly") {
            end.setFullYear(end.getFullYear() + 1);
            end.setDate(end.getDate() - 1);
        }

        const fmt = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD
        setAdjustedStartCoverage(fmt(start));
        setAdjustedEndCoverage(fmt(end));
    }, [renewData, recurringType]);

    // ── Helpers ──────────────────────────────────────────────────────────
    const resetForm = () => {
        setClientInput("");
        setSelectedClient(null);
        setClientSuggestions([]);
        setShowSuggestions(false);
        setSelectedService("");
        setPaymentType("");
        setVatType("vat_exempt");
        setInstallmentMonths("");
        setInstallmentSchedule([]);
        setRecurringType("");
        setRecurringCycles("");
        setRecurringRate("");
        setErrors(null);
        setAdjustedStartCoverage("");
        setAdjustedEndCoverage("");
        setCrNo("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isNonVat = company?.vat_type === "non_vat";
    const vatRate = company?.vat_type === "vat_registered" ? 0.12 : 0;
    const vatMultiplier = 1 + vatRate;
    const isVatIncluded = vatType === "vat_inclusive";
    const includeVat = vatType === "vat_exclusive";
    const showVatLine = isVatIncluded || includeVat;

    const selectedServiceData = services.find(
        (s) => String(s.id) === String(selectedService),
    );
    const basePrice = isProject
        ? (selectedServiceData?.price ?? 0)
        : (selectedServiceData?.cost ?? 0);

    const displayPrice = isVatIncluded
        ? basePrice
        : includeVat
          ? basePrice * vatMultiplier
          : basePrice;

    const vatAmount = isVatIncluded
        ? basePrice - basePrice / vatMultiplier
        : includeVat
          ? basePrice * vatRate
          : 0;

    const fmt = (n) =>
        "₱" +
        new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(n);

    const getRecurringCycleLabel = () => {
        if (recurringType === "weekly") return "Number of weeks";
        if (recurringType === "monthly") return "Number of months";
        if (recurringType === "yearly") return "Number of years";
        return "Number of cycles";
    };

    const today = new Date().toLocaleDateString("en-CA");

    // ── Client autocomplete handlers ─────────────────────────────────────
    const handleClientInput = (value) => {
        setClientInput(value);
        setSelectedClient(null);
        if (!value.trim()) {
            setClientSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const filtered = allClients
            .filter((c) => c.name.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 6);
        setClientSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    };

    const handleSelectClient = (client) => {
        setClientInput(client.name);
        setSelectedClient(client);
        setClientSuggestions([]);
        setShowSuggestions(false);
    };

    // ── Installment schedule builder ─────────────────────────────────────
    const handleInstallmentMonths = (val) => {
        const months = parseInt(val) || 0;
        setInstallmentMonths(months);
        if (months > 0) {
            const todayIso = new Date().toISOString().split("T")[0];
            setInstallmentSchedule((prev) => {
                const existing = prev.slice(0, months);
                const newRows = Array.from(
                    { length: Math.max(0, months - prev.length) },
                    (_, i) => ({
                        due_date: i === 0 && prev.length === 0 ? todayIso : "",
                        payment_rate: "",
                    }),
                );
                return [...existing, ...newRows];
            });
        } else {
            setInstallmentSchedule([]);
        }
    };

    const updateScheduleItem = (index, field, value) => {
        setInstallmentSchedule((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    // ── Submit ───────────────────────────────────────────────────────────
    const handleSubmit = () => {
        setErrors(null);

        if (!selectedClient) {
            setErrors({ general: ["Please select a client."] });
            return;
        }
        if (!selectedService) {
            setErrors({
                general: [
                    `Please select a ${isProject ? "project" : "subscription"}.`,
                ],
            });
            return;
        }
        if (!paymentType) {
            setErrors({ general: ["Please select a payment type."] });
            return;
        }
        if (paymentType === "recurring" && !recurringType) {
            setErrors({ general: ["Please select a recurring type."] });
            return;
        }
        if (paymentType === "installment" && !installmentMonths) {
            setErrors({
                general: ["Please enter the number of installment months."],
            });
            return;
        }

        const endpoint = isEditing
            ? `/clients/${editData.client.id}/assign/${editData.id}`
            : `/clients/${selectedClient.id}/assign`;

        const method = isEditing ? "patch" : "post";

        const payload = isEditing
            ? {
                  vat_type: vatType,
                  final_price: basePrice,
                  number_of_cycles: installmentMonths || null,
                  installment_schedule:
                      installmentSchedule.length > 0
                          ? installmentSchedule.map((item) => ({
                                id: item.id ?? null, // existing rows have id, new ones don't
                                due_date: item.due_date,
                                payment_rate: item.payment_rate,
                            }))
                          : null,
              }
            : isProject
              ? {
                    project_id: selectedService,
                    payment_type: paymentType,
                    number_of_cycles:
                        paymentType === "installment"
                            ? installmentMonths
                            : null,
                    installment_schedule:
                        paymentType === "installment"
                            ? installmentSchedule
                            : null,
                    start_date: today,
                    final_price: basePrice,
                    vat_type: vatType,
                }
              : {
                    subscription_id: selectedService,
                    payment_type: "recurring",
                    recurring_type: recurringType,
                    start_date: today,
                    final_price: basePrice,
                    vat_type: vatType,
                    ...(renewData && {
                        is_renewal: true,
                        adjusted_start_coverage: adjustedStartCoverage || null,
                        adjusted_end_coverage: adjustedEndCoverage || null,
                        cr_no: crNo || null,
                    }),
                };

        axiosClient[method](endpoint, payload)
            .then(() => {
                setNotification(
                    isEditing
                        ? "Service updated successfully."
                        : isProject
                          ? "Project assigned successfully."
                          : "Subscription assigned successfully.",
                );
                handleClose();
                if (onSuccess) onSuccess();
            })
            .catch((err) => {
                const response = err.response;
                if (!response) return;
                if (response.status === 422) {
                    setErrors(
                        response.data.errors ?? {
                            general: [response.data.message],
                        },
                    );
                }
            });
    };

    const inputCls =
        "block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500";
    const selectCls =
        "block w-full border border-gray-300 rounded-md pl-2 pr-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">
                        {renewData && !editData
                            ? "Renew Subscription"
                            : isEditing
                              ? isProject
                                  ? "Edit Project"
                                  : "Edit Subscription"
                              : isProject
                                ? "Assign Project"
                                : "Assign Subscription"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-1">
                    {/* Validation errors */}
                    {errors && (
                        <div className="px-4 py-3 mb-3 rounded-md text-white bg-red-500 text-sm">
                            {Object.keys(errors).map((key) => (
                                <p key={key}>{errors[key][0]}</p>
                            ))}
                        </div>
                    )}

                    {/* ── CLIENT AUTOCOMPLETE ────────────────────────── */}
                    <div className="relative w-full mb-2">
                        <FloatField label="Client Name">
                            <input
                                ref={clientInputRef}
                                type="text"
                                value={clientInput}
                                onChange={(e) =>
                                    !isEditing &&
                                    !renewData &&
                                    handleClientInput(e.target.value)
                                }
                                readOnly={isEditing || !!renewData}
                                placeholder="Enter client..."
                                className={
                                    inputCls +
                                    (isEditing || renewData
                                        ? " bg-gray-50 cursor-not-allowed"
                                        : "")
                                }
                                autoComplete="off"
                            />
                        </FloatField>
                        {showSuggestions && (
                            <ul
                                ref={suggestionsRef}
                                className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-0.5 max-h-48 overflow-y-auto"
                            >
                                {clientSuggestions.map((client) => (
                                    <li
                                        key={client.id}
                                        onMouseDown={() =>
                                            handleSelectClient(client)
                                        }
                                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-900 cursor-pointer"
                                    >
                                        <span className="font-medium">
                                            {client.name}
                                        </span>
                                        {client.company_type && (
                                            <span className="ml-2 text-xs text-gray-400">
                                                {client.company_type}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* ── SERVICE DROPDOWN ───────────────────────────── */}
                    <FloatField label={isProject ? "Project" : "Subscription"}>
                        <select
                            value={selectedService}
                            onChange={(e) =>
                                !isEditing &&
                                !renewData &&
                                setSelectedService(e.target.value)
                            }
                            disabled={isEditing || !!renewData}
                            className={
                                selectCls +
                                (isEditing || renewData
                                    ? " bg-gray-50 cursor-not-allowed"
                                    : "")
                            }
                        >
                            <option value="">
                                {isProject
                                    ? "Select a project"
                                    : "Select a subscription"}
                            </option>
                            {services.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    </FloatField>

                    {/* ── PAYMENT TYPE ───────────────────────────────── */}
                    <FloatField label="Payment Type">
                        <select
                            value={paymentType}
                            onChange={(e) => {
                                if (isEditing || renewData) return;
                                setPaymentType(e.target.value);
                                if (isProject) setRecurringType("");
                                setInstallmentMonths("");
                                setInstallmentSchedule([]);
                            }}
                            disabled={isEditing || !!renewData}
                            className={
                                selectCls +
                                (isEditing || renewData
                                    ? " bg-gray-50 cursor-not-allowed"
                                    : "")
                            }
                        >
                            <option value="" disabled>
                                Select payment type
                            </option>
                            {isProject ? (
                                <>
                                    <option value="one_time">One Time</option>
                                    <option value="installment">
                                        Installment
                                    </option>
                                </>
                            ) : (
                                <option value="recurring">Recurring</option>
                            )}
                        </select>
                    </FloatField>

                    {/* ── VAT + PRICE BLOCK ──────────────────────────── */}
                    {paymentType && (
                        <>
                            <div className="flex gap-2">
                                <ReadonlyInput
                                    label="Original Price"
                                    value={fmt(basePrice)}
                                />
                                {!isNonVat && (
                                    <FloatField label="VAT Type">
                                        <select
                                            value={vatType}
                                            onChange={(e) =>
                                                setVatType(e.target.value)
                                            }
                                            className={selectCls}
                                        >
                                            <option value="vat_exempt">
                                                VAT Exempt
                                            </option>
                                            <option value="vat_exclusive">
                                                VAT Exclusive
                                            </option>
                                            <option value="vat_inclusive">
                                                VAT Inclusive
                                            </option>
                                        </select>
                                    </FloatField>
                                )}
                            </div>

                            {!isNonVat && showVatLine && (
                                <ReadonlyInput
                                    label={
                                        isVatIncluded
                                            ? `VAT Inclusive (${vatRate * 100}%)`
                                            : `VAT Exclusive (${vatRate * 100}%)`
                                    }
                                    value={fmt(vatAmount)}
                                />
                            )}

                            {selectedService && (
                                <ReadonlyInput
                                    label={`Total Price (${vatType === "vat_inclusive" ? "VAT Inclusive" : vatType === "vat_exclusive" ? `VAT Exclusive ${vatRate * 100}%` : "VAT Exempt"})`}
                                    value={fmt(displayPrice)}
                                />
                            )}
                        </>
                    )}

                    {/* ── RECURRING FIELDS (subscription only) ──────── */}
                    {paymentType === "recurring" && (
                        <>
                            <FloatField label="Recurring Type">
                                <select
                                    value={recurringType}
                                    onChange={(e) => {
                                        setRecurringType(e.target.value);
                                    }}
                                    disabled={!isProject && !!selectedService}
                                    className={
                                        selectCls +
                                        (!isProject && selectedService
                                            ? " bg-gray-50 cursor-not-allowed"
                                            : "")
                                    }
                                >
                                    <option value="" disabled>
                                        Select recurring type
                                    </option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </FloatField>
                        </>
                    )}

                    {/* ── ADJUSTED COVERAGE (renew only) ───────────────── */}
                    {renewData && !editData && (
                        <div className="border-t pt-4 mt-2">
                            <h3 className="text-xs font-semibold text-cyan-800 uppercase tracking-wider mb-4">
                                Adjustments & Reference
                            </h3>
                            <div className="space-y-4 rounded-xl p-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                        Adjusted Start Coverage
                                    </label>
                                    <input
                                        type="date"
                                        value={adjustedStartCoverage}
                                        onChange={(e) =>
                                            setAdjustedStartCoverage(
                                                e.target.value,
                                            )
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                        Adjusted End Coverage
                                    </label>
                                    <input
                                        type="date"
                                        value={adjustedEndCoverage}
                                        onChange={(e) =>
                                            setAdjustedEndCoverage(
                                                e.target.value,
                                            )
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                        CR No.
                                    </label>
                                    <input
                                        type="text"
                                        value={crNo}
                                        onChange={(e) =>
                                            setCrNo(e.target.value)
                                        }
                                        placeholder="Enter CR number..."
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── INSTALLMENT FIELDS (project only) ─────────── */}
                    {paymentType === "installment" && (
                        <FloatField label="Number of months">
                            <input
                                type="number"
                                placeholder="0"
                                value={installmentMonths}
                                onChange={(e) =>
                                    handleInstallmentMonths(e.target.value)
                                }
                                className={inputCls}
                            />
                        </FloatField>
                    )}

                    {installmentSchedule.length > 0 && (
                        <>
                            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                                {installmentSchedule.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <FloatField
                                            label={
                                                index === 0
                                                    ? "First Payment"
                                                    : "Next due date"
                                            }
                                        >
                                            <input
                                                type="date"
                                                value={item.due_date}
                                                onChange={(e) =>
                                                    updateScheduleItem(
                                                        index,
                                                        "due_date",
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputCls}
                                            />
                                        </FloatField>
                                        <FloatField label="Rate">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={item.payment_rate}
                                                onChange={(e) =>
                                                    updateScheduleItem(
                                                        index,
                                                        "payment_rate",
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputCls + " pr-8"}
                                            />
                                            <span className="absolute right-3 top-1/2 translate-y-0.5 text-gray-500 text-sm pointer-events-none">
                                                %
                                            </span>
                                        </FloatField>
                                        <ReadonlyInput
                                            label="Amount"
                                            value={
                                                item.payment_rate &&
                                                displayPrice
                                                    ? fmt(
                                                          (item.payment_rate /
                                                              100) *
                                                              basePrice,
                                                      )
                                                    : "₱0.00"
                                            }
                                        />
                                        {showVatLine && (
                                            <ReadonlyInput
                                                label={
                                                    isVatIncluded
                                                        ? "VAT Included"
                                                        : "VAT (12%)"
                                                }
                                                value={
                                                    item.payment_rate &&
                                                    displayPrice
                                                        ? fmt(
                                                              isVatIncluded
                                                                  ? (item.payment_rate /
                                                                        100) *
                                                                        displayPrice -
                                                                        ((item.payment_rate /
                                                                            100) *
                                                                            displayPrice) /
                                                                            vatMultiplier
                                                                  : (item.payment_rate /
                                                                        100) *
                                                                        basePrice *
                                                                        vatRate,
                                                          )
                                                        : "₱0.00"
                                                }
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Installment totals summary */}
                            <div className="border-t border-gray-200 pt-3 mt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        Total Rate:
                                    </span>
                                    <span className="font-semibold text-gray-800">
                                        {installmentSchedule
                                            .reduce(
                                                (sum, item) =>
                                                    sum +
                                                    (parseFloat(
                                                        item.payment_rate,
                                                    ) || 0),
                                                0,
                                            )
                                            .toFixed(2)}
                                        %
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        Sub-Total:
                                    </span>
                                    <span className="font-semibold text-cyan-800">
                                        {fmt(
                                            installmentSchedule.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    ((parseFloat(
                                                        item.payment_rate,
                                                    ) || 0) /
                                                        100) *
                                                        basePrice,
                                                0,
                                            ),
                                        )}
                                    </span>
                                </div>
                                {showVatLine && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Total VAT{" "}
                                                {isVatIncluded
                                                    ? "(Included)"
                                                    : "(12%)"}
                                                :
                                            </span>
                                            <span className="font-semibold text-cyan-700">
                                                {fmt(
                                                    installmentSchedule.reduce(
                                                        (sum, item) => {
                                                            const rate =
                                                                parseFloat(
                                                                    item.payment_rate,
                                                                ) || 0;
                                                            const itemAmt =
                                                                (rate / 100) *
                                                                displayPrice;
                                                            return (
                                                                sum +
                                                                (isVatIncluded
                                                                    ? itemAmt -
                                                                      itemAmt /
                                                                          vatMultiplier
                                                                    : (rate /
                                                                          100) *
                                                                      basePrice *
                                                                      vatRate)
                                                            );
                                                        },
                                                        0,
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Total Amount:
                                            </span>
                                            <span className="font-semibold text-cyan-900">
                                                {fmt(
                                                    (() => {
                                                        const totalAmt =
                                                            installmentSchedule.reduce(
                                                                (sum, item) =>
                                                                    sum +
                                                                    ((parseFloat(
                                                                        item.payment_rate,
                                                                    ) || 0) /
                                                                        100) *
                                                                        basePrice,
                                                                0,
                                                            );
                                                        const totalVat =
                                                            installmentSchedule.reduce(
                                                                (sum, item) => {
                                                                    const rate =
                                                                        parseFloat(
                                                                            item.payment_rate,
                                                                        ) || 0;
                                                                    const itemAmt =
                                                                        (rate /
                                                                            100) *
                                                                        displayPrice;
                                                                    return (
                                                                        sum +
                                                                        (isVatIncluded
                                                                            ? itemAmt -
                                                                              itemAmt /
                                                                                  vatMultiplier
                                                                            : (rate /
                                                                                  100) *
                                                                              basePrice *
                                                                              vatRate)
                                                                    );
                                                                },
                                                                0,
                                                            );
                                                        return isVatIncluded
                                                            ? totalAmt
                                                            : totalAmt +
                                                                  totalVat;
                                                    })(),
                                                )}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {(() => {
                                    const totalRate =
                                        installmentSchedule.reduce(
                                            (sum, item) =>
                                                sum +
                                                (parseFloat(
                                                    item.payment_rate,
                                                ) || 0),
                                            0,
                                        );
                                    const remaining =
                                        displayPrice -
                                        (totalRate / 100) * displayPrice;
                                    return remaining !== 0 ? (
                                        <div className="flex justify-between text-sm">
                                            <span
                                                className={`font-medium ${remaining > 0 ? "text-orange-500" : "text-red-500"}`}
                                            >
                                                {remaining > 0
                                                    ? "Remaining:"
                                                    : "Exceeded by:"}
                                            </span>
                                            <span
                                                className={`font-semibold ${remaining > 0 ? "text-orange-500" : "text-red-500"}`}
                                            >
                                                {fmt(Math.abs(remaining))}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-emerald-600">
                                                Fully allocated
                                            </span>
                                            <span className="font-semibold text-emerald-600">
                                                ✓
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm rounded-md bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors cursor-pointer"
                    >
                        {renewData && !editData
                            ? "Renew Subscription"
                            : isEditing
                              ? "Save Changes"
                              : isProject
                                ? "Assign Project"
                                : "Assign Subscription"}
                    </button>
                </div>
            </div>
        </div>
    );
}
