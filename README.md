# CuboMX Documentation

## 1. Introduction

CuboMX is a reactive micro-framework for JavaScript, built from the ground up to be the best way to add modern, reactive user interfaces to Server-Side Rendered (SSR) applications. Its philosophy is based on enhancing HTML with reactivity through a simple, explicit, and predictable global API.

**Core Principles:**

-   **JavaScript is the Home for Logic:** Unlike other frameworks that encourage complex logic within HTML attributes, CuboMX believes that JavaScript is the proper place for application logic. Components are written in pure JavaScript, keeping your HTML clean and focused on structure.
-   **HTML is for State Binding, Not Logic:** The role of HTML is to declaratively bind elements to your JavaScript state. Directives like `mx-text` and `mx-on` are simple, explicit bridges, not a place to write inline JavaScript programs.
-   **Global, Predictable State:** All reactive state is managed on a single, flat global `CuboMX` object. This eliminates the complexity of nested scopes and makes it immediately clear where your data lives, creating a predictable and easy-to-debug environment.
-   **SSR-First Hydration:** CuboMX is built with Server-Side Rendering as a primary use case. Its directives are designed to effortlessly "hydrate" the state of your application from the initial HTML rendered by the server, bridging the gap between backend and frontend.

## 2. Installation and Initialization

To use CuboMX, you register your stores and components, then start the engine.

**`index.js` (Example):**

```javascript
import { CuboMX } from "cubomx";
import { loginControl } from "./components/loginControl";
import { passwordInput } from "./components/passwordInput";

// 1. (Optional) Define and register your global stores
const themeStore = {
    mode: "light",
    changeTheme() {
        this.mode = this.mode === "light" ? "dark" : "light";
    },
};
CuboMX.store("theme", themeStore);

// 2. Register your components
CuboMX.component("loginControl", loginControl); // Singleton Component
CuboMX.component("passwordInput", passwordInput); // Factory Component

// 3. Start CuboMX to scan the DOM and initialize everything
CuboMX.start();
```

## 3. Components & Stores

Components and stores are the heart of CuboMX. They are JavaScript objects that contain the state and logic for your application. After registration, they become available as reactive proxies directly on the global `CuboMX` object.

### 3.1. Stores

Stores are global singletons, perfect for shared state across the entire application, like theme settings or user authentication status.

-   **Definition (JS):** A simple object.
    ```javascript
    const themeStore = { mode: "light" };
    CuboMX.store("theme", themeStore);
    ```
-   **Global Access:** The store is globally accessible via `CuboMX.storeName` (e.g., `CuboMX.theme`).

### 3.2. Singletons

These are components that exist only once per page, ideal for page-specific controllers.

-   **Definition (JS):** A simple object, registered with `CuboMX.component`.
    ```javascript
    const loginControl = { email: "" };
    CuboMX.component("loginControl", loginControl);
    ```
-   **Usage (HTML):** The `mx-data` attribute links the DOM element to the component, managing its lifecycle.
    ```html
    <div mx-data="loginControl">...</div>
    ```
-   **Global Access:** The single instance is globally accessible via `CuboMX.componentName` (e.g., `CuboMX.loginControl`).

### 3.3. Reusable Components (Factories)

Factories are functions that return new object instances, perfect for UI elements that appear multiple times, like form fields or modals.

-   **Definition (JS):** A **function** that returns a new object.
    ```javascript
    const passwordInput = () => ({ isVisible: false });
    CuboMX.component("passwordInput", passwordInput);
    ```
-   **Usage (HTML):** Use parentheses `()` in `mx-data` and assign a unique name with `mx-ref`.
    ```html
    <div mx-data="passwordInput()" mx-ref="passwordOne">...</div>
    <div mx-data="passwordInput()" mx-ref="passwordTwo">...</div>
    ```
-   **Global Access:** Instances are globally accessible via the name provided in `mx-ref` (e.g., `CuboMX.passwordOne`).

## 4. Directives

Directives are special HTML attributes that create a bridge between your DOM and your JavaScript state. **All expressions must explicitly reference the global proxies** (e.g., `myStore.property`, `myComponent.property`).

### `mx-data`

Declares a component and manages its lifecycle (`init` and `destroy` hooks). It **does not** create a scope; all child elements still access state from the global `CuboMX` object.

### `mx-model`

Creates a two-way data binding on a form element. It supports standard inputs (`text`, `textarea`, `select`) as well as checkboxes.

```html
<!-- Binds the input's value to the 'email' property -->
<input type="text" mx-model="loginControl.email" />

<!-- Binds the checkbox's checked status to the 'notifications' property -->
<input type="checkbox" mx-model="settings.notifications" />
```

**SSR Hydration:**
Similar to `mx-text`, `mx-model` can hydrate the initial state from server-rendered attributes. If the bound property is `null` or `undefined`, CuboMX will use the element's `value` (for text inputs) or `checked` status (for checkboxes) to populate the state.

**Example:**

**Server-Rendered HTML:**
```html
<div mx-data="userForm">
    <input type="text" mx-model="userForm.name" value="John Doe" />
    <input type="checkbox" mx-model="userForm.agreed" checked />
</div>
```

**JavaScript:**
```javascript
CuboMX.component("userForm", {
    name: null,
    agreed: undefined
});
CuboMX.start();

// After start():
// CuboMX.userForm.name will be "John Doe"
// CuboMX.userForm.agreed will be true
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

**SSR Hydration:**
For applications using Server-Side Rendering (SSR), `mx-text` has a special behavior. If the bound property in your component is `null` or `undefined` when CuboMX starts, the directive will automatically update your component's state with the initial text content rendered by the server. This provides a simple way to "hydrate" your frontend state from the server-rendered HTML.

**Example:**

**Server-Rendered HTML:**

```html
<div mx-data="userProfile">
    <h1 mx-text="userProfile.name">John Doe</h1>
</div>
```

**JavaScript:**

```javascript
CuboMX.component("userProfile", {
    name: null, // or just {}, where name is undefined
});
CuboMX.start();

// After start(), CuboMX.userProfile.name will be "John Doe"
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
<div
    class="static-class"
    :class="theme.mode === 'dark' ? 'bg-dark' : 'bg-light'"
>
    ...
</div>
```

### `mx-on:`

Attaches an event listener to an element.

-   **Syntax:** `mx-on:event.modifier="expression"`
-   **Example:** `<button mx-on:click="theme.changeTheme()">Change Theme</button>`
-   **Modifiers:**
    -   `.prevent`: Calls `event.preventDefault()`.
    -   `.stop`: Calls `event.stopPropagation()`.
-   **Magic Variables:** Inside an `mx-on` expression, you have access to:
    -   `$el`: The DOM element the listener is attached to.
    -   `$event`: The DOM `Event` object.
    -   `$item`: If the element is an `mx-item` within an `mx-array`, `$item` holds the corresponding data item (primitive or object) for that element. This is incredibly useful for handling clicks on lists.

    **Example with `$item`:**
    ```html
    <ul mx-array:cart.items>
        <li mx-item mx-obj:id="1" mx-on:click="cart.selectItem($item)">Item 1</li>
        <li mx-item mx-obj:id="2" mx-on:click="cart.selectItem($item)">Item 2</li>
    </ul>
    ```
    In this case, clicking the first `<li>` would call `cart.selectItem` with the object `{ id: 1 }`.

### `mx-ref`

Crucial for factory components, `mx-ref` gives a component instance a unique global name on the `CuboMX` object.

```html
<div mx-data="passwordInput()" mx-ref="passwordField">...</div>
```

```javascript
// Access the instance anywhere in your JS
CuboMX.passwordField.isVisible = true;
```

## 5. Advanced SSR Hydration Directives

For deep integration with Server-Side Rendering (SSR), CuboMX offers a powerful set of declarative directives to hydrate complex data structures directly from your HTML, without writing any inline JavaScript.

This is the primary method for populating your components with data (like database query results) that is rendered on the server.

#### `mx-prop:component.property="value"`

This is the simplest way to hydrate a single, primitive value (string, number, boolean) into a component.

- **HTML:** `<div mx-prop:cart.user-id="123"></div>`
- **JS:** `CuboMX.component('cart', { userId: null });`
- **Result:** After `CuboMX.start()`, `CuboMX.cart.userId` will be `123`.

#### `mx-obj:component.objectProperty`

This directive, combined with `mx-obj:*` attributes on the same element, allows you to build a complete object.

- **HTML:** 
  ```html
  <div mx-obj:cart.user 
       mx-obj:id="456" 
       mx-obj:display-name="'Mauro'" 
       class="user-data">
  </div>
  ```
- **JS:** `CuboMX.component('cart', { user: null });`
- **Result:** `CuboMX.cart.user` will be `{ id: 456, displayName: 'Mauro' }`. Note that the standard `class` attribute is ignored.

#### `mx-array:component.arrayProperty` & `mx-item`

This is the most powerful combination, used to hydrate arrays of primitives or objects.

1.  **`mx-array`**: Placed on a parent element, it declares the target array property.
2.  **`mx-item`**: Placed on child elements, it defines each item in the array.

**Example 1: Array of Primitives**

If `mx-item` has a value, it's evaluated as an expression.

- **HTML:**
  ```html
  <ul mx-array:product.tags>
      <li mx-item="'new-arrival'"></li>
      <li mx-item="'featured'"></li>
  </ul>
  ```
- **JS:** `CuboMX.component('product', { tags: [] });`
- **Result:** `CuboMX.product.tags` will be `['new-arrival', 'featured']`.

**Example 2: Array of Objects**

If `mx-item` has no value, it collects the `mx-obj:*` attributes from its own element to build an object.

- **HTML:**
  ```html
  <ul mx-array:cart.items>
      <li mx-item mx-obj:id="1" mx-obj:name="'Product A'"></li>
      <li mx-item mx-obj:id="2" mx-obj:name="'Product B'"></li>
  </ul>
  ```
- **JS:** `CuboMX.component('cart', { items: [] });`
- **Result:** `CuboMX.cart.items` will be `[{ id: 1, name: 'Product A' }, { id: 2, name: 'Product B' }]`.


## 6. Magic Properties

Within a component's methods, you have access to a few special `this` properties:

-   **`this.$el`**: A direct reference to the component's root DOM element (the one with the `mx-data` attribute). This is useful for direct DOM manipulation, especially within the `init()` hook.
-   **`this.$watch('property', callback)`**: Watches a property **on the current component instance** for changes.

**Example using `this.$el`:**

```javascript
const searchField = {
    init() {
        // Automatically focus the input field when the component is initialized
        this.$el.querySelector("input").focus();
    },
};
CuboMX.component("searchField", searchField);
```

```html
<div mx-data="searchField">
    <input type="search" placeholder="Search..." />
</div>
```

## 7. Global API

-   **`CuboMX.component(name, definition)`**: Registers a component (Singleton object or Factory function).
-   **`CuboMX.store(name, object)`**: Registers a global store.
-   **`CuboMX.start()`**: Starts the framework.
-   **`CuboMX.watch(path, callback)`**: Watches a property on any global store or component. The path is a simple string, e.g., `'passwordField.value'` or `'theme.mode'`.
    ```javascript
    CuboMX.watch('passwordField.value', (newValue) => { ... });
    CuboMX.watch('theme.mode', (newMode) => { ... });
    ```
-   **`CuboMX.request(config)`**: Performs an AJAX request.
-   **`CuboMX.swapHTML(html, strategies, options)`**: Updates the DOM from an HTML string.
-   **`CuboMX.renderTemplate(template, data)`**: A simple template rendering utility.
-   **`CuboMX.actions(actions, rootElement)`**: Programmatically executes a list of DOM actions.

## 8. Lifecycle Hooks

-   **`init()`**: Executed once when the component/store is initialized. Can be `async`.
-   **`destroy()`**: Executed when the component is removed from the DOM.
-   **`onDOMUpdate()`**: Executed on all stores and components every time the DOM is modified by `CuboMX.request()` or `CuboMX.swapHTML()`.

#### Component Communication

Because the `init()` order is not guaranteed, never access one component from another directly inside `init()`. Always use `CuboMX.watch` to react to state changes, which is safer and more robust.

**✅ Safe Example:**

```javascript
// Component A
const ComponentA = {
    valueFromB: "",
    init() {
        // Watch for changes on ComponentB and update self
        CuboMX.watch("componentB.value", (newValue) => {
            this.valueFromB = newValue;
        });
    },
};

// Component B
const ComponentB = {
    value: "initial",
};
```
