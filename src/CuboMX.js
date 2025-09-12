import { request as a, swapHTML as b, processActions as d } from "./request.js";
import { renderTemplate as c } from "./template.js";

const CuboMX = (() => {
    let registeredComponents = {};
    let registeredStores = {};
    let watchers = {};
    let activeProxies = {};
    let anonCounter = 0;
    let bindings = [];

    const evaluate = (expression) => {
        try {
            // Avalia a expressão no contexto dos proxies ativos
            return new Function(`with(this) { return ${expression} }`).call(
                activeProxies
            );
        } catch (e) {
            console.error(
                `[CuboMX] Error evaluating expression: "${expression}"`,
                e
            );
        }
    };

    const evaluateEventExpression = (expression, el, event) => {
        try {
            const func = new Function(
                "$el",
                "$event",
                `with(this) { ${expression} }`
            );
            func.call(activeProxies, el, event);
        } catch (e) {
            console.error(
                `[CuboMX] Error evaluating expression: "${expression}"`,
                e
            );
        }
    };

    const watch = (path, cb) => {
        if (!watchers[path]) watchers[path] = [];
        watchers[path].push(cb);
    };

    const createProxy = (obj, name, el = null) => {
        const handler = {
            set(target, property, value) {
                const oldValue = target[property];
                const success = Reflect.set(target, property, value);
                if (success && oldValue !== value) {
                    const path = `${name}.${property}`;
                    if (watchers[path]) {
                        watchers[path].forEach((cb) => cb(value, oldValue));
                    }
                    // Adiciona a reavaliação das diretivas do DOM
                    bindings.forEach((b) => b.evaluate());
                }
                return success;
            },
            get(target, property) {
                if (property === "$watch") {
                    return (propToWatch, callback) => {
                        const path = `${name}.${propToWatch}`;
                        watch(path, callback);
                    };
                }
                if (property === "$el") {
                    return el;
                }
                return Reflect.get(target, property);
            },
        };
        return new Proxy(obj, handler);
    };

    const addActiveProxy = (name, proxy) => {
        if (activeProxies[name]) {
            console.error(
                `[CuboMX] Name collision: The name '${name}' is already in use.`
            );
            return;
        }
        activeProxies[name] = proxy;
    };

    const directiveHandlers = {
        "mx-text": (el, expression) => {
            const initialValue = evaluate(expression);

            // If the state is null or undefined, hydrate it from the DOM's text content.
            if (initialValue === null || initialValue === undefined) {
                try {
                    // Use textContent for better reliability in test environments like jsdom
                    const setter = new Function(
                        "value",
                        `with(this) { ${expression} = value }`
                    );
                    setter.call(activeProxies, el.textContent);
                } catch (e) {
                    console.error(
                        `[CuboMX] Could not set initial value for mx-text expression: "${expression}"`,
                        e
                    );
                }
            }

            const binding = {
                el,
                evaluate: () =>
                    (el.innerText = String(evaluate(expression) ?? "")),
            };
            binding.evaluate();
            bindings.push(binding);
        },
        "mx-show": (el, expression) => {
            const originalDisplay =
                el.style.display === "none" ? "" : el.style.display;
            const binding = {
                el,
                evaluate: () =>
                    (el.style.display = evaluate(expression)
                        ? originalDisplay
                        : "none"),
            };
            binding.evaluate();
            bindings.push(binding);
        },
        "mx-model": (el, expression) => {
            const setter = new Function(
                "value",
                `with(this) { ${expression} = value }`
            );
            el.addEventListener("input", () =>
                setter.call(activeProxies, el.value)
            );

            const binding = {
                el,
                evaluate() {
                    const value = evaluate(expression);
                    if (el.value !== value) el.value = value ?? "";
                },
            };
            binding.evaluate();
            bindings.push(binding);
        },
        ":": (el, attr) => {
            const attrName = attr.name.substring(1);
            const expression = attr.value;
            let binding;

            if (attrName === "class") {
                let lastAddedClasses = [];
                binding = {
                    el,
                    evaluate() {
                        const newClasses = String(evaluate(expression) || "")
                            .split(" ")
                            .filter(Boolean);
                        lastAddedClasses.forEach((c) => el.classList.remove(c));
                        newClasses.forEach((c) => el.classList.add(c));
                        lastAddedClasses = newClasses;
                    },
                };
            } else if (
                [
                    "disabled",
                    "readonly",
                    "required",
                    "checked",
                    "selected",
                    "open",
                ].includes(attrName)
            ) {
                binding = {
                    el,
                    evaluate() {
                        evaluate(expression)
                            ? el.setAttribute(attrName, "")
                            : el.removeAttribute(attrName);
                    },
                };
            } else {
                binding = {
                    el,
                    evaluate: () =>
                        el.setAttribute(attrName, evaluate(expression) ?? ""),
                };
            }
            binding.evaluate();
            bindings.push(binding);
        },
        "mx-on:": (el, attr) => {
            const eventAndModifiers = attr.name.substring(6); // 'mx-on:'.length
            const [eventName, ...modifiers] = eventAndModifiers.split(".");
            const expression = attr.value;

            el.addEventListener(eventName, (event) => {
                if (modifiers.includes("prevent")) event.preventDefault();
                if (modifiers.includes("stop")) event.stopPropagation();
                evaluateEventExpression(expression, el, event);
            });
        },
    };

    const bindDirectives = (rootElement) => {
        const elements = [rootElement, ...rootElement.querySelectorAll("*")];
        for (const el of elements) {
            // Fixed-name directives
            if (el.hasAttribute("mx-text"))
                directiveHandlers["mx-text"](el, el.getAttribute("mx-text"));
            if (el.hasAttribute("mx-show"))
                directiveHandlers["mx-show"](el, el.getAttribute("mx-show"));
            if (el.hasAttribute("mx-model"))
                directiveHandlers["mx-model"](el, el.getAttribute("mx-model"));

            // Prefixed directives
            for (const attr of [...el.attributes]) {
                if (attr.name.startsWith(":")) directiveHandlers[":"](el, attr);
                if (attr.name.startsWith("mx-on:"))
                    directiveHandlers["mx-on:"](el, attr);
            }
        }
    };

    const processInit = (initQueue) => {
        for (const proxy of initQueue) {
            if (typeof proxy.init === "function") {
                proxy.init.call(proxy);
            }
        }
    };

    const scanDOM = (rootElement) => {
        const newInstances = [];
        const elements = rootElement.matches("[mx-data]")
            ? [rootElement, ...rootElement.querySelectorAll("[mx-data]")]
            : [...rootElement.querySelectorAll("[mx-data]")];

        elements.forEach((el) => {
            const expression = el.getAttribute("mx-data");
            const isFactory = expression.endsWith("()");
            const componentName = isFactory
                ? expression.slice(0, -2)
                : expression;

            if (!registeredComponents[componentName]) return;

            let refName = el.getAttribute("mx-ref");
            const definition = registeredComponents[componentName];

            if (isFactory) {
                const instanceObj = definition();
                if (!refName) {
                    refName = `_cubo_${anonCounter++}`;
                    el.setAttribute("mx-ref", refName);
                }
                if (activeProxies[refName]) return; // Already initialized
                const proxy = createProxy(instanceObj, refName, el);
                addActiveProxy(refName, proxy);
                newInstances.push(proxy);
            } else {
                // Singleton
                if (activeProxies[componentName]) return; // Already initialized
                const proxy = createProxy({ ...definition }, componentName, el);
                addActiveProxy(componentName, proxy);
                newInstances.push(proxy);
            }
        });

        return newInstances;
    };

    const destroyProxies = (removedNode) => {
        if (removedNode.nodeType !== 1) return;

        // Part 1: Destroy component proxies
        const elementsWithData = removedNode.matches("[mx-data]")
            ? [removedNode, ...removedNode.querySelectorAll("[mx-data]")]
            : [...removedNode.querySelectorAll("[mx-data]")];

        elementsWithData.forEach((el) => {
            const componentName = el.getAttribute("mx-data").replace("()", "");
            const refName = el.getAttribute("mx-ref") || componentName;

            const proxy = activeProxies[refName];

            if (proxy) {
                if (typeof proxy.destroy === "function") {
                    proxy.destroy.call(proxy);
                }
                delete activeProxies[refName];
            }
        });

        // Part 2: Clean up bindings from all removed nodes to prevent memory leaks
        const allRemovedChildren = [
            removedNode,
            ...removedNode.querySelectorAll("*"),
        ];
        bindings = bindings.filter((b) => !allRemovedChildren.includes(b.el));
    };

    const start = () => {
        let initQueue = [];

        for (const name in registeredStores) {
            const proxy = createProxy({ ...registeredStores[name] }, name);
            addActiveProxy(name, proxy);
            if (proxy.init) initQueue.push(proxy);
        }

        const domInstances = scanDOM(document.body);
        initQueue = initQueue.concat(domInstances);

        processInit(initQueue);

        bindDirectives(document.body);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    const newInstances = scanDOM(node);
                    processInit(newInstances);
                    bindDirectives(node); // Vincula diretivas nos nós adicionados
                });

                mutation.removedNodes.forEach((node) => {
                    destroyProxies(node);
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener("cubo:dom-updated", () => {
            for (const proxy of Object.values(activeProxies)) {
                if (typeof proxy.onDOMUpdate === "function") {
                    proxy.onDOMUpdate.call(proxy);
                }
            }
        });
    };

    const reset = () => {
        registeredComponents = {};
        registeredStores = {};
        watchers = {};
        activeProxies = {};
        anonCounter = 0;
        bindings = [];
    };

    const publicAPI = {
        /**
         * Registers a global store. Stores are always singletons.
         * @param {string} name The name of the store, used to access it globally (e.g., `CuboMX.storeName`).
         * @param {object} obj The store object.
         */
        store: (name, obj) => (registeredStores[name] = obj),

        /**
         * Registers a component. A component can be a singleton (plain object)
         * or a factory (a function that returns an object).
         * @param {string} name The name used in the `mx-data` attribute.
         * @param {object|Function} def The component object or factory function.
         */
        component: (name, def) => (registeredComponents[name] = def),

        /**
         * Watches a property on any global store or component for changes.
         * @param {string} path A string path to the property (e.g., 'componentName.propertyName' or 'storeName.propertyName').
         * @param {Function} cb A function to execute when the property changes. It receives the new and old values.
         */
        watch,

        /**
         * Scans the DOM, initializes all registered stores and components,
         * and starts listening for DOM mutations. This function should be called
         * once the entire application is ready.
         */
        start,

        /**
         * Resets the internal state of CuboMX. Used primarily for testing.
         */
        reset,

        // External utilities from other modules
        request: a,
        swapHTML: b,
        renderTemplate: c,
        actions: d,
    };

    return new Proxy(publicAPI, {
        get(target, prop) {
            if (prop in target) {
                return target[prop];
            }
            return activeProxies[prop];
        },
        set(target, prop, value) {
            if (!(prop in target)) {
                activeProxies[prop] = value;
                return true;
            }
            return Reflect.set(target, prop, value);
        },
    });
})();

export { CuboMX };
