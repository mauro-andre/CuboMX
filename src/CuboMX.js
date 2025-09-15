import { request as a, swapHTML as b, processActions as d } from "./request.js";
import { renderTemplate as c } from "./template.js";

const CuboMX = (() => {
    let registeredComponents = {};
    let registeredStores = {};
    let watchers = {};
    let activeProxies = {};
    let anonCounter = 0;
    let bindings = [];

    const kebabToCamel = (str) =>
        str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    const camelToKebab = (str) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

    const parseValue = (value) => {
        const lowerValue = value.toLowerCase();
        if (lowerValue === "true") return true;
        if (lowerValue === "false") return false;
        if (lowerValue === "null" || lowerValue === "none") return null;
        if (value === "undefined") return undefined;

        const num = Number(value);
        if (!isNaN(num) && value.trim() !== "") return num;

        // Se parece um objeto, array ou string literal, avalia como expressão
        if (
            (value.startsWith("{") && value.endsWith("}")) ||
            (value.startsWith("[") && value.endsWith("]")) ||
            (value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))
        ) {
            return evaluate(value);
        }

        return value;
    };

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
            const itemData = el.__cubo_item_data__; // Procura pelos dados do item
            const func = new Function(
                "$el",
                "$event",
                "$item", // Adiciona $item aos parâmetros
                `with(this) { ${expression} }`
            );
            func.call(activeProxies, el, event, itemData); // Passa os dados como argumento
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

            if (initialValue === null || initialValue === undefined) {
                try {
                    const setter = new Function(
                        "value",
                        `with(this) { ${expression} = value }`
                    );
                    setter.call(activeProxies, el.textContent);
                } catch (e) {
                    console.warn(
                        `[CuboMX] Could not set initial value for mx-text expression: "${expression}". The expression is not assignable.`
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
            const isCheckbox = el.type === "checkbox";
            const initialValue = evaluate(expression);

            // Hydration logic
            if (initialValue === null || initialValue === undefined) {
                try {
                    const valueToSet = isCheckbox ? el.checked : el.value;
                    const setter = new Function(
                        "value",
                        `with(this) { ${expression} = value }`
                    );
                    setter.call(activeProxies, valueToSet);
                } catch (e) {
                    console.warn(
                        `[CuboMX] Could not set initial value for mx-model expression: "${expression}". The expression is not assignable.`
                    );
                }
            }

            // Binding logic
            if (isCheckbox) {
                el.addEventListener("change", () => {
                    const setter = new Function(
                        "value",
                        `with(this) { ${expression} = value }`
                    );
                    setter.call(activeProxies, el.checked);
                });
                const binding = {
                    el,
                    evaluate() {
                        el.checked = !!evaluate(expression);
                    },
                };
                binding.evaluate();
                bindings.push(binding);
            } else {
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
            }
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
        "mx-array": (el, expression) => {
            const targetPath = expression.split(".").map(kebabToCamel);
            const propName = targetPath.pop();
            const objName = targetPath.join(".");
            const targetObject = evaluate(objName);

            if (typeof targetObject !== "object" || targetObject === null)
                return;

            const items = [];
            el.querySelectorAll("[mx-item]").forEach((itemEl) => {
                const itemValueAttr = itemEl.getAttribute("mx-item");
                let itemData;

                // Se mx-item tem valor, trata como primitivo
                if (itemValueAttr) {
                    itemData = parseValue(itemValueAttr);
                } else {
                    // Se não tem valor, constrói um objeto a partir dos atributos mx-obj
                    const newObject = {};
                    for (const attr of itemEl.attributes) {
                        if (attr.name.startsWith("mx-obj:")) {
                            const key = kebabToCamel(attr.name.substring(7));
                            newObject[key] = parseValue(attr.value);
                        }
                    }
                    itemData = newObject;
                }
                items.push(itemData);
                // Anexa os dados do item diretamente ao elemento para referência futura
                itemEl.__cubo_item_data__ = itemData;
            });

            targetObject[propName] = items;
        },
        "mx-obj": (el, expression) => {
            const targetPath = expression.split(".").map(kebabToCamel);
            const propName = targetPath.pop();
            const objName = targetPath.join(".");
            const targetObject = evaluate(objName);

            if (typeof targetObject !== "object" || targetObject === null)
                return;

            const newObject = {};
            for (const attr of el.attributes) {
                // Considera apenas atributos `mx-obj:` que têm um valor (são propriedades do objeto)
                if (attr.name.startsWith("mx-obj:") && attr.value !== "") {
                    const key = kebabToCamel(attr.name.substring(7)); // 7 = length of "mx-obj:"
                    newObject[key] = parseValue(attr.value);
                }
            }
            targetObject[propName] = newObject;
        },
        "mx-prop": (el, expression) => {
            const targetPath = expression.split(".");
            const propName = kebabToCamel(targetPath.pop());
            const objName = targetPath.map(kebabToCamel).join(".");
            const targetObject = evaluate(objName);

            if (typeof targetObject !== "object" || targetObject === null)
                return;

            targetObject[propName] = parseValue(
                el.getAttribute(`mx-prop:${expression}`)
            );
        },
        "mx-attrs": (el, expression) => {
            const targetPath = expression.split('.').map(kebabToCamel);
            const propName = targetPath.pop();
            const objName = targetPath.join('.');
            const targetObject = evaluate(objName);

            if (typeof targetObject !== 'object' || targetObject === null) return;

            // 1. Hydration (DOM -> State)
            const hydratedAttrs = {};
            for (const attr of el.attributes) {
                if (attr.name.startsWith('mx-') || attr.name === 'class') continue;
                hydratedAttrs[kebabToCamel(attr.name)] = attr.value;
            }
            hydratedAttrs.text = el.textContent;
            hydratedAttrs.html = el.innerHTML;
            
            // 2. Reactivity Setup
            const classArray = Array.from(el.classList);
            const MUTATION_METHODS = ['push', 'pop', 'splice', 'shift', 'unshift', 'sort', 'reverse'];
            
            const classProxy = new Proxy(classArray, {
                get(target, prop) {
                    const value = Reflect.get(target, prop);
                    if (typeof value === 'function' && MUTATION_METHODS.includes(prop)) {
                        return function(...args) {
                            const result = value.apply(target, args);
                            el.className = target.join(' ');
                            return result;
                        };
                    }
                    return typeof value === 'function' ? value.bind(target) : value;
                }
            });
            hydratedAttrs.class = classProxy;

            const attrsProxy = new Proxy(hydratedAttrs, {
                set(target, prop, value) {
                    const success = Reflect.set(target, prop, value);
                    if (prop === 'text') {
                        el.innerText = value;
                    } else if (prop === 'html') {
                        el.innerHTML = value;
                    } else if (prop === 'class') {
                        if (Array.isArray(value)) el.className = value.join(' ');
                    } else {
                        el.setAttribute(camelToKebab(prop), value);
                    }
                    return success;
                }
            });

            // Assign the reactive proxy to the component state
            targetObject[propName] = attrsProxy;

            // Add mx-model-like behavior for input elements
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                el.addEventListener('input', () => {
                    // Directly set the value on the proxy to ensure reactivity
                    attrsProxy.value = el.value;
                });
            }
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
                if (attr.name.startsWith("mx-prop:")) {
                    directiveHandlers["mx-prop"](el, attr.name.substring(8)); // 8 = length of "mx-prop:"
                }
                if (attr.name.startsWith("mx-array:")) {
                    directiveHandlers["mx-array"](el, attr.name.substring(9));
                }
                // Procura pelo atributo "âncora" do objeto, que não tem valor
                if (attr.name.startsWith("mx-obj:") && attr.value === "") {
                    directiveHandlers["mx-obj"](el, attr.name.substring(7));
                }
                if (attr.name.startsWith("mx-attrs:")) {
                    directiveHandlers["mx-attrs"](el, attr.name.substring(9));
                }
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
            let componentName = isFactory
                ? expression.slice(0, -2)
                : expression;

            componentName = kebabToCamel(componentName);

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

        bindDirectives(document.body);

        processInit(initQueue);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    const newInstances = scanDOM(node);
                    bindDirectives(node); // Vincula diretivas ANTES de inicializar
                    processInit(newInstances);
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
