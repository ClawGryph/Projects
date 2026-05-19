import { useState, useEffect } from "react";
import axiosClient from "../axios-client";

export default function MismatchReportTable({ paymentSchedules = [] }) {
    useEffect(() => {
        axiosClient
            .get("/payment-schedules", { params: { status: "paid" } })
            .then(({ data }) => {
                setPaymentSchedules(data?.data ?? data ?? []);
            })
            .finally(() => setLoading(false));
    }, []);

    const formatCurrency = (val) =>
        new Intl.NumberFormat("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(parseFloat(val) || 0);

    const mismatches = paymentSchedules.filter((p) => {
        const netAmount = parseFloat(p.transaction?.net_amount) || 0;
        const orTotal =
            parseFloat(p.transaction?.officialReceipt?.total_amount) || 0;

        // Only check paid schedules that have an OR issued
        return p.status === "paid" && p.is_or_issued && netAmount !== orTotal;
    });

    const totalDiscrepancy = mismatches.reduce((sum, p) => {
        const net = parseFloat(p.transaction?.net_amount) || 0;
        const or =
            parseFloat(p.transaction?.officialReceipt?.total_amount) || 0;
        return sum + (or - net);
    }, 0);

    const formatPaymentType = (p) => {
        const isProject = !!p.clientsProject?.project;
        return isProject ? "Project" : "Subscription";
    };

    return (
        <div className="w-full p-5">
            {/* Summary cards */}
            <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500">Total mismatches</p>
                    <p className="text-xl font-medium text-gray-800">
                        {mismatches.length}
                    </p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500">Total discrepancy</p>
                    <p
                        className={`text-xl font-medium ${totalDiscrepancy < 0 ? "text-red-600" : "text-green-700"}`}
                    >
                        {totalDiscrepancy < 0 ? "−" : "+"}₱
                        {formatCurrency(Math.abs(totalDiscrepancy))}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-auto rounded-lg border border-gray-200">
                <table className="w-full bg-white border-separate border-spacing-0 text-sm">
                    <thead className="sticky top-0 z-20 bg-cyan-800">
                        <tr>
                            {[
                                "Invoice no.",
                                "S.I/ACK no.",
                                "Service type",
                                "Service name",
                                "Client name",
                                "Total invoice",
                                "Total O.R",
                                "Difference",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-2 text-white text-sm font-medium text-left whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {mismatches.length > 0 ? (
                            mismatches.map((p) => {
                                const isProject = !!p.clientsProject?.project;
                                const netAmount =
                                    parseFloat(p.transaction?.net_amount) || 0;
                                const orTotal =
                                    parseFloat(
                                        p.transaction?.officialReceipt
                                            ?.total_amount,
                                    ) || 0;
                                const diff = orTotal - netAmount;

                                const siOrAckNo =
                                    p.transaction?.officialReceipt
                                        ?.service_invoice_number ||
                                    p.transaction?.officialReceipt
                                        ?.payment_acknowledgement_number ||
                                    "—";

                                const serviceName =
                                    p.clientsProject?.project?.title ??
                                    p.clientsProject?.subscription?.title ??
                                    "—";

                                const clientName =
                                    p.clientsProject?.client?.name ?? "—";

                                return (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-red-50 transition-colors"
                                    >
                                        <td className="border-b border-gray-200 px-4 py-2 font-mono text-xs text-gray-700">
                                            {p.invoice_number ?? "—"}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 font-mono text-xs text-gray-700">
                                            {siOrAckNo}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2">
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isProject ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                                            >
                                                {formatPaymentType(p)}
                                            </span>
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                                            {serviceName}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                                            {clientName}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                            ₱{formatCurrency(netAmount)}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                            ₱{formatCurrency(orTotal)}
                                        </td>
                                        <td
                                            className={`border-b border-gray-200 px-4 py-2 text-right font-mono text-xs font-semibold ${diff < 0 ? "text-red-600" : "text-green-700"}`}
                                        >
                                            {diff < 0 ? "−" : "+"}₱
                                            {formatCurrency(Math.abs(diff))}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-10 text-center text-gray-400"
                                >
                                    No mismatches found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
