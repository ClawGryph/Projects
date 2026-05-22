/**
 * Calculate withholding tax based on service type rate.
 *
 * @param {Object} params
 * @param {number} params.totalAmount     - total amount (base + vat)
 * @param {number} params.serviceTypeRate - rate from service type (e.g. 10 for 10%)
 *
 * @returns {{ rate: number, tax: number, base: number }}
 */
export function calcWithholdingTax({ totalAmount, serviceTypeRate }) {
    const rate = serviceTypeRate / 100;
    const tax = Math.round(totalAmount * rate * 100) / 100;

    return { rate, tax, base: totalAmount };
}
