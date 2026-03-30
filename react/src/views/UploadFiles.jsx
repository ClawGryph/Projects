import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { useStateContext } from "../context/ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../components/StatusBadge";
import UploadFileModal from "../components/UploadFileModal";

export default function UploadFiles() {
    const [transactions, setTransactions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [uploadTransaction, setUploadTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const { setNotification, user } = useStateContext();
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedOrStatus, setSelectedOrStatus] = useState("");
    const [selected2307Status, setSelected2307Status] = useState("");

    const getTransactions = () => {
        setLoading(true);
        axiosClient
            .get("/transactions")
            .then(({ data }) => {
                setTransactions(Array.isArray(data) ? data : (data.data ?? []));
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        getTransactions();
    }, []);

    useEffect(() => {
        axiosClient.get("/projects").then(({ data }) => {
            setProjects(data.data);
        });
    }, []);

    const filteredTransactions = transactions.filter((t) => {
        const or = t.official_receipt;
        const orFileStatus = or?.or_file_url ? "uploaded" : "pending";
        const form2307FileStatus = or?.form2307_file_url
            ? "uploaded"
            : "pending";

        const matchesProject =
            !selectedProject ||
            String(t.project?.id) === String(selectedProject);
        const matchesOrStatus =
            !selectedOrStatus || orFileStatus === selectedOrStatus;
        const matches2307 =
            !selected2307Status || form2307FileStatus === selected2307Status;

        return matchesProject && matchesOrStatus && matches2307;
    });

    const formatPaymentType = (type) => {
        if (!type) return "";
        return type
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const tableHeaders = [
        { key: "Paid Date" },
        { key: "Client Name" },
        { key: "Project Name" },
        { key: "Payment Details" },
        { key: "S.I / ACK No." },
        {
            key: "O.R. Status",
            render: () => (
                <div className="flex items-center justify-center gap-1">
                    <span>O.R. Status</span>
                    <div className="relative">
                        <select
                            value={selectedOrStatus}
                            onChange={(e) =>
                                setSelectedOrStatus(e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-black"
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="uploaded">Uploaded</option>
                        </select>
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`h-3 w-3 transition-colors ${selectedOrStatus ? "text-yellow-300" : "text-white/70"} text-xs`}
                        />
                    </div>
                </div>
            ),
        },
        {
            key: "2307 Status",
            render: () => (
                <div className="relative">
                    <select
                        value={selected2307Status}
                        onChange={(e) => setSelected2307Status(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-black"
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="uploaded">Uploaded</option>
                    </select>
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`h-3 w-3 transition-colors ${selected2307Status ? "text-yellow-300" : "text-white/70"} text-xs`}
                    />
                </div>
            ),
        },
        { key: "Action" },
    ];

    const columnCount = tableHeaders.filter(
        (h) => !(h.key === "Action" && user?.role_name === "viewer"),
    ).length;

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 mt-5 gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Upload Files
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Project Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Project:
                        </label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                            <option value="">All Projects</option>
                            {projects.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                    {proj.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Button */}
                    {(selectedProject ||
                        selectedOrStatus ||
                        selected2307Status) && (
                        <button
                            onClick={() => {
                                setSelectedProject("");
                                setSelectedOrStatus("");
                                setSelected2307Status("");
                            }}
                            className="text-sm text-cyan-700 hover:underline dark:text-cyan-400"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 justify-start items-center overflow-x-auto p-5">
                <div className="max-w-[1300px] w-full overflow-auto rounded-lg hide-scrollbar max-height">
                    <table className="w-full bg-white shadow-sm border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20 bg-cyan-800">
                            <tr>
                                {tableHeaders.map((header) => {
                                    if (
                                        header.key === "Action" &&
                                        user?.role_name === "viewer"
                                    )
                                        return null;
                                    return (
                                        <th
                                            key={header.key}
                                            className="px-4 py-2 text-white text-sm font-medium"
                                        >
                                            {header.render
                                                ? header.render()
                                                : header.key}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        {loading && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={columnCount}
                                        className="text-center py-4"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            </tbody>
                        )}

                        {!loading && (
                            <tbody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t) => {
                                        const or = t.official_receipt;
                                        const siOrAck =
                                            or?.service_invoice_number ||
                                            or?.payment_acknowledgement_number ||
                                            "";
                                        const orFileStatus = or?.or_file_url
                                            ? "uploaded"
                                            : "pending";
                                        const form2307FileStatus =
                                            or?.form2307_file_url
                                                ? "uploaded"
                                                : "pending";
                                        const paymentType =
                                            t.payment?.payment_type ===
                                            "recurring"
                                                ? t.payment?.recurring_type
                                                : t.payment?.payment_type;

                                        return (
                                            <tr
                                                key={t.id}
                                                className="hover:bg-cyan-50 text-center"
                                            >
                                                {/* Paid Date */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {t.paid_at || "-"}
                                                </td>

                                                {/* Client Name */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {t.client?.name ?? "-"}
                                                </td>

                                                {/* Project Name */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {t.project?.title ?? "-"}
                                                </td>

                                                {/* Payment Details */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <div className="font-semibold">
                                                        ₱
                                                        {new Intl.NumberFormat(
                                                            "en-PH",
                                                        ).format(
                                                            t.payment
                                                                ?.expected_amount,
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatPaymentType(
                                                            paymentType,
                                                        )}
                                                    </div>
                                                </td>

                                                {/* S.I / ACK No. */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    {siOrAck ? (
                                                        <span className="font-mono text-sm text-gray-700">
                                                            {siOrAck}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            No O.R. issued
                                                        </span>
                                                    )}
                                                </td>

                                                {/* O.R. Status */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <div className="flex justify-center">
                                                        <StatusBadge
                                                            status={
                                                                orFileStatus
                                                            }
                                                        />
                                                    </div>
                                                </td>

                                                {/* 2307 Status */}
                                                <td className="border-b border-gray-200 px-4 py-2">
                                                    <div className="flex justify-center">
                                                        <StatusBadge
                                                            status={
                                                                form2307FileStatus
                                                            }
                                                        />
                                                    </div>
                                                </td>

                                                {/* Action */}
                                                {user?.role_name !==
                                                    "viewer" && (
                                                    <td className="border-b border-gray-200 px-4 py-2">
                                                        <button
                                                            onClick={() =>
                                                                setUploadTransaction(
                                                                    t,
                                                                )
                                                            }
                                                            className="flex items-center gap-1.5 mx-auto text-xs text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 px-2.5 py-1.5 rounded-md transition-colors font-medium"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-3.5 w-3.5"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                            Upload
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={columnCount}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No paid transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            {uploadTransaction && (
                <UploadFileModal
                    transaction={uploadTransaction}
                    onClose={() => setUploadTransaction(null)}
                    onSaved={() => {
                        getTransactions();
                        setUploadTransaction(null);
                        setNotification("File uploaded successfully");
                    }}
                />
            )}
        </>
    );
}
