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

### Installation via NPM

To get started, add CuboMX to your project using npm:

```bash
npm install cubomx
```

### Initialization

CuboMX needs to be initialized to scan the page and activate its components. The process is simple: register your components, and then call `CuboMX.start()`.

Let's see a basic example in an `index.js` file:

```javascript
import { CuboMX } from "cubomx";
import { loginControl } from "./components/loginControl.js";
import { passwordInput } from "./components/passwordInput.js";

// 1. (Optional) Register "Stores" for global state.
// A store is ideal for data shared across the entire application, like the theme.
const themeStore = {
    mode: "light",
    changeTheme() {
        this.mode = this.mode === "light" ? "dark" : "light";
    },
};
CuboMX.store("theme", themeStore);

// 2. Register your components.
// They can be simple objects (Singletons) or functions (Factories).
CuboMX.component("loginControl", loginControl);
CuboMX.component("passwordInput", passwordInput);

// 3. Start CuboMX.
// It will scan the DOM, find the `mx-data` attributes, and initialize everything.
CuboMX.start();
```

## 3. Components: The Foundation

In CuboMX, everything revolves around components. They are JavaScript objects that contain the state (data) and behavior (methods) of your interface. Although they are all components in essence, there are three ways to register them, each with a specific purpose.

### 3.1. Singletons

A Singleton is a component that will have only **one instance** per page. It is defined as a simple JavaScript object. It is ideal for managing the state of an entire page or a main section that does not repeat.

-   **Definition (JS):**
    ```javascript
    // components/pageController.js
    export const pageController = {
        title: "My Page",
        isLoading: true,
        loadContent() {
            // Logic to load data...
            this.isLoading = false;
        },
    };
    ```
-   **Registration (JS):**
    ```javascript
    import { pageController } from "./components/pageController.js";
    CuboMX.component("pageController", pageController);
    ```

### 3.2. Factories

A Factory is used for **reusable** components, such as modals, dropdowns, or list items. Instead of an object, you define a **function that returns a new object**. Each time CuboMX encounters the component in the HTML, it calls this function to create a new, independent instance.

-   **Definition (JS):**
    ```javascript
    // components/dropdown.js
    export const dropdown = () => ({
        isOpen: false,
        toggle() {
            this.isOpen = !this.isOpen;
        },
        close() {
            this.isOpen = false;
        },
    });
    ```
-   **Registration (JS):**
    ```javascript
    import { dropdown } from "./components/dropdown.js";
    CuboMX.component("dropdown", dropdown);
    ```

### 3.3. Stores

A Store is semantically similar to a Singleton: it is also a single, global instance. The difference is its purpose. Use Stores to hold **shared global state** that is not directly tied to a specific part of the DOM, such as user information, theme preferences, or authentication status.

-   **Definition (JS):**
    ```javascript
    const authStore = {
        isLoggedIn: false,
        user: null,
    };
    ```
-   **Registration (JS):**
    ```javascript
    CuboMX.store("auth", authStore);
    ```

## 4. Directives: Connecting HTML and JavaScript

Directives are special attributes in HTML that CuboMX understands. They are the bridge between your DOM and your JavaScript components.

### `mx-data`

This is the most important directive. It declares that a DOM element and its children are controlled by a component, creating a **local scope**.

-   **For Singletons:** Use the component's name.
    ```html
    <div mx-data="pageController">
        <!-- All content here can access the properties of pageController -->
    </div>
    ```
-   **For Factories:** Use the factory's name followed by parentheses `()`. This instructs CuboMX to create a new instance.
    ```html
    <div mx-data="dropdown()">...</div>
    <div mx-data="dropdown()">...</div>
    ```

### `mx-ref`

When you have multiple factory instances, how do you differentiate them in JavaScript? With `mx-ref`. This directive gives a **unique and global name** to a factory instance.

```html
<!-- Two independent dropdowns, each with its own name -->
<div mx-data="dropdown()" mx-ref="headerMenu">...</div>
<div mx-data="dropdown()" mx-ref="userMenu">...</div>
```

Now, you can access each instance from anywhere in your JavaScript:

```javascript
// Open the header menu
CuboMX.headerMenu.toggle();

// Close the user menu
CuboMX.userMenu.close();
```

### `mx-show`

This directive shows or hides an element based on a boolean expression. By default, the expression is evaluated in the **local component's scope**.

Let's use our `dropdown` factory:

```html
<div mx-data="dropdown()" mx-ref="headerMenu">
    <button>Menu</button>

    <!-- `isOpen` refers to the `isOpen` property of the `headerMenu` instance -->
    <div mx-show="isOpen">
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
    </div>
</div>
```

In this example, `isOpen` resolves to `CuboMX.headerMenu.isOpen`.

### `mx-on`: Handling User Events

This directive attaches an event listener to an element, allowing you to run code in response to user interactions. You can use any standard browser DOM event, like `click`, `submit`, `keydown`, `mouseenter`, etc. By default, the expression is evaluated in the **local component's scope**.

Let's complete our dropdown example:

```html
<div mx-data="dropdown()" mx-ref="headerMenu">
    <!-- The `toggle()` method is called on the `headerMenu` instance -->
    <button mx-on:click="toggle()">Menu</button>
    
    <div mx-show="isOpen">
        ...
    </div>
</div>
```
Clicking the button will call the `toggle()` method of our `dropdown` component, changing the `isOpen` property and, through reactivity, showing or hiding the `div`.

#### Modifiers

You can chain modifiers to the event name to change its behavior:

-   `.prevent`: Calls `event.preventDefault()` on the triggered event. This is useful for stopping default actions, like a form submission.
-   `.stop`: Calls `event.stopPropagation()`, preventing the event from bubbling up to parent elements.

```html
<!-- Prevents the form from doing a full page reload on submission -->
<form mx-on:submit.prevent="saveData()">
    ...
</form>
```

#### Magic Variables

Inside an `mx-on` expression, you have access to special variables that provide extra context:

-   `$event`: The raw browser `Event` object. Useful for accessing event-specific properties, like `event.key` on a `keydown` event.
-   `$el`: A reference to the DOM element the listener is attached to.
-   `$item`: If the element is also hydrated by `mx-bind` or `mx-item`, `$item` gives you direct access to that reactive object. This is incredibly powerful for lists.

**Example using `$item`:**

Let's imagine a playlist where clicking an item selects it.

```html
<div mx-data="playlist">
    <p>Selected: {{ selectedSong ? selectedSong.text : 'None' }}</p>
    <ul>
        <!-- On click, we pass the reactive `song` object to the method -->
        <li mx-item="songs" song-id="s1" mx-on:click="selectSong($item)">
            Bohemian Rhapsody
        </li>
        <li mx-item="songs" song-id="s2" mx-on:click="selectSong($item)">
            Stairway to Heaven
        </li>
    </ul>
</div>
```

```javascript
// JS
CuboMX.component('playlist', {
    songs: [],
    selectedSong: null,
    selectSong(song) {
        // `song` is the reactive object for the clicked <li>
        this.selectedSong = song;
        console.log(`Selected: ${song.text.trim()}`);
    }
});
```
In this case, `$item` refers to the specific, reactive song object associated with the clicked `<li>`, making it trivial to manage selections.

### `mx-link`

Upgrades a standard `<a>` link to use an AJAX request for navigation, preventing a full page reload. This is ideal for creating a fast, SPA-like user experience, inspired by HTMX's `hx-boost`.

When `mx-link` is added to an anchor tag, it automatically:
1.  Prevents the default navigation on click.
2.  Calls `CuboMX.request` using the link's `href`.
3.  Sets `history: true` and `pushUrl: true` to update the browser's address bar and history.

The server should respond with an `X-Swap-Strategies` header to instruct CuboMX on how to update the DOM. If this header is not found, CuboMX will attempt a **"smart swap"** by automatically comparing the received HTML with the current DOM (see `CuboMX.swapHTML` for details).

**Example:**

```html
<!-- This link will fetch /profile via AJAX instead of doing a full page navigation -->
<a href="/profile" mx-link>My Profile</a>

<!-- The server handling /profile should respond with HTML and a header like: -->
<!-- X-Swap-Strategies: [{ "select": "#main-content", "target": "#main-content" }] -->
```

## 5. Hydration: HTML as the Source of Truth

One of CuboMX's superpowers is hydration: the ability to read data directly from your server-rendered HTML and transform it into **reactive** JavaScript objects. This means that any change to these objects will update the DOM, and any change in the DOM (in forms) will update the objects.

### `mx-bind`

Transforms an element and its attributes into a reactive **object**.

Imagine your backend rendered this HTML for a user profile:

```html
<div mx-data="userProfile">
    <div id="user-card" mx-bind="user" user-id="99" is-active="true" guest>
        Welcome, John Doe!
    </div>
</div>
```

And your JavaScript component:

```javascript
// JS
CuboMX.component("userProfile", {
    user: null, // The `user` property starts as null
});
CuboMX.start();
```

After initialization, `CuboMX.userProfile.user` will be magically populated:

```javascript
console.log(CuboMX.userProfile.user);
// {
//   userId: 99,
//   isActive: true,
//   guest: true,
//   text: "Welcome, John Doe!",
//   html: "Welcome, John Doe!",
//   class: [...],
//   ...
// }
```

### `mx-item`

Works similarly to `mx-bind`, but instead of creating an object, it creates an object and pushes it into an **array**. It's perfect for lists.

```html
<div mx-data="playlist">
    <ul>
        <li mx-item="songs" song-id="s1">Bohemian Rhapsody</li>
        <li mx-item="songs" song-id="s2">Stairway to Heaven</li>
    </ul>
</div>
```

```javascript
// JS
CuboMX.component("playlist", {
    songs: [], // The `songs` property is an empty array
});
CuboMX.start();
```

After initialization, `CuboMX.playlist.songs` will be an array of two reactive objects.

### Hydration Rules

-   **Attributes to Properties:** HTML attributes are converted to properties on the object.
-   **Case Conversion:** `kebab-case` becomes `camelCase` (`user-id` -> `userId`).
-   **Value Parsing:** Values are converted to the correct types (`"123"` -> `123`, `"true"` -> `true`). Attributes without a value become `true`.
-   **Special Properties:** `text` (`textContent`), `html` (`innerHTML`), and `class` (a reactive array of CSS classes) are always created.

### Granular Hydration

Sometimes, you don't need a whole object.

-   **`mx-bind:prop="property"` (shorthand `:prop="property"`):** Binds just one attribute to a property. Great for simple two-way binding.
    ```html
    <div mx-data="loginForm">
        <!-- Both of these are equivalent -->
        <input type="text" mx-bind:value="email" />
        <input type="text" :value="email" />
    </div>
    ```
> **Shorthand and Ambiguity Warning**
>
> The `:` shorthand is an alias **exclusively** for `mx-bind:`. Its purpose is to bind HTML attributes. **Do not** use it as a shorthand for `mx-item:prop`, as this will lead to unexpected behavior.
>
> ```html
> <!-- DO: To populate an array of strings, use the full directive -->
> <li mx-item:text="tags">Featured</li>
>
> <!-- DON'T: This will NOT populate the array. It will try to bind the "text" attribute. -->
> <li :text="tags">Featured</li>
> ```

-   **`mx-item:prop="array"`:** Creates an array of primitive values (text, attribute value) instead of an array of objects.
    ```html
    <div mx-data="product">
        <ul>
            <li mx-item:text="tags">New</li>
            <li mx-item:text="tags">Featured</li>
        </ul>
    </div>
    ```
    This results in `CuboMX.product.tags` being `['New', 'Featured']`.

### Two-Way Data Binding

When `mx-bind` is used on form elements (`<input>`, `<select>`, etc.), it automatically creates a two-way data binding. User input updates the state, and state changes update the field.

```html
<div mx-data="form">
    <input type="text" mx-bind="textInput" value="Initial value" />
</div>
```

```javascript
// JS
CuboMX.component("form", { textInput: null });
CuboMX.start();

// The state is hydrated from the DOM
console.log(CuboMX.form.textInput.value); // "Initial value"

// User types in the field -> CuboMX.form.textInput.value is updated.
// Changing the state -> The field is updated.
CuboMX.form.textInput.value = "New value";
```

### Reactivity (State -> DOM)

Hydrated objects are fully reactive. Changing a property in JavaScript automatically updates the HTML.

```javascript
const userCard = CuboMX.userProfile.user;

// Changes the `user-id` attribute in the HTML to "100"
userCard.userId = 100;

// Changes the element's text
userCard.text = "Welcome, Mauro!";

// Adds the "highlight" class to the element
userCard.class.push("highlight");
```

### Class Manipulation Helpers

For convenience, the hydrated object comes with methods to manage classes:

-   `myObject.addClass('class-name')`
-   `myObject.removeClass('class-name')`
-   `myObject.toggleClass('class-name')`

## 6. Scopes: The Power of Local and the Flexibility of Global

So far, all examples have worked within the **local scope**: a directive always interacts with the nearest `mx-data` component. This is the main rule and makes components predictable and encapsulated.

But what if you need to access a global Store or another component?

### The `$` Prefix

To "escape" the local scope and access the **global scope** (the main `CuboMX` object), use the `$` prefix.

**Example 1: Accessing a Store**

Let's use the `themeStore` we registered at the beginning.

```html
<body mx-data="pageController">
    <!-- `$theme.mode` accesses the global store, ignoring `pageController` -->
    <div mx-show="$theme.mode === 'dark'">You are in dark mode!</div>

    <button mx-on:click="$theme.changeTheme()">Change Theme</button>
</body>
```

**Example 2: Accessing another Component**

You can access any Singleton or Factory instance (via `mx-ref`) from anywhere.

```html
<!-- Notification component -->
<div mx-data="notifier" mx-ref="globalNotifier">
    <div mx-show="message">{{ message }}</div>
</div>

<!-- Another component elsewhere on the page -->
<div mx-data="contactForm">
    <!-- This button calls a method on a completely different component! -->
    <button mx-on:click="$globalNotifier.show('Message sent!')">Send</button>
</div>
```

## 7. Client-Side Rendering with Templates

While CuboMX prioritizes server-rendered HTML, it provides a template system for when you need to render new elements on the client-side (e.g., notifications, content from an AJAX response).

**Step 1: Define the Template with `mx-template`**

Your backend renders an inert `<template>` tag.

```html
<template mx-template="error-alert">
    <div class="alert alert-danger">
        <strong>{{title}}</strong>
        <p>{{message}}</p>
    </div>
</template>
```

> [!IMPORTANT]
> If your template engine (Jinja, Blade, etc.) also uses `{{...}}`, wrap the content in a "raw" block to prevent the server from processing it.

**Step 2: Render with JavaScript**

Use `CuboMX.renderTemplate()` to generate the HTML.

```javascript
const alertHtml = CuboMX.renderTemplate("error-alert", {
    title: "Validation Error",
    message: "Please fill in all fields.",
});
```

**Step 3: Add to the DOM**

Use `CuboMX.swapHTML()` to insert the HTML into the page.

```javascript
CuboMX.swapHTML(alertHtml, [
    { select: "this", target: "#alert-container:beforeend" },
]);
```

## 8. Magic Properties

Within a component's methods, you have access to special properties on `this`:

-   **`this.$el`**: A direct reference to the component's root DOM element (the one with `mx-data`).
-   **`this.$watch('property', callback)`**: Watches a property **on the current component instance** and reacts to changes.

```javascript
const searchField = {
    init() {
        // Automatically focus the input when the component is initialized
        this.$el.querySelector("input").focus();
    },
};
```

## 9. Lifecycle Hooks

-   **`init()`**: Executed once when the component/store is initialized.
-   **`destroy()`**: Executed when the component is removed from the DOM.
-   **`onDOMUpdate()`**: Executed on all components and stores whenever the DOM is modified by CuboMX.

## 10. Global API

-   **`CuboMX.component(name, definition)`**: Registers a component.
-   **`CuboMX.store(name, object)`**: Registers a global store.
-   **`CuboMX.start()`**: Starts the framework.
-   **`CuboMX.watch(path, callback)`**: Watches a property on any global store or component (e.g., `'theme.mode'`).
-   **`CuboMX.render(templateString, data)`**: Renders a template string with data.
-   **`CuboMX.renderTemplate(templateName, data)`**: Renders a pre-registered template.

### CuboMX.request(config)

This is the core function for making AJAX requests and orchestrating DOM updates. It's highly configurable and can be controlled by server-sent headers.

**Example:** Imagine a button that loads more products onto a page.

```javascript
// In a component method
loadMoreProducts() {
    CuboMX.request({
        url: '/api/products?page=2',
        // The server will respond with strategies to append the new products
        loadingSelectors: ['#load-more-btn'] // Show a loading indicator on the button
    });
}
```

**Config Object Parameters:**

-   `url` (string, required): The URL to request.
-   `method` (string): The HTTP method. Defaults to `GET`.
-   `body` (Object | FormData): The request body. For `GET` requests, it will be converted to URL parameters.
-   `headers` (Object): Custom request headers.
-   `strategies` (Array): An array of swap strategy objects. If provided, these take priority over server-sent strategies. If omitted and the server provides no `X-Swap-Strategies` header, a **smart swap** will be attempted (see `CuboMX.swapHTML` for details).
-   `actions` (Array): An array of action objects to be executed after the request. These take priority over server-sent actions.
-   `loadingSelectors` (Array): An array of CSS selectors that will have the `x-request` class applied during the request.
-   `history` (boolean): If `true`, the navigation will be added to the browser's history. Defaults to `false`.
-   `pushUrl` (boolean): A fallback to update the browser URL to the request's final URL if the server does not provide an `X-Push-Url` header. Defaults to `false`.

**Server-Driven Behavior:**

-   `X-Swap-Strategies`: A header containing a JSON string of swap strategies. `CuboMX.request` will use these if no local `strategies` are provided.
-   `X-Cubo-Actions`: A header with a JSON string of actions to be executed after the swap.
-   `X-Push-Url`: A header specifying the URL to push to the browser's address bar.
-   `X-Redirect`: A header that will cause a full page redirect to the specified URL.

### CuboMX.swapHTML(html, strategies, options)

A powerful utility to swap parts of the DOM from a given HTML string, without making a request. It's the engine used internally by `CuboMX.request`.

**Example:** This is useful for when you already have the HTML content and just need to place it in the DOM, for example, after rendering a client-side template.

```javascript
// First, render a template
const notificationHtml = CuboMX.renderTemplate('error-alert', { message: 'Invalid input' });

// Now, use swapHTML to insert it into the page
CuboMX.swapHTML(notificationHtml, [
    {
        select: 'this', // 'this' refers to the root of the provided html string
        target: '#notification-area:beforeend' // Append it to the notification area
    }
]);
```

**Swap Strategies:**

A strategy is an object with a `select` and a `target` key:
`{ select: '#source-element', target: '#destination-element:mode' }`

**Swap Modes:**

The `target` selector can be augmented with a swap mode. The default is `outerHTML`.

-   `innerHTML`: Replaces the inner content of the target element.
-   `outerHTML`: Replaces the entire target element.
-   `beforebegin`: Inserts the content before the target element.
-   `afterbegin`: Inserts the content as the first child of the target element.
-   `beforeend`: Inserts the content as the last child of the target element.
-   `afterend`: Inserts the content after the target element.

#### Smart Swaps (DOM Morphing)

If you call `CuboMX.swapHTML` with `null` strategies, or call `CuboMX.request` without receiving any strategies, CuboMX activates the **smart swap** mode. This powerful feature uses DOM morphing to intelligently update the current page with minimal changes, preserving important states like focus and input values. It follows a clear hierarchy:

1.  **Priority 1: Explicit Strategies**
    -   If strategies are provided, they are always executed. Smart swap is skipped.

2.  **Priority 2: Smart Swap by ID**
    -   If no strategies are given and the `html` content is a snippet with a single root element that has an `id`, CuboMX will find the element with the same `id` in the current DOM and intelligently merge the changes.
    -   **Example:** If the server responds with `<div id="user-profile"><p>New Name</p></div>`, CuboMX will update the existing `<div id="user-profile">...</div>` on your page.

3.  **Priority 3: Smart Swap of Body**
    -   If the response appears to be a full HTML document (contains an `<html>` tag), CuboMX will merge the new `<body>` into the current page's `<body>`.

4.  **Fallback: Warning**
    -   If none of the above conditions are met (e.g., the response is a partial snippet without a root ID), no swap will occur, and a warning will be logged to the console.

### CuboMX.actions(actions)

Programmatically executes a list of imperative actions on the DOM. This is useful for small DOM manipulations that don't require a full content swap, often in response to a server event or a component method.

**Example:** Show a success state on a button after a save operation.

```javascript
showSuccess() {
    CuboMX.actions([
        { action: 'addClass', selector: '#save-btn', class: 'is-success' },
        { action: 'setAttribute', selector: '#save-btn', attribute: 'disabled', value: '' },
        { action: 'setTextContent', selector: '#save-btn', text: 'Saved!' },
        { action: 'dispatchEvent', selector: 'window', event: 'show-confetti' }
    ]);
}
```

**Available Actions:**

-   `{ action: 'addClass', selector: '#el', class: 'new-class' }`
-   `{ action: 'removeClass', selector: '#el', class: 'old-class' }`
-   `{ action: 'setAttribute', selector: 'input', attribute: 'disabled', value: '' }`
-   `{ action: 'removeElement', selector: '.temp' }`
-   `{ action: 'setTextContent', selector: 'h1', text: 'New Title' }`
-   `{ action: 'dispatchEvent', selector: 'button', event: 'custom-event', detail: { ... } }`
