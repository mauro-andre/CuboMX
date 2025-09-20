
export const numberParser = {
    /**
     * Parses a string into a number, removing non-numeric characters except for the decimal point.
     * @param {string} value The string value from the DOM.
     * @returns {number | null} The parsed number or null if parsing fails.
     */
    parse(value) {
        if (typeof value !== 'string') {
            return value;
        }
        // Remove characters that are not digits, decimal separator, or minus sign.
        const cleanedValue = value.replace(/[^0-9.-]+/g, "");
        const number = parseFloat(cleanedValue);
        return isNaN(number) ? null : number;
    },

    /**
     * Formats a number back into a string. For the basic number parser,
     * this is essentially a no-op, just converting the number to a string.
     * @param {number} value The numeric value from the state.
     * @returns {string} The value as a string.
     */
    format(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value);
    }
};
