import PaymentScheduleReport from "../components/PaymentScheduleReport";

export default function OverdueReport() {
    return (
        <PaymentScheduleReport
            variant="overdue"
            title="Overdue"
            subtitle="Quarterly overdue collections summary"
        />
    );
}
