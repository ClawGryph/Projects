import { useState, useEffect, useMemo } from "react";
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
function DrillDown({ quarter, rows, onClose }) {
    if (!rows) return null;
    return (
        <tr>
            <td colSpan={9} className="p-0">
                <div className="bg-cyan-50 dark:bg-cyan-950/30 border-t border-b border-cyan-200 dark:border-cyan-800 px-6 py-3 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-widest">
                            {quarter} — {rows.length} transaction
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
                            <tr className="text-gray-500 dark:text-gray-400 border-b border-cyan-200 dark:border-cyan-800">
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
                                <th className="text-left py-1 pr-3 font-medium">
                                    Paid At
                                </th>
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
                            {rows.map((s) => (
                                <tr
                                    key={s.id}
                                    className="border-b border-cyan-100 dark:border-cyan-900/50 last:border-0"
                                >
                                    <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">
                                        {s.clientsProject?.client?.name ?? "—"}
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
                                    <td className="py-1.5 pr-3 text-gray-500">
                                        {s.due_date ?? "—"}
                                    </td>
                                    <td className="py-1.5 pr-3 text-gray-500">
                                        {s.transaction?.paid_at
                                            ? new Date(s.transaction.paid_at)
                                                  .toISOString()
                                                  .split("T")[0]
                                            : "—"}
                                    </td>
                                    <td className="py-1.5 pr-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                                        {php(s.total_amount)}
                                    </td>
                                    <td className="py-1.5 pr-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                                        {php(s.transaction?.gross_amount)}
                                    </td>
                                    <td className="py-1.5 pr-3 text-right text-red-500 tabular-nums">
                                        {s.transaction?.wh_tax > 0
                                            ? `- ${php(s.transaction.wh_tax)}`
                                            : "—"}
                                    </td>
                                    <td className="py-1.5 pr-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                        {php(s.transaction?.net_amount)}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportModule() {
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
                        total_amount: parseFloat(s.total_amount || 0),
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

    const paidSchedules = useMemo(
        () => schedules.filter((s) => s.transaction?.paid_at),
        [schedules],
    );

    const allYears = useMemo(
        () =>
            unique(
                paidSchedules.map((s) => String(getY(s.transaction.paid_at))),
            ).reverse(),
        [paidSchedules],
    );

    const allClients = useMemo(
        () =>
            unique(
                paidSchedules
                    .map((s) => s.clientsProject?.client?.name)
                    .filter(Boolean),
            ),
        [paidSchedules],
    );

    const allServices = useMemo(
        () =>
            unique(
                paidSchedules
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
        [paidSchedules, filters.serviceType],
    );

    const filtered = useMemo(() => {
        return paidSchedules
            .filter((s) => {
                const paidAt = s.transaction.paid_at;
                if (
                    filters.year !== "All" &&
                    String(getY(paidAt)) !== filters.year
                )
                    return false;
                if (
                    filters.quarter !== "All" &&
                    getQ(paidAt) !== filters.quarter
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
            .map((s) => ({ ...s, quarter: getQ(s.transaction.paid_at) }))
            .sort(
                (a, b) =>
                    new Date(a.transaction.paid_at) -
                    new Date(b.transaction.paid_at),
            );
    }, [paidSchedules, filters]);

    const grouped = useMemo(() => {
        const g = {};
        QUARTERS.forEach((q) => (g[q] = []));
        filtered.forEach((s) => g[s.quarter].push(s));
        return g;
    }, [filtered]);

    const grandGross = filtered.reduce(
        (s, r) => s + r.transaction.gross_amount,
        0,
    );
    const grandWht = filtered.reduce((s, r) => s + r.transaction.wh_tax, 0);
    const grandNet = filtered.reduce((s, r) => s + r.transaction.net_amount, 0);

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
                        Report
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Quarterly income summary
                    </p>
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
                                    className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
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
                                className="ml-auto text-xs text-cyan-700 hover:underline dark:text-cyan-400"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>

                    {/* ── Table ── */}
                    <table className="w-full bg-white dark:bg-gray-900 shadow-sm rounded-xl border-separate border-spacing-0 overflow-hidden">
                        <thead className="sticky top-0 z-20 bg-cyan-800">
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
                                            No paid transactions match the
                                            selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {QUARTERS.map((q, qi) => {
                                            const rows = grouped[q];
                                            if (!rows.length) return null;

                                            const totalGross = rows.reduce(
                                                (s, r) =>
                                                    s +
                                                    r.transaction.gross_amount,
                                                0,
                                            );
                                            const totalWht = rows.reduce(
                                                (s, r) =>
                                                    s + r.transaction.wh_tax,
                                                0,
                                            );
                                            const totalNet = rows.reduce(
                                                (s, r) =>
                                                    s +
                                                    r.transaction.net_amount,
                                                0,
                                            );
                                            const withOR = rows.filter(
                                                (r) => !!r.is_or_issued,
                                            ).length;
                                            const with2307 = rows.filter(
                                                (r) => !!r.is_form2307_issued,
                                            ).length;
                                            const isExpanded = expandedQ === q;

                                            return (
                                                <>
                                                    <tr
                                                        key={q}
                                                        onClick={() =>
                                                            toggleQ(q)
                                                        }
                                                        className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors
                                                            ${isExpanded ? "bg-cyan-50 dark:bg-cyan-950/20" : qi % 2 === 1 ? "bg-gray-50 dark:bg-gray-800/40 hover:bg-cyan-50 dark:hover:bg-cyan-950/20" : "bg-white dark:bg-gray-900 hover:bg-cyan-50 dark:hover:bg-cyan-950/20"}`}
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
                                                        <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
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
                                                        />
                                                    )}
                                                </>
                                            );
                                        })}

                                        {/* Grand total row */}
                                        <tr className="bg-cyan-50 dark:bg-cyan-950/30 border-t-2 border-cyan-200 dark:border-cyan-800">
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
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
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
