import { useState, useEffect } from "react";
import axiosClient from "../axios-client.js";
import { useStateContext } from "../context/ContextProvider.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { calcVat } from "../utils/vatCalculator";

/**
 * AssignServiceModal
 *
 * Props:
 *  - isOpen    : boolean
 *  - onClose   : () => void
 *  - onSuccess : () => void  — called after a successful assignment
 *  - mode      : "project" | "subscription"
 *  - editData  : object | null
 *  - renewData : object | null
 *  - clientId  : number | string
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
            value={value ?? "—"}
            className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 bg-gray-50 text-gray-700 text-sm cursor-not-allowed focus:outline-none"
        />
    </FloatField>
);

// ── Cycle calculator ─────────────────────────────────────────────────
const calcCycles = (startDate, endDate, paymentType, recurringType) => {
    if (!startDate || !endDate) return "—";

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end < start) return "—";

    if (paymentType === "one_time") return 1;

    const totalMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;

    switch (recurringType) {
        case "monthly":
            return totalMonths > 0 ? totalMonths : "—";
        case "quarterly":
            return totalMonths > 0 ? Math.ceil(totalMonths / 3) : "—";
        case "half_yearly":
            return totalMonths > 0 ? Math.ceil(totalMonths / 6) : "—";
        case "yearly": {
            const years = end.getFullYear() - start.getFullYear() + 1;
            return years > 0 ? years : "—";
        }
        default:
            return "—";
    }
};

export default function PaymentModal({
    isOpen,
    onClose,
    onSuccess,
    mode,
    editData,
    renewData,
    clientId,
}) {
    const { setNotification } = useStateContext();

    const isProject = mode === "project";
    const isEditing = !!editData;

    // ── Service list ─────────────────────────────────────────────────
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState("");

    // ── Payment shared ───────────────────────────────────────────────
    const [paymentType, setPaymentType] = useState("");
    const [vatType, setVatType] = useState("vat_exempt");
    const [recurringType, setRecurringType] = useState("");

    // ── Company ──────────────────────────────────────────────────────
    const [company, setCompany] = useState(null);

    // ── Errors ───────────────────────────────────────────────────────
    const [errors, setErrors] = useState(null);

    // ── Renew fields ─────────────────────────────────────────────────
    const [adjustedStartCoverage, setAdjustedStartCoverage] = useState("");
    const [adjustedEndCoverage, setAdjustedEndCoverage] = useState("");
    const [crNo, setCrNo] = useState("");

    // ── Searchable dropdown ──────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // ── Fetch on open ────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        resetForm();

        axiosClient
            .get("/company")
            .then(({ data }) => setCompany(data))
            .catch(() => {});

        axiosClient
            .get(isProject ? "/projects" : "/subscriptions")
            .then(({ data }) => {
                const allServices = data.data ?? [];

                // Fetch all assignments then filter to this client to exclude
                // already-assigned projects/subscriptions from the dropdown
                axiosClient
                    .get("/clients-projects")
                    .then(({ data: assignData }) => {
                        const assignments = assignData.data ?? assignData ?? []; // ← no client filter

                        const assignedIds = new Set(
                            assignments.map((a) =>
                                String(
                                    isProject
                                        ? a.project?.id
                                        : a.subscription?.id,
                                ),
                            ),
                        );

                        const currentId = editData
                            ? String(
                                  isProject
                                      ? editData.project?.id
                                      : editData.subscription?.id,
                              )
                            : null;

                        setServices(
                            allServices.filter(
                                (s) =>
                                    !assignedIds.has(String(s.id)) ||
                                    String(s.id) === currentId,
                            ),
                        );
                    })
                    .catch(() => setServices(allServices));

                if (editData) {
                    const service = isProject
                        ? editData.project
                        : editData.subscription;

                    setSelectedService(String(service?.id ?? ""));
                    setSearch(service?.title ?? "");
                    setPaymentType(
                        isProject
                            ? (service?.payment_type ?? "one_time")
                            : "recurring",
                    );
                    setVatType(editData.vat_type ?? "vat_exempt");
                    setRecurringType(service?.frequency ?? service?.type ?? "");
                }

                if (renewData && !editData) {
                    const service = renewData.subscription;
                    setSelectedService(String(service?.id ?? ""));
                    setSearch(service?.title ?? "");
                    setPaymentType("recurring");
                    setVatType(renewData.vat_type ?? "vat_exempt");
                    setRecurringType(service?.type ?? "");
                }
            })
            .catch(() => {});
    }, [isOpen, mode]);

    // ── Auto-fill adjusted coverage dates on renew ───────────────────
    useEffect(() => {
        if (!renewData || editData) return;

        const prevEndDate =
            renewData.subscription?.adjusted_end_coverage ??
            renewData.subscription?.end_coverage;
        if (!prevEndDate || !recurringType) return;

        const start = new Date(prevEndDate);
        start.setDate(start.getDate() + 1);

        const end = new Date(start);
        if (recurringType === "weekly") {
            end.setDate(end.getDate() + 6);
        } else if (recurringType === "monthly") {
            end.setMonth(end.getMonth() + 1);
            end.setDate(end.getDate() - 1);
        } else if (recurringType === "quarterly") {
            end.setMonth(end.getMonth() + 3);
            end.setDate(end.getDate() - 1);
        } else if (recurringType === "half_yearly") {
            end.setMonth(end.getMonth() + 6);
            end.setDate(end.getDate() - 1);
        } else if (recurringType === "yearly") {
            end.setFullYear(end.getFullYear() + 1);
            end.setDate(end.getDate() - 1);
        }

        const fmtDate = (d) => d.toLocaleDateString("en-CA");
        setAdjustedStartCoverage(fmtDate(start));
        setAdjustedEndCoverage(fmtDate(end));
    }, [renewData, recurringType]);

    // ── Auto-fill payment_type / vat_type from selected service ─────
    useEffect(() => {
        if (!selectedService || renewData) return;

        const svc = services.find(
            (s) => String(s.id) === String(selectedService),
        );
        if (!svc) return;

        if (isProject) {
            setPaymentType(svc.payment_type ?? "one_time");
            setVatType(svc.vat_type ?? "vat_exempt");
        } else {
            setPaymentType("recurring");
            setRecurringType(svc.frequency ?? "");
            setVatType(svc.vat_type ?? "vat_exempt");
        }
    }, [selectedService, services, renewData]);

    // ── Helpers ──────────────────────────────────────────────────────
    const resetForm = () => {
        setSelectedService("");
        setPaymentType("");
        setVatType("vat_exempt");
        setRecurringType("");
        setErrors(null);
        setAdjustedStartCoverage("");
        setAdjustedEndCoverage("");
        setCrNo("");
        setSearch("");
        setDropdownOpen(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isNonVat = company?.vat_type === "non_vat";

    const selectedServiceData =
        services.find((s) => String(s.id) === String(selectedService)) ??
        (isEditing
            ? isProject
                ? editData?.project
                : editData?.subscription
            : renewData?.subscription);

    const basePrice = isProject
        ? (selectedServiceData?.price ?? 0)
        : (selectedServiceData?.cost ?? 0);

    const fmt = (n) =>
        "₱" +
        new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(n);

    const today = new Date().toLocaleDateString("en-CA");

    // ── Derived display values ────────────────────────────────────────
    const billingStartDate = selectedServiceData?.billing_start_date ?? "—";

    const startDateValue = isProject
        ? (selectedServiceData?.adjusted_start_date ??
          selectedServiceData?.start_date ??
          "—")
        : renewData
          ? adjustedStartCoverage || "—"
          : (selectedServiceData?.adjusted_start_coverage ??
            selectedServiceData?.start_coverage ??
            "—");

    const endDateValue = isProject
        ? (selectedServiceData?.adjusted_end_date ??
          selectedServiceData?.end_date ??
          "—")
        : renewData
          ? adjustedEndCoverage || "—"
          : (selectedServiceData?.adjusted_end_coverage ??
            selectedServiceData?.end_coverage ??
            "—");

    const startDateLabel = isProject ? "Start Date" : "Start Coverage Date";
    const endDateLabel = isProject ? "End Date" : "End Coverage Date";

    const effectivePeriod = isProject
        ? paymentType === "installment"
            ? "monthly"
            : recurringType
        : recurringType;

    const numberOfCycles = calcCycles(
        startDateValue === "—" ? null : startDateValue,
        endDateValue === "—" ? null : endDateValue,
        paymentType,
        effectivePeriod,
    );

    const costLabel = paymentType === "installment" ? "Monthly Cost" : "Cost";

    const paymentTypeDisplay = isProject
        ? paymentType
        : recurringType
          ? `${recurringType}`
          : paymentType;

    const formatLabel = (val) =>
        val?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";

    // ── Submit ───────────────────────────────────────────────────────
    const handleSubmit = () => {
        setErrors(null);

        if (!selectedService) {
            setErrors({
                general: [
                    `Please select a ${isProject ? "project" : "subscription"}.`,
                ],
            });
            return;
        }

        const endpoint = isEditing
            ? `/clients/${editData.client.id}/assign/${editData.id}`
            : `/clients/${clientId}/assign`;

        const method = isEditing ? "patch" : "post";

        const payload = isEditing
            ? {
                  number_of_cycles: numberOfCycles,
                  ...(isProject
                      ? { project_id: selectedService }
                      : { subscription_id: selectedService }),
              }
            : isProject
              ? {
                    project_id: selectedService,
                    client_id: clientId,
                    number_of_cycles: numberOfCycles,
                    total_cost: calcVat(basePrice, vatType).total_amount,
                }
              : {
                    subscription_id: selectedService,
                    client_id: clientId,
                    number_of_cycles: numberOfCycles,
                    total_cost:
                        numberOfCycles !== "—"
                            ? calcVat(basePrice * numberOfCycles, vatType)
                                  .total_amount
                            : 0,
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* ── Header ─────────────────────────────────────── */}
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
                    {/* ── Validation errors ───────────────────────── */}
                    {errors && (
                        <div className="px-4 py-3 mb-3 rounded-md text-white bg-red-500 text-sm">
                            {Object.keys(errors).map((key) => (
                                <p key={key}>{errors[key][0]}</p>
                            ))}
                        </div>
                    )}

                    {/* ── 1. SERVICE DROPDOWN (Searchable) ─────────── */}
                    <FloatField label={isProject ? "Project" : "Subscription"}>
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setDropdownOpen(true);
                                }}
                                onBlur={() =>
                                    setTimeout(
                                        () => setDropdownOpen(false),
                                        150,
                                    )
                                }
                                disabled={!!renewData}
                                placeholder={
                                    isProject
                                        ? "Search a project..."
                                        : "Search a subscription..."
                                }
                                className={
                                    "block w-full border border-gray-300 rounded-md pl-3 pr-10 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" +
                                    (renewData
                                        ? " bg-gray-50 cursor-not-allowed"
                                        : " bg-white")
                                }
                            />
                            {!renewData && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setDropdownOpen((prev) => !prev);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                            )}
                            {dropdownOpen && !renewData && (
                                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                    {services
                                        .filter((s) =>
                                            s.title
                                                .toLowerCase()
                                                .includes(search.toLowerCase()),
                                        )
                                        .map((s) => (
                                            <li
                                                key={s.id}
                                                onMouseDown={() => {
                                                    setSelectedService(
                                                        String(s.id),
                                                    );
                                                    setSearch(s.title);
                                                    setDropdownOpen(false);
                                                }}
                                                className="px-3 py-2 text-sm hover:bg-cyan-50 cursor-pointer"
                                            >
                                                {s.title}
                                            </li>
                                        ))}
                                    {services.filter((s) =>
                                        s.title
                                            .toLowerCase()
                                            .includes(search.toLowerCase()),
                                    ).length === 0 && (
                                        <li className="px-3 py-2 text-sm text-gray-400">
                                            No results found
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </FloatField>

                    {/* ── Fields revealed after a service is picked ── */}
                    {selectedService && (
                        <>
                            {/* ── 2. PAYMENT TYPE ─────────────────── */}
                            <ReadonlyInput
                                label="Payment Type"
                                value={formatLabel(paymentTypeDisplay)}
                            />

                            {/* ── 3. COST + VAT TYPE ──────────────── */}
                            <div className="flex gap-2">
                                <ReadonlyInput
                                    label={costLabel}
                                    value={fmt(basePrice)}
                                />
                                {!isNonVat && (
                                    <ReadonlyInput
                                        label="VAT Type"
                                        value={formatLabel(vatType)}
                                    />
                                )}
                            </div>

                            {/* ── 4. BILLING START DATE ───────────── */}
                            <ReadonlyInput
                                label="Billing Start Date"
                                value={billingStartDate}
                            />

                            {/* ── 5. START + END DATE/COVERAGE ────── */}
                            <div className="flex gap-2">
                                {!isProject && renewData && !editData ? (
                                    <>
                                        <FloatField label={startDateLabel}>
                                            <input
                                                type="date"
                                                value={adjustedStartCoverage}
                                                onChange={(e) =>
                                                    setAdjustedStartCoverage(
                                                        e.target.value,
                                                    )
                                                }
                                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                        </FloatField>
                                        <FloatField label={endDateLabel}>
                                            <input
                                                type="date"
                                                value={adjustedEndCoverage}
                                                onChange={(e) =>
                                                    setAdjustedEndCoverage(
                                                        e.target.value,
                                                    )
                                                }
                                                className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                            />
                                        </FloatField>
                                    </>
                                ) : (
                                    <>
                                        <ReadonlyInput
                                            label={startDateLabel}
                                            value={startDateValue}
                                        />
                                        <ReadonlyInput
                                            label={endDateLabel}
                                            value={endDateValue}
                                        />
                                    </>
                                )}
                            </div>

                            {/* ── 6. NUMBER OF CYCLES ─────────────── */}
                            <ReadonlyInput
                                label="Payment Cycles"
                                value={
                                    numberOfCycles === "—"
                                        ? "—"
                                        : String(numberOfCycles)
                                }
                            />

                            {!isProject && numberOfCycles !== "—" && (
                                <ReadonlyInput
                                    label="Expected Gross Amount"
                                    value={fmt(
                                        calcVat(
                                            basePrice * numberOfCycles,
                                            vatType,
                                        ).total_amount,
                                    )}
                                />
                            )}

                            {/* ── CR NO. (subscription renew only) ─── */}
                            {!isProject && renewData && !editData && (
                                <FloatField label="CR No.">
                                    <input
                                        type="text"
                                        value={crNo}
                                        onChange={(e) =>
                                            setCrNo(e.target.value)
                                        }
                                        placeholder="Enter CR number..."
                                        className="block w-full border border-gray-300 rounded-md pl-3 pr-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </FloatField>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────────── */}
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
