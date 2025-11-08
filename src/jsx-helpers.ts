/**
 * JSX/TSX Support for CuboMX
 *
 * Provides utilities to detect and render Preact VNodes to HTML strings
 * for use with CuboMX's swap functionality.
 */

import type { VNode } from "preact";

/**
 * Type guard to check if a value is a Preact VNode
 *
 * A VNode is a plain JavaScript object with specific properties:
 * - type: string (DOM element) or function (component)
 * - props: object containing component/element properties
 * - key: optional key for list rendering
 *
 * @param value - The value to check
 * @returns true if the value is a VNode, false otherwise
 */
export function isVNode(value: any): value is VNode {
    return (
        value !== null &&
        typeof value === "object" &&
        "type" in value &&
        "props" in value &&
        !("nodeType" in value) // Exclude real DOM nodes
    );
}

/**
 * Renders a Preact VNode to an HTML string
 *
 * This function dynamically imports preact-render-to-string to avoid
 * bundling it when not needed. It will throw an error if the package
 * is not installed.
 *
 * @param vnode - The Preact VNode to render
 * @returns A promise that resolves to the HTML string
 * @throws Error if preact-render-to-string is not installed
 */
export async function renderVNodeToString(vnode: VNode): Promise<string> {
    try {
        // Dynamic import to avoid bundling when not needed
        const { default: renderToString } = await import(
            "preact-render-to-string"
        );
        return renderToString(vnode);
    } catch (error) {
        throw new Error(
            "[CuboMX] JSX support requires 'preact' and 'preact-render-to-string' packages. " +
            "Install them with: npm install preact preact-render-to-string"
        );
    }
}

/**
 * Normalizes the input to an HTML string
 *
 * If the input is a VNode, it will be rendered to a string.
 * If it's already a string, it will be returned as-is.
 *
 * @param input - Either an HTML string or a Preact VNode
 * @returns A promise that resolves to an HTML string
 */
export async function normalizeToHTMLString(
    input: string | VNode
): Promise<string> {
    if (typeof input === "string") {
        return input;
    }

    if (isVNode(input)) {
        return renderVNodeToString(input);
    }

    throw new Error(
        "[CuboMX] Invalid input: expected HTML string or Preact VNode"
    );
}
