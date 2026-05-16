import { useState, useEffect, useMemo, Fragment } from "react";
import axiosClient from "../axios-client";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const Q_MONTHS = {
    Q1: "Jan – Mar",
    Q2: "Apr – Jun",
    Q3: "Jul – Sep",
    Q4: "Oct – Dec",
};

function getQ(d) {
    const m = new Date(d).getMonth() + 1;
    return m <= 3 ? "Q1" : m <= 6 ? "Q2" : m <= 9 ? "Q3" : "Q4";
}

function getY(d) {
    return new Date(d).getFullYear();
}

function php(n) {
    return (
        "₱" +
        Number(n || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function unique(arr) {
    return [...new Set(arr)].sort();
}

function daysPast(dateStr) {
    if (!dateStr) return 0;
    return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate withholding tax based on client type, annual gross, and vat type.
 */
function calcWithholdingTax({
    clientType,
    annualGross,
    vatType,
    baseAmount,
    totalAmount,
}) {
    if (vatType === "vat_other") {
        return { rate: 0, tax: 0, base: 0 };
    }
    if (clientType === "Government") {
        const rate = 0.01;
        const base = totalAmount;
        return { rate, base, tax: Math.round(base * rate * 100) / 100 };
    }
    if (clientType === "Private Corporation") {
        const rate = annualGross >= 3_000_000 ? 0.02 : 0.01;
        const base = baseAmount;
        return { rate, base, tax: Math.round(base * rate * 100) / 100 };
    }
    return { rate: 0, tax: 0, base: 0 };
}

/**
 * Get WHT for a non-paid schedule row using its schedule fields.
 */
function getScheduleWht(s) {
    return calcWithholdingTax({
        clientType: s.clientsProject?.client?.company_type ?? "",
        annualGross: parseFloat(s.clientsProject?.client?.annual_gross ?? 0),
        vatType: s.clientsProject?.vat_type ?? "vat_exempt",
        baseAmount: parseFloat(s.base_amount ?? 0),
        totalAmount: parseFloat(s.total_amount ?? 0),
    });
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(filtered, activeFilters, variant) {
    const isPaid = variant === "paid";

    const headers = [
        "Quarter",
        "Client",
        "Type",
        "Service",
        "Due Date",
        "Paid At",
        "Expected",
        "Gross Paid",
        "WHT",
        "Net Received",
        "O.R. Issued",
        "2307 Issued",
    ];

    const escape = (val) => {
        const str = String(val ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };

    const rows = filtered.map((s) => {
        const wht = isPaid ? null : getScheduleWht(s);
        const grossPaid = isPaid
            ? Number(s.transaction?.gross_amount || 0)
            : Number(s.total_amount || 0);
        const whtAmt = isPaid
            ? Number(s.transaction?.wh_tax || 0)
            : (wht?.tax ?? 0);
        const netAmt = isPaid
            ? Number(s.transaction?.net_amount || 0)
            : grossPaid - whtAmt;

        return [
            s.quarter,
            s.clientsProject?.client?.name ?? "",
            s.clientsProject?.project ? "Project" : "Subscription",
            s.clientsProject?.project?.title ??
                s.clientsProject?.subscription?.title ??
                "",
            s.due_date ?? "",
            isPaid && s.transaction?.paid_at
                ? new Date(s.transaction.paid_at).toISOString().split("T")[0]
                : "",
            Number(s.total_amount || 0).toFixed(2),
            grossPaid.toFixed(2),
            whtAmt.toFixed(2),
            netAmt.toFixed(2),
            s.is_or_issued ? "Yes" : "No",
            s.is_form2307_issued ? "Yes" : "No",
        ];
    });

    const csv = [headers, ...rows]
        .map((row) => row.map(escape).join(","))
        .join("\n");
    const year = activeFilters.year !== "All" ? activeFilters.year : "All";
    const quarter =
        activeFilters.quarter !== "All" ? `_${activeFilters.quarter}` : "";
    const filename = `${variant}_report_${year}${quarter}.csv`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Badge ────────────────────────────────────────────────────────────────────
function Badge({ complete, count, total }) {
    const color = complete
        ? "text-emerald-600 dark:text-emerald-400"
        : count === 0
          ? "text-gray-400"
          : "text-amber-500";
    return (
        <span className={`text-sm font-semibold tabular-nums ${color}`}>
            {count}/{total}
        </span>
    );
}

// ── Drill-down drawer ─────────────────────────────────────────────────────────
function DrillDown({ quarter, rows, onClose, variant, theme, isPaid }) {
    if (!rows) return null;
    const isOverdue = variant === "overdue";

    return (
        <tr>
            <td colSpan={9} className="p-0">
                <div
                    className={`${theme.drillBg} border-t border-b ${theme.drillBorder} px-6 py-3 animate-fadeIn`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span
                            className={`text-xs font-semibold ${theme.drillLabel} uppercase tracking-widest`}
                        >
                            {quarter} — {rows.length}{" "}
                            {variant === "paid"
                                ? "transaction"
                                : isOverdue
                                  ? "overdue item"
                                  : "receivable"}
                            {rows.length !== 1 ? "s" : ""}
                        </span>
                        <button
                            onClick={onClose}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            ✕ Close
                        </button>
                    </div>

                    <table className="w-full text-xs">
                        <thead>
                            <tr
                                className={`text-gray-500 dark:text-gray-400 border-b ${theme.drillBorder}`}
                            >
                                <th className="text-left py-1 pr-3 font-medium">
                                    Client
                                </th>
                                <th className="text-left py-1 pr-3 font-medium">
                                    Type
                                </th>
                                <th className="text-left py-1 pr-3 font-medium">
                                    Service
                                </th>
                                <th className="text-left py-1 pr-3 font-medium">
                                    Due Date
                                </th>
                                {isPaid && (
                                    <th className="text-left py-1 pr-3 font-medium">
                                        Paid At
                                    </th>
                                )}
                                <th className="text-right py-1 pr-3 font-medium">
                                    Expected
                                </th>
                                <th className="text-right py-1 pr-3 font-medium">
                                    Gross Paid
                                </th>
                                <th className="text-right py-1 pr-3 font-medium">
                                    WHT
                                </th>
                                <th className="text-right py-1 pr-3 font-medium">
                                    Net Received
                                </th>
                                <th className="text-center py-1 pr-3 font-medium">
                                    O.R.
                                </th>
                                <th className="text-center py-1 font-medium">
                                    2307
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((s) => {
                                const wht = isPaid ? null : getScheduleWht(s);
                                const grossPaid = isPaid
                                    ? (s.transaction?.gross_amount ?? 0)
                                    : (s.total_amount ?? 0);
                                const whtAmt = isPaid
                                    ? (s.transaction?.wh_tax ?? 0)
                                    : (wht?.tax ?? 0);
                                const netAmt = isPaid
                                    ? (s.transaction?.net_amount ?? 0)
                                    : grossPaid - whtAmt;

                                const dueDateClass = isOverdue
                                    ? "text-red-500 font-semibold"
                                    : "text-gray-500";

                                return (
                                    <tr
                                        key={s.id}
                                        className={`border-b ${theme.drillRowBorder} last:border-0`}
                                    >
                                        <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">
                                            {s.clientsProject?.client?.name ??
                                                "—"}
                                        </td>
                                        <td className="py-1.5 pr-3">
                                            {s.clientsProject?.project ? (
                                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                    Project
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                    Subscription
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">
                                            {s.clientsProject?.project?.title ??
                                                s.clientsProject?.subscription
                                                    ?.title ??
                                                "—"}
                                        </td>
                                        <td
                                            className={`py-1.5 pr-3 ${dueDateClass}`}
                                        >
                                            {s.due_date ?? "—"}
                                        </td>
                                        {isPaid && (
                                            <td className="py-1.5 pr-3 text-gray-500">
                                                {s.transaction?.paid_at
                                                    ? new Date(
                                                          s.transaction.paid_at,
                                                      )
                                                          .toISOString()
                                                          .split("T")[0]
                                                    : "—"}
                                            </td>
                                        )}
                                        {/* Expected = always total_amount from schedule */}
                                        <td className="py-1.5 pr-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                                            {php(s.total_amount)}
                                        </td>
                                        {/* Gross Paid = transaction gross (paid) | total_amount (pending/overdue) */}
                                        <td className="py-1.5 pr-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                                            {php(grossPaid)}
                                        </td>
                                        {/* WHT */}
                                        <td className="py-1.5 pr-3 text-right text-red-500 tabular-nums">
                                            {whtAmt > 0
                                                ? `- ${php(whtAmt)}`
                                                : "—"}
                                        </td>
                                        {/* Net Received */}
                                        <td className="py-1.5 pr-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                            {php(netAmt)}
                                        </td>
                                        <td className="py-1.5 pr-3 text-center">
                                            {!!s.is_or_issued ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    ✓
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-1.5 text-center">
                                            {!!s.is_form2307_issued ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    ✓
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    );
}

// ── Theme map ─────────────────────────────────────────────────────────────────
const THEMES = {
    paid: {
        header: "bg-cyan-800",
        ring: "focus:ring-cyan-600",
        resetLink: "text-cyan-700 dark:text-cyan-400",
        exportBtn: "bg-cyan-700 hover:bg-cyan-800",
        rowHover: "hover:bg-cyan-50 dark:hover:bg-cyan-950/20",
        rowExpanded: "bg-cyan-50 dark:bg-cyan-950/20",
        totalRow:
            "bg-cyan-50 dark:bg-cyan-950/30 border-t-2 border-cyan-200 dark:border-cyan-800",
        drillBg: "bg-cyan-50 dark:bg-cyan-950/30",
        drillBorder: "border-cyan-200 dark:border-cyan-800",
        drillLabel: "text-cyan-700 dark:text-cyan-400",
        drillRowBorder: "border-cyan-100 dark:border-cyan-900/50",
        amountColor: "text-emerald-700 dark:text-emerald-400",
    },
    pending: {
        header: "bg-amber-700",
        ring: "focus:ring-amber-500",
        resetLink: "text-amber-700 dark:text-amber-400",
        exportBtn: "bg-amber-700 hover:bg-amber-800",
        rowHover: "hover:bg-amber-50 dark:hover:bg-amber-950/20",
        rowExpanded: "bg-amber-50 dark:bg-amber-950/20",
        totalRow:
            "bg-amber-50 dark:bg-amber-950/30 border-t-2 border-amber-200 dark:border-amber-800",
        drillBg: "bg-amber-50 dark:bg-amber-950/30",
        drillBorder: "border-amber-200 dark:border-amber-800",
        drillLabel: "text-amber-700 dark:text-amber-400",
        drillRowBorder: "border-amber-100 dark:border-amber-900/50",
        amountColor: "text-amber-700 dark:text-amber-400",
    },
    overdue: {
        header: "bg-red-700",
        ring: "focus:ring-red-500",
        resetLink: "text-red-700 dark:text-red-400",
        exportBtn: "bg-red-700 hover:bg-red-800",
        rowHover: "hover:bg-red-50 dark:hover:bg-red-950/20",
        rowExpanded: "bg-red-50 dark:bg-red-950/20",
        totalRow:
            "bg-red-50 dark:bg-red-950/30 border-t-2 border-red-200 dark:border-red-800",
        drillBg: "bg-red-50 dark:bg-red-950/30",
        drillBorder: "border-red-200 dark:border-red-800",
        drillLabel: "text-red-700 dark:text-red-400",
        drillRowBorder: "border-red-100 dark:border-red-900/50",
        amountColor: "text-red-700 dark:text-red-400",
    },
};

// ── Main shared component ─────────────────────────────────────────────────────
export default function PaymentScheduleReport({
    variant,
    title,
    subtitle,
    headerBadge,
}) {
    const theme = THEMES[variant];
    const isPaid = variant === "paid";

    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedQ, setExpandedQ] = useState(null);
    const [filters, setFilters] = useState({
        year: String(new Date().getFullYear()),
        quarter: "All",
        client: "All",
        serviceType: "All",
        service: "All",
    });

    useEffect(() => {
        setLoading(true);
        axiosClient
            .get("/payment-schedules")
            .then(({ data }) => {
                const items = Array.isArray(data) ? data : (data.data ?? []);
                setSchedules(
                    items.map((s) => ({
                        ...s,
                        base_amount: parseFloat(s.base_amount || 0),
                        total_amount: parseFloat(s.total_amount || 0),
                        vat_amount: parseFloat(s.vat_amount || 0),
                        transaction: s.transaction
                            ? {
                                  ...s.transaction,
                                  gross_amount: parseFloat(
                                      s.transaction.gross_amount || 0,
                                  ),
                                  net_amount: parseFloat(
                                      s.transaction.net_amount || 0,
                                  ),
                                  wh_tax: parseFloat(s.transaction.wh_tax || 0),
                              }
                            : null,
                    })),
                );
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // ── Filter source rows by variant ──
    const sourceSchedules = useMemo(() => {
        if (isPaid) return schedules.filter((s) => s.transaction?.paid_at);
        return schedules.filter((s) => s.status === variant);
    }, [schedules, variant, isPaid]);

    const getDateKey = (s) => (isPaid ? s.transaction?.paid_at : s.due_date);

    const allYears = useMemo(
        () =>
            unique(
                sourceSchedules
                    .filter((s) => getDateKey(s))
                    .map((s) => String(getY(getDateKey(s)))),
            ).reverse(),
        [sourceSchedules],
    );

    const allClients = useMemo(
        () =>
            unique(
                sourceSchedules
                    .map((s) => s.clientsProject?.client?.name)
                    .filter(Boolean),
            ),
        [sourceSchedules],
    );

    const allServices = useMemo(
        () =>
            unique(
                sourceSchedules
                    .filter((s) => {
                        if (filters.serviceType === "project")
                            return !!s.clientsProject?.project;
                        if (filters.serviceType === "subscription")
                            return !!s.clientsProject?.subscription;
                        return true;
                    })
                    .map(
                        (s) =>
                            s.clientsProject?.project?.title ??
                            s.clientsProject?.subscription?.title,
                    )
                    .filter(Boolean),
            ),
        [sourceSchedules, filters.serviceType],
    );

    const filtered = useMemo(() => {
        return sourceSchedules
            .filter((s) => {
                const dateKey = getDateKey(s);
                if (!dateKey)
                    return filters.year === "All" && filters.quarter === "All";
                if (
                    filters.year !== "All" &&
                    String(getY(dateKey)) !== filters.year
                )
                    return false;
                if (
                    filters.quarter !== "All" &&
                    getQ(dateKey) !== filters.quarter
                )
                    return false;
                if (
                    filters.client !== "All" &&
                    s.clientsProject?.client?.name !== filters.client
                )
                    return false;
                const isProject = !!s.clientsProject?.project;
                if (filters.serviceType === "project" && !isProject)
                    return false;
                if (filters.serviceType === "subscription" && isProject)
                    return false;
                const serviceName =
                    s.clientsProject?.project?.title ??
                    s.clientsProject?.subscription?.title;
                if (
                    filters.service !== "All" &&
                    serviceName !== filters.service
                )
                    return false;
                return true;
            })
            .map((s) => ({
                ...s,
                quarter: getDateKey(s) ? getQ(getDateKey(s)) : "Q1",
            }))
            .sort((a, b) => {
                const da = getDateKey(a),
                    db = getDateKey(b);
                if (!da) return 1;
                if (!db) return -1;
                return new Date(da) - new Date(db);
            });
    }, [sourceSchedules, filters]);

    const grouped = useMemo(() => {
        const g = {};
        QUARTERS.forEach((q) => (g[q] = []));
        filtered.forEach((s) => g[s.quarter].push(s));
        return g;
    }, [filtered]);

    // ── Grand totals ──
    const { grandGross, grandWht, grandNet } = useMemo(() => {
        if (isPaid) {
            return {
                grandGross: filtered.reduce(
                    (s, r) => s + (r.transaction?.gross_amount ?? 0),
                    0,
                ),
                grandWht: filtered.reduce(
                    (s, r) => s + (r.transaction?.wh_tax ?? 0),
                    0,
                ),
                grandNet: filtered.reduce(
                    (s, r) => s + (r.transaction?.net_amount ?? 0),
                    0,
                ),
            };
        }
        const gGross = filtered.reduce((s, r) => s + r.total_amount, 0);
        const gWht = filtered.reduce((s, r) => s + getScheduleWht(r).tax, 0);
        return { grandGross: gGross, grandWht: gWht, grandNet: gGross - gWht };
    }, [filtered, isPaid]);

    const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
    const clearFilters = () =>
        setFilters({
            year: String(new Date().getFullYear()),
            quarter: "All",
            client: "All",
            serviceType: "All",
            service: "All",
        });

    const hasActiveFilter =
        filters.year !== String(new Date().getFullYear()) ||
        ["quarter", "client", "serviceType", "service"].some(
            (k) => filters[k] !== "All",
        );

    const toggleQ = (q) => setExpandedQ((prev) => (prev === q ? null : q));

    return (
        <>
            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-5 pt-6 pb-2 gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {headerBadge}
                    <button
                        onClick={() => exportCSV(filtered, filters, variant)}
                        disabled={filtered.length === 0}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${theme.exportBtn} text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 px-5 pb-8 gap-5">
                <div className="max-w-[1300px] w-full overflow-auto rounded-xl hide-scrollbar">
                    {/* ── Filters ── */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                            Filters
                        </span>
                        {[
                            {
                                key: "year",
                                label: "Year",
                                opts: ["All", ...allYears],
                            },
                            {
                                key: "quarter",
                                label: "Quarter",
                                opts: ["All", ...QUARTERS],
                            },
                            {
                                key: "client",
                                label: "Client",
                                opts: ["All", ...allClients],
                            },
                            {
                                key: "serviceType",
                                label: "Type",
                                opts: ["All", "project", "subscription"],
                            },
                            {
                                key: "service",
                                label: "Service",
                                opts: ["All", ...allServices],
                            },
                        ].map(({ key, label, opts }) => (
                            <label
                                key={key}
                                className="flex items-center gap-1.5"
                            >
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {label}
                                </span>
                                <select
                                    value={filters[key]}
                                    onChange={(e) => {
                                        set(key, e.target.value);
                                        if (key === "serviceType")
                                            set("service", "All");
                                    }}
                                    className={`border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 ${theme.ring} dark:bg-gray-800 dark:text-white dark:border-gray-600`}
                                >
                                    {opts.map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                        {hasActiveFilter && (
                            <button
                                onClick={clearFilters}
                                className={`ml-auto text-xs ${theme.resetLink} hover:underline`}
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>

                    {/* ── Table ── */}
                    <table className="w-full bg-white dark:bg-gray-900 shadow-sm rounded-xl border-separate border-spacing-0 overflow-hidden">
                        <thead className={`sticky top-0 z-20 ${theme.header}`}>
                            <tr>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-left uppercase tracking-wider w-8" />
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-left uppercase tracking-wider">
                                    Quarter
                                </th>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-left uppercase tracking-wider">
                                    Period
                                </th>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-center uppercase tracking-wider">
                                    Schedules
                                </th>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-right uppercase tracking-wider">
                                    Gross Paid
                                </th>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-right uppercase tracking-wider">
                                    WHT
                                </th>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-right uppercase tracking-wider">
                                    Net Received
                                </th>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-center uppercase tracking-wider">
                                    O.R.
                                </th>
                                <th className="px-4 py-2.5 text-white text-xs font-semibold text-center uppercase tracking-wider">
                                    2307
                                </th>
                            </tr>
                        </thead>

                        {loading && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="text-center py-4"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            </tbody>
                        )}

                        {!loading && (
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="text-center py-12 text-gray-400 dark:text-gray-500"
                                        >
                                            No {variant} schedules match the
                                            selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {QUARTERS.map((q, qi) => {
                                            const rows = grouped[q];
                                            if (!rows.length) return null;

                                            let totalGross, totalWht, totalNet;
                                            if (isPaid) {
                                                totalGross = rows.reduce(
                                                    (s, r) =>
                                                        s +
                                                        (r.transaction
                                                            ?.gross_amount ??
                                                            0),
                                                    0,
                                                );
                                                totalWht = rows.reduce(
                                                    (s, r) =>
                                                        s +
                                                        (r.transaction
                                                            ?.wh_tax ?? 0),
                                                    0,
                                                );
                                                totalNet = rows.reduce(
                                                    (s, r) =>
                                                        s +
                                                        (r.transaction
                                                            ?.net_amount ?? 0),
                                                    0,
                                                );
                                            } else {
                                                totalGross = rows.reduce(
                                                    (s, r) =>
                                                        s + r.total_amount,
                                                    0,
                                                );
                                                totalWht = rows.reduce(
                                                    (s, r) =>
                                                        s +
                                                        getScheduleWht(r).tax,
                                                    0,
                                                );
                                                totalNet =
                                                    totalGross - totalWht;
                                            }

                                            const withOR = rows.filter(
                                                (r) => !!r.is_or_issued,
                                            ).length;
                                            const with2307 = rows.filter(
                                                (r) => !!r.is_form2307_issued,
                                            ).length;
                                            const isExpanded = expandedQ === q;

                                            return (
                                                <Fragment key={q}>
                                                    <tr
                                                        onClick={() =>
                                                            toggleQ(q)
                                                        }
                                                        className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors
                                                            ${isExpanded ? theme.rowExpanded : qi % 2 === 1 ? `bg-gray-50 dark:bg-gray-800/40 ${theme.rowHover}` : `bg-white dark:bg-gray-900 ${theme.rowHover}`}`}
                                                    >
                                                        <td className="px-3 py-3 text-center">
                                                            <span
                                                                className={`text-gray-400 text-xs transition-transform inline-block ${isExpanded ? "rotate-90" : ""}`}
                                                            >
                                                                ▶
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-left font-bold text-gray-800 dark:text-white">
                                                            {q}
                                                        </td>
                                                        <td className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 text-sm">
                                                            {Q_MONTHS[q]}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                                                            {rows.length}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-white tabular-nums">
                                                            {php(totalGross)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-red-500 tabular-nums">
                                                            {totalWht > 0
                                                                ? `- ${php(totalWht)}`
                                                                : "—"}
                                                        </td>
                                                        <td
                                                            className={`px-4 py-3 text-right font-semibold ${theme.amountColor} tabular-nums`}
                                                        >
                                                            {php(totalNet)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge
                                                                complete={
                                                                    withOR ===
                                                                    rows.length
                                                                }
                                                                count={withOR}
                                                                total={
                                                                    rows.length
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge
                                                                complete={
                                                                    with2307 ===
                                                                    rows.length
                                                                }
                                                                count={with2307}
                                                                total={
                                                                    rows.length
                                                                }
                                                            />
                                                        </td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <DrillDown
                                                            quarter={q}
                                                            rows={rows}
                                                            onClose={() =>
                                                                setExpandedQ(
                                                                    null,
                                                                )
                                                            }
                                                            variant={variant}
                                                            theme={theme}
                                                            isPaid={isPaid}
                                                        />
                                                    )}
                                                </Fragment>
                                            );
                                        })}

                                        {/* Grand total row */}
                                        <tr className={theme.totalRow}>
                                            <td className="px-3 py-3" />
                                            <td
                                                colSpan={2}
                                                className="px-4 py-3 text-left font-bold text-gray-800 dark:text-white"
                                            >
                                                Total
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                                                {filtered.length}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-800 dark:text-white tabular-nums">
                                                {php(grandGross)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-red-500 tabular-nums">
                                                {grandWht > 0
                                                    ? `- ${php(grandWht)}`
                                                    : "—"}
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right font-bold ${theme.amountColor} tabular-nums`}
                                            >
                                                {php(grandNet)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                {
                                                    filtered.filter(
                                                        (s) => !!s.is_or_issued,
                                                    ).length
                                                }
                                                /{filtered.length}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                {
                                                    filtered.filter(
                                                        (s) =>
                                                            !!s.is_form2307_issued,
                                                    ).length
                                                }
                                                /{filtered.length}
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
            `}</style>
        </>
    );
}
