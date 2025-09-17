import morphdom from "morphdom";

/**
 * This module provides two main functions for dynamic DOM manipulation,
 * inspired by HTMX, but with full control via JavaScript.
 */

/**
 * Restores the DOM state based on a state object saved from history.
 * Handles selectors that match multiple elements.
 */
const restoreState = (state, rootElement = document) => {
    if (!state || !state.swaps) return;
    for (const swap of state.swaps) {
        const { selector: targetSelector } = parseSelector(
            swap.selector,
            "outerHTML"
        );
        const targetElements = rootElement.querySelectorAll(targetSelector);

        // Ensure the number of saved elements matches the number of found elements
        if (targetElements.length === swap.htmls.length) {
            targetElements.forEach((element, index) => {
                // Using replaceWith on a temporary element is safer than setting outerHTML on a live NodeList
                const tempEl = document.createElement("div");
                tempEl.innerHTML = swap.htmls[index];
                if (tempEl.firstChild) {
                    element.replaceWith(tempEl.firstChild);
                }
            });
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
 * Captures the current state of elements targeted by strategies and actions.
 * Handles selectors that match multiple elements.
 */
const captureState = (strategies, actions, rootElement = document) => {
    const selectors = new Set();

    if (strategies) {
        strategies.forEach((s) => s.target && selectors.add(s.target));
    }
    if (actions) {
        actions.forEach(
            (a) =>
                a.selector &&
                a.selector !== "window" &&
                selectors.add(a.selector)
        );
    }

    const currentState = [];
    for (const selector of selectors) {
        const { selector: targetSelector } = parseSelector(
            selector,
            "outerHTML"
        );
        const targetElements = rootElement.querySelectorAll(targetSelector);

        if (targetElements.length > 0) {
            const htmls = Array.from(targetElements).map((el) => el.outerHTML);
            currentState.push({
                selector: selector,
                htmls: htmls,
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
    // Priority 1: Explicit strategies always win.
    if (strategies && strategies.length > 0) {
        const parser = new DOMParser();
        const sourceDoc = parser.parseFromString(htmlContent, "text/html");
        for (const strategy of strategies) {
            const { selector: sourceSelector, mode: sourceMode } =
                parseSelector(strategy.select, "outerHTML");

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
                        targetElement.insertAdjacentHTML(
                            targetMode,
                            contentToSwap
                        );
                        break;
                }
            }
        }
        return;
    }

    // If no strategies, attempt smart swap.
    const parser = new DOMParser();
    const sourceDoc = parser.parseFromString(htmlContent, "text/html");
    const sourceRoot = sourceDoc.body.firstElementChild;

    // Priority 2: Partial swap if the response has a single root element with an ID.
    if (sourceRoot && sourceRoot.id && sourceDoc.body.childElementCount === 1) {
        const targetElement = rootElement.querySelector(`#${sourceRoot.id}`);
        if (targetElement) {
            morphdom(targetElement, sourceRoot);
            return;
        }
    }

    // Priority 3: Full body swap if the response looks like a full document.
    if (htmlContent.toLowerCase().includes("<html")) {
        morphdom(rootElement.documentElement, sourceDoc.documentElement);
        return;
    }

    // Fallback: If no strategies and no identifiable target, do nothing and warn.
    console.warn(
        "[CuboMX] Smart swap failed: No explicit strategies were found, and the response could not be automatically placed because it is not a full document or a partial with a root ID. The HTML was ignored."
    );
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
        const currentState = captureState(strategies, actions, rootElement);
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

        const htmlContent = await response.text();

        // If we have strategies OR we have HTML content (for a potential smart swap)
        if (finalStrategies || htmlContent) {
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
            // This only runs if there are no strategies and no HTML, but there are actions.
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

export { request, swapHTML, processActions };
