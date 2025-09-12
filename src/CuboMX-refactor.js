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
            return new Function(`with(this) { return ${expression} }`).call(activeProxies);
        } catch (e) {
            console.error(`[CuboMX] Error evaluating expression: "${expression}"`, e);
        }
    };

    const evaluateEventExpression = (expression, el, event) => {
        try {
            const func = new Function('$el', '$event', `with(this) { ${expression} }`);
            func.call(activeProxies, el, event);
        } catch (e) {
            console.error(`[CuboMX] Error evaluating expression: "${expression}"`, e);
        }
    };

    const watch = (path, cb) => {
        if (!watchers[path]) watchers[path] = [];
        watchers[path].push(cb);
    };

    const createProxy = (obj, name) => {
        const handler = {
            set(target, property, value) {
                const oldValue = target[property];
                const success = Reflect.set(target, property, value);
                if (success && oldValue !== value) {
                    const path = `${name}.${property}`;
                    if (watchers[path]) {
                        watchers[path].forEach(cb => cb(value, oldValue));
                    }
                    // Adiciona a reavaliação das diretivas do DOM
                    bindings.forEach(b => b.evaluate());
                }
                return success;
            },
            get(target, property) {
                if (property === '$watch') {
                    return (propToWatch, callback) => {
                        const path = `${name}.${propToWatch}`;
                        watch(path, callback);
                    }
                }
                return Reflect.get(target, property);
            }
        };
        return new Proxy(obj, handler);
    };

    const addActiveProxy = (name, proxy) => {
        if (activeProxies[name]) {
            console.error(`[CuboMX] Name collision: The name '${name}' is already in use.`);
            return;
        }
        activeProxies[name] = proxy;
    };

    const bindDirectives = (rootElement) => {
        const elements = [rootElement, ...rootElement.querySelectorAll('*')];

        for (const el of elements) {
            // Fixed directives
            if (el.hasAttribute('mx-text')) {
                const expression = el.getAttribute('mx-text');
                const binding = {
                    el,
                    evaluate() {
                        const value = evaluate(expression);
                        el.innerText = String(value ?? '');
                    }
                };
                binding.evaluate();
                bindings.push(binding);
            }
            if (el.hasAttribute('mx-show')) {
                const expression = el.getAttribute('mx-show');
                const originalDisplay = el.style.display === 'none' ? '' : el.style.display;
                const binding = {
                    el,
                    evaluate() {
                        const show = evaluate(expression);
                        el.style.display = show ? originalDisplay : 'none';
                    }
                };
                binding.evaluate();
                bindings.push(binding);
            }

            // Prefixed directives
            for (const attr of [...el.attributes]) {
                if (attr.name.startsWith(':')) {
                    const attrName = attr.name.substring(1);
                    const expression = attr.value;

                    let binding;

                    if (attrName === 'class') {
                        let lastAddedClasses = [];
                        binding = {
                            el,
                            evaluate() {
                                const newClasses = String(evaluate(expression) || '').split(' ').filter(Boolean);
                                lastAddedClasses.forEach(c => el.classList.remove(c));
                                newClasses.forEach(c => el.classList.add(c));
                                lastAddedClasses = newClasses;
                            }
                        };
                    } else if (['disabled', 'readonly', 'required', 'checked', 'selected', 'open'].includes(attrName)) {
                        binding = {
                            el,
                            evaluate() {
                                const result = evaluate(expression);
                                if (result) {
                                    el.setAttribute(attrName, '');
                                } else {
                                    el.removeAttribute(attrName);
                                }
                            }
                        };
                    } else { // Default attribute
                        binding = {
                            el,
                            evaluate() {
                                const result = evaluate(expression);
                                el.setAttribute(attrName, result ?? '');
                            }
                        };
                    }
                    binding.evaluate();
                    bindings.push(binding);
                }

                const eventPrefix = 'mx-on:';
                if (attr.name.startsWith(eventPrefix)) {
                    const eventAndModifiers = attr.name.substring(eventPrefix.length);
                    const [eventName, ...modifiers] = eventAndModifiers.split('.');
                    const expression = attr.value;

                    el.addEventListener(eventName, (event) => {
                        if (modifiers.includes('prevent')) {
                            event.preventDefault();
                        }
                        if (modifiers.includes('stop')) {
                            event.stopPropagation();
                        }
                        evaluateEventExpression(expression, el, event);
                    });
                }
            }
        }
    };

    const processInit = (initQueue) => {
        for (const proxy of initQueue) {
            if (typeof proxy.init === 'function') {
                proxy.init.call(proxy);
            }
        }
    };

    const scanDOM = (rootElement) => {
        const newInstances = [];
        const elements = rootElement.matches('[mx-data]') 
            ? [rootElement, ...rootElement.querySelectorAll('[mx-data]')]
            : [...rootElement.querySelectorAll('[mx-data]')];

        elements.forEach(el => {
            const expression = el.getAttribute('mx-data');
            const isFactory = expression.endsWith('()');
            const componentName = isFactory ? expression.slice(0, -2) : expression;
            
            if (!registeredComponents[componentName]) return;

            let refName = el.getAttribute('mx-ref');
            const definition = registeredComponents[componentName];

            if (isFactory) {
                const instanceObj = definition();
                if (!refName) {
                    refName = `_cubo_${anonCounter++}`;
                    el.setAttribute('mx-ref', refName);
                }
                if (activeProxies[refName]) return; // Already initialized
                const proxy = createProxy(instanceObj, refName);
                addActiveProxy(refName, proxy);
                newInstances.push(proxy);
            } else { // Singleton
                if (activeProxies[componentName]) return; // Already initialized
                const proxy = createProxy({ ...definition }, componentName);
                addActiveProxy(componentName, proxy);
                newInstances.push(proxy);
            }
        });

        return newInstances;
    };

    const destroyProxies = (removedNode) => {
        if (removedNode.nodeType !== 1) return;

        // Part 1: Destroy component proxies
        const elementsWithData = removedNode.matches('[mx-data]')
            ? [removedNode, ...removedNode.querySelectorAll('[mx-data]')]
            : [...removedNode.querySelectorAll('[mx-data]')];

        elementsWithData.forEach(el => {
            const componentName = el.getAttribute('mx-data').replace('()', '');
            const refName = el.getAttribute('mx-ref') || componentName;
            
            const proxy = activeProxies[refName];

            if (proxy) {
                if (typeof proxy.destroy === 'function') {
                    proxy.destroy.call(proxy);
                }
                delete activeProxies[refName];
            }
        });

        // Part 2: Clean up bindings from all removed nodes to prevent memory leaks
        const allRemovedChildren = [removedNode, ...removedNode.querySelectorAll('*')];
        bindings = bindings.filter(b => !allRemovedChildren.includes(b.el));
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
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    const newInstances = scanDOM(node);
                    processInit(newInstances);
                    bindDirectives(node); // Vincula diretivas nos nós adicionados
                });

                mutation.removedNodes.forEach(node => {
                    destroyProxies(node);
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
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
        store: (name, obj) => registeredStores[name] = obj,
        component: (name, def) => registeredComponents[name] = def,
        watch,
        start,
        reset,
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
        }
    });
})();

export { CuboMX };
