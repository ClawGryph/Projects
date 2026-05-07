/**
 * Calculate base_amount, vat_amount, and total_amount.
 *
 * vat_exclusive — price does NOT yet include VAT, add 12% on top:
 *   base   = price
 *   vat    = price × 0.12
 *   total  = price × 1.12
 *
 * vat_inclusive — price ALREADY contains 12% VAT, back-calculate:
 *   base   = price ÷ 1.12
 *   vat    = price − (price ÷ 1.12)
 *   total  = price
 *
 * vat_exempt — no VAT at all:
 *   base   = price
 *   vat    = 0
 *   total  = price
 */
export const calcVat = (price, vatType) => {
    const p = parseFloat(price) || 0;

    if (vatType === "vat_exclusive") {
        return {
            base_amount: parseFloat(p.toFixed(2)),
            vat_amount: parseFloat((p * 0.12).toFixed(2)),
            total_amount: parseFloat((p * 1.12).toFixed(2)),
        };
    }

    if (vatType === "vat_inclusive") {
        return {
            base_amount: parseFloat((p / 1.12).toFixed(2)),
            vat_amount: parseFloat((p - p / 1.12).toFixed(2)),
            total_amount: parseFloat(p.toFixed(2)),
        };
    }

    // vat_exempt & vat_other
    return {
        base_amount: parseFloat(p.toFixed(2)),
        vat_amount: 0,
        total_amount: parseFloat(p.toFixed(2)),
    };
};
