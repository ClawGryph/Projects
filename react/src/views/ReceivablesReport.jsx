import PaymentScheduleReport from "../components/PaymentScheduleReport";

export default function ReceivablesReport() {
    return (
        <PaymentScheduleReport
            variant="pending"
            title="Receivables"
            subtitle="Quarterly pending collections summary"
        />
    );
}
