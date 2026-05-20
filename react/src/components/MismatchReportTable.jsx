import { useState, useEffect } from "react";
import axiosClient from "../axios-client";

export default function MismatchReportTable({ transactions = [] }) {
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

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
        const totalSI =
            parseFloat(p.transaction?.officialReceipt?.total_amount) || 0;
        const totalPaid = parseFloat(p.transaction?.net_amount) || 0;

        return p.status === "paid" && p.is_or_issued && totalPaid !== totalSI;
    });

    const formatPaymentType = (p) => {
        const isProject = !!p.clientsProject?.project;
        return isProject ? "Project" : "Subscription";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                Loading...
            </div>
        );
    }

    return (
        <div className="w-full p-5">
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
                                "Total service",
                                "Total invoice",
                                "Total S.I/ACK",
                                "Total paid",
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

                                const totalService =
                                    parseFloat(p.base_amount) || 0;
                                const totalInvoice =
                                    parseFloat(p.total_amount) || 0;
                                const totalSI =
                                    parseFloat(
                                        p.transaction?.officialReceipt
                                            ?.total_amount,
                                    ) || 0;
                                const totalPaid =
                                    parseFloat(p.transaction?.net_amount) || 0;

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
                                            ₱{formatCurrency(totalService)}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                            ₱{formatCurrency(totalInvoice)}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                            ₱{formatCurrency(totalSI)}
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-2 text-right font-mono text-xs text-gray-700">
                                            ₱{formatCurrency(totalPaid)}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={9}
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
