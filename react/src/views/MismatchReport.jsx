import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import MismatchReportTable from "../components/MismatchReportTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export default function MismatchReport() {
    const [transactions, setTransactions] = useState([]);
    const [paymentSchedules, setPaymentSchedules] = useState([]);
    const [mismatches, setMismatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axiosClient.get("/transactions"),
            axiosClient.get("/payment-schedules", {
                params: { status: "paid" },
            }),
            axiosClient.get("/mismatch-reports"),
        ])
            .then(([txRes, psRes, mmRes]) => {
                setTransactions(txRes.data?.data ?? txRes.data ?? []);
                setPaymentSchedules(psRes.data?.data ?? psRes.data ?? []);
                setMismatches(mmRes.data?.data ?? mmRes.data ?? []);
            })
            .finally(() => setLoading(false));
    }, []);

    const refreshMismatches = () => {
        axiosClient.get("/mismatch-reports").then((mmRes) => {
            setMismatches(mmRes.data?.data ?? mmRes.data ?? []);
        });
    };

    const exportCSV = () => {
        const mismatchedSchedules = paymentSchedules.filter((p) => {
            return mismatches.some(
                (m) =>
                    m.payment_schedule_id === p.id ||
                    m.transaction_id === p.transaction?.id ||
                    m.official_receipt_id ===
                        p.transaction?.officialReceipt?.id,
            );
        });

        const rows = [
            [
                "Invoice No.",
                "S.I/ACK No.",
                "Service Type",
                "Service Name",
                "Client Name",
                "Total Invoice",
                "Total Paid",
                "Total S.I/ACK",
                "Status",
                "Notes",
            ],
        ];

        mismatchedSchedules.forEach((p) => {
            const mismatch = mismatches.find(
                (m) =>
                    m.payment_schedule_id === p.id ||
                    m.transaction_id === p.transaction?.id ||
                    m.official_receipt_id ===
                        p.transaction?.officialReceipt?.id,
            );

            const siOrAckNo =
                p.transaction?.officialReceipt?.service_invoice_number ||
                p.transaction?.officialReceipt
                    ?.payment_acknowledgement_number ||
                "—";

            const isProject = !!p.clientsProject?.project;
            const serviceName =
                p.clientsProject?.project?.title ??
                p.clientsProject?.subscription?.title ??
                "—";
            const clientName = p.clientsProject?.client?.name ?? "—";
            const totalInvoice = parseFloat(p.total_amount) || 0;
            const totalPaid = parseFloat(p.transaction?.paid_amount) || 0;
            const totalSI =
                parseFloat(p.transaction?.officialReceipt?.total_amount) || 0;
            const status = mismatch?.is_checked
                ? "Mismatch Checked"
                : "Pending";
            const notes = mismatch?.notes ?? "";

            rows.push([
                p.invoice_number ?? "—",
                siOrAckNo,
                isProject ? "Project" : "Subscription",
                serviceName,
                clientName,
                totalInvoice.toFixed(2),
                totalPaid.toFixed(2),
                totalSI.toFixed(2),
                status,
                notes,
            ]);
        });

        const csv = rows
            .map((row) =>
                row
                    .map((val) => `"${String(val).replace(/"/g, '""')}"`)
                    .join(","),
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
            "download",
            `mismatch_report_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                Loading...
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">
                        Mismatch Report
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Transactions where the invoice total amount does not
                        match the O.R. total.
                    </p>
                </div>
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                >
                    <FontAwesomeIcon icon={faDownload} />
                    <span>Export CSV</span>
                </button>
            </div>
            <MismatchReportTable
                transactions={transactions}
                onMismatchUpdate={refreshMismatches}
            />
        </div>
    );
}
