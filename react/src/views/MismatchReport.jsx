import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import MismatchReportTable from "../components/MismatchReportTable";

export default function MismatchReport() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosClient
            .get("/transactions")
            .then(({ data }) => setTransactions(data?.data ?? data ?? []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                Loading...
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-800">
                    Mismatch Report
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Transactions where the invoice total amount does not match
                    the O.R. total.
                </p>
            </div>
            <MismatchReportTable transactions={transactions} />
        </div>
    );
}
