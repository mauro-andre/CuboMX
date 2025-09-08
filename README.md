# CuboMX Documentation

## 1. Introduction

CuboMX is a reactive micro-framework for JavaScript, designed to be lightweight, powerful, and seamlessly integrated with a server-side rendered (SSR) architecture. Its philosophy is based on enhancing HTML with reactivity, keeping the code clean, declarative, and easy to maintain.

**Core Principles:**
*   **HTML as the Source of Truth:** The UI structure and bindings are defined directly in the HTML.
*   **Component-Oriented Reactivity:** State and logic are encapsulated within JavaScript components.
*   **Minimal Overhead:** With no virtual DOM, CuboMX manipulates the real DOM efficiently.

## 2. Installation and Initialization

To use CuboMX, you need to register your components and then start the engine.

**`index.js` (Example):**
```javascript
import { CuboMX } from "cubomx";
import { loginControl } from "./components/loginControl";
import { passwordInput } from "./components/passwordInput";

// 1. (Optional) Define and register your global stores
const themeStore = {
    mode: 'light',
    changeTheme() {
        this.mode = this.mode === 'light' ? 'dark' : 'light';
    }
};
CuboMX.store('theme', themeStore);

// 2. Register your components
CuboMX.component('loginControl', loginControl); // Singleton Component
CuboMX.component('passwordInput', passwordInput); // Factory Component

// 3. Start CuboMX to scan the DOM and initialize stores
CuboMX.start();
```

## 3. Components

Components are the heart of CuboMX. They are JavaScript objects that contain the state (properties) and logic (methods) for a portion of your UI.

### 3.1. Singleton Components

Perfect for page controllers or sections that exist only once.

*   **Definition (JS):** Export a simple object.
    ```javascript
    const loginControl = {
        email: '',
        submit() { console.log(this.email); }
    };
    export { loginControl };
    ```
*   **Usage (HTML):** `mx-data="componentName"`
    ```html
    <div mx-data="loginControl">...</div>
    ```
*   **Global Access:** The single instance is globally accessible via `CuboMX.loginControl`.

### 3.2. Reusable Components (Factories)

Perfect for repeating UI elements like form fields, modals, etc.

*   **Definition (JS):** Export a **function** that returns a new object.
    ```javascript
    const passwordInput = () => ({
        isVisible: false,
        toggle() { this.isVisible = !this.isVisible; }
    });
    export { passwordInput };
    ```
*   **Usage (HTML):** `mx-data="componentName()"` (note the parentheses).
    ```html
    <div mx-data="passwordInput()">...</div>
    <div mx-data="passwordInput()">...</div>
    ```
*   **Global Access:** By default, instances are anonymous. To access them, use the `mx-ref` directive.

## 4. Directives

Directives are special HTML attributes that connect your DOM to your components.

### `mx-data`
Declares a new component scope. All HTML within this element will have access to the component's state and methods.

### `mx-model`
Creates a two-way data binding between a form element (`input`, `textarea`, `select`) and a component property.

```html
<input type="text" mx-model="username">
```

### `mx-show`
Shows or hides an element based on the result of a JavaScript expression.

```html
<!-- With a boolean variable -->
<div mx-show="isOpen">...</div>

<!-- With a complex expression -->
<div mx-show="items.length > 0 && !isLoading">...</div>
```

### `mx-text`
Updates the `innerText` of an element with the value of a component property.

```html
<span mx-text="username"></span>
```

### `:` (Attribute Binding)
Binds an HTML attribute to the result of a JavaScript expression. For most attributes, this will completely replace the attribute's value on every change.

```html
<button :disabled="isLoading">Save</button>
<a :href="userProfileUrl">Profile</a>
```

**Special Behavior for `:class`:**
The `:class` binding is special. Instead of replacing the entire class list, CuboMX intelligently compares the new and old values from the expression. It only adds or removes the classes that have changed, without affecting other static classes on the element. This is more efficient and preserves CSS transitions.

```html
<!-- The expression can return a string of space-separated classes -->
<div class="static-class" :class="isActive ? 'active text-bold' : ''">...</div>
```

### `mx-on:`
Attaches an event listener to an element. It calls a component method when the event is triggered.

> **Advanced Usage:** `mx-on` can be used even outside an `mx-data` component to interact with global stores. This is useful for simple elements, like modals, that don't need a full component state.

*   **Syntax:** `mx-on:event.modifier="method()"`
*   **Example:** `<button mx-on:click="save()">Save</button>`
*   **Modifiers:**
    *   `.prevent`: Calls `event.preventDefault()`.
    *   `.stop`: Calls `event.stopPropagation()`.
*   **Magic Variables:** Inside an `mx-on` expression, you have direct access to special variables:
    *   `$el`: The DOM element the listener is attached to.
    *   `$event`: The DOM `Event` object.
    *   `$stores`: The object containing all stores, allowing you to call global actions.
    ```html
    <button mx-on:click="$stores.theme.changeTheme()">Change Theme</button>
    ```

### `mx-prop:`
Injects server-rendered data directly into a component's initial state. This is the primary method for passing data from the backend to the frontend in CuboMX.

*   **Syntax:** `mx-prop:property-name="value"`

> **Usage Note:** The `mx-prop:` directive must be declared on the **same element** as the `mx-data` directive. It is used to pass the initial state to the component being defined at that point.
>
> **Naming Convention:** By default, HTML attributes are case-insensitive. To pass properties with compound names, use `kebab-case` in HTML, and CuboMX will automatically convert them to `camelCase` in your JavaScript component.
> *   HTML: `mx-prop:user-id="123"`
> *   JS: `this.userId` will be `123`.

*   **Type Conversion:** CuboMX automatically converts attribute values to the most appropriate JavaScript data types:
    *   `"true"`, `"True"` -> `true` (Boolean)
    *   `"false"`, `"False"` -> `false` (Boolean)
    *   `"123"` -> `123` (Number)
    *   `'{"key": "value"}'` -> `{ key: "value" }` (Object/Array from JSON)
    *   `"null"`, `"None"`, `"none"` -> `null`
    *   `"undefined"` -> `undefined`
    *   Any other value remains a String.

**Example:**
```html
<!-- Server Template (e.g., Jinja2) -->
<div mx-data="salesChart"
     mx-prop:month="'{{ current_month }}'"
     mx-prop:total-sales="{{ total_sales }}"
     mx-prop:is-active="{{ is_active | tojson }}"
     mx-prop:chart-data='{{ chart_json }}'>
</div>
```
```javascript
// Component Definition
const salesChart = {
    // Props will be injected here before init()
    init() {
        console.log(this.month); // String: 'August'
        console.log(this.totalSales); // Number: 15000
        console.log(this.isActive); // Boolean: true
        console.log(this.chartData); // Object: { ... }
    }
}
```

### `mx-ref`
Gives a name to a specific component instance, making it globally accessible via `CuboMX.refs`.

```html
<div mx-data="passwordInput()" mx-ref="passwordField">...</div>
```
```javascript
// In another component or JS file:
const password = CuboMX.refs.passwordField.value;
```

## 5. Magic Properties

Within a component's methods, you have access to special properties via `this`.

*   **`this.$el`**: The DOM element the component is attached to.
*   **`this.$stores`**: An object containing all reactive global stores.
*   **`this.$watch('property', callback)`**: Watches a property **of this component**.

## 6. Global API

The global `CuboMX` object exposes several useful properties and methods.

*   **`CuboMX.component(name, object)`**: Registers a new component (Singleton or Factory).
*   **`CuboMX.store(name, object)`**: Registers a new global store. The object can contain data properties and the `init()` and `onDOMUpdate()` methods. Must be called before `CuboMX.start()`.
*   **`CuboMX.start()`**: Starts the framework, processes registered stores, and scans the DOM for components.
*   **`CuboMX.stores`**: An object containing the reactive instances of all registered stores. Use for shared state (e.g., `CuboMX.stores.theme.mode = 'dark'`).
*   **`CuboMX.refs`**: An object containing all component instances named with `mx-ref`.
*   **`CuboMX.watch(path, callback)`**: Watches a property on a named component (`$refs.`) or a store (`$stores.`).
    ```javascript
    CuboMX.watch('$refs.passwordField.value', (newValue) => { ... });
    CuboMX.watch('$stores.theme.mode', (newMode) => { ... });
    ```
*   **`CuboMX.request(config)`**: Performs an AJAX request and updates the DOM.
*   **`CuboMX.swapHTML(html, strategies, options)`**: Updates the DOM without a request.
*   **`CuboMX.renderTemplate(template, data)`**: A simple utility function that replaces `{{ variable }}` placeholders in a string with values from a data object.

#### Actions

For more granular DOM manipulations that don't involve swapping HTML blocks, you can use `actions`. They allow the client or server to send a list of instructions to be executed after an HTML swap.

Actions can be passed as a parameter in the `CuboMX.request` call or sent by the server via the `X-Cubo-Actions` header. If both are provided, the JavaScript actions take priority.

**Available Actions:**
*   `addClass`: `{ "action": "addClass", "selector": ".my-el", "class": "new-class" }`
*   `removeClass`: `{ "action": "removeClass", "selector": ".my-el", "class": "old-class" }`
*   `setAttribute`: `{ "action": "setAttribute", "selector": "#my-el", "attribute": "disabled", "value": "" }`
*   `removeElement`: `{ "action": "removeElement", "selector": "#el-to-remove" }`
*   `setTextContent`: `{ "action": "setTextContent", "selector": "#counter", "text": "5" }`
*   `dispatchEvent`: `{ "action": "dispatchEvent", "selector": "window", "event": "custom-event", "detail": { ... } }`

**Example Usage (Client-Side):**
```javascript
CuboMX.request({
    url: '/path',
    strategies: [{ select: '#content', target: '#content' }],
    actions: [
        { action: 'removeClass', selector: 'a.active', class: 'active' },
        { action: 'addClass', selector: `a[href='/path']`, class: 'active' }
    ]
});
```

#### Advanced Swap Strategies

The strategy object within the `strategies` list can contain additional properties for fine-grained control over DOM updates, ideal for preserving elements and preventing UI flickering.

*   `sync: true`: Instead of replacing the `target` element, this option will synchronize its attributes (and those of its children) with the `source`. The DOM is not destroyed, only modified.
*   `replaceElements: ["selector1", "selector2"]`: After a `sync`, this option will surgically replace only the inner elements that match the selectors.

**Example:**
```javascript
// Updates the 'active' class on all links, but only replaces the inner SVG.
// This prevents the tooltip from flickering because the <a> element is not destroyed.
const strategies = [{
    select: "#sidebar-links",
    target: "#sidebar-links",
    sync: true,
    replaceElements: ["svg"]
}];
```

## 7. Lifecycle Hooks

You can define special methods in your components that CuboMX will execute at specific moments.

*   **`init()`**: Executed once when the component is initialized and added to the DOM. Can be `async`.
    ```javascript
    async init() {
        this.items = await CuboMX.request({ url: '/api/items' });
    }
    ```

#### 7.1. Component Communication in `init()`

**Important:** The initialization order (`init()`) between different components is not guaranteed. Trying to access properties of another component directly within `init()` can lead to race conditions, where one component tries to access another that has not yet been fully initialized.

The correct and safe way to react to data from other components is by using `CuboMX.watch`.

**Practical Example:**

❌ **Don't do this (risky):**
```javascript
// Component A
const ComponentA = {
    valueFromComponentB: '',
    init() {
        // This might fail if the init() of 'componentB' hasn't run yet.
        this.valueFromComponentB = CuboMX.refs.componentB.value;
    }
}
```

✅ **Do this (safe and reactive):**
```javascript
// Component A
const ComponentA = {
    valueFromComponentB: '',
    init() {
        // The watcher will be triggered as soon as 'componentB.value' is available
        // and will also react to future changes.
        CuboMX.watch('$refs.componentB.value', (newValue) => {
            this.valueFromComponentB = newValue;
        });
    }
}
```
This reactive approach decouples the components, making your application more robust and predictable.

*   **`destroy()`**: Executed when the component is removed from the DOM. Perfect for cleaning up timers or event listeners. Can be `async`.
    ```javascript
    destroy() {
        clearInterval(this.timerId);
    }
    ```
*   **`onDOMUpdate()`**: Executed every time the DOM is modified by the `CuboMX.request()` or `CuboMX.swapHTML()` functions. Ideal for re-initializing third-party libraries (e.g., charts, tooltips) or re-evaluating state after a DOM update. Can be `async`. This hook can also be defined on a registered `store` object.
    ```javascript
    async onDOMUpdate() {
        // Re-initialize a chart library on the component's element
        if (this.chart) {
            this.chart.update();
        }
    }
    ```