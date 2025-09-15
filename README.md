# CuboMX Documentation

## 1. Introduction

CuboMX is a reactive micro-framework for developers who believe in the power of Server-Side Rendered (SSR) applications and the simplicity of HTML. It challenges the complexity of modern SPAs by embracing a simple, powerful idea: **your server should send HTML, not JSON.**

Following a server-centric philosophy, CuboMX is designed to seamlessly "hydrate" your server-rendered HTML into reactive JavaScript components. It's backend-agnostic, allowing you to enhance applications written in any language—PHP, Python, Ruby, Java, or Node.js—with a modern, reactive user experience without a full rewrite.

**Core Principles:**

-   **HTML as the Source of Truth:** CuboMX starts where your server finishes. It treats the initial server-rendered HTML as the definitive source of state, declaratively hydrating your JavaScript objects directly from the DOM. No need to fetch the same data twice.
-   **JavaScript is for Behavior, Not Structure:** Keep your logic where it belongs—in pure JavaScript modules. CuboMX uses simple directives as bridges to your state, not as a place for inline mini-programs, keeping your HTML clean and focused on structure.
-   **Global, Predictable State:** All reactive state is managed on a single, flat global `CuboMX` object. This eliminates the complexity of nested scopes and makes it immediately clear where your data lives, creating a predictable and easy-to-debug environment.
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

## 4. Directives

Directives are special HTML attributes that create a bridge between your DOM and your JavaScript state. **All expressions must explicitly reference the global proxies** (e.g., `myStore.property`, `myComponent.property`).

### `mx-data`

Declares a component and manages its lifecycle (`init` and `destroy` hooks). It **does not** create a scope; all child elements still access state from the global `CuboMX` object.

### `mx-show`

Shows or hides an element based on the result of a JavaScript expression.

```html
<div mx-show="theme.mode === 'dark'">...</div>
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
    -   `$item`: If the element has an `mx-item` or `mx-attrs` directive, `$item` holds the corresponding reactive object for that element. This is incredibly useful for handling events on lists or specific components.

    **Example with `$item`:**
    ```html
    <ul>
        <li mx-item:cart.items item-id="1" mx-on:click="cart.selectItem($item)">Item 1</li>
        <li mx-item:cart.items item-id="2" mx-on:click="cart.selectItem($item)">Item 2</li>
    </ul>
    ```
    In this case, clicking the first `<li>` would call `cart.selectItem` with the reactive object for that item, which would include `{ itemId: 1, ... }`.

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

### `mx-attrs:component.property`

This is the primary directive for hydrating an object. It transforms the DOM element it's attached to into a reactive JavaScript object, assigning it to the specified component property.

**Example:**

**HTML:**
```html
<div mx-data="user-profile">
    <div mx-attrs:user-profile.user
         user-id="99"
         is-active="true"
         guest>
        Welcome, John Doe!
    </div>
</div>
```

**JavaScript:**
```javascript
CuboMX.component('userProfile', { user: null });
CuboMX.start();
```

**Resulting State:**
After initialization, `CuboMX.userProfile.user` will be a reactive object:
```javascript
{
    userId: 99,
    isActive: true,
    guest: true,
    text: "Welcome, John Doe!",
    html: "Welcome, John Doe!",
    class: []
}
```

#### Hydration Rules:

-   **Attributes to Properties:** All HTML attributes are converted into properties on the object.
-   **Case Conversion:** Attribute names are converted from `kebab-case` to `camelCase` (e.g., `user-id` becomes `userId`).
-   **Value Parsing:** Attribute values are automatically parsed into their correct JavaScript types using `parseValue`. `"123"` becomes `123`, `"true"` becomes `true`, `"null"` becomes `null`, etc.
-   **Boolean Attributes:** Attributes without a value (like `guest` in the example) are treated as `true`.
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
    CuboMX.userProfile.user.class.push('highlight');
    ```

#### Two-Way Data Binding

A powerful feature of `mx-attrs` is that when used on form elements like `<input>`, `<textarea>`, or `<select>`, it provides full two-way data binding automatically, making it a superior alternative to `mx-model`.

-   For text inputs, it binds the `value` property.
-   For checkboxes, it binds the `checked` property.

This means the state is not only hydrated from the DOM, but any user interaction (like typing or clicking a checkbox) will update the state, and any change in the state will update the DOM.

**Example:**
```html
<div mx-data="form">
    <input type="text" mx-attrs:form.textInput>
    <input type="checkbox" mx-attrs:form.checkboxInput>
</div>
```
```javascript
CuboMX.component('form', { textInput: null, checkboxInput: null });
CuboMX.start();

// Changing state updates the input value
CuboMX.form.textInput.value = 'Hello from JS';

// Clicking the checkbox will automatically set CuboMX.form.checkboxInput.checked to true/false
```

### `mx-item:component.arrayProperty`

This directive hydrates an element into a reactive object and pushes it into a target array. It uses the **exact same hydration logic as `mx-attrs`**, meaning it captures all attributes, content, and provides two-way binding for inputs.

`mx-item` is a standalone directive and does not need to be a child of an `mx-attrs` element, making it highly flexible.

**Example 1: Standalone Usage**

Use `mx-item` to hydrate a simple list of objects.

**HTML:**
```html
<div mx-data="my-comp">
    <ul>
        <li mx-item:my-comp.songs song-id="s1">Song 1</li>
        <li mx-item:my-comp.songs song-id="s2">Song 2</li>
    </ul>
</div>
```
**JS:** `CuboMX.component('myComp', { songs: null });`
**Result:** `CuboMX.myComp.songs` will be an array of two reactive objects.

**Example 2: Nested Usage with `mx-attrs`**

You can combine `mx-attrs` and `mx-item` to hydrate complex, nested data structures from the DOM.

**HTML:**
```html
<div mx-data="my-comp">
    <div mx-attrs:my-comp.profile user-id="123" name="John Doe">
        <ul>
            <li mx-item:my-comp.profile.songs song-id="s1" title="Bohemian Rhapsody">Queen</li>
            <li mx-item:my-comp.profile.songs song-id="s2" title="Stairway to Heaven">Led Zeppelin</li>
        </ul>
    </div>
</div>
```

**JavaScript:**
```javascript
CuboMX.component('myComp', { profile: null });
CuboMX.start();
```

**Resulting State:**
This creates a nested data structure. The `profile` object contains a `songs` array, and each item in the array is a rich object created from its `<li>` element.
```javascript
{
    profile: {
        userId: 123,
        name: "John Doe",
        text: "...",
        html: "<ul>...</ul>",
        class: [],
        songs: [
            { songId: "s1", title: "Bohemian Rhapsody", text: "Queen", ... },
            { songId: "s2", title: "Stairway to Heaven", text: "Led Zeppelin", ... }
        ]
    }
}
```

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
