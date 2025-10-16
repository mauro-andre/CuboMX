import {
    request as a,
    swapHTML as b,
    processActions as d,
    stream as e,
} from "./request.js";
import { renderTemplate as c } from "./template.js";
import { numberParser } from "./parsers/number.js";
import { currencyParser } from "./parsers/currency.js";

const CuboMX = (() => {
    let registeredComponents = {};
    let registeredStores = {};
    let watchers = {};
    let arrayWatchers = {};
    let activeProxies = {};
    let anonCounter = 0;
    let loadIdCounter = 0;
    let bindings = [];
    let outsideClickListeners = [];
    let isInitialLoad = true;
    let templates = {};
    let itemTemplates = {};
    let config = {};
    let registeredParsers = {};
    let observer = null;

    const kebabToCamel = (str) =>
        str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    const camelToKebab = (str) => {
        if (typeof str !== "string") return str;
        return str
            .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
            .toLowerCase();
    };

    const preHydrateTemplate = (templateString, itemData) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = templateString;
        const itemEl = tempDiv.firstElementChild;

        if (!itemEl) return templateString;

        const allElements = [itemEl, ...itemEl.querySelectorAll("*")];

        const arrayDirectiveMap = new Map();
        allElements.forEach((el) => {
            for (const attr of [...el.attributes]) {
                if (
                    attr.name.startsWith("::") &&
                    attr.name.includes(".array")
                ) {
                    const propName = attr.value;
                    if (!arrayDirectiveMap.has(propName)) {
                        arrayDirectiveMap.set(propName, []);
                    }
                    arrayDirectiveMap.get(propName).push(el);
                }
            }
        });

        arrayDirectiveMap.forEach((elements, propName) => {
            if (
                itemData.hasOwnProperty(propName) &&
                Array.isArray(itemData[propName])
            ) {
                const dataArray = itemData[propName];
                const templateNode = elements[0];
                const parent = templateNode.parentElement;

                for (
                    let i = 0;
                    i < Math.max(dataArray.length, elements.length);
                    i++
                ) {
                    const node = elements[i];
                    const data = dataArray[i];

                    if (data !== undefined && node) {
                        // Update
                        const attr = [...node.attributes].find(
                            (a) =>
                                a.name.startsWith("::") && a.value === propName
                        );
                        const [propAndModifiers, parserName] = attr.name
                            .substring(2)
                            .split(":");
                        const [propToBind] = propAndModifiers.split(".");
                        setDOMValue(node, propToBind, data, parserName);
                    } else if (data !== undefined && !node) {
                        // Add
                        const newNode = templateNode.cloneNode(true);
                        const attr = [...newNode.attributes].find(
                            (a) =>
                                a.name.startsWith("::") && a.value === propName
                        );
                        const [propAndModifiers, parserName] = attr.name
                            .substring(2)
                            .split(":");
                        const [propToBind] = propAndModifiers.split(".");
                        setDOMValue(newNode, propToBind, data, parserName);
                        parent.appendChild(newNode);
                    } else if (data === undefined && node) {
                        // Remove
                        node.remove();
                    }
                }
            }
        });

        allElements.forEach((el) => {
            for (const attr of [...el.attributes]) {
                if (
                    attr.name.startsWith("::") &&
                    !attr.name.includes(".array")
                ) {
                    const propName = attr.value;
                    const [propAndModifiers, parserName] = attr.name
                        .substring(2)
                        .split(":");
                    const [propToBind] = propAndModifiers.split(".");

                    // Allow arrays for class properties, but not for other properties
                    const isClassProperty = propToBind === "class";
                    const shouldProcess = itemData.hasOwnProperty(propName) &&
                        (isClassProperty || !Array.isArray(itemData[propName]));

                    if (shouldProcess) {
                        setDOMValue(
                            el,
                            propToBind,
                            itemData[propName],
                            parserName
                        );
                    }
                }
            }
        });

        // Apply special 'class' property if provided in itemData
        // This allows passing initial classes for items without explicit ::class directive
        if (itemData.hasOwnProperty('class') && Array.isArray(itemData.class)) {
            setDOMValue(itemEl, 'class', itemData.class);
        }

        return itemEl.outerHTML;
    };

    const notifyArrayWatchers = (path, eventData) => {
        const watchersList = arrayWatchers[path];
        if (!watchersList || watchersList.length === 0) return;

        setTimeout(() => {
            watchersList.forEach(({ callback }) => {
                callback(eventData);
            });
        }, 0);
    };

    const createItemArrayProxy = (targetArray, templateInfo) => {
        const proxy = new Proxy(targetArray, {
            get(target, prop) {
                if (prop === "__isItemArrayProxy") return true;

                if (prop === "add") {
                    return (itemData) => {
                        const preHydratedHtml = preHydrateTemplate(
                            templateInfo.template,
                            itemData
                        );
                        if (!templateInfo.parent.id) {
                            templateInfo.parent.id = `cubo-item-parent-${anonCounter++}`;
                        }
                        const targetSelector = `#${templateInfo.parent.id}:beforeend`;
                        const index = target.length;

                        publicAPI.swapHTML(preHydratedHtml, [
                            { select: "this", target: targetSelector },
                        ]);

                        setTimeout(() => {
                            const addedItem = target[index];
                            if (addedItem) {
                                const arrayPath = templateInfo.key;
                                notifyArrayWatchers(arrayPath, {
                                    type: "add",
                                    item: addedItem,
                                    index: index,
                                    arrayName: arrayPath.split(".")[1],
                                    componentName: arrayPath.split(".")[0],
                                });
                            }
                        }, 0);
                    };
                }
                if (prop === "prepend") {
                    return (itemData) => {
                        const preHydratedHtml = preHydrateTemplate(
                            templateInfo.template,
                            itemData
                        );
                        if (!templateInfo.parent.id) {
                            templateInfo.parent.id = `cubo-item-parent-${anonCounter++}`;
                        }
                        const targetSelector = `#${templateInfo.parent.id}:afterbegin`;

                        publicAPI.swapHTML(preHydratedHtml, [
                            { select: "this", target: targetSelector },
                        ]);

                        setTimeout(() => {
                            const prependedItem = target[0];
                            if (prependedItem) {
                                const arrayPath = templateInfo.key;
                                notifyArrayWatchers(arrayPath, {
                                    type: "prepend",
                                    item: prependedItem,
                                    index: 0,
                                    arrayName: arrayPath.split(".")[1],
                                    componentName: arrayPath.split(".")[0],
                                });
                            }
                        }, 0);
                    };
                }
                if (prop === "insert") {
                    return (itemData, index) => {
                        if (index < 0 || index > target.length) {
                            return;
                        }

                        const preHydratedHtml = preHydrateTemplate(
                            templateInfo.template,
                            itemData
                        );

                        // Handle insert at end
                        if (index === target.length) {
                            if (!templateInfo.parent.id) {
                                templateInfo.parent.id = `cubo-item-parent-${anonCounter++}`;
                            }
                            const targetSelector = `#${templateInfo.parent.id}:beforeend`;

                            publicAPI.swapHTML(preHydratedHtml, [
                                { select: "this", target: targetSelector },
                            ]);

                            setTimeout(() => {
                                const insertedItem = target[index];
                                if (insertedItem) {
                                    const arrayPath = templateInfo.key;
                                    notifyArrayWatchers(arrayPath, {
                                        type: "insert",
                                        item: insertedItem,
                                        index: index,
                                        arrayName: arrayPath.split(".")[1],
                                        componentName: arrayPath.split(".")[0],
                                    });
                                }
                            }, 0);
                            return;
                        }

                        // Handle insert in the middle
                        const targetItem = target[index];
                        if (targetItem && targetItem.__el) {
                            const targetEl = targetItem.__el;
                            if (!targetEl.id) {
                                targetEl.id = `cubo-item-el-${anonCounter++}`;
                            }
                            const targetSelector = `#${targetEl.id}:beforebegin`;

                            publicAPI.swapHTML(preHydratedHtml, [
                                { select: "this", target: targetSelector },
                            ]);

                            setTimeout(() => {
                                const insertedItem = target[index];
                                if (insertedItem) {
                                    const arrayPath = templateInfo.key;
                                    notifyArrayWatchers(arrayPath, {
                                        type: "insert",
                                        item: insertedItem,
                                        index: index,
                                        arrayName: arrayPath.split(".")[1],
                                        componentName: arrayPath.split(".")[0],
                                    });
                                }
                            }, 0);
                        }
                    };
                }
                if (prop === "delete") {
                    return (index) => {
                        if (index < 0 || index >= target.length) {
                            return;
                        }
                        const item = target[index];
                        const arrayPath = templateInfo.key;

                        if (item && item.__el) {
                            item.__el.remove();

                            setTimeout(() => {
                                notifyArrayWatchers(arrayPath, {
                                    type: "delete",
                                    item: item,
                                    index: index,
                                    arrayName: arrayPath.split(".")[1],
                                    componentName: arrayPath.split(".")[0],
                                });
                            }, 0);
                        }
                    };
                }
                const value = Reflect.get(target, prop);
                return typeof value === "function" ? value.bind(target) : value;
            },
        });
        return proxy;
    };

    const transition = (el, name, type, originalDisplay) => {
        const enterStartClass = `${name}-enter-start`;
        const enterEndClass = `${name}-enter-end`;
        const leaveStartClass = `${name}-leave-start`;
        const leaveEndClass = `${name}-leave-end`;

        if (el.__cubo_transition_timeout__) {
            clearTimeout(el.__cubo_transition_timeout__);
        }
        if (el.__cubo_transition_handler__) {
            el.removeEventListener(
                "transitionend",
                el.__cubo_transition_handler__
            );
            el.__cubo_transition_handler__ = null;
        }

        const runTransition = (startClasses, endClasses, finalAction) => {
            el.classList.add(...startClasses);

            const frame1 = () => {
                el.classList.remove(...startClasses);
                el.classList.add(...endClasses);

                const onEnd = () => {
                    el.classList.remove(...endClasses);
                    el.removeEventListener("transitionend", onEnd);
                    el.__cubo_transition_handler__ = null;
                    if (finalAction) finalAction();
                };
                el.addEventListener("transitionend", onEnd);
                el.__cubo_transition_handler__ = onEnd;
            };

            el.__cubo_transition_timeout__ = setTimeout(frame1, 1);
        };

        if (type === "enter") {
            el.style.display = originalDisplay;
            el.classList.remove(
                leaveStartClass,
                leaveEndClass,
                enterStartClass,
                enterEndClass
            );
            runTransition([enterStartClass], [enterEndClass], null);
        } else {
            // leave
            el.classList.remove(
                leaveStartClass,
                leaveEndClass,
                enterStartClass,
                enterEndClass
            );
            runTransition([leaveStartClass], [leaveEndClass], () => {
                el.style.display = "none";
            });
        }
    };

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
                if (property === "$watchArrayItems") {
                    return (arrayName, callback) => {
                        const path = `${name}.${arrayName}`;
                        if (!arrayWatchers[path]) arrayWatchers[path] = [];
                        arrayWatchers[path].push({
                            callback,
                            componentName: name,
                        });
                    };
                }
                if (property === "$el") {
                    return el;
                }

                const value = Reflect.get(target, property, receiver);

                if (typeof value === "function") {
                    // Preserve spy/mock functions (e.g., from Vitest, Jest)
                    // by checking if they have spy-specific properties
                    if (
                        value.mock ||
                        value._isMockFunction ||
                        typeof value.mockClear === "function"
                    ) {
                        return value;
                    }
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

    const extractAttributesAsData = (el) => {
        const data = {};
        for (const attr of el.attributes) {
            if (
                attr.name.startsWith("mx-") ||
                attr.name === "class" ||
                attr.name === "style"
            )
                continue;
            const value = attr.value === "" ? true : parseValue(attr.value, el);
            data[kebabToCamel(attr.name)] = value;
        }
        return data;
    };

    const processTemplates = (rootElement) => {
        const templatesToProcess = [];
        if (rootElement.matches("[mx-template]")) {
            templatesToProcess.push(rootElement);
        }
        rootElement
            .querySelectorAll("[mx-template]")
            .forEach((t) => templatesToProcess.push(t));

        const uniqueTemplates = [...new Set(templatesToProcess)];

        uniqueTemplates.forEach((el) => {
            const name = el.getAttribute("mx-template");

            const metadata = extractAttributesAsData(el);
            let templateHtml;

            if (el.tagName === "TEMPLATE") {
                templateHtml = el.innerHTML;
                el.remove();
            } else {
                templateHtml = el.outerHTML;
            }
            templates[name] = { template: templateHtml, data: metadata };
        });
    };

    const extractDataFromElement = (el) => {
        const data = extractAttributesAsData(el);
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

    const createClassProxy = (el, onMutation = null) => {
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
                        const oldValue = [...target];
                        const result = value.apply(target, args);
                        el.className = target.join(" ");

                        if (onMutation) {
                            onMutation(oldValue, [...target]);
                        }

                        return result;
                    };
                }
                return typeof value === "function" ? value.bind(target) : value;
            },
        });

        classProxy.add = (className) => {
            if (!classProxy.includes(className)) {
                classProxy.push(className);
                // onMutation is called by the Proxy trap when push() executes
            }
        };

        classProxy.remove = (className) => {
            const index = classProxy.indexOf(className);
            if (index > -1) {
                classProxy.splice(index, 1);
                // onMutation is called by the Proxy trap when splice() executes
            }
        };

        classProxy.toggle = (className) => {
            const index = classProxy.indexOf(className);
            if (index > -1) {
                classProxy.splice(index, 1);
            } else {
                classProxy.push(className);
            }
            // onMutation is called by the Proxy trap when push()/splice() executes
        };

        classProxy.contains = (className) => {
            return classProxy.includes(className);
        };

        const helpers = {
            class: classProxy,
            addClass: classProxy.add,
            removeClass: classProxy.remove,
            toggleClass: classProxy.toggle,
        };

        return helpers;
    };

    const getDOMValue = (el, propName, parserName) => {
        // Skip symbol properties (used by testing frameworks for inspection)
        if (typeof propName === "symbol") return undefined;

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
        const onClassMutation = basePath
            ? (oldValue, newValue) => {
                  const pathParts = basePath.match(/^(.+?)\.(.+?)\[(\d+)\]$/);
                  if (pathParts) {
                      const componentName = pathParts[1];
                      const arrayName = pathParts[2];
                      const index = parseInt(pathParts[3], 10);
                      const arrayPath = `${componentName}.${arrayName}`;

                      // Only notify if there are registered watchers
                      // (avoids notifications during initial hydration before $watchArrayItems is called)
                      if (!arrayWatchers[arrayPath] || arrayWatchers[arrayPath].length === 0) {
                          return;
                      }

                      setTimeout(() => {
                          notifyArrayWatchers(arrayPath, {
                              type: "update",
                              item: obj,
                              index: index,
                              arrayName: arrayName,
                              componentName: componentName,
                              propertyName: "class",
                              oldValue: oldValue,
                              newValue: newValue,
                          });
                      }, 0);
                  }
              }
            : null;

        const classHelpers = createClassProxy(el, onClassMutation);
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

                    // Only notify array watchers if the property doesn't have its own setter
                    // (properties defined via populateItemObject have their own setters that notify)
                    const descriptor = Object.getOwnPropertyDescriptor(
                        target,
                        prop
                    );
                    const hasCustomSetter = descriptor && descriptor.set;

                    if (!hasCustomSetter) {
                        // Notify array watchers if this is an item in an array
                        const pathParts = basePath.match(
                            /^(.+?)\.(.+?)\[(\d+)\]$/
                        );
                        if (pathParts) {
                            const componentName = pathParts[1];
                            const arrayName = pathParts[2];
                            const index = parseInt(pathParts[3], 10);
                            const arrayPath = `${componentName}.${arrayName}`;

                            // Only notify if there are registered watchers
                            // (avoids notifications during initial hydration before $watchArrayItems is called)
                            if (!arrayWatchers[arrayPath] || arrayWatchers[arrayPath].length === 0) {
                                return success;
                            }

                            setTimeout(() => {
                                notifyArrayWatchers(arrayPath, {
                                    type: "update",
                                    item: target,
                                    index: index,
                                    arrayName: arrayName,
                                    componentName: componentName,
                                    propertyName: prop,
                                    oldValue: oldValue,
                                    newValue: value,
                                });
                            }, 0);
                        }
                    }
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
                const requestConfig = {
                    url: url,
                    pushUrl: true,
                    history: true,
                };

                const target = el.getAttribute("mx-target");
                if (target) {
                    const select = el.getAttribute("mx-select") || target;
                    requestConfig.strategies = [{ select, target }];
                }

                a(requestConfig);
            });
        },
        "mx-swap-template": (el, templateName) => {
            const target = el.getAttribute("mx-target");
            if (!target) {
                console.error(
                    "[CuboMX] The mx-target attribute is required for mx-swap-template."
                );
                return;
            }

            const select = el.getAttribute("mx-select");
            const triggerEvent = el.getAttribute("mx-trigger") || "click";

            const elementUrl =
                el.getAttribute("url") ?? el.getAttribute("data-url");
            const elementPageTitle =
                el.getAttribute("page-title") ??
                el.getAttribute("data-page-title");

            el.addEventListener(triggerEvent, (event) => {
                event.preventDefault();
                const swapOptions = { target };
                if (select) {
                    swapOptions.select = select;
                }
                if (elementUrl) {
                    swapOptions.url = elementUrl;
                }
                if (elementPageTitle) {
                    swapOptions.pageTitle = elementPageTitle;
                }
                publicAPI.swapTemplate(templateName, swapOptions);
            });
        },
        "mx-load": (el, url) => {
            let target = el.getAttribute("mx-target");
            let select = el.getAttribute("mx-select");
            let strategy = {};

            if (target) {
                strategy = { target };
                if (select) {
                    strategy.select = select;
                }
            } else {
                if (!el.id) {
                    el.id = `cubo-load-${loadIdCounter++}`;
                }
                target = `#${el.id}:outerHTML`;
                select = select || "this";
                strategy = { select, target };
            }

            publicAPI.request({ url, strategies: [strategy] });
        },
        "mx-delay": (el, value) => {
            const delay = parseInt(value || "0", 10);
            if (isNaN(delay)) {
                el.removeAttribute("mx-delay");
                return;
            }

            const originalInlineDisplay = el.style.display;
            el.style.setProperty("display", "none", "important");

            setTimeout(() => {
                if (document.body.contains(el)) {
                    el.removeAttribute("mx-delay");
                    el.style.removeProperty("display");

                    if (originalInlineDisplay) {
                        el.style.display = originalInlineDisplay;
                    }
                }
            }, delay);
        },
        "mx-show": (el, expression) => {
            const originalDisplay =
                el.style.display === "none" ? "" : el.style.display;
            let state = evaluate(expression, el);

            const transitionName = el.getAttribute("mx-transition");

            const binding = {
                el,
                evaluate: () => {
                    const newState = evaluate(expression, el);
                    if (newState === state) return;

                    if (!transitionName) {
                        el.style.display = newState ? originalDisplay : "none";
                        state = newState;
                        return;
                    }

                    if (newState) {
                        transition(
                            el,
                            transitionName,
                            "enter",
                            originalDisplay
                        );
                    } else {
                        transition(
                            el,
                            transitionName,
                            "leave",
                            originalDisplay
                        );
                    }
                    state = newState;
                },
            };

            if (!transitionName) {
                el.style.display = state ? originalDisplay : "none";
            } else {
                if (!state) {
                    el.style.display = "none";
                }
            }

            bindings.push(binding);
        },
        "mx-on:": (el, attr) => {
            const eventAndModifiers = attr.name.substring(6);
            const [eventName, ...modifiers] = eventAndModifiers.split(".");
            const expression = attr.value;

            if (eventName === "click" && modifiers.includes("outside")) {
                const handler = (event) => {
                    if (el.contains(event.target)) {
                        return;
                    }
                    evaluateEventExpression(expression, el, event);
                };
                document.addEventListener("click", handler, true);
                outsideClickListeners.push({ el, handler });
                return;
            }

            el.addEventListener(eventName, (event) => {
                if (modifiers.includes("prevent")) event.preventDefault();
                if (modifiers.includes("stop")) event.stopPropagation();
                evaluateEventExpression(expression, el, event);
            });
        },
        "mx-bind:": (el, attr) => {
            const [propAndModifiers, parserName] = attr.name
                .substring(8)
                .split(":");
            const [propToBind, ...modifiers] = propAndModifiers.split(".");
            const expression = attr.value;

            if (modifiers.includes("array")) {
                const { context, key } = getContextForExpression(
                    expression,
                    el
                );
                const valueToPush = getDOMValue(el, propToBind, parserName);

                if (
                    !Object.hasOwnProperty.call(context, key) ||
                    context[key] === null
                ) {
                    context[key] = [];
                }

                if (Array.isArray(context[key])) {
                    context[key].push(valueToPush);
                } else {
                    console.error(
                        `[CuboMX] property '${expression}' was configured as an array but it is not an array.`
                    );
                }
                return;
            }

            const directiveProp = kebabToCamel(propToBind);
            const { context, key } = getContextForExpression(expression, el);

            const hydrate = () => {
                if (directiveProp === "class") {
                    context[key] = createClassProxy(el).class;
                } else {
                    context[key] = getDOMValue(
                        el,
                        camelToKebab(directiveProp),
                        parserName
                    );
                }
            };

            const componentRootEl = el.closest("[mx-data]");
            const hasInitialState =
                componentRootEl && componentRootEl.__cubo_initial_state__;

            if (!hasInitialState) {
                if (
                    isInitialLoad &&
                    (context[key] === null || context[key] === undefined)
                ) {
                    hydrate();
                } else if (!isInitialLoad) {
                    hydrate();
                }
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
            const component = findComponentProxyFor(el);
            const componentName = component
                ? Object.keys(activeProxies).find(
                      (k) => activeProxies[k] === component
                  )
                : "global";
            const templateRegistryKey = `${componentName}.${key}`;

            if (
                context[key] === undefined ||
                context[key] === null ||
                !context[key].__isItemArrayProxy
            ) {
                const templateInfo = {
                    template: el.outerHTML,
                    parent: el.parentElement,
                    key: templateRegistryKey,
                };
                if (!itemTemplates[templateRegistryKey]) {
                    itemTemplates[templateRegistryKey] = templateInfo;
                }

                const realArray = Array.isArray(context[key])
                    ? context[key]
                    : [];
                context[key] = createItemArrayProxy(realArray, templateInfo);
            }

            if (!Array.isArray(context[key])) {
                return console.error(
                    `[CuboMX] mx-item target '${expression}' is not an array.`
                );
            }
            const arrayName = expression.startsWith("$")
                ? expression.substring(1)
                : expression;
            const basePath = `${componentName}.${arrayName}`;

            const fullPath = `${basePath}[${context[key].length}]`;

            const itemObject = enhanceObjectWithElementProxy({}, el, fullPath);

            Object.defineProperty(itemObject, "__el", {
                value: el,
                configurable: true,
            });

            const parent = el.parentElement;

            const siblingItems = [...parent.children].filter(
                (child) => child.getAttribute("mx-item") === expression
            );

            const domIndex = siblingItems.indexOf(el);

            if (domIndex > -1) {
                context[key].splice(domIndex, 0, itemObject);
            } else {
                context[key].push(itemObject);
            }

            el.__cubo_item_object__ = itemObject;
        },
        "mx-item:": (el, attr) => {
            const parentItemEl = el.closest("[mx-item]");

            if (!parentItemEl) {
                directiveHandlers["mx-bind:"](el, {
                    name: `mx-bind:${attr.name.substring(8)}`,
                    value: attr.value,
                });
                return;
            }

            if (!parentItemEl.__cubo_item_object__) return;

            const itemObject = parentItemEl.__cubo_item_object__;
            const [propAndModifiers, parserName] = attr.name
                .substring(8)
                .split(":");
            const [propToBind, ...modifiers] = propAndModifiers.split(".");
            const propertyName = attr.value;

            if (modifiers.includes("array")) {
                const valueToPush = getDOMValue(el, propToBind, parserName);

                if (!Object.hasOwnProperty.call(itemObject, propertyName)) {
                    itemObject[propertyName] = [];
                }

                if (Array.isArray(itemObject[propertyName])) {
                    itemObject[propertyName].push(valueToPush);
                } else {
                    console.error(
                        `[CuboMX] property '${propertyName}' was configured as an array but it is not an array.`
                    );
                }
                return;
            }

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
        // Get the basePath from the itemObject's internal structure
        const itemEl = itemObject.__el;
        let basePath = "";
        if (itemEl && itemEl.hasAttribute("mx-item")) {
            const component = findComponentProxyFor(itemEl);
            const componentName = component
                ? Object.keys(activeProxies).find(
                      (k) => activeProxies[k] === component
                  )
                : "global";
            const expression = itemEl.getAttribute("mx-item");
            const arrayName = expression.startsWith("$")
                ? expression.substring(1)
                : expression;

            // Find the index of this item in its parent array
            const parent = itemEl.parentElement;
            const siblingItems = [...parent.children].filter(
                (child) => child.getAttribute("mx-item") === expression
            );
            const domIndex = siblingItems.indexOf(itemEl);
            basePath = `${componentName}.${arrayName}[${domIndex}]`;
        }

        if (propToBind === "class") {
            const onClassMutation = basePath
                ? (oldValue, newValue) => {
                      const pathParts = basePath.match(
                          /^(.+?)\.(.+?)\[(\d+)\]$/
                      );
                      if (pathParts) {
                          const componentName = pathParts[1];
                          const arrayName = pathParts[2];
                          const index = parseInt(pathParts[3], 10);
                          const arrayPath = `${componentName}.${arrayName}`;

                          // Only notify if there are registered watchers
                          // (avoids notifications during initial hydration before $watchArrayItems is called)
                          if (!arrayWatchers[arrayPath] || arrayWatchers[arrayPath].length === 0) {
                              return;
                          }

                          setTimeout(() => {
                              notifyArrayWatchers(arrayPath, {
                                  type: "update",
                                  item: itemObject,
                                  index: index,
                                  arrayName: arrayName,
                                  componentName: componentName,
                                  propertyName: propertyName,
                                  oldValue: oldValue,
                                  newValue: newValue,
                              });
                          }, 0);
                      }
                  }
                : null;

            itemObject[propertyName] = createClassProxy(
                el,
                onClassMutation
            ).class;
            return;
        }

        Object.defineProperty(itemObject, propertyName, {
            get() {
                return getDOMValue(el, propToBind, parserName);
            },
            set(value) {
                const oldValue = getDOMValue(el, propToBind, parserName);
                setDOMValue(el, propToBind, value, parserName);

                // Notify array watchers if there's a basePath
                if (basePath && oldValue !== value) {
                    const pathParts = basePath.match(/^(.+?)\.(.+?)\[(\d+)\]$/);
                    if (pathParts) {
                        const componentName = pathParts[1];
                        const arrayName = pathParts[2];
                        const index = parseInt(pathParts[3], 10);
                        const arrayPath = `${componentName}.${arrayName}`;

                        setTimeout(() => {
                            notifyArrayWatchers(arrayPath, {
                                type: "update",
                                item: itemObject,
                                index: index,
                                arrayName: arrayName,
                                componentName: componentName,
                                propertyName: propertyName,
                                oldValue: oldValue,
                                newValue: value,
                            });
                        }, 0);
                    }
                }
            },
            enumerable: true,
            configurable: true,
        });

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
            if (el.hasAttribute("mx-swap-template"))
                directiveHandlers["mx-swap-template"](
                    el,
                    el.getAttribute("mx-swap-template")
                );
            if (el.hasAttribute("mx-load"))
                directiveHandlers["mx-load"](el, el.getAttribute("mx-load"));
            if (el.hasAttribute("mx-delay"))
                directiveHandlers["mx-delay"](el, el.getAttribute("mx-delay"));

            for (const attr of [...el.attributes]) {
                if (attr.name.startsWith("mx-bind:"))
                    directiveHandlers["mx-bind:"](el, attr);
                else if (attr.name.startsWith("mx-item:"))
                    directiveHandlers["mx-item:"](el, attr);
                else if (attr.name.startsWith("mx-on:"))
                    directiveHandlers["mx-on:"](el, attr);
                else if (attr.name.startsWith("::")) {
                    directiveHandlers["mx-item:"](el, {
                        name: `mx-item:${attr.name.substring(2)}`,
                        value: attr.value,
                    });
                } else if (attr.name.startsWith(":")) {
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

        const applyInitialState = (instance, componentEl) => {
            if (!componentEl.__cubo_initial_state__) return;

            const initialState = componentEl.__cubo_initial_state__;

            const elementsWithClassBinding = [
                ...(componentEl.hasAttribute(":class") ? [componentEl] : []),
                ...componentEl.querySelectorAll("[\\:class]"),
            ];

            const classBoundProps = new Map();
            elementsWithClassBinding.forEach((boundEl) => {
                if (boundEl.closest("[mx-data]") === componentEl) {
                    classBoundProps.set(
                        boundEl.getAttribute(":class"),
                        boundEl
                    );
                }
            });

            for (const propName in initialState) {
                if (Object.hasOwnProperty.call(initialState, propName)) {
                    if (classBoundProps.has(propName)) {
                        const boundEl = classBoundProps.get(propName);
                        const proxy = createClassProxy(boundEl).class;
                        const initialClasses = initialState[propName];
                        if (Array.isArray(initialClasses)) {
                            initialClasses.forEach((c) => proxy.add(c));
                        }
                        instance[propName] = proxy;
                    } else {
                        instance[propName] = initialState[propName];
                    }
                }
            }
        };

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
                applyInitialState(instanceObj, el);
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

                const instance = {};
                for (const key in definition) {
                    if (Object.hasOwnProperty.call(definition, key)) {
                        const value = definition[key];
                        if (Array.isArray(value)) {
                            instance[key] = [];
                        } else if (
                            typeof value === "object" &&
                            value !== null &&
                            !Array.isArray(value) &&
                            value.constructor === Object
                        ) {
                            instance[key] = {};
                        } else {
                            instance[key] = value;
                        }
                    }
                }

                applyInitialState(instance, el);

                const proxy = createProxy(instance, componentName, el);
                addActiveProxy(componentName, proxy);
                newInstances.push(proxy);
            }
        });

        return newInstances;
    };

    const destroyProxies = (removedNode) => {
        if (removedNode.nodeType !== 1) return;

        const itemElements = removedNode.matches("[mx-item]")
            ? [removedNode, ...removedNode.querySelectorAll("[mx-item]")]
            : [...removedNode.querySelectorAll("[mx-item]")];

        itemElements.forEach((el) => {
            if (el.__cubo_item_object__) {
                const itemObject = el.__cubo_item_object__;

                for (const compName in activeProxies) {
                    const component = activeProxies[compName];
                    for (const prop in component) {
                        if (
                            Object.hasOwnProperty.call(component, prop) &&
                            Array.isArray(component[prop])
                        ) {
                            const array = component[prop];
                            const index = array.indexOf(itemObject);
                            if (index > -1) {
                                array.splice(index, 1);
                                return;
                            }
                        }
                    }
                }
            }
        });

        const elementsWithData = removedNode.matches("[mx-data]")
            ? [removedNode, ...removedNode.querySelectorAll("[mx-data]")]
            : [...removedNode.querySelectorAll("[mx-data]")];

        elementsWithData.forEach((el) => {
            const rawName = el.getAttribute("mx-data").replace("()", "");
            const componentName = kebabToCamel(rawName);
            const refName = el.getAttribute("mx-ref") || componentName;
            const proxy = activeProxies[refName];

            if (proxy) {
                if (typeof proxy.destroy === "function")
                    proxy.destroy.call(proxy);
                delete activeProxies[refName];

                const watcherPrefix = `${refName}.`;
                for (const path in watchers) {
                    if (path.startsWith(watcherPrefix)) {
                        delete watchers[path];
                    }
                }
            }
        });

        const allRemovedChildren = [
            removedNode,
            ...removedNode.querySelectorAll("*"),
        ];

        outsideClickListeners = outsideClickListeners.filter(
            ({ el, handler }) => {
                if (allRemovedChildren.includes(el)) {
                    document.removeEventListener("click", handler, true);
                    return false;
                }
                return true;
            }
        );

        bindings = bindings.filter((b) => !allRemovedChildren.includes(b.el));
    };

    /**
     * Scans the DOM, initializes all registered stores and components,
     * and starts listening for DOM mutations. This function should be called
     * once the entire application is ready.
     * @param {object} [userConfig={}] - Optional configuration object.
     * @param {string} [userConfig.locale='en-US'] - The default locale for formatting, e.g., 'en-US', 'pt-BR'.
     * @param {string} [userConfig.currency='USD'] - The default currency code for formatting, e.g., 'USD', 'BRL'.
     */
    const start = (userConfig = {}) => {
        config = userConfig;
        let initQueue = [];

        addParser("number", numberParser);
        addParser("currency", currencyParser);

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
        arrayWatchers = {};
        activeProxies = {};
        anonCounter = 0;
        loadIdCounter = 0;
        bindings = [];
        outsideClickListeners.forEach(({ handler }) =>
            document.removeEventListener("click", handler, true)
        );
        outsideClickListeners = [];
        isInitialLoad = true;
        templates = {};
        itemTemplates = {};
        config = {};
        registeredParsers = {};
    };

    /**
     * Registers a custom parser to transform data during hydration and reactivity.
     * A parser must be an object with `parse` and `format` methods.
     * @param {string} name - The name of the parser, used in directives (e.g., `::text:my-parser`).
     * @param {{parse: function, format: function}} parser - The parser object.
     */
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
        store: (name, obj) => (registeredStores[kebabToCamel(name)] = obj),
        component: (name, def) =>
            (registeredComponents[kebabToCamel(name)] = def),
        addParser,
        watch,
        start,
        reset,
        request: (...args) => a(...args, activeProxies),
        swapHTML: b,
        actions: d,
        render: c,
        getTemplate(templateName) {
            const templateObj = templates[templateName];
            if (!templateObj) {
                console.error(`[CuboMX] Template '${templateName}' not found.`);
                return undefined;
            }
            return templateObj;
        },
        renderTemplate(templateName, data) {
            const templateObj = this.getTemplate(templateName);
            if (!templateObj) {
                return "";
            }
            return this.render(templateObj.template, data);
        },
        /**
         * @summary Swaps a pre-registered template into the DOM, with automatic history handling.
         * @description This function looks for URL and title information first in the `options` object, then in the template's HTML attributes (e.g., `url="..."` or `data-url="..."`). It also allows passing an initial state to the components being rendered.
         * @param {string} templateName The name of the template to swap.
         * @param {object} options Configuration for the swap operation.
         * @param {string} options.target The CSS selector for the destination element (e.g., '#container:innerHTML').
         * @param {string} [options.select] A CSS selector to extract a fragment from the template. If omitted, the entire template content is used.
         * @param {boolean} [options.history] Explicitly controls history. If a URL is present, history is enabled by default. Set to `false` to disable.
         * @param {string} [options.url] The URL for the history entry. Overrides URL from template metadata.
         * @param {string} [options.pageTitle] The document title. Overrides title from template metadata.
         * @param {object} [options.state] An object containing initial state for the components in the template. The keys should match the component names.
         */
        swapTemplate(templateName, options = {}) {
            const templateObj = this.getTemplate(templateName);
            if (!templateObj) {
                return;
            }

            const { template, data: metadata } = templateObj;
            const { target, select, history, url, pageTitle, state } = options;

            if (!target) {
                console.error(
                    "[CuboMX.swapTemplate] The 'target' option is required."
                );
                return;
            }

            const finalUrl = url ?? metadata.dataUrl ?? metadata.url;
            const finalTitle =
                pageTitle ?? metadata.dataPageTitle ?? metadata.pageTitle;
            const isHistoryActive =
                history === true || (history !== false && !!finalUrl);

            const finalSelect = select || "this";
            const strategies = [{ select: finalSelect, target: target }];
            const actions = [];
            if (finalTitle && isHistoryActive) {
                actions.push({
                    action: "setTextContent",
                    selector: "title",
                    text: finalTitle,
                });
            }

            this.swapHTML(template, strategies, {
                history: isHistoryActive,
                targetUrl: finalUrl,
                actions: actions,
                state: state,
            });
        },
        stream: e,
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
