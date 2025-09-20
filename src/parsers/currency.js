
const getResolvedOptions = (config = {}, el) => {
    const localLocale = el?.dataset.locale;
    const localCurrency = el?.dataset.currency;

    const locale = (localLocale || config.locale || navigator.language).toLowerCase();
    const currency = (localCurrency || config.currency || 'USD').toUpperCase();

    return { locale, currency };
};

const getDecimalSeparator = (locale) => {
    const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
    return parts.find(part => part.type === 'decimal')?.value || '.';
}

export const currencyParser = {
    /**
     * Parses a formatted currency string into a number.
     * @param {string} value The string value from the DOM (e.g., "R$ 1.999,99").
     * @param {HTMLElement} el The element the directive is on.
     * @param {object} config The global CuboMX config.
     * @returns {number | null} The parsed number.
     */
    parse(value, el, config) {
        if (typeof value !== 'string') {
            return value;
        }

        const { locale } = getResolvedOptions(config, el);
        const decimalSeparator = getDecimalSeparator(locale);

        // 1. Remove everything that is not a digit, the decimal separator, or a minus sign.
        const regex = new RegExp(`[^0-9${decimalSeparator}-]+`, 'g');
        const cleanedString = value.replace(regex, '');

        // 2. Replace the locale-specific decimal separator with a standard period.
        const normalizedString = cleanedString.replace(decimalSeparator, '.');

        const number = parseFloat(normalizedString);
        return isNaN(number) ? null : number;
    },

    /**
     * Formats a number into a currency string.
     * @param {number} value The numeric value from the state.
     * @param {HTMLElement} el The element the directive is on.
     * @param {object} config The global CuboMX config.
     * @returns {string} The formatted currency string (e.g., "$1,999.99").
     */
    format(value, el, config) {
        if (value === null || value === undefined || isNaN(value)) {
            return "";
        }

        const { locale, currency } = getResolvedOptions(config, el);

        try {
            return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
        } catch (e) {
            console.error(`[CuboMX] Currency formatting failed for locale '${locale}' and currency '${currency}'.`, e);
            return String(value); // Fallback to simple string conversion
        }
    }
};
