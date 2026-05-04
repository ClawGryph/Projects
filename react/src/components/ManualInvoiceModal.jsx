import { useRef, useState, useEffect } from "react";
import chimes_logo from "../assets/chimes-logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";
import axiosClient from "../axios-client";

const generateId = () => Math.random().toString(36).slice(2, 9);

export default function ManualInvoiceModal({ payment, onClose, company }) {
    const invoiceRef = useRef();
    const [downloading, setDownloading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState(null); // "saved" | "error" | null

    if (!payment) return null;

    const client = payment.clientsProject?.client ?? {};
    const project =
        payment.clientsProject?.project ??
        payment.clientsProject?.subscription ??
        {};
    const paymentInfo = payment.clientsProject?.payment ?? {};
    const invoiceNumber = payment.invoice_number;
    const vatType = payment.clientsProject?.vat_type ?? "vat_exempt";
    const isVatExclusive = vatType === "vat_exclusive";
    const isVatInclusive = vatType === "vat_inclusive";
    const isVatable = isVatExclusive || isVatInclusive;

    // Payment term label
    const getTerms = () => {
        const type = paymentInfo.payment_type;
        const total = payment.total_schedules ?? paymentInfo.number_of_cycles;
        const index = payment.schedule_index ?? "?";
        if (type === "one_time") return "One Time";
        if (type === "recurring") {
            const r = paymentInfo.recurring_type;
            const label = r
                ? r.charAt(0).toUpperCase() + r.slice(1)
                : "Recurring";
            return total > 1 ? `${label} ${index}/${total}` : label;
        }
        if (type === "installment") {
            return total ? `Installment ${index}/${total}` : "Installment";
        }
        return "";
    };

    const terms = getTerms();
    const dueDate = payment.due_date ?? "";
    const billName = client.name ?? "";
    const billCompany = client.company_name ?? "";
    const billAddress = client.company_address ?? "";
    const billType = client.company_type ?? "";
    const clientType = client.company_type ?? "";
    const annualGross = parseFloat(company?.annual_gross) || 0;

    // Determines withholding tax rate based on client type and companies annual gross
    const getWithholdingRate = () => {
        if (clientType === "Private Corporation") {
            return annualGross >= 3_000_000 ? 0.02 : 0.01;
        }
        if (clientType === "Government") {
            return 0.01;
        }
        return 0;
    };

    const withholdingRate = getWithholdingRate();

    // subtotal base on payment amount and vat type
    const getDefaultSubtotal = () => parseFloat(payment.base_amount) || 0;

    // Only line items are editable
    const [lineItems, setLineItems] = useState([
        {
            id: generateId(),
            description: project.title ?? "",
            note: project.description ?? "",
            qty: 1,
            unitPrice: parseFloat(getDefaultSubtotal().toFixed(2)),
        },
    ]);

    // Load saved draft on mount — only restores line items
    useEffect(() => {
        setLoading(true);
        axiosClient
            .get("/manual-invoices", { params: { schedule_id: payment.id } })
            .then(({ data }) => {
                const d = data.data;
                if (!d) return;
                if (d.line_items?.length) {
                    setLineItems(
                        d.line_items.map((item) => ({
                            ...item,
                            id: generateId(),
                        })),
                    );
                }
            })
            .catch((err) =>
                console.error("Failed to load manual invoice draft:", err),
            )
            .finally(() => setLoading(false));
    }, [payment.id]);

    // Save — persists only line items; other fields always come from the schedule
    const handleSave = () => {
        setSaving(true);
        setSaveStatus(null);
        axiosClient
            .post("/manual-invoices", {
                payment_schedule_id: payment.id,
                invoice_number: invoiceNumber,
                due_date: dueDate || null,
                terms,
                vat_type: vatType,
                bill_name: billName,
                bill_company: billCompany,
                bill_address: billAddress,
                line_items: lineItems.map(({ id, ...rest }, index) => {
                    const qty = parseFloat(rest.qty) || 0;
                    const unitPrice = parseFloat(rest.unitPrice) || 0;
                    const amount = qty * unitPrice;
                    const vat_amount = isVatExclusive ? amount * 0.12 : 0;

                    return {
                        description: rest.description,
                        note: rest.note,
                        qty,
                        unitPrice,
                        amount,
                        vat_amount,
                        is_additional: index !== 0,
                    };
                }),
            })
            .then(() => setSaveStatus("saved"))
            .catch(() => setSaveStatus("error"))
            .finally(() => setSaving(false));
    };

    const markDirty = () => setSaveStatus(null);

    // Line item helpers
    const addLineItem = () => {
        setLineItems((prev) => [
            ...prev,
            {
                id: generateId(),
                description: "",
                note: "",
                qty: 1,
                unitPrice: 0,
            },
        ]);
        markDirty();
    };
    const removeLineItem = (id) => {
        setLineItems((prev) => prev.filter((i) => i.id !== id));
        markDirty();
    };
    const updateLineItem = (id, field, value) => {
        setLineItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
        );
        markDirty();
    };

    // Calculates by adding up the line items in an invoice
    const subtotal = lineItems.reduce(
        (s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0),
        0,
    );

    const firstItemSubtotal = (() => {
        const first = lineItems[0];
        return (
            (parseFloat(first?.qty) || 0) * (parseFloat(first?.unitPrice) || 0)
        );
    })();

    // Calculates vat amount (12%)
    const vatAmount = isVatExclusive
        ? subtotal * 0.12 // all items
        : isVatInclusive
          ? firstItemSubtotal * 0.12 // first item only
          : 0;
    const total = subtotal + vatAmount;

    // Private Corp → based on subtotal (excluding VAT)
    // Government → based on total (including VAT)
    const withholdingBase = clientType === "Government" ? total : subtotal;
    const withholdingTax = withholdingBase * withholdingRate;
    const netAmount = total - withholdingTax;

    // Converts numbers into philippine peso format with proper decimal places
    const formatPHP = (val) =>
        new Intl.NumberFormat("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

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
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();
            const ih = (canvas.height * pw) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pw, Math.min(ih, ph));
            pdf.save(`Invoice-${invoiceNumber}.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setDownloading(false);
        }
    };

    // Styling input fields
    const inputCls =
        "border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto flex flex-col">
                {/* ── Action Bar ── */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Manual Invoice
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {loading
                                ? "Loading saved draft…"
                                : "Edit line items, save your draft, then download as PDF"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {saveStatus === "saved" && (
                            <span className="text-xs text-emerald-600 font-medium">
                                ✓ Saved
                            </span>
                        )}
                        {saveStatus === "error" && (
                            <span className="text-xs text-red-500 font-medium">
                                Failed to save
                            </span>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
                        >
                            {saving ? (
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
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon
                                        icon={faSave}
                                        className="w-4 h-4"
                                    />
                                    Save Draft
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading || loading}
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
                                    Generating…
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

                <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0">
                    {/* ── Left: Line Items Editor Only ── */}
                    <div className="w-full lg:w-72 shrink-0 border-r border-gray-100 bg-gray-50 p-5 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                                Loading draft…
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Line Items
                                </p>
                                <div className="space-y-3">
                                    {lineItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-400">
                                                    Item {idx + 1}
                                                </span>
                                                {lineItems.length > 1 && (
                                                    <button
                                                        onClick={() =>
                                                            removeLineItem(
                                                                item.id,
                                                            )
                                                        }
                                                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faTrash}
                                                            className="h-3 w-3"
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-0.5 block">
                                                    Description
                                                </label>
                                                <input
                                                    className={inputCls}
                                                    value={item.description}
                                                    placeholder="Service / item name"
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            item.id,
                                                            "description",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-0.5 block">
                                                    Note (optional)
                                                </label>
                                                <input
                                                    className={inputCls}
                                                    value={item.note}
                                                    placeholder="Additional detail"
                                                    onChange={(e) =>
                                                        updateLineItem(
                                                            item.id,
                                                            "note",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-20">
                                                    <label className="text-xs text-gray-500 mb-0.5 block">
                                                        Qty
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className={inputCls}
                                                        value={item.qty}
                                                        onChange={(e) =>
                                                            updateLineItem(
                                                                item.id,
                                                                "qty",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500 mb-0.5 block">
                                                        Unit Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className={inputCls}
                                                        value={item.unitPrice}
                                                        onChange={(e) =>
                                                            updateLineItem(
                                                                item.id,
                                                                "unitPrice",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addLineItem}
                                        className="flex items-center gap-1.5 text-sm text-cyan-700 hover:text-cyan-900 font-medium transition-colors cursor-pointer mt-1"
                                    >
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            className="h-3 w-3"
                                        />
                                        Add item
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Invoice Preview ── */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white">
                        <div
                            ref={invoiceRef}
                            style={{
                                maxWidth: 700,
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
                                <img
                                    src={chimes_logo}
                                    alt="Chimes Consulting Logo"
                                    style={{ width: 220, height: "auto" }}
                                />
                                <div style={{ textAlign: "right" }}>
                                    <div
                                        style={{
                                            fontSize: 28,
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
                                            minWidth: 240,
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
                                                        padding: "6px 18px",
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
                                                        padding: "6px 18px",
                                                        fontSize: 11,
                                                        letterSpacing: 1,
                                                    }}
                                                >
                                                    DUE DATE
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td
                                                    style={{
                                                        padding: "6px 18px",
                                                        textAlign: "center",
                                                        border: "1px solid #d0dce8",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {invoiceNumber}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "6px 18px",
                                                        textAlign: "center",
                                                        border: "1px solid #d0dce8",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {formatDate(dueDate)}
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
                                    <p
                                        style={{
                                            fontSize: 13,
                                            lineHeight: 1.8,
                                        }}
                                    >
                                        <strong>{billName || "—"}</strong>
                                        {billCompany && (
                                            <>
                                                <br />
                                                {billCompany}
                                            </>
                                        )}
                                        {billAddress && (
                                            <>
                                                <br />
                                                {billAddress}
                                            </>
                                        )}
                                    </p>
                                </div>
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
                                        Company Type
                                    </div>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            lineHeight: 1.8,
                                        }}
                                    >
                                        {client.company_type || ""}
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
                                        Terms
                                    </div>
                                    <div style={{ fontSize: 13, marginTop: 4 }}>
                                        <strong>{terms || "—"}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items Table */}
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
                                                width: 60,
                                            }}
                                        >
                                            QTY
                                        </th>
                                        <th
                                            style={{
                                                color: "#fff",
                                                padding: "8px 14px",
                                                fontSize: 11,
                                                letterSpacing: 1,
                                                textAlign: "right",
                                                width: 110,
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
                                                textAlign: "right",
                                                width: 110,
                                            }}
                                        >
                                            AMOUNT
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item) => {
                                        const qty = parseFloat(item.qty) || 0;
                                        const up =
                                            parseFloat(item.unitPrice) || 0;
                                        return (
                                            <tr key={item.id}>
                                                <td
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderBottom:
                                                            "1px dashed #c8daea",
                                                        verticalAlign: "top",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {item.description ||
                                                            "—"}
                                                    </div>
                                                    {item.note && (
                                                        <div
                                                            style={{
                                                                color: "#555",
                                                                fontSize: 11,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {item.note}
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderBottom:
                                                            "1px dashed #c8daea",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {qty}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderBottom:
                                                            "1px dashed #c8daea",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {formatPHP(up)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderBottom:
                                                            "1px dashed #c8daea",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {formatPHP(up * qty)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {[
                                        ...Array(
                                            Math.max(0, 3 - lineItems.length),
                                        ),
                                    ].map((_, i) => (
                                        <tr key={`blank-${i}`}>
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

                            {/* Totals */}
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
                                            minWidth: 240,
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
                                                        {isVatInclusive
                                                            ? "VAT Inclusive (12%) — first item"
                                                            : "VAT Exclusive (12%) — all items"}
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
                                                        padding: "4px 16px",
                                                        color: "#555",
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    TOTAL
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "4px 16px",
                                                        fontSize: 13,
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    PHP &nbsp;{" "}
                                                    {formatPHP(total)}
                                                </td>
                                            </tr>
                                            {withholdingRate > 0 && (
                                                <>
                                                    <tr>
                                                        <td
                                                            colSpan={2}
                                                            style={{
                                                                padding:
                                                                    "6px 0",
                                                            }}
                                                        />
                                                    </tr>
                                                    <tr>
                                                        <td
                                                            style={{
                                                                padding:
                                                                    "4px 16px",
                                                                color: "#555",
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            Less: Withholding
                                                            Tax (
                                                            {withholdingRate *
                                                                100}
                                                            %)
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding:
                                                                    "4px 16px",
                                                                fontSize: 13,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            -{" "}
                                                            {formatPHP(
                                                                withholdingTax,
                                                            )}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td
                                                            style={{
                                                                background:
                                                                    "#1a5276",
                                                                color: "#fff",
                                                                fontWeight: 700,
                                                                fontSize: 15,
                                                                padding:
                                                                    "8px 16px",
                                                            }}
                                                        >
                                                            NET AMOUNT DUE
                                                        </td>
                                                        <td
                                                            style={{
                                                                background:
                                                                    "#1a5276",
                                                                color: "#fff",
                                                                fontWeight: 700,
                                                                fontSize: 15,
                                                                padding:
                                                                    "8px 16px",
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            PHP &nbsp;{" "}
                                                            {formatPHP(
                                                                netAmount,
                                                            )}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>

                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "#888",
                                            textAlign: "right",
                                            marginTop: 4,
                                        }}
                                    >
                                        {vatType === "vat_inclusive"
                                            ? "VAT Inclusive (12%)"
                                            : vatType === "vat_exclusive"
                                              ? "VAT Exclusive (12%)"
                                              : "VAT Exempt"}
                                    </div>
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
                                    <strong>
                                        Union Bank of the Philippines
                                    </strong>
                                    <br />
                                    <strong>Account Name:</strong> Chimes
                                    Consulting OPC
                                    <br />
                                    <strong>Account Number:</strong> 0020 8001
                                    1681
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
