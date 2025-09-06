/**
 * Navigates a nested object using a path string (e.g., 'a.b.c').
 * @param {object} obj The object to navigate.
 * @param {string} path The path to the desired property.
 * @returns {*} The found value or undefined if the path does not exist.
 */
const resolvePath = (obj, path) => {
    return path.split(".").reduce((prev, curr) => {
        return prev ? prev[curr] : undefined;
    }, obj);
};

/**
 * Replaces placeholders in a template string with values from a data object.
 * @param {string} template The template string.
 * @param {object} data A data object with key-value pairs.
 * @returns {string} The rendered template.
 */
const renderTemplate = (template, data) => {
    // Remove Jinja-style comments {# ... #} and statements {% ... %}
    const cleanTemplate = template
        .replace(/{#[\s\S]*?#}/g, "")
        .replace(/{%[\s\S]*?%}/g, "");

    if (!data) {
        return cleanTemplate;
    }

    // Then, replace placeholders {{ ... }} in the cleaned template.
    return cleanTemplate.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
        const trimmedKey = key.trim();
        const value = resolvePath(data, trimmedKey);
        return value !== undefined ? value : "";
    });
};

export { renderTemplate };
