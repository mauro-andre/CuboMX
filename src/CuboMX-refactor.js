import { request as a, swapHTML as b, processActions as d } from "./request.js";
import { renderTemplate as c } from "./template.js";

const CuboMX = (() => {
    let registeredComponents = {};
    let registeredStores = {};
    let activeProxies = {};
    let anonCounter = 0;

    const createProxy = (obj) => new Proxy(obj, {});

    const addActiveProxy = (name, proxy) => {
        if (activeProxies[name]) {
            console.error(`[CuboMX] Name collision: The name '${name}' is already in use.`);
            return;
        }
        activeProxies[name] = proxy;
    };

    const scanDOM = (rootElement) => {
        const elements = rootElement.querySelectorAll('[mx-data]');

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
                const proxy = createProxy(instanceObj);
                addActiveProxy(refName, proxy);
            } else { // Singleton
                if (activeProxies[componentName]) return; // Already initialized
                const proxy = createProxy({ ...definition });
                addActiveProxy(componentName, proxy);
            }
        });
    };

    const start = () => {
        // 1. Processa Stores
        for (const name in registeredStores) {
            const proxy = createProxy({ ...registeredStores[name] });
            addActiveProxy(name, proxy);
        }

        // 2. Processa Componentes do DOM
        scanDOM(document.body);
    };

    const reset = () => {
        registeredComponents = {};
        registeredStores = {};
        activeProxies = {};
        anonCounter = 0;
    };

    const publicAPI = {
        store: (name, obj) => registeredStores[name] = obj,
        component: (name, def) => registeredComponents[name] = def,
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