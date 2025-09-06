/**
 * This module provides two main functions for dynamic DOM manipulation,
 * inspired by HTMX, but with full control via JavaScript.
 */

/**
 * Restores the DOM state based on a state object saved from history.
 */
const restoreState = (state, rootElement = document) => {
    if (!state || !state.swaps) return;
    for (const swap of state.swaps) {
        const { selector: targetSelector } = parseSelector(
            swap.target,
            "outerHTML"
        );
        const targetElement = rootElement.querySelector(targetSelector);
        if (targetElement) {
            targetElement.outerHTML = swap.html;
        }
    }
    window.dispatchEvent(new CustomEvent("cubo:dom-updated"));
};

const processActions = (actions, rootElement = document) => {
    if (!actions || !Array.isArray(actions)) return;

    for (const action of actions) {
        const elements =
            action.selector === "window"
                ? [window]
                : rootElement.querySelectorAll(action.selector);
        if (!elements.length && action.selector !== "window") continue;

        switch (action.action) {
            case "addClass":
                elements.forEach((el) => el.classList.add(action.class));
                break;
            case "removeClass":
                elements.forEach((el) => el.classList.remove(action.class));
                break;
            case "setAttribute":
                elements.forEach((el) =>
                    el.setAttribute(action.attribute, action.value)
                );
                break;
            case "removeElement":
                elements.forEach((el) => el.remove());
                break;
            case "setTextContent":
                elements.forEach((el) => (el.textContent = action.text));
                break;
            case "dispatchEvent":
                const eventDetail = action.detail || {};
                const customEvent = new CustomEvent(action.event, {
                    detail: eventDetail,
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                });
                elements.forEach((el) => el.dispatchEvent(customEvent));
                break;
        }
    }
};

/**
 * Captures the current state of the elements that will be swapped.
 */
const captureState = (strategies, rootElement = document) => {
    const currentState = [];
    for (const strategy of strategies) {
        const { selector: targetSelector } = parseSelector(
            strategy.target,
            "outerHTML"
        );
        const targetElement = rootElement.querySelector(targetSelector);
        if (targetElement) {
            currentState.push({
                target: strategy.target,
                html: targetElement.outerHTML,
            });
        }
    }
    return currentState;
};

/**
 * Parses a selector with an optional mode (e.g., "#id:innerHTML").
 */
const parseSelector = (selectorWithMode, defaultMode) => {
    if (typeof selectorWithMode !== "string") {
        return { selector: selectorWithMode, mode: defaultMode };
    }
    const lastColonIndex = selectorWithMode.lastIndexOf(":");
    if (
        lastColonIndex === -1 ||
        lastColonIndex < selectorWithMode.indexOf("[")
    ) {
        return { selector: selectorWithMode, mode: defaultMode };
    }
    const selector = selectorWithMode.substring(0, lastColonIndex);
    const mode = selectorWithMode.substring(lastColonIndex + 1);
    const validModes = [
        "innerHTML",
        "outerHTML",
        "beforebegin",
        "afterbegin",
        "beforeend",
        "afterend",
    ];
    if (validModes.includes(mode)) {
        return { selector, mode };
    }
    return { selector: selectorWithMode, mode: defaultMode };
};

const syncAttributes = (target, source) => {
    for (const attr of source.attributes) {
        if (target.getAttribute(attr.name) !== attr.value) {
            target.setAttribute(attr.name, attr.value);
        }
    }
    for (const attr of target.attributes) {
        if (!source.hasAttribute(attr.name)) {
            target.removeAttribute(attr.name);
        }
    }
};

const replaceElements = (targetElement, sourceElement, selectors) => {
    for (const selector of selectors) {
        const sourceNodes = sourceElement.querySelectorAll(selector);
        const targetNodes = targetElement.querySelectorAll(selector);
        if (sourceNodes.length === targetNodes.length) {
            targetNodes.forEach((node, i) => {
                node.replaceWith(sourceNodes[i]);
            });
        }
    }
};

/**
 * Applies DOM swaps based on strategies and the source HTML.
 */
const applySwaps = (strategies, htmlContent, rootElement = document) => {
    const parser = new DOMParser();
    const sourceDoc = parser.parseFromString(htmlContent, "text/html");

    for (const strategy of strategies) {
        const { selector: sourceSelector, mode: sourceMode } = parseSelector(
            strategy.select,
            "outerHTML"
        );

        let targetElement = strategy.target;
        if (typeof strategy.target === "string") {
            const { selector: targetSelector } = parseSelector(
                strategy.target,
                "outerHTML"
            );
            targetElement = rootElement.querySelector(targetSelector);
        }

        const { mode: targetMode } = parseSelector(
            strategy.target,
            "outerHTML"
        );
        const sourceElement = sourceDoc.querySelector(sourceSelector);

        if (!sourceElement || !targetElement) continue;

        if (strategy.sync) {
            syncAttributes(targetElement, sourceElement);
            const targetChildren = Array.from(
                targetElement.querySelectorAll("*")
            );
            const sourceChildren = Array.from(
                sourceElement.querySelectorAll("*")
            );
            if (targetChildren.length === sourceChildren.length) {
                targetChildren.forEach((child, i) => {
                    syncAttributes(child, sourceChildren[i]);
                });
            }
        }

        if (strategy.replaceElements) {
            replaceElements(
                targetElement,
                sourceElement,
                strategy.replaceElements
            );
        }

        if (!strategy.sync && !strategy.replaceElements) {
            const contentToSwap =
                sourceMode === "innerHTML"
                    ? sourceElement.innerHTML
                    : sourceElement.outerHTML;
            switch (targetMode) {
                case "innerHTML":
                    targetElement.innerHTML = contentToSwap;
                    break;
                case "outerHTML":
                    targetElement.outerHTML = contentToSwap;
                    break;
                default:
                    targetElement.insertAdjacentHTML(targetMode, contentToSwap);
                    break;
            }
        }
    }
};

/**
 * Central function that orchestrates DOM and browser history updates.
 */
const processDOMUpdate = (
    htmlContent,
    strategies,
    {
        targetUrl = null,
        history = false,
        rootElement = document,
        actions = null,
    }
) => {
    if (history && targetUrl) {
        const currentState = captureState(strategies, rootElement);
        window.history.replaceState(
            { swaps: currentState },
            "",
            window.location.href
        );
    }
    applySwaps(strategies, htmlContent, rootElement);

    if (actions) {
        processActions(actions, rootElement);
    }

    if (targetUrl) {
        const stateObject = history ? { swaps: [] } : {};
        window.history.pushState(stateObject, "", targetUrl);
    }
    window.dispatchEvent(new CustomEvent("cubo:dom-updated"));
};

/**
 * @summary Updates the DOM from HTML content and local strategies.
 * @param {string} htmlContent - The source HTML content containing the elements to be swapped.
 * @param {Array<Object>} strategies - The list of swap strategies. E.g., [{ select: '#src', target: '#dest' }]
 * @param {Object} [options={}] - Options for URL, history, and scope control.
 * @param {string} [options.targetUrl] - The new URL to display in the address bar.
 * @param {boolean} [options.history] - Whether the change should be added to the browser history.
 * @param {Array<Object>} [options.actions=null] - Imperative actions to execute after the swap.
 * @param {HTMLElement} [options.rootElement=document] - The root element for selector queries.
 */
const swapHTML = (htmlContent, strategies, options = {}) => {
    processDOMUpdate(htmlContent, strategies, options);
};

/**
 * Adds or removes a loading class from the specified elements.
 */
const toggleLoadingState = (selectors, add, rootElement = document) => {
    if (!selectors || !Array.isArray(selectors)) return;
    for (const selector of selectors) {
        const elements = rootElement.querySelectorAll(selector);
        elements.forEach((el) => el.classList.toggle("x-request", add));
    }
};

/**
 * @summary Performs an asynchronous request and updates the DOM based on the response.
 * @param {Object} config - The request configuration object.
 * @param {string} config.url - The URL to which the request will be sent.
 * @param {string} [config.method='GET'] - The HTTP method to use.
 * @param {Object|FormData} [config.body=null] - The request body.
 * @param {Object} [config.headers={}] - Custom request headers.
 * @param {boolean} [config.pushUrl=false] - Fallback to update the URL if the backend does not send `X-Push-Url`.
 * @param {boolean} [config.history=false] - Whether the change should be added to the browser history.
 * @param {Array<string>} [config.loadingSelectors=[]] - Selectors to apply the 'x-request' class during the request.
 * @param {Array<Object>} [config.strategies=null] - Swap strategies, with priority over server-sent ones.
 * @param {Array<Object>} [config.actions=null] - Imperative actions to execute after the swap, with priority over server-sent ones.
 * @param {HTMLElement} [config.rootElement=document] - The root element for selector queries.
 * @returns {Promise<Object>} A promise that resolves with the status and final URL of the response.
 */
const request = async ({
    url,
    method = "GET",
    body = null,
    headers = {},
    pushUrl = false,
    history = false,
    loadingSelectors = [],
    strategies = null,
    actions = null,
    rootElement = document,
}) => {
    method = method.toUpperCase();
    const fetchOptions = {
        method,
        headers: { "X-Requested-With": "XMLHttpRequest", ...headers },
        credentials: "include",
    };

    if (method === "GET" && body) {
        const params = new URLSearchParams(body);
        url = `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
    } else if (body) {
        if (body instanceof FormData) {
            fetchOptions.body = body;
        } else {
            fetchOptions.body = JSON.stringify(body);
            if (!headers["Content-Type"]) {
                fetchOptions.headers["Content-Type"] = "application/json";
            }
        }
    }

    toggleLoadingState(loadingSelectors, true, rootElement);

    try {
        const response = await fetch(url, fetchOptions);
        let finalStrategies = strategies;
        if (!finalStrategies) {
            const strategiesHeader = response.headers.get("X-Swap-Strategies");
            if (strategiesHeader) {
                finalStrategies = JSON.parse(strategiesHeader);
            }
        }

        if (!response.ok) {
            if (finalStrategies) {
                const htmlContent = await response.text();
                processDOMUpdate(htmlContent, finalStrategies, {
                    history: false,
                    rootElement,
                });
            }
            throw new Error(
                `Request failed: ${response.status} ${response.statusText}`
            );
        }

        const redirectUrl = response.headers.get("X-Redirect");
        if (redirectUrl) {
            window.location.href = redirectUrl;
            return {
                ok: response.ok,
                status: response.status,
                redirected: true,
            };
        }

        let finalActions = actions;
        if (!finalActions) {
            const actionsHeader = response.headers.get("X-Cubo-Actions");
            if (actionsHeader) {
                finalActions = JSON.parse(actionsHeader);
            }
        }

        if (finalStrategies) {
            const htmlContent = await response.text();
            const finalUrl = response.url;
            const pushUrlFromHeader = response.headers.get("X-Push-Url");
            const targetUrl = pushUrlFromHeader || (pushUrl ? finalUrl : null);
            processDOMUpdate(htmlContent, finalStrategies, {
                targetUrl,
                history,
                rootElement,
                actions: finalActions,
            });
        } else if (finalActions) {
            // Process actions even if there is no HTML swap
            processActions(finalActions, rootElement);
        }

        return { ok: response.ok, status: response.status, url: response.url };
    } catch (error) {
        console.error("Request operation failed:", error);
        throw error;
    } finally {
        toggleLoadingState(loadingSelectors, false, rootElement);
    }
};

window.addEventListener("popstate", (event) => restoreState(event.state));

export { request, swapHTML };
