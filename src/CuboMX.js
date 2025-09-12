import { request as a, swapHTML as b, processActions as d } from "./request.js";
import { renderTemplate as c } from "./template.js";

const CuboMX = (() => {
    const registeredComponents = {};
    const activeInstances = new Map();
    const watchers = {};
    const refs = {};
    const initQueue = [];
    let isInitScheduled = false;
    const registeredStores = {};
    const activeStores = {};

    /**
     * Registers a new global store. Must be called before start().
     * @param {string} name The name of the store.
     * @param {object} obj The store object, containing state, methods, and optional init/onDOMUpdate hooks.
     */
    const store = (name, obj) => {
        registeredStores[name] = obj;
    };

    const parseAttributeValue = (value) => {
        const lowerValue = value.toLowerCase();
        if (lowerValue === "true") return true;
        if (lowerValue === "false") return false;
        if (lowerValue === "null" || lowerValue === "none") return null;
        if (value === "undefined") return undefined;

        const num = Number(value);
        if (!isNaN(num) && value.trim() !== "") return num;

        try {
            if (
                (value.startsWith("{") && value.endsWith("}")) ||
                (value.startsWith("[") && value.endsWith("]"))
            ) {
                return JSON.parse(value);
            }
        } catch (e) {
            // Ignore the error and return the original string
        }
        return value;
    };

    const kebabToCamel = (str) =>
        str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    const createReactiveInstance = (componentName, element) => {
        const blueprint = registeredComponents[componentName];
        if (!blueprint) return null;
        const instanceData =
            typeof blueprint === "function" ? blueprint() : { ...blueprint };

        const propPrefix = "mx-prop:";
        for (const attr of element.attributes) {
            if (attr.name.startsWith(propPrefix)) {
                let propName = attr.name.substring(propPrefix.length);
                propName = kebabToCamel(propName);
                instanceData[propName] = parseAttributeValue(attr.value);
            }
        }

        const bindings = { model: {}, text: {}, show: [], expressions: [] };

        const reevaluateShowBindings = () => {
            bindings.show.forEach((binding) => {
                let show = false;
                try {
                    show = new Function(
                        `with(this) { return ${binding.expression} }`
                    ).call(instance);
                } catch (e) {}
                if (!show) {
                    if (binding.element.style.display !== "none")
                        binding.originalDisplay = binding.element.style.display;
                    binding.element.style.display = "none";
                } else {
                    binding.element.style.display =
                        binding.originalDisplay || "";
                }
            });
        };

        const reevaluateExpressionBindings = () => {
            bindings.expressions.forEach((binding) => {
                let result;
                try {
                    // Create a function that accepts $el and $stores as arguments
                    const func = new Function(
                        "$el",
                        "$stores",
                        `with(this) { return ${binding.expression} }`
                    );
                    // Call the function with the element and active stores
                    result = func.call(instance, binding.element, activeStores);
                } catch (e) {
                    console.error(
                        `[CuboMX] Error evaluating expression: "${binding.expression}"`,
                        e
                    );
                }

                if (binding.attribute === "class") {
                    const newClasses = result ? String(result).split(" ") : [];
                    const oldClasses = binding.lastResult
                        ? String(binding.lastResult).split(" ")
                        : [];

                    oldClasses.forEach((cls) => {
                        if (cls && !newClasses.includes(cls)) {
                            binding.element.classList.remove(cls);
                        }
                    });

                    newClasses.forEach((cls) => {
                        if (cls) {
                            binding.element.classList.add(cls);
                        }
                    });

                    binding.lastResult = result;
                } else if (typeof result === "boolean") {
                    result
                        ? binding.element.setAttribute(binding.attribute, "")
                        : binding.element.removeAttribute(binding.attribute);
                } else {
                    binding.element.setAttribute(binding.attribute, result);
                }
            });
        };

        const instance = new Proxy(instanceData, {
            set(target, property, value) {
                const oldValue = target[property];
                const success = Reflect.set(target, property, value);
                if (success && oldValue !== value) {
                    if (bindings.model[property])
                        bindings.model[property].forEach((el) => {
                            if (el.value !== value) el.value = value;
                        });
                    if (bindings.text[property])
                        bindings.text[property].forEach(
                            (el) => (el.innerText = value)
                        );

                    const refName = Object.keys(refs).find(
                        (key) => refs[key] === instance
                    );
                    const watchPath = refName
                        ? `$refs.${refName}.${property}`
                        : `${componentName}.${property}`;
                    if (watchers[watchPath])
                        watchers[watchPath].forEach((cb) =>
                            cb(value, oldValue)
                        );
                    const internalWatchPath = `${componentName}.${property}`;
                    if (watchers[internalWatchPath])
                        watchers[internalWatchPath].forEach((cb) =>
                            cb(value, oldValue)
                        );
                    reevaluateShowBindings();
                    reevaluateExpressionBindings();
                }
                return success;
            },
            get(target, property) {
                if (property === "$el") return element;
                if (property === "$stores") return activeStores;
                if (property === "$watch") {
                    return (prop, cb) => watch(`${componentName}.${prop}`, cb);
                }
                return Reflect.get(target, property);
            },
        });
        instance.__bindings = bindings;
        instance.__reevaluateShowBindings = reevaluateShowBindings;
        instance.__reevaluateExpressionBindings = reevaluateExpressionBindings;
        return instance;
    };

    /**
     * Registers a new component.
     * @param {string} name The name of the component, used in the `mx-data` attribute.
     * @param {object|Function} obj The component definition (an object for a singleton, a function for a factory).
     */
    const component = (name, obj) => (registeredComponents[name] = obj);

    /**
     * Watches a property on a reactive object (store or ref) for changes.
     * @param {string} pathString The path to the property to watch (e.g., '$stores.theme.mode', '$refs.myComponent.value').
     * @param {Function} callback The function to execute when the property changes. It receives (newValue, oldValue).
     */
    const watch = (pathString, callback) => {
        if (typeof pathString !== "string" || !pathString.includes(".")) {
            let valid = false;
            if (pathString.startsWith("$stores.")) valid = true;
            if (pathString.startsWith("$refs.")) valid = true;
            if (!valid) {
                console.error(
                    `[CuboMX] Invalid format for watch. Use '$stores.storeName.property' or '$refs.refName.property'.`
                );
                return;
            }
        }
        if (!watchers[pathString]) watchers[pathString] = [];
        watchers[pathString].push(callback);
    };

    const bindDirectives = (element) => {
        const dataElement = element.closest("[mx-data]");
        // If there is no parent data element, create an empty instance context.
        // This allows directives like mx-on="$stores.something()" to work globally.
        const instance = dataElement
            ? activeInstances.get(dataElement)
            : { __bindings: {} };

        // If the instance is null (i.e., the dataElement was found but is not active), exit.
        if (!instance) return;

        const bindings = instance.__bindings;

        if (element.hasAttribute("mx-model") && !element._mxModelAttached) {
            const stateKey = element.getAttribute("mx-model");
            if (instance[stateKey] === undefined)
                instance[stateKey] = element.value || "";
            else element.value = instance[stateKey];
            if (!bindings.model[stateKey]) bindings.model[stateKey] = [];
            bindings.model[stateKey].push(element);
            element.addEventListener("input", () => {
                instance[stateKey] = element.value;
            });
            element._mxModelAttached = true;
        }
        if (element.hasAttribute("mx-text") && !element._mxTextAttached) {
            const stateKey = element.getAttribute("mx-text");
            if (!bindings.text[stateKey]) bindings.text[stateKey] = [];
            bindings.text[stateKey].push(element);
            if (instance[stateKey] !== undefined)
                element.innerText = instance[stateKey];
            element._mxTextAttached = true;
        }
        if (element.hasAttribute("mx-show") && !element._mxShowAttached) {
            const expression = element.getAttribute("mx-show");
            bindings.show.push({
                element,
                expression,
                originalDisplay: element.style.display,
            });
            element._mxShowAttached = true;
        }
        for (const attr of element.attributes) {
            if (attr.name.startsWith(":")) {
                const attributeName = attr.name.substring(1);
                const expression = attr.value;
                bindings.expressions.push({
                    element,
                    attribute: attributeName,
                    expression,
                });
            }
            const prefix = "mx-on:";
            if (attr.name.startsWith(prefix)) {
                const eventAndModifiers = attr.name.substring(prefix.length);
                const [eventName, ...modifiers] = eventAndModifiers.split(".");
                if (eventName && !element[`_${attr.name}Attached`]) {
                    const handler = new Function(
                        "$el",
                        "$event",
                        "$stores",
                        `with(this) { ${attr.value} }`
                    );
                    element.addEventListener(eventName, (event) => {
                        if (modifiers.includes("prevent"))
                            event.preventDefault();
                        if (modifiers.includes("stop")) event.stopPropagation();
                        handler.call(instance, element, event, activeStores);
                    });
                    element[`_${attr.name}Attached`] = true;
                }
            }
        }
    };

    const processInitQueue = async () => {
        if (!initQueue.length) {
            isInitScheduled = false;
            return;
        }

        const queueToProcess = [...initQueue];
        initQueue.length = 0;

        for (const { instance, el } of queueToProcess) {
            if (!instance.__initialized) {
                const childElements = [el, ...el.querySelectorAll("*")];
                childElements.forEach(bindDirectives);

                if (typeof instance.init === "function") {
                    await instance.init.call(instance);
                }
                instance.__initialized = true;
                instance.__reevaluateShowBindings();
                instance.__reevaluateExpressionBindings();
            }
        }

        isInitScheduled = false;
        // If new components were added during initialization, process them
        if (initQueue.length > 0) {
            scheduleInit();
        }
    };

    const scheduleInit = () => {
        if (!isInitScheduled) {
            isInitScheduled = true;
            Promise.resolve().then(processInitQueue);
        }
    };

    const initComponents = (rootNode) => {
        const childElements = Array.from(
            rootNode.querySelectorAll("[mx-data]")
        );
        const elements = rootNode.matches("[mx-data]")
            ? [rootNode, ...childElements]
            : childElements;
        let addedToQueue = false;

        for (const el of elements) {
            if (!activeInstances.has(el)) {
                const expression = el.getAttribute("mx-data");
                const isFactory = expression.endsWith("()");
                const componentName = isFactory
                    ? expression.slice(0, -2)
                    : expression;
                const instance = createReactiveInstance(componentName, el);
                if (instance) {
                    activeInstances.set(el, instance);
                    if (!isFactory) {
                        CuboMX[componentName] = instance;
                    }
                    if (el.hasAttribute("mx-ref")) {
                        refs[el.getAttribute("mx-ref")] = instance;
                    }
                    initQueue.push({ instance, el });
                    addedToQueue = true;
                }
            }
        }

        if (addedToQueue) {
            scheduleInit();
        }
    };

    const destroyComponents = async (rootNode) => {
        const childElements = Array.from(
            rootNode.querySelectorAll("[mx-data]")
        );
        const elements = rootNode.matches("[mx-data]")
            ? [rootNode, ...childElements]
            : childElements;
        for (const el of elements) {
            if (activeInstances.has(el)) {
                const instance = activeInstances.get(el);
                const expression = el.getAttribute("mx-data");
                const isFactory = expression.endsWith("()");
                const componentName = isFactory
                    ? expression.slice(0, -2)
                    : expression;
                if (el.hasAttribute("mx-ref")) {
                    delete refs[el.getAttribute("mx-ref")];
                }
                if (!isFactory) {
                    delete CuboMX[componentName];
                }
                if (typeof instance.destroy === "function") {
                    await instance.destroy.call(instance);
                }
                activeInstances.delete(el);
            }
        }
    };

    /**
     * Initializes all stores and starts the framework.
     * Scans the entire DOM for components, initializes them, and sets up a MutationObserver to handle dynamic changes.
     */
    const start = () => {
        for (const name in registeredStores) {
            const storeDefinition = registeredStores[name];
            const { init: storeInit, ...storeData } = storeDefinition;

            const storeProxy = new Proxy(storeData, {
                set(target, property, value) {
                    const oldValue = target[property];
                    const success = Reflect.set(target, property, value);
                    if (success && oldValue !== value) {
                        // Trigger watchers for the specific store property
                        const fullPath = `$stores.${name}.${property}`;
                        if (watchers[fullPath]) {
                            watchers[fullPath].forEach((cb) =>
                                cb(value, oldValue)
                            );
                        }

                        // Re-evaluate bindings on all active components
                        // so they can react to store changes
                        for (const instance of activeInstances.values()) {
                            instance.__reevaluateShowBindings();
                            instance.__reevaluateExpressionBindings();
                        }
                    }
                    return success;
                },
            });

            activeStores[name] = storeProxy;

            if (typeof storeInit === "function") {
                storeInit.call(storeProxy);
            }
        }

        initComponents(document.body);
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1 /* Node.ELEMENT_NODE */) return;

                    // 1. Initialize any NEW components within the added node.
                    initComponents(node);

                    // 2. Bind directives on the node itself and its children.
                    // The bindDirectives function is smart enough to find
                    // the correct context (whether a parent component or the global context).

                    const elementsToBind = [
                        node,
                        ...node.querySelectorAll("*"),
                    ];
                    elementsToBind.forEach((el) => {
                        bindDirectives(el);
                    });
                });
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1 /* Node.ELEMENT_NODE */)
                        destroyComponents(node);
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener("cubo:dom-updated", () => {
            for (const instance of activeInstances.values()) {
                if (typeof instance.onDOMUpdate === "function") {
                    instance.onDOMUpdate.call(instance);
                }
            }
            for (const name in registeredStores) {
                const storeDefinition = registeredStores[name];
                if (typeof storeDefinition.onDOMUpdate === "function") {
                    const instance = activeStores[name];
                    storeDefinition.onDOMUpdate.call(instance);
                }
            }
        });
    };

    const reset = () => {
        // Limpa os objetos de estado em vez de reatribuí-los
        for (const key in registeredComponents) {
            delete registeredComponents[key];
        }
        activeInstances.clear();
        for (const key in watchers) {
            delete watchers[key];
        }
        for (const key in refs) {
            delete refs[key];
        }
        initQueue.length = 0;
        isInitScheduled = false;
        for (const key in registeredStores) {
            delete registeredStores[key];
        }
        for (const key in activeStores) {
            delete activeStores[key];
        }
    };

    return {
        component,
        watch,
        start,
        store,
        stores: activeStores,
        request: a,
        swapHTML: b,
        renderTemplate: c,
        actions: d,
        refs,
        reset, // Expor a função de reset
    };
})();

export { CuboMX };
