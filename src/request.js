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
    if (!state) return;

    // Restore title if it exists in the state
    if (state.title) {
        document.title = state.title;
    }

    if (!state.swaps) return; // Check for swaps after handling title

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

const processActions = (actions, rootElement = document, activeProxies = {}) => {
    if (!actions || !Array.isArray(actions)) return;

    for (const action of actions) {
        switch (action.action) {
            case "setProperty": {
                const path = action.property;
                const value = action.value;
                const dotIndex = path.indexOf('.');

                if (dotIndex === -1) {
                    console.error('[CuboMX] setProperty action requires a path in the format "componentName.propertyName"');
                    continue;
                }

                const componentName = path.substring(0, dotIndex);
                const propertyPath = path.substring(dotIndex + 1);
                const component = activeProxies[componentName];

                if (!component) {
                    console.error(`[CuboMX] setProperty failed: component '${componentName}' not found.`);
                    continue;
                }

                const pathParts = propertyPath.split('.');
                const finalProp = pathParts.pop();
                let current = component;

                for (const part of pathParts) {
                    if (current[part] === undefined || current[part] === null) {
                        current[part] = {};
                    }
                    current = current[part];
                }

                current[finalProp] = value;
                break;
            }
            // Actions that don't require a selector
            case "pushUrl":
                if (action.url) {
                    // First, update the state for the CURRENT page to include its title
                    const currentState = window.history.state || {};
                    window.history.replaceState(
                        { ...currentState, title: document.title },
                        "",
                        window.location.href
                    );

                    // Now, push the NEW page state
                    const newTitle = action.title || document.title;
                    window.history.pushState(
                        { title: newTitle },
                        newTitle,
                        action.url
                    );
                    if (action.title) {
                        document.title = action.title;
                    }
                }
                break;

            // Default case for actions that DO require a selector
            default: {
                const elements =
                    action.selector === "window"
                        ? [window]
                        : rootElement.querySelectorAll(action.selector);
                if (!elements.length && action.selector !== "window") continue;

                switch (action.action) {
                    case "addClass":
                        elements.forEach((el) =>
                            el.classList.add(action.class)
                        );
                        break;
                    case "removeClass":
                        elements.forEach((el) =>
                            el.classList.remove(action.class)
                        );
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
                        if (action.selector === "title") {
                            document.title = action.text;
                        } else {
                            elements.forEach(
                                (el) => (el.textContent = action.text)
                            );
                        }
                        break;
                    case "dispatchEvent": {
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
                break;
            }
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

const kebabToCamel = (str) =>
    str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

/**
 * Applies DOM swaps based on strategies and the source HTML.
 */
const applySwaps = (
    strategies,
    htmlContent,
    rootElement = document,
    state = null
) => {
    // Priority 1: Explicit strategies always win.
    if (strategies && strategies.length > 0) {
        const parser = new DOMParser();
        const sourceDoc = parser.parseFromString(htmlContent, "text/html");
        for (const strategy of strategies) {
            let finalSelect = strategy.select;

            // Shorthand logic: if select is missing, infer it from target.
            if (!finalSelect && strategy.target) {
                const { mode: targetMode } = parseSelector(
                    strategy.target,
                    "outerHTML"
                );
                // If mode is for replacement, select is same as target.
                if (targetMode === "outerHTML" || targetMode === "innerHTML") {
                    finalSelect = strategy.target;
                }
                // If mode is for insertion, select is 'this'.
                else {
                    finalSelect = "this";
                }
            }

            const { selector: sourceSelector, mode: sourceMode } =
                parseSelector(finalSelect, "outerHTML");

            const { selector: targetSelector, mode: targetMode } =
                parseSelector(strategy.target, "outerHTML");
            const targetElement = rootElement.querySelector(targetSelector);

            // Determine the source element based on the selector.
            const sourceElement =
                sourceSelector === "this"
                    ? sourceDoc.body
                    : sourceDoc.querySelector(sourceSelector);

            if (!sourceElement || !targetElement) continue;

            // Create a fragment and populate it with the nodes to be swapped.
            const fragment = document.createDocumentFragment();
            if (sourceSelector === "this" || sourceMode === "innerHTML") {
                fragment.append(...Array.from(sourceElement.childNodes));
            } else {
                // outerHTML
                fragment.append(sourceElement);
            }

            // Pre-process the fragment to attach initial state to components
            if (state) {
                const elements = fragment.querySelectorAll("[mx-data]");
                elements.forEach((el) => {
                    const componentName = kebabToCamel(
                        el.getAttribute("mx-data").replace("()", "")
                    );
                    if (state[componentName]) {
                        el.__cubo_initial_state__ = state[componentName];
                    }
                });
            }

            // Other swap types like sync and replaceElements are not compatible with 'this' selector
            // and will be skipped by the check above. We proceed with the main swap logic.
            if (!strategy.sync && !strategy.replaceElements) {
                // Use node-based insertion methods instead of string-based ones.
                switch (targetMode) {
                    case "innerHTML":
                        targetElement.replaceChildren(fragment);
                        break;
                    case "outerHTML":
                        targetElement.replaceWith(fragment);
                        break;
                    case "beforebegin":
                        targetElement.before(fragment);
                        break;
                    case "afterbegin":
                        targetElement.prepend(fragment);
                        break;
                    case "beforeend":
                        targetElement.append(fragment);
                        break;
                    case "afterend":
                        targetElement.after(fragment);
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
        state = null,
    },
    activeProxies
) => {
    if (history && targetUrl) {
        const currentState = captureState(strategies, actions, rootElement);
        window.history.replaceState(
            { swaps: currentState, title: document.title }, // Save title
            "",
            window.location.href
        );
    }
    applySwaps(strategies, htmlContent, rootElement, state);

    if (actions) {
        processActions(actions, rootElement, activeProxies);
    }

    if (history && targetUrl) {
        const stateObject = { swaps: [], title: document.title };
        window.history.pushState(stateObject, document.title, targetUrl);
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
 * @param {object} [options.state] - An object containing initial state for any components in the `htmlContent`.
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
const request = async (
    {
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
    },
    activeProxies
) => {
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
            processDOMUpdate(
                htmlContent,
                finalStrategies,
                {
                    targetUrl,
                    history,
                    rootElement,
                    actions: finalActions,
                },
                activeProxies
            );
        } else if (finalActions) {
            // This only runs if there are no strategies and no HTML, but there are actions.
            processActions(finalActions, rootElement, activeProxies);
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

/**
 * @summary Establishes a persistent SSE connection to receive real-time updates from the server.
 * @param {Object} config - The stream configuration object.
 * @param {string} config.url - The URL of the SSE endpoint.
 * @param {Array} [config.listeners=null] - An array of listener objects for client-defined behavior.
 * @param {string} config.listeners[].event - The named event to listen for.
 * @param {Array} config.listeners[].strategies - The swap strategies to apply for this event.
 * @param {Array} [config.listeners[].actions=null] - The actions to execute for this event.
 * @param {HTMLElement} [config.rootElement=document] - The root element for selector queries.
 * @returns {EventSource} The underlying EventSource instance, allowing it to be closed manually.
 */
const stream = ({ url, listeners = null, rootElement = document }) => {
    if (!url) {
        console.error("[CuboMX.stream] URL is required.");
        return null;
    }

    const eventSource = new EventSource(url);

    if (listeners && listeners.length > 0) {
        // Client-Decide Mode
        listeners.forEach((listener) => {
            if (!listener.event) return;
            eventSource.addEventListener(listener.event, (event) => {
                const html = event.data;
                const options = { rootElement };
                if (listener.strategies) {
                    swapHTML(html, listener.strategies, options);
                }
                if (listener.actions) {
                    processActions(listener.actions, rootElement);
                }
            });
        });
    } else {
        // Server-Commands Mode (fallback)
        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                const options = { rootElement };
                if (payload.html && payload.strategies) {
                    swapHTML(payload.html, payload.strategies, options);
                }
                if (payload.actions) {
                    processActions(payload.actions, rootElement);
                }
            } catch (e) {
                console.error(
                    "[CuboMX.stream] Failed to process server event. Data is not a valid JSON or is missing expected properties.",
                    e
                );
            }
        };
    }

    eventSource.onerror = (err) => {
        console.error("[CuboMX.stream] EventSource failed:", err);
        // The browser will automatically try to reconnect, but we close it on error
        // to prevent infinite loops on a 404, for example.
        eventSource.close();
    };

    return eventSource;
};

export { request, swapHTML, processActions, stream };
