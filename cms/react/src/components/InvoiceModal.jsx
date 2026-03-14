import { useRef, useState } from "react";
import chimes_logo from "../assets/chimes-logo.png";

export default function InvoiceModal({ payment, onClose }) {
    const invoiceRef = useRef();
    const [downloading, setDownloading] = useState(false);

    if (!payment) return null;

    const client = payment.clientsProject?.client ?? {};
    const project = payment.clientsProject?.project ?? {};
    const paymentInfo = payment.clientsProject?.payment ?? {};
    const isVatable = payment.clientsProject?.is_vatable === 1;

    // Invoice number: [project_id]-[payment_schedule_id]
    const invoiceNumber = `${project.id ?? "?"}-${payment.id}`;

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Payment term label
    const getTerms = () => {
        const type = paymentInfo.payment_type;
        if (type === "one_time") return "One Time";
        if (type === "recurring") {
            const r = paymentInfo.recurring_type;
            return r ? r.charAt(0).toUpperCase() + r.slice(1) : "Recurring";
        }
        if (type === "installment") return "Installment";
        return "-";
    };

    const subtotal = isVatable
        ? (parseFloat(payment.expected_amount) || 0) / 1.12
        : parseFloat(payment.expected_amount) || 0;
    const vatAmount = isVatable ? subtotal * 0.12 : 0;
    const total = subtotal + vatAmount;

    const formatPHP = (val) =>
        new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(
            val,
        );

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const jsPDF = (await import("jspdf")).default;

            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            const finalHeight = Math.min(imgHeight, pageHeight);

            pdf.addImage(imgData, "PNG", 0, 0, pageWidth, finalHeight);
            pdf.save(`Invoice-${invoiceNumber}.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col">
                {/* Action Bar */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-800">
                        Invoice Preview
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
                        >
                            {downloading ? (
                                <>
                                    <svg
                                        className="w-4 h-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                        />
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Invoice Content — inline styles kept intentionally for accurate PDF rendering */}
                <div className="p-6">
                    <div
                        ref={invoiceRef}
                        style={{
                            maxWidth: 780,
                            margin: "0 auto",
                            padding: "36px 40px",
                            fontFamily: "'Segoe UI', Arial, sans-serif",
                            fontSize: 13,
                            color: "#1a1a2e",
                            background: "#fff",
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 28,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <img
                                    src={chimes_logo}
                                    alt="Chimes Consulting Logo"
                                    style={{
                                        width: 250,
                                        maxWidth: 250,
                                        height: "auto",
                                    }}
                                />
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div
                                    style={{
                                        fontSize: 30,
                                        fontWeight: 800,
                                        letterSpacing: 3,
                                        color: "#1a1a2e",
                                    }}
                                >
                                    INVOICE
                                </div>
                                <table
                                    style={{
                                        borderCollapse: "collapse",
                                        minWidth: 260,
                                        marginLeft: "auto",
                                        marginTop: 10,
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th
                                                style={{
                                                    background: "#2980b9",
                                                    color: "#fff",
                                                    padding: "6px 20px",
                                                    fontSize: 11,
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                INVOICE #
                                            </th>
                                            <th
                                                style={{
                                                    background: "#2980b9",
                                                    color: "#fff",
                                                    padding: "6px 20px",
                                                    fontSize: 11,
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                DATE
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td
                                                style={{
                                                    padding: "6px 20px",
                                                    textAlign: "center",
                                                    border: "1px solid #d0dce8",
                                                    fontSize: 13,
                                                }}
                                            >
                                                {invoiceNumber}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "6px 20px",
                                                    textAlign: "center",
                                                    border: "1px solid #d0dce8",
                                                    fontSize: 13,
                                                }}
                                            >
                                                {formatDate(payment.due_date)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bill To + Terms */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                margin: "18px 0 24px",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        background: "#2980b9",
                                        color: "#fff",
                                        padding: "5px 14px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: 1.5,
                                        display: "inline-block",
                                        marginBottom: 8,
                                    }}
                                >
                                    BILL TO
                                </div>
                                <p style={{ fontSize: 13, lineHeight: 1.8 }}>
                                    <strong>{client.name || "—"}</strong>
                                    <br />
                                    {client.company_name || ""}
                                    <br />
                                    {client.company_address || ""}
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div
                                    style={{
                                        background: "#2980b9",
                                        color: "#fff",
                                        padding: "5px 22px",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        display: "inline-block",
                                    }}
                                >
                                    {getTerms()}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "#888",
                                        marginTop: 4,
                                    }}
                                >
                                    Terms
                                </div>
                            </div>
                        </div>

                        {/* Description Table */}
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginBottom: 20,
                            }}
                        >
                            <thead>
                                <tr style={{ background: "#2980b9" }}>
                                    <th
                                        style={{
                                            color: "#fff",
                                            padding: "8px 14px",
                                            fontSize: 11,
                                            letterSpacing: 1,
                                            textAlign: "left",
                                        }}
                                    >
                                        DESCRIPTION
                                    </th>
                                    <th
                                        style={{
                                            color: "#fff",
                                            padding: "8px 14px",
                                            fontSize: 11,
                                            letterSpacing: 1,
                                            textAlign: "center",
                                        }}
                                    >
                                        QUANTITY
                                    </th>
                                    <th
                                        style={{
                                            color: "#fff",
                                            padding: "8px 14px",
                                            fontSize: 11,
                                            letterSpacing: 1,
                                            textAlign: "center",
                                        }}
                                    >
                                        UNIT PRICE
                                    </th>
                                    <th
                                        style={{
                                            color: "#fff",
                                            padding: "8px 14px",
                                            fontSize: 11,
                                            letterSpacing: 1,
                                            textAlign: "center",
                                        }}
                                    >
                                        AMOUNT
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px dashed #c8daea",
                                            verticalAlign: "top",
                                        }}
                                    >
                                        <div style={{ fontWeight: 600 }}>
                                            {project.title || "—"}
                                        </div>
                                        {project.description && (
                                            <div
                                                style={{
                                                    color: "#555",
                                                    fontSize: 12,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {project.description}
                                            </div>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px dashed #c8daea",
                                            textAlign: "center",
                                        }}
                                    >
                                        1
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px dashed #c8daea",
                                            textAlign: "center",
                                        }}
                                    >
                                        {formatPHP(subtotal)}
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px dashed #c8daea",
                                            textAlign: "center",
                                        }}
                                    >
                                        {formatPHP(subtotal)}
                                    </td>
                                </tr>
                                {[...Array(3)].map((_, i) => (
                                    <tr key={i}>
                                        <td
                                            style={{
                                                padding: "10px 14px",
                                                borderBottom:
                                                    "1px dashed #e8eef4",
                                                height: 32,
                                            }}
                                        ></td>
                                        <td
                                            style={{
                                                borderBottom:
                                                    "1px dashed #e8eef4",
                                            }}
                                        ></td>
                                        <td
                                            style={{
                                                borderBottom:
                                                    "1px dashed #e8eef4",
                                            }}
                                        ></td>
                                        <td
                                            style={{
                                                borderBottom:
                                                    "1px dashed #e8eef4",
                                            }}
                                        ></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer: Thank you + Totals */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                marginTop: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontStyle: "italic",
                                    fontSize: 15,
                                    color: "#2980b9",
                                    fontWeight: 600,
                                }}
                            >
                                Thank you for your business!
                            </div>
                            <div>
                                <table
                                    style={{
                                        borderCollapse: "collapse",
                                        minWidth: 260,
                                    }}
                                >
                                    <tbody>
                                        <tr>
                                            <td
                                                style={{
                                                    padding: "4px 16px",
                                                    color: "#555",
                                                    fontSize: 13,
                                                }}
                                            >
                                                SUBTOTAL
                                            </td>
                                            <td
                                                style={{
                                                    padding: "4px 16px",
                                                    fontSize: 13,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {formatPHP(subtotal)}
                                            </td>
                                        </tr>
                                        {isVatable && (
                                            <tr>
                                                <td
                                                    style={{
                                                        padding: "4px 16px",
                                                        color: "#555",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    VAT (12%)
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "4px 16px",
                                                        fontSize: 13,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {formatPHP(vatAmount)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td
                                                style={{
                                                    background: "#2980b9",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    padding: "8px 16px",
                                                }}
                                            >
                                                TOTAL
                                            </td>
                                            <td
                                                style={{
                                                    background: "#2980b9",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    padding: "8px 16px",
                                                    textAlign: "right",
                                                }}
                                            >
                                                PHP &nbsp; {formatPHP(total)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                {isVatable && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "#888",
                                            textAlign: "right",
                                            marginTop: 4,
                                        }}
                                    >
                                        VAT inclusive
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div style={{ marginTop: 40 }}>
                            <div
                                style={{
                                    background: "#2980b9",
                                    color: "#fff",
                                    padding: "5px 14px",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: 1.5,
                                    display: "block",
                                    marginBottom: 12,
                                }}
                            >
                                Bank Details
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    lineHeight: 2,
                                    color: "#333",
                                }}
                            >
                                <strong>Chimes Consulting OPC</strong>
                                <br />
                                <strong>TIN No:</strong> 744 328 715 000
                                <br />
                                <br />
                                <strong>Union Bank of the Philippines</strong>
                                <br />
                                <strong>Account Name:</strong> Chimes Consulting
                                OPC
                                <br />
                                <strong>Account Number:</strong> 0020 8001 1681
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
