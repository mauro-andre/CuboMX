# CuboMX Documentation

## 1. Introduction

CuboMX is a reactive micro-framework for developers who believe in the power of Server-Side Rendered (SSR) applications and the simplicity of HTML. It challenges the complexity of modern SPAs by embracing a simple, powerful idea: **your server should send HTML, not JSON.**

Following a server-centric philosophy, CuboMX is designed to seamlessly "hydrate" your server-rendered HTML into reactive JavaScript components. It's backend-agnostic, allowing you to enhance applications written in any language—PHP, Python, Ruby, Java, or Node.js—with a modern, reactive user experience without a full rewrite.

**Core Principles:**

-   **HTML as the Source of Truth:** CuboMX starts where your server finishes. It treats the initial server-rendered HTML as the definitive source of state, declaratively hydrating your JavaScript objects directly from the DOM. No need to fetch the same data twice.
-   **JavaScript is for Behavior, Not Structure:** Keep your logic where it belongs—in pure JavaScript modules. CuboMX uses simple directives as bridges to your state, not as a place for inline mini-programs, keeping your HTML clean and focused on structure.
-   **Hierarchical & Predictable State:** CuboMX offers a powerful two-tier state management system. All components and stores are globally accessible for easy debugging and cross-component communication, but within a component's template, you have direct, local access to its properties. This provides the perfect balance of encapsulation and global predictability.
-   **Enhance, Don't Replace:** CuboMX is designed to enhance existing server-rendered applications. You don't need to build a separate SPA. Add reactivity where you need it, from simple components to dynamic AJAX-driven content swaps.

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

## 4. Directives & Scoping

Directives are special HTML attributes that create a bridge between your DOM and your JavaScript state. CuboMX uses a powerful hierarchical scope system.

### `mx-data`

Declares a component and manages its lifecycle (`init`, `destroy`, and `onDOMUpdate` hooks). Crucially, it **creates a local scope**. All directives within this component's DOM tree will first try to resolve properties and methods from the component instance itself.

### Scope Resolution Rules

1.  **Local First:** Expressions are evaluated against the properties of the closest parent component.

    ```html
    <div mx-data="myComponent()" mx-ref="instance1">
        <!-- `isOpen` refers to `instance1.isOpen` -->
        <div mx-show="isOpen">...</div>
        <!-- `toggle` calls `instance1.toggle()` -->
        <button mx-on:click="toggle()">Toggle</button>
    </div>
    ```

2.  **Global with `$`:** To access global stores or other components, use the `$` prefix. This tells CuboMX to bypass the local scope and look directly at the global `CuboMX` object.
    ```html
    <div mx-data="myComponent()">
        <!-- `$theme.mode` refers to `CuboMX.theme.mode` -->
        <div mx-show="$theme.mode === 'dark'">...</div>
    </div>
    ```

### `mx-show`

Shows or hides an element based on the result of a JavaScript expression.

```html
<div mx-show="$theme.mode === 'dark'">...</div>
```

### `mx-on:`

Attaches an event listener to an element.

-   **Syntax:** `mx-on:event.modifier="expression"`
-   **Example:** `<button mx-on:click="$theme.changeTheme()">Change Theme</button>`
-   **Modifiers:**
    -   `.prevent`: Calls `event.preventDefault()`.
    -   `.stop`: Calls `event.stopPropagation()`.
-   **Magic Variables:** Inside an `mx-on` expression, you have access to:

    -   `$el`: The DOM element the listener is attached to.
    -   `$event`: The DOM `Event` object.
    -   `$item`: If the element has an `mx-item` or `mx-attrs` directive, `$item` holds the corresponding reactive object for that element. This is incredibly useful for handling events on lists or specific components.

    **Example with `$item`:**

    ```html
    <div mx-data="cart">
        <ul>
            <!-- `items` is local, but `selectItem` is called on the global `$cart` -->
            <li
                mx-item="items"
                item-id="1"
                mx-on:click="$cart.selectItem($item)"
            >
                Item 1
            </li>
            <li
                mx-item="items"
                item-id="2"
                mx-on:click="$cart.selectItem($item)"
            >
                Item 2
            </li>
        </ul>
    </div>
    ```

    In this case, clicking the first `<li>` would call `CuboMX.cart.selectItem` with the reactive object for that item, which would include `{ itemId: 1, ... }`.

### `mx-ref`

Crucial for factory components, `mx-ref` gives a component instance a unique global name on the `CuboMX` object.

```html
<div mx-data="passwordInput()" mx-ref="passwordField">...</div>
```

```javascript
// Access the instance anywhere in your JS
CuboMX.passwordField.isVisible = true;
```

## 5. Unified Hydration Directives (`mx-attrs` & `mx-item`)

CuboMX features a powerful and unified system for hydrating component state directly from server-rendered HTML. This system is centered around two directives, `mx-attrs` and `mx-item`, which together can build complex, nested, and fully reactive data structures. This is the recommended approach for populating components with data from the backend.

### `mx-attrs="property"` or `mx-attrs="$component.property"`

This is the primary directive for hydrating an object. It transforms the DOM element it's attached to into a reactive JavaScript object, assigning it to a property on either the local component or a global component/store.

**Example:**

**HTML:**

```html
<div mx-data="userProfile">
    <div mx-attrs="user" user-id="99" is-active="true" guest>
        Welcome, John Doe!
    </div>
</div>
```

**JavaScript:**

```javascript
CuboMX.component("userProfile", { user: null });
CuboMX.start();
```

**Resulting State:**
After initialization, `CuboMX.userProfile.user` will be a reactive object containing the hydrated data.

#### Local vs. Global Hydration

-   **Local (default):** `mx-attrs="user"` inside `mx-data="userProfile"` hydrates `CuboMX.userProfile.user`.
-   **Global (with \$):** `mx-attrs="$profile"` hydrates `CuboMX.profile` directly, ignoring the local component scope.

#### Hydration Rules:

-   **Attributes to Properties:** All HTML attributes are converted into properties on the object.
-   **Case Conversion:** Attribute names are converted from `kebab-case` to `camelCase` (e.g., `user-id` becomes `userId`).
-   **Value Parsing:** Attribute values are automatically parsed into their correct JavaScript types. `"123"` becomes `123`, `"true"` becomes `true`, and attributes without a value (like `guest`) also become `true`.
-   **Special Properties:** Three special properties are always created:
    -   `text`: The element's `textContent`.
    -   `html`: The element's `innerHTML`.
    -   `class`: A reactive array containing the element's CSS classes.
-   **Ignored Attributes:** All `mx-*` attributes are ignored during hydration.

#### Reactivity:

The created object is fully reactive.

-   **Updating State -> DOM:** Changing a property on the object updates the corresponding attribute or content in the DOM.

    ```javascript
    // Updates the `user-id` attribute to "100"
    CuboMX.userProfile.user.userId = 100;

    // Removes the `disabled` attribute from the element
    CuboMX.userProfile.user.disabled = false;

    // Updates the element's text content
    CuboMX.userProfile.user.text = "New Text";

    // Adds the 'highlight' class to the element
    CuboMX.userProfile.user.class.push("highlight");
    ```

##### Class Manipulation Helpers

For convenience, the hydrated object also comes with helper methods to ergonomically manage CSS classes, which are often simpler than manipulating the `.class` array directly.

-   **`myObject.addClass('class-name')`**: Adds the specified class if it's not already present.
-   **`myObject.removeClass('class-name')`**: Removes the specified class if it exists.
-   **`myObject.toggleClass('class-name')`**: Adds the class if it's absent, or removes it if it's present.

**Example:**

```javascript
// Given: <div mx-data="myComp" mx-attrs="myDiv" class="initial"></div>
// CuboMX.start() has been called.

// Add a class
CuboMX.myComp.myDiv.addClass("active");
// Element is now: <div ... class="initial active">

// Toggle the class off
CuboMX.myComp.myDiv.toggleClass("active");
// Element is now: <div ... class="initial">
```

#### Two-Way Data Binding

A powerful feature of `mx-attrs` is that when used on form elements like `<input>`, `<textarea>`, or `<select>`, it provides full two-way data binding automatically.

-   For text inputs, it binds the `value` property.
-   For checkboxes, it binds the `checked` property.

This means the state is not only hydrated from the DOM, but any user interaction (like typing or clicking a checkbox) will update the state, and any change in the state will update the DOM.

**Example:**

```html
<div mx-data="form">
    <input type="text" mx-attrs="textInput" />
    <input type="checkbox" mx-attrs="checkboxInput" />
</div>
```

```javascript
CuboMX.component("form", () => ({ textInput: null, checkboxInput: null }));
CuboMX.start();

// Changing state updates the input value
CuboMX.form.textInput.value = "Hello from JS";

// Clicking the checkbox will automatically set CuboMX.form.checkboxInput.checked to true/false
```

#### Granular Binding: `mx-attrs:prop`

For cases where you only need to bind a single property from an element, you can use a modifier. This provides simple two-way data binding without creating a full object.

-   **Syntax:** `mx-attrs:PROPERTY="target"`
-   **Supported Properties:** `value`, `checked`, `text`, `html`, or any custom attribute.

**Example:**

```html
<div mx-data="loginForm">
    <input type="text" mx-attrs:value="email" />
    <input type="checkbox" mx-attrs:checked="rememberMe" />
</div>
```

This binds the input's value to `loginForm.email` and the checkbox's checked status to `loginForm.rememberMe`.

### `mx-item="arrayProperty"` or `mx-item="$component.arrayProperty"`

This directive hydrates an element into a reactive object and pushes it into a target array on either the local component or a global component/store. It uses the **exact same hydration logic as `mx-attrs`**, meaning it captures all attributes, content, and provides two-way data binding for inputs.

`mx-item` is a standalone directive and does not need to be a child of an `mx-attrs` element, making it highly flexible.

**Example 1: Standalone Usage**

Use `mx-item` to hydrate a simple list of objects.

**HTML:**

```html
<div mx-data="myComp">
    <ul>
        <li mx-item="songs" song-id="s1">Song 1</li>
        <li mx-item="songs" song-id="s2">Song 2</li>
    </ul>
</div>
```

**JS:** `CuboMX.component('myComp', { songs: [] });`
**Result:** `CuboMX.myComp.songs` will be an array of two reactive objects.

**Example 2: Nested Hydration**

Because `mx-item` expressions are resolved relative to their parent component, you can easily hydrate nested data structures.

**HTML:**

```html
<div mx-data="playlist">
    <!-- Hydrates playlist.details -->
    <div mx-attrs="details" name="Classic Rock"></div>

    <ul>
        <!-- Hydrates into playlist.details.songs -->
        <li mx-item="details.songs" title="Bohemian Rhapsody">Queen</li>
        <li mx-item="details.songs" title="Stairway to Heaven">Led Zeppelin</li>
    </ul>
</div>
```

**JavaScript:**

```javascript
CuboMX.component("playlist", () => ({
    details: {
        name: "",
        songs: [],
    },
}));
CuboMX.start();
```

**Resulting State:**
This creates a `playlist` object where the `details` property is hydrated from the `<div>`, and the `songs` array within `details` is populated by the `<li>` elements.

#### Granular Binding

For cases where you only need to bind a single property or create an array of primitive values, you can use modifiers on the directives.

##### `mx-item:prop`

Hydrates an array of primitive values instead of objects.

-   **Syntax:** `mx-item:PROPERTY="targetArray"`
-   **Supported Properties:** `value`, `text`, `html`.
-   **Example:**
    ```html
    <div mx-data="product">
        <ul>
            <li mx-item:text="tags">New</li>
            <li mx-item:text="tags">Featured</li>
        </ul>
    </div>
    ```
    This results in `CuboMX.product.tags` being `['New', 'Featured']`. `mx-item:value` prioritizes the `value` attribute, falling back to `textContent` if it doesn't exist.

## 6. Client-Side Rendering with Templates

While CuboMX's primary philosophy is to enhance server-rendered HTML, it provides a powerful and flexible template system for cases where you need to render new DOM elements on the client-side, such as displaying notifications, alerts, or content from an AJAX response.

This system is designed to respect the "backend as the source of truth" principle: the HTML structure is still defined by the backend, but stored in an inert `<template>` tag to be used by the client when needed.

### Step 1: Define Templates with `mx-template`

The backend should render `<template>` tags with the `mx-template` attribute. CuboMX will automatically find these templates, store their content, and remove them from the DOM so they are not visible.

```html
<!-- The backend provides the template for an alert -->
<template mx-template="error-alert">
    <div class="alert alert-danger">
        <strong>{{title}}</strong>
        <p>{{message}}</p>
    </div>
</template>
```

> [!IMPORTANT]
> If your backend template engine (like Jinja, Blade, or Twig) also uses `{{...}}`, you must wrap the content of your `<template>` tag in a "raw" or "verbatim" block to prevent the server from processing the placeholders. For example, in Jinja: `{% raw %}...{% endraw %}`.

### Step 2: Render Templates with JavaScript

Use the `CuboMX.renderTemplate()` function to create an HTML string from a registered template and a data object.

```javascript
// In your component, after a validation fails
const alertHtml = CuboMX.renderTemplate("error-alert", {
    title: "Validation Error",
    message: "Please fill in all required fields.",
});
```

### Step 3: Add to the DOM with `swapHTML`

Use the powerful `CuboMX.swapHTML()` utility to insert the newly rendered HTML string anywhere in the DOM. The `beforeend` strategy is perfect for adding elements to a container.

```javascript
// The target container for alerts
// <div id="alert-container"></div>

CuboMX.swapHTML(alertHtml, [
    { select: "this", target: "#alert-container:beforeend" },
]);
```

This approach provides a clean way to handle client-side rendering without sacrificing the core philosophy of server-defined structure. It's perfect for UI components like notifications, modals, and for rendering lists of items returned from an API call.

## 7. Magic Properties

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

## 8. Global API

-   **`CuboMX.component(name, definition)`**: Registers a component (Singleton object or Factory function).
-   **`CuboMX.store(name, object)`**: Registers a global store.
-   **`CuboMX.start()`**: Starts the framework.
-   **`CuboMX.watch(path, callback)`**: Watches a property on any global store or component. The path is a simple string, e.g., `'passwordField.value'` or `'theme.mode'`.
    ```javascript
    CuboMX.watch('passwordField.value', (newValue) => { ... });
    CuboMX.watch('theme.mode', (newMode) => { ... });
    ```
-   **`CuboMX.render(templateString, data)`**: Renders a raw HTML string with data by replacing `{{key}}` placeholders.
-   **`CuboMX.renderTemplate(templateName, data)`**: Renders a pre-registered `<template>` by name.
-   **`CuboMX.request(config)`**: Performs an AJAX request.
-   **`CuboMX.swapHTML(html, strategies, options)`**: Updates the DOM from an HTML string.
-   **`CuboMX.actions(actions, rootElement)`**: Programmatically executes a list of DOM actions.

## 9. Lifecycle Hooks

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
