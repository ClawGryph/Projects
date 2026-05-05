/**
 * Calculate withholding tax based on client type, annual gross, and vat type.
 *
 * Rules:
 * - vat_other → no withholding tax
 * - Government → 1% of total_amount (base + vat)
 * - Private Corporation & annual_gross > 3M → 2% of base_amount
 * - Private Corporation & annual_gross <= 3M → 1% of base_amount
 *
 * @param {Object} params
 * @param {string} params.clientType       - e.g. "Government" | "Private Corporation"
 * @param {number} params.annualGross      - company annual gross
 * @param {string} params.vatType          - e.g. "vat_exempt" | "vat_exclusive" | "vat_inclusive" | "vat_other"
 * @param {number} params.baseAmount       - base amount (excluding VAT)
 * @param {number} params.totalAmount      - total amount (base + vat)
 *
 * @returns {{ rate: number, tax: number, base: number }}
 */
export function calcWithholdingTax({
    clientType,
    annualGross,
    vatType,
    baseAmount,
    totalAmount,
}) {
    if (vatType === "vat_other") {
        return { rate: 0, tax: 0, base: 0 };
    }

    if (clientType === "Government") {
        const rate = 0.01;
        const base = totalAmount;
        return { rate, base, tax: Math.round(base * rate * 100) / 100 };
    }

    if (clientType === "Private Corporation") {
        const rate = annualGross >= 3_000_000 ? 0.02 : 0.01;
        const base = baseAmount;
        return { rate, base, tax: Math.round(base * rate * 100) / 100 };
    }

    return { rate: 0, tax: 0, base: 0 };
}
