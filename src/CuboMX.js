import { request as a, swapHTML as b, processActions as d } from "./request.js";
import { renderTemplate as c } from "./template.js";
import { numberParser } from "./parsers/number.js";
import { currencyParser } from "./parsers/currency.js";

const CuboMX = (() => {
    let registeredComponents = {};
    let registeredStores = {};
    let watchers = {};
    let activeProxies = {};
    let anonCounter = 0;
    let bindings = [];
    let isInitialLoad = true;
    let templates = {};
    let config = {};
    let registeredParsers = {};
    let observer = null;

    const kebabToCamel = (str) =>
        str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    const camelToKebab = (str) =>
        str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

    const parseValue = (value, el, parserName) => {
        if (parserName && registeredParsers[parserName]) {
            return registeredParsers[parserName].parse(value, el, config);
        }
        if (value === null || value === undefined) return value;
        const lowerValue = String(value).toLowerCase();
        if (lowerValue === "true") return true;
        if (lowerValue === "false") return false;
        if (lowerValue === "null" || lowerValue === "none") return null;
        if (value === "undefined") return undefined;

        const num = Number(value);
        if (!isNaN(num) && String(value).trim() !== "") return num;

        if (
            (value.startsWith("{") && value.endsWith("}")) ||
            (value.startsWith("[") && value.endsWith("]")) ||
            (value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))
        ) {
            return evaluate(value, el);
        }

        return value;
    };

    const findComponentProxyFor = (el) => {
        const parent = el.closest("[mx-data]");
        if (!parent) return null;
        const ref =
            parent.getAttribute("mx-ref") ||
            kebabToCamel(parent.getAttribute("mx-data").replace("()", ""));
        return activeProxies[ref] || null;
    };

    const evaluate = (expression, el) => {
        const localScope = findComponentProxyFor(el);

        if (expression.startsWith("$")) {
            const globalExpression = expression.substring(1);
            try {
                return new Function(
                    `with(this) { return ${globalExpression} }`
                ).call(activeProxies);
            } catch (e) {
                console.error(
                    `[CuboMX] Error evaluating global expression: "${expression}"`,
                    e
                );
            }
            return;
        }

        const context = Object.assign(Object.create(activeProxies), localScope);

        try {
            return new Function(`with(this) { return ${expression} }`).call(
                context
            );
        } catch (e) {
            console.error(
                `[CuboMX] Error evaluating expression: "${expression}"`,
                e
            );
        }
    };

    const getContextForExpression = (expression, el) => {
        const isGlobal = expression.startsWith("$");
        let expr = isGlobal ? expression.substring(1) : expression;
        let context = isGlobal ? activeProxies : findComponentProxyFor(el);

        if (!context) {
            context = activeProxies;
        }

        const parts = expr.split(".");
        const key = parts.pop();
        let current = context;

        for (const part of parts) {
            if (current[part] === undefined || current[part] === null) {
                current[part] = {};
            }
            current = current[part];
        }

        return { context: current, key };
    };

    const evaluateEventExpression = (expression, el, event) => {
        const localScope = findComponentProxyFor(el) || {};

        const parentItemEl = el.closest("[mx-item]");
        const itemData = parentItemEl
            ? parentItemEl.__cubo_item_object__
            : undefined;

        if (expression.startsWith("$")) {
            const globalExpression = expression.substring(1);
            try {
                const func = new Function(
                    "$el",
                    "$event",
                    "$item",
                    `with(this) { ${globalExpression} }`
                );
                func.call(activeProxies, el, event, itemData);
            } catch (e) {
                console.error(
                    `[CuboMX] Error evaluating global event expression: "${expression}"`,
                    e
                );
            }
            return;
        }

        const context = { ...activeProxies, ...localScope };
        try {
            const func = new Function(
                "$el",
                "$event",
                "$item",
                `with(this) { ${expression} }`
            );
            func.call(context, el, event, itemData);
        } catch (e) {
            console.error(
                `[CuboMX] Error evaluating event expression: "${expression}"`,
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
                    bindings.forEach((b) => b.evaluate());
                }
                return success;
            },
            get(target, property, receiver) {
                if (property === "$watch") {
                    return (propToWatch, callback) => {
                        const path = `${name}.${propToWatch}`;
                        watch(path, callback);
                    };
                }
                if (property === "$el") {
                    return el;
                }

                const value = Reflect.get(target, property, receiver);

                if (typeof value === "function") {
                    return value.bind(receiver);
                }

                return value;
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

    const processTemplates = (rootElement) => {
        const templatesToProcess = [];
        if (rootElement.matches("template[mx-template]")) {
            templatesToProcess.push(rootElement);
        }
        rootElement
            .querySelectorAll("template[mx-template]")
            .forEach((t) => templatesToProcess.push(t));

        templatesToProcess.forEach((templateEl) => {
            const name = templateEl.getAttribute("mx-template");
            templates[name] = templateEl.innerHTML;
            templateEl.remove();
        });
    };

    const extractDataFromElement = (el) => {
        const data = {};
        for (const attr of el.attributes) {
            if (attr.name.startsWith("mx-") || attr.name === "class") continue;
            const value = attr.value === "" ? true : parseValue(attr.value, el);
            data[kebabToCamel(attr.name)] = value;
        }
        data.text = el.textContent;
        data.html = el.innerHTML;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
            data.value = el.value;
        }
        if (el.tagName === "INPUT" && el.type === "checkbox") {
            data.checked = el.checked;
        }
        return data;
    };

    const createClassProxy = (el) => {
        const classArray = Array.from(el.classList);
        const MUTATION_METHODS = [
            "push",
            "pop",
            "splice",
            "shift",
            "unshift",
            "sort",
            "reverse",
        ];

        const classProxy = new Proxy(classArray, {
            get(target, prop) {
                const value = Reflect.get(target, prop);
                if (
                    typeof value === "function" &&
                    MUTATION_METHODS.includes(prop)
                ) {
                    return function (...args) {
                        const result = value.apply(target, args);
                        el.className = target.join(" ");
                        return result;
                    };
                }
                return typeof value === "function" ? value.bind(target) : value;
            },
        });

        const helpers = {
            class: classProxy,
            addClass: (className) => {
                if (!classProxy.includes(className)) classProxy.push(className);
            },
            removeClass: (className) => {
                const index = classProxy.indexOf(className);
                if (index > -1) classProxy.splice(index, 1);
            },
            toggleClass: (className) => {
                const index = classProxy.indexOf(className);
                if (index > -1) classProxy.splice(index, 1);
                else classProxy.push(className);
            },
        };

        return helpers;
    };

    const getDOMValue = (el, propName, parserName) => {
        const rawValue = (() => {
            if (propName === "checked") return el.checked;
            if (propName === "value") return el.value;
            if (propName === "text") return el.textContent;
            if (propName === "html") return el.innerHTML;
            const attrValue = el.getAttribute(propName);
            if (attrValue === "" && el.hasAttribute(propName)) return true;
            return attrValue;
        })();
        return parseValue(rawValue, el, parserName);
    };

    const setDOMValue = (el, propName, value, parserName) => {
        const finalValue =
            parserName && registeredParsers[parserName]
                ? registeredParsers[parserName].format(value, el, config)
                : value;

        if (propName === "text") el.textContent = finalValue;
        else if (propName === "html") el.innerHTML = finalValue;
        else if (propName === "checked") el.checked = !!finalValue;
        else if (propName === "value") el.value = finalValue;
        else if (propName === "class" && Array.isArray(finalValue))
            el.className = finalValue.join(" ");
        else if (typeof finalValue === "boolean") {
            if (finalValue) el.setAttribute(propName, "");
            else el.removeAttribute(propName);
        } else {
            el.setAttribute(propName, finalValue);
        }
    };

    const enhanceObjectWithElementProxy = (obj, el, basePath) => {
        const classHelpers = createClassProxy(el);
        Object.assign(obj, classHelpers);

        return new Proxy(obj, {
            get(target, prop) {
                if (prop === "$watch") {
                    return (propToWatch, callback) =>
                        watch(`${basePath}.${propToWatch}`, callback);
                }
                if (prop in target) return Reflect.get(target, prop);

                return getDOMValue(el, camelToKebab(prop));
            },
            set(target, prop, value) {
                const oldValue = getDOMValue(el, camelToKebab(prop));
                const success = Reflect.set(target, prop, value);

                if (oldValue !== value) {
                    const propertyPath = `${basePath}.${prop}`;
                    if (watchers[propertyPath]) {
                        watchers[propertyPath].forEach((cb) =>
                            cb(value, oldValue)
                        );
                    }
                    bindings.forEach((b) => b.evaluate());
                }

                setDOMValue(el, camelToKebab(prop), value);
                return success;
            },
        });
    };

    const hydrateElementToObject = (el, basePath) => {
        const hydratedAttrs = extractDataFromElement(el);
        return enhanceObjectWithElementProxy(hydratedAttrs, el, basePath);
    };

    const directiveHandlers = {
        "mx-link": (el) => {
            if (el.tagName !== "A" || !el.getAttribute("href")) {
                return;
            }
            el.addEventListener("click", (event) => {
                event.preventDefault();
                const url = el.getAttribute("href");
                a({
                    // `a` is the imported `request` function
                    url: url,
                    pushUrl: true,
                    history: true,
                });
            });
        },
        "mx-show": (el, expression) => {
            const originalDisplay =
                el.style.display === "none" ? "" : el.style.display;
            const binding = {
                el,
                evaluate: () =>
                    (el.style.display = evaluate(expression, el)
                        ? originalDisplay
                        : "none"),
            };
            binding.evaluate();
            bindings.push(binding);
        },
        "mx-on:": (el, attr) => {
            const eventAndModifiers = attr.name.substring(6);
            const [eventName, ...modifiers] = eventAndModifiers.split(".");
            const expression = attr.value;

            el.addEventListener(eventName, (event) => {
                if (modifiers.includes("prevent")) event.preventDefault();
                if (modifiers.includes("stop")) event.stopPropagation();
                evaluateEventExpression(expression, el, event);
            });
        },
        "mx-bind:": (el, attr) => {
            const [source, parserName] = attr.name.substring(8).split(":");
            const directiveProp = kebabToCamel(source);
            const expression = attr.value;
            const { context, key } = getContextForExpression(expression, el);

            if (
                isInitialLoad &&
                (context[key] === null || context[key] === undefined)
            ) {
                context[key] = getDOMValue(
                    el,
                    camelToKebab(directiveProp),
                    parserName
                );
            } else if (!isInitialLoad) {
                context[key] = getDOMValue(
                    el,
                    camelToKebab(directiveProp),
                    parserName
                );
            }

            const binding = {
                el,
                initialRun: true,
                evaluate: function () {
                    const value = evaluate(expression, el);
                    const propToSet = camelToKebab(directiveProp);
                    if (
                        this.initialRun ||
                        getDOMValue(el, propToSet, parserName) !== value
                    ) {
                        setDOMValue(
                            el,
                            propToSet,
                            value ?? (directiveProp === "checked" ? false : ""),
                            parserName
                        );
                        this.initialRun = false;
                    }
                },
            };
            bindings.push(binding);
            binding.evaluate();

            const eventName = directiveProp === "checked" ? "change" : "input";
            el.addEventListener(eventName, () => {
                context[key] = getDOMValue(
                    el,
                    camelToKebab(directiveProp),
                    parserName
                );
            });
        },
        "mx-bind": (el, expression) => {
            const { context, key } = getContextForExpression(expression, el);
            const basePath = expression.startsWith("$")
                ? expression.substring(1)
                : `${findComponentProxyFor(el)?.name || ""}.${expression}`;
            const attrsProxy = hydrateElementToObject(el, basePath);
            context[key] = attrsProxy;
            el.__cubo_item_data__ = attrsProxy;

            if (el.tagName === "INPUT" && el.type === "checkbox") {
                el.addEventListener("change", () => {
                    attrsProxy.checked = el.checked;
                });
            } else if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
                el.addEventListener("input", () => {
                    attrsProxy.value = el.value;
                });
            }
        },
        "mx-item": (el, expression) => {
            const { context, key } = getContextForExpression(expression, el);
            if (context[key] === undefined || context[key] === null) {
                context[key] = [];
            }
            if (!Array.isArray(context[key])) {
                return console.error(
                    `[CuboMX] mx-item target '${expression}' is not an array.`
                );
            }
            const basePath = expression.startsWith("$")
                ? expression.substring(1)
                : `${findComponentProxyFor(el)?.name || ""}.${expression}`;
            const fullPath = `${basePath}[${context[key].length}]`;

            const itemObject = enhanceObjectWithElementProxy({}, el, fullPath);
            context[key].push(itemObject);
            el.__cubo_item_object__ = itemObject;
        },
        "mx-item:": (el, attr) => {
            const parentItemEl = el.closest("[mx-item]");

            if (!parentItemEl) {
                // This is a granular bind on a component property, not an item property.
                // Delegate to the mx-bind: handler.
                directiveHandlers["mx-bind:"](el, {
                    name: `mx-bind:${attr.name.substring(8)}`,
                    value: attr.value,
                });
                return;
            }

            if (!parentItemEl.__cubo_item_object__) return;

            const itemObject = parentItemEl.__cubo_item_object__;
            const [propToBind, parserName] = attr.name.substring(8).split(":");
            const propertyName = attr.value;
            populateItemObject(
                el,
                itemObject,
                propToBind,
                propertyName,
                parserName
            );
        },
    };

    const populateItemObject = (
        el,
        itemObject,
        propToBind,
        propertyName,
        parserName
    ) => {
        if (propToBind === "class") {
            itemObject[propertyName] = createClassProxy(el).class;
            return;
        }

        Object.defineProperty(itemObject, propertyName, {
            get() {
                return getDOMValue(el, propToBind, parserName);
            },
            set(value) {
                setDOMValue(el, propToBind, value, parserName);
            },
            enumerable: true,
            configurable: true,
        });

        // When a parser is present, we need to force an initial format pass.
        // Reading the value triggers the 'parse' and writing it back triggers the 'format'.
        if (parserName && registeredParsers[parserName]) {
            const initialValue = itemObject[propertyName];
            itemObject[propertyName] = initialValue;
        }

        if (propToBind === "value" || propToBind === "checked") {
            const eventName = propToBind === "checked" ? "change" : "input";
            el.addEventListener(eventName, () => {
                itemObject[propertyName] = getDOMValue(
                    el,
                    propToBind,
                    parserName
                );
            });
        }
    };

    const bindDirectives = (rootElement) => {
        const elements = [rootElement, ...rootElement.querySelectorAll("*")];
        for (const el of elements) {
            if (el.hasAttribute("mx-bind"))
                directiveHandlers["mx-bind"](el, el.getAttribute("mx-bind"));
            if (el.hasAttribute("mx-item"))
                directiveHandlers["mx-item"](el, el.getAttribute("mx-item"));
            if (el.hasAttribute("mx-show"))
                directiveHandlers["mx-show"](el, el.getAttribute("mx-show"));
            if (el.hasAttribute("mx-link")) directiveHandlers["mx-link"](el);

            for (const attr of [...el.attributes]) {
                if (attr.name.startsWith("mx-bind:"))
                    directiveHandlers["mx-bind:"](el, attr);
                else if (attr.name.startsWith("mx-item:"))
                    directiveHandlers["mx-item:"](el, attr);
                else if (attr.name.startsWith("mx-on:"))
                    directiveHandlers["mx-on:"](el, attr);
                else if (attr.name.startsWith("::")) {
                    // Check for :: first
                    directiveHandlers["mx-item:"](el, {
                        name: `mx-item:${attr.name.substring(2)}`,
                        value: attr.value,
                    });
                } else if (attr.name.startsWith(":")) {
                    // Check for : second
                    directiveHandlers["mx-bind:"](el, {
                        name: `mx-bind:${attr.name.substring(1)}`,
                        value: attr.value,
                    });
                }
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
                if (activeProxies[refName]) return;
                const proxy = createProxy(instanceObj, refName, el);
                addActiveProxy(refName, proxy);
                newInstances.push(proxy);
            } else {
                if (activeProxies[componentName]) return;
                const proxy = createProxy({ ...definition }, componentName, el);
                addActiveProxy(componentName, proxy);
                newInstances.push(proxy);
            }
        });

        return newInstances;
    };

    const destroyProxies = (removedNode) => {
        if (removedNode.nodeType !== 1) return;
        const elementsWithData = removedNode.matches("[mx-data]")
            ? [removedNode, ...removedNode.querySelectorAll("[mx-data]")]
            : [...removedNode.querySelectorAll("[mx-data]")];

        elementsWithData.forEach((el) => {
            const componentName = el.getAttribute("mx-data").replace("()", "");
            const refName = el.getAttribute("mx-ref") || componentName;
            const proxy = activeProxies[refName];

            if (proxy) {
                if (typeof proxy.destroy === "function")
                    proxy.destroy.call(proxy);
                delete activeProxies[refName];
            }
        });

        const allRemovedChildren = [
            removedNode,
            ...removedNode.querySelectorAll("*"),
        ];
        bindings = bindings.filter((b) => !allRemovedChildren.includes(b.el));
    };

    const start = (userConfig = {}) => {
        config = userConfig;
        let initQueue = [];

        addParser("number", numberParser);
        addParser("currency", currencyParser);

        for (const name in registeredStores) {
            const proxy = createProxy({ ...registeredStores[name] }, name);
            addActiveProxy(name, proxy);
            if (proxy.init) initQueue.push(proxy);
        }

        const domInstances = scanDOM(document.body);
        initQueue = initQueue.concat(domInstances);

        processTemplates(document.body);
        bindDirectives(document.body);
        isInitialLoad = false;

        processInit(initQueue);

        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    processTemplates(node);
                    const newInstances = scanDOM(node);
                    bindDirectives(node);
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
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        registeredComponents = {};
        registeredStores = {};
        watchers = {};
        activeProxies = {};
        anonCounter = 0;
        bindings = [];
        isInitialLoad = true;
        templates = {};
        config = {};
        registeredParsers = {};
    };

    const addParser = (name, parser) => {
        if (
            !parser ||
            typeof parser.parse !== "function" ||
            typeof parser.format !== "function"
        ) {
            console.error(
                `[CuboMX] Parser '${name}' must be an object with 'parse' and 'format' methods.`
            );
            return;
        }
        registeredParsers[name] = parser;
    };

    const publicAPI = {
        store: (name, obj) => (registeredStores[name] = obj),
        component: (name, def) => (registeredComponents[name] = def),
        addParser,
        watch,
        start,
        reset,
        request: a,
        swapHTML: b,
        actions: d,
        render: c,
        renderTemplate(templateName, data) {
            const templateString = templates[templateName];
            if (!templateString) {
                console.error(`[CuboMX] Template '${templateName}' not found.`);
                return "";
            }
            return this.render(templateString, data);
        },
    };

    return new Proxy(publicAPI, {
        get(target, prop) {
            if (prop in target) return target[prop];
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
