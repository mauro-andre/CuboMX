import { request as a, swapHTML as b, processActions as d } from "./request.js";
import { renderTemplate as c } from "./template.js";

const CuboMX = (() => {
    let registeredComponents = {};
    let registeredStores = {};
    let watchers = {};
    let activeProxies = {};
    let anonCounter = 0;

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

        const elements = removedNode.matches('[mx-data]')
            ? [removedNode, ...removedNode.querySelectorAll('[mx-data]')]
            : [...removedNode.querySelectorAll('[mx-data]')];

        elements.forEach(el => {
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

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    const newInstances = scanDOM(node);
                    processInit(newInstances);
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
