import { MxElement } from "./types";

/**
 * Preprocesses bindings on an element tree by replacing bound attributes with actual values.
 * This is the inverse of parsing - instead of reading from DOM to create proxy,
 * it writes from data object to DOM.
 *
 * @param element - Root element to process (will also process all descendants)
 * @param data - Object with property values to set
 * @param prefixes - Array of binding prefixes to look for (e.g., ["::", "mx-item:"] or [":", "mx-bind:"])
 */
const preprocessBindings = (
    element: MxElement,
    data: Record<string, any>,
    prefixes: string[]
): void => {
    const allElements = [element, ...Array.from(element.querySelectorAll<MxElement>("*"))];

    for (const el of allElements) {
        for (const attr of Array.from(el.attributes)) {
            // Check if attribute starts with any of the prefixes
            const matchedPrefix = prefixes.find(prefix => attr.name.startsWith(prefix));
            if (!matchedPrefix) continue;

            // Extract the bind type (e.g., "text", "value", "class", etc)
            const bindType = attr.name.replace(matchedPrefix, "");

            // Get the property name from the attribute value
            const propName = attr.value;

            // Get the value from data object
            const value = data[propName];

            // Skip if property doesn't exist in data
            if (value === undefined) continue;

            // Set the value based on bind type
            if (bindType === "text") {
                el.textContent = String(value);
            } else if (bindType === "html") {
                el.innerHTML = String(value);
            } else if (bindType === "value") {
                (el as HTMLInputElement | HTMLTextAreaElement).value = String(value);
            } else if (bindType === "checked") {
                (el as HTMLInputElement).checked = Boolean(value);
            } else if (bindType === "class") {
                if (Array.isArray(value)) {
                    el.className = value.filter(c => c && typeof c === "string").join(" ");
                } else if (typeof value === "string") {
                    el.className = value;
                }
            } else if (bindType === "el") {
                // :el doesn't need preprocessing - it's just a reference
                continue;
            } else {
                // Regular attribute binding
                el.setAttribute(bindType, String(value));
            }
        }
    }
};

export { preprocessBindings };
