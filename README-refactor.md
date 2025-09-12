# CuboMX Documentation (Refactored)

## 1. Introduction

CuboMX is a reactive micro-framework for JavaScript, designed to be lightweight, powerful, and easy to maintain. Its philosophy is based on enhancing HTML with reactivity through a simple, explicit, and predictable global API.

**Core Principles:**
*   **Global Flat API:** All reactive state (stores and components) is accessed directly from the global `CuboMX` object (e.g., `CuboMX.theme`, `CuboMX.myForm`). This eliminates complexity by removing implicit scopes.
*   **HTML as the Source of Truth:** The UI structure and bindings are defined directly in the HTML, with explicit references to the global state.
*   **Minimal Overhead:** With no virtual DOM, CuboMX manipulates the real DOM efficiently.

## 2. Installation and Initialization

To use CuboMX, you register your stores and components, then start the engine.

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

// 3. Start CuboMX to scan the DOM and initialize everything
CuboMX.start();
```

## 3. Components & Stores

Components and stores are the heart of CuboMX. They are JavaScript objects that contain the state and logic for your application. After registration, they become available as reactive proxies directly on the global `CuboMX` object.

### 3.1. Stores

Stores are global singletons, perfect for shared state across the entire application, like theme settings or user authentication status.

*   **Definition (JS):** A simple object.
    ```javascript
    const themeStore = { mode: 'light' };
    CuboMX.store('theme', themeStore);
    ```
*   **Global Access:** The store is globally accessible via `CuboMX.storeName` (e.g., `CuboMX.theme`).

### 3.2. Singletons

These are components that exist only once per page, ideal for page-specific controllers.

*   **Definition (JS):** A simple object, registered with `CuboMX.component`.
    ```javascript
    const loginControl = { email: '' };
    CuboMX.component('loginControl', loginControl);
    ```
*   **Usage (HTML):** The `mx-data` attribute links the DOM element to the component, managing its lifecycle.
    ```html
    <div mx-data="loginControl">...</div>
    ```
*   **Global Access:** The single instance is globally accessible via `CuboMX.componentName` (e.g., `CuboMX.loginControl`).

### 3.3. Reusable Components (Factories)

Factories are functions that return new object instances, perfect for UI elements that appear multiple times, like form fields or modals.

*   **Definition (JS):** A **function** that returns a new object.
    ```javascript
    const passwordInput = () => ({ isVisible: false });
    CuboMX.component('passwordInput', passwordInput);
    ```
*   **Usage (HTML):** Use parentheses `()` in `mx-data` and assign a unique name with `mx-ref`.
    ```html
    <div mx-data="passwordInput()" mx-ref="passwordOne">...</div>
    <div mx-data="passwordInput()" mx-ref="passwordTwo">...</div>
    ```
*   **Global Access:** Instances are globally accessible via the name provided in `mx-ref` (e.g., `CuboMX.passwordOne`).

## 4. Directives

Directives are special HTML attributes that create a bridge between your DOM and your JavaScript state. **All expressions must explicitly reference the global proxies** (e.g., `myStore.property`, `myComponent.property`).

### `mx-data`
Declares a component and manages its lifecycle (`init` and `destroy` hooks). It **does not** create a scope; all child elements still access state from the global `CuboMX` object.

### `mx-model`
Creates a two-way data binding on a form element (`input`, `textarea`, `select`).

```html
<input type="text" mx-model="loginControl.email">
```

### `mx-show`
Shows or hides an element based on the result of a JavaScript expression.

```html
<div mx-show="theme.mode === 'dark'">...</div>
```

### `mx-text`
Updates the `innerText` of an element with a value from your state.

```html
<span mx-text="loginControl.email"></span>
```

### `:` (Attribute Binding)
Binds an HTML attribute to the result of a JavaScript expression. Because all expressions are evaluated within the global context of `CuboMX`, you can access your stores and components directly (e.g., `user.id`) or explicitly for clarity (e.g., `CuboMX.user.id`).

```html
<button :disabled="loginControl.isLoading">Save</button>

<!-- Both forms are valid -->
<a :href="`/users/${user.id}`">Profile</a>
<a :href="`/users/${CuboMX.user.id}`">Profile (Explicit)</a>
```

**Special Behavior for `:class`:**
This binding intelligently adds and removes classes from your expression without affecting other static classes on the element.

```html
<div class="static-class" :class="theme.mode === 'dark' ? 'bg-dark' : 'bg-light'">...</div>
```

### `mx-on:`
Attaches an event listener to an element.

*   **Syntax:** `mx-on:event.modifier="expression"`
*   **Example:** `<button mx-on:click="theme.changeTheme()">Change Theme</button>`
*   **Modifiers:**
    *   `.prevent`: Calls `event.preventDefault()`.
    *   `.stop`: Calls `event.stopPropagation()`.
*   **Magic Variables:** Inside an `mx-on` expression, you have access to:
    *   `$el`: The DOM element the listener is attached to.
    *   `$event`: The DOM `Event` object.
    ```html
    <button mx-on:click="console.log($event.target)">Log Target</button>
    ```

### `mx-ref`
Crucial for factory components, `mx-ref` gives a component instance a unique global name on the `CuboMX` object.

```html
<div mx-data="passwordInput()" mx-ref="passwordField">...</div>
```
```javascript
// Access the instance anywhere in your JS
CuboMX.passwordField.isVisible = true;
```

## 5. Server-Side Data

To inject server-rendered data, simply render a `<script>` tag that populates your stores or components before `CuboMX.start()` is called. The `mx-prop` directive is no longer used.

**Example (e.g., rendered by Django, Rails, etc.):**
```html
<div mx-data="salesChart" mx-ref="chart"></div>

<script>
    CuboMX.component('salesChart', () => ({
        month: '{{ current_month }}', // Server-rendered value
        totalSales: {{ total_sales }},
        chartData: JSON.parse('{{ chart_json|escapejs }}'),
        init() {
            console.log(this.month, this.totalSales);
        }
    }));

    CuboMX.start();
</script>
```

## 6. Magic Properties

Within a component's methods, you have access to a few special `this` properties:

*   **`this.$el`**: A direct reference to the component's root DOM element (the one with the `mx-data` attribute). This is useful for direct DOM manipulation, especially within the `init()` hook.
*   **`this.$watch('property', callback)`**: Watches a property **on the current component instance** for changes.

**Example using `this.$el`:**
```javascript
const searchField = {
    init() {
        // Automatically focus the input field when the component is initialized
        this.$el.querySelector('input').focus();
    }
};
CuboMX.component('searchField', searchField);
```
```html
<div mx-data="searchField">
    <input type="search" placeholder="Search...">
</div>
```

## 7. Global API

*   **`CuboMX.component(name, definition)`**: Registers a component (Singleton object or Factory function).
*   **`CuboMX.store(name, object)`**: Registers a global store.
*   **`CuboMX.start()`**: Starts the framework.
*   **`CuboMX.watch(path, callback)`**: Watches a property on any global store or component. The path is a simple string, e.g., `'passwordField.value'` or `'theme.mode'`.
    ```javascript
    CuboMX.watch('passwordField.value', (newValue) => { ... });
    CuboMX.watch('theme.mode', (newMode) => { ... });
    ```
*   **`CuboMX.request(config)`**: Performs an AJAX request.
*   **`CuboMX.swapHTML(html, strategies, options)`**: Updates the DOM from an HTML string.
*   **`CuboMX.renderTemplate(template, data)`**: A simple template rendering utility.
*   **`CuboMX.actions(actions, rootElement)`**: Programmatically executes a list of DOM actions.

## 8. Lifecycle Hooks

*   **`init()`**: Executed once when the component/store is initialized. Can be `async`.
*   **`destroy()`**: Executed when the component is removed from the DOM.
*   **`onDOMUpdate()`**: Executed on all stores and components every time the DOM is modified by `CuboMX.request()` or `CuboMX.swapHTML()`.

#### Component Communication

Because the `init()` order is not guaranteed, never access one component from another directly inside `init()`. Always use `CuboMX.watch` to react to state changes, which is safer and more robust.

**✅ Safe Example:**
```javascript
// Component A
const ComponentA = {
    valueFromB: '',
    init() {
        // Watch for changes on ComponentB and update self
        CuboMX.watch('componentB.value', (newValue) => {
            this.valueFromB = newValue;
        });
    }
}

// Component B
const ComponentB = {
    value: 'initial'
}
```
