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
    <button mx-on:click="toggle()">Menu</button>

    <!-- `isOpen` refers to the `isOpen` property of the `headerMenu` instance -->
    <div mx-show="isOpen">
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
    </div>
</div>
```

In this example, `isOpen` resolves to `CuboMX.headerMenu.isOpen`.

### Animating with `mx-transition`

You can create smooth transitions for elements controlled by `mx-show` by adding the `mx-transition` attribute. This allows for CSS-based animations instead of elements simply appearing and disappearing abruptly.

**How It Works**

1.  Add `mx-transition="your-animation-name"` to the same element that has `mx-show`.
2.  In your CSS, define a set of four classes based on this name to control the different states of the animation.

**The CSS Classes**

For a given name, like `fade`, you need to define the following classes:

-   `[name]-enter-start`: The state of the element **before** it starts entering (e.g., `opacity: 0`).
-   `[name]-enter-end`: The state the element animates **to** when entering (e.g., `opacity: 1`).
-   `[name]-leave-start`: The state of the element **before** it starts leaving (e.g., `opacity: 1`).
-   `[name]-leave-end`: The state the element animates **to** when leaving (e.g., `opacity: 0`).

> **Note:** The `transition` CSS property itself should be defined either on the element directly or on the `*-end` classes.

**Example: Dropdown with Fade & Slide Animation**

Let's create a dropdown that fades and slides into view. We'll name our transition `fade-slide`.

**HTML:**

```html
<div mx-data="dropdown()" class="relative">
    <button mx-on:click="toggle()">Options</button>

    <div class="dropdown-menu"
         mx-show="isOpen"
         mx-on:click.outside="close()"
         mx-transition="fade-slide"
    >
        <a href="#">Profile</a>
        <a href="#">Settings</a>
    </div>
</div>
```

**CSS:**

Now, we define the four states for our `fade-slide` animation.

```css
/* The element can have a base transition property */
.dropdown-menu {
    transition: opacity 200ms, transform 200ms;
}

/* 1. Enter: from invisible and up, to visible and at rest */
.fade-slide-enter-start {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-enter-end {
  opacity: 1;
  transform: translateY(0);
}

/* 2. Leave: from visible and at rest, to invisible and up */
.fade-slide-leave-start {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-end {
  opacity: 0;
  transform: translateY(-10px);
}
```

With this setup, CuboMX will automatically orchestrate the classes to create a smooth animation for both the appearance and disappearance of the dropdown menu.

### `mx-delay`

This directive controls the visibility of an element, keeping it hidden initially and revealing it after a specified delay. It's ideal for preventing "Flash of Unstyled Content" (FOUC) or for implementing loading indicators that only appear if an operation takes longer than a certain time.

For `mx-delay` to work correctly, you **must** add the following CSS rule to your project:

```css
[mx-delay] {
    display: none !important;
}
```

**Attributes:**

-   `mx-delay="<milliseconds>"`: The time in milliseconds the element will remain hidden.
-   `mx-delay` (no value): Equivalent to `mx-delay="0"`. The element will be hidden by CSS and revealed on the next JavaScript "tick", ensuring it only appears after being fully processed by CuboMX.

**How it works:**

1.  When an element with `mx-delay` is added to the DOM, the CSS rule hides it immediately.
2.  CuboMX processes the `mx-delay` directive.
3.  A timer is started with the specified value.
4.  At the end of the timer, the `mx-delay` attribute is removed from the element.
5.  The removal of the attribute causes the CSS rule `[mx-delay] { display: none !important; }` to no longer apply, and the element becomes visible (or its `display` state is determined by other CSS rules or directives like `mx-show`).

**Usage Examples:**

**1. Preventing "Flicker" with `mx-show`:**

To ensure an element controlled by `mx-show` never "flickers" before JavaScript acts, use `mx-delay` without a value:

```html
<div mx-show="isLoading" mx-delay>
    Loading data...
</div>
```
In this case, the `div` starts hidden by CSS. As soon as CuboMX processes it, `mx-delay` removes its attribute, and `mx-show` takes control, keeping it hidden if `isLoading` is `false`.

**2. Delayed Loading Indicator:**

To show a skeleton loader only if a request takes longer than 300ms:

```html
<!-- In your CSS: -->
<!-- [mx-delay] { display: none !important; } -->

<!-- In your HTML: -->
<div id="content-area">
    <!-- Main content will be loaded here -->
</div>

<div mx-load="/api/data" mx-target="#content-area:innerHTML" mx-delay="300">
    <!-- This div will be replaced by the content from /api/data -->
    <div class="skeleton-loader">
        <div class="placeholder-line"></div>
        <div class="placeholder-line"></div>
    </div>
</div>
```
If the `/api/data` request finishes in less than 300ms, the `div` with `mx-delay` will be replaced before becoming visible, preventing the skeleton "flicker". If it takes longer, the skeleton will appear after 300ms, providing feedback to the user.

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
-   `.outside`: (Only for the `click` event) Executes the expression only when a click occurs *outside* of the element or its children. This is extremely useful for closing modals, dropdowns, and popovers when the user clicks away.

```html
<!-- Using .prevent on a form -->
<form mx-on:submit.prevent="saveData()">
    ...
</form>

<!-- Using .outside to close a dropdown -->
<div mx-data="dropdown()" class="relative">
    <!-- This button toggles the dropdown's visibility -->
    <button mx-on:click="toggle()">Options</button>

    <!-- This div is the dropdown menu. It closes itself if a click happens outside -->
    <div mx-show="isOpen" mx-on:click.outside="close()" class="dropdown-menu">
        <a href="#">Edit</a>
        <a href="#">Delete</a>
    </div>
</div>
```

#### Magic Variables

Inside an `mx-on` expression, you have access to special variables that provide extra context:

-   `$event`: The raw browser `Event` object. Useful for accessing event-specific properties, like `event.key` on a `keydown` event.
-   `$el`: A reference to the DOM element the listener is attached to.
-   `$item`: When an event is triggered on an element *inside* an `mx-item` scope, this variable provides direct access to the complete, composite object for that item. This makes handling events in lists incredibly simple. If used outside an `mx-item` scope, `$item` will be `undefined`.

**Example using `$item`:**

Let's use our shopping cart example. We can add a button to log the specific item's data to the console.

**HTML:**
```html
<div mx-data="cart">
    <table>
        <tbody>
            <tr mx-item="items" ::data-sku="sku" data-sku="MOUSE-G403">
                <td ::text="description">A very cool gaming mouse</td>
                <td>
                    <!-- This button is inside the mx-item scope -->
                    <button mx-on:click="logItem($item)">Log Item Data</button>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

**JavaScript:**
```javascript
CuboMX.component("cart", {
    items: [],
    logItem(item) {
        // `item` is the full composite object for the row that was clicked.
        // It will be: { sku: "MOUSE-G403", description: "A very cool gaming mouse" }
        console.log(item);
    }
});
CuboMX.start();
```
In this case, clicking the button gives you the fully assembled, reactive object for that specific row, making it easy to perform actions like "delete item," "edit item," or "view details."

### `mx-link`

Upgrades a standard `<a>` link to use an AJAX request for navigation, preventing a full page reload. This is ideal for creating a fast, SPA-like user experience, inspired by HTMX's `hx-boost`.

When `mx-link` is added to an anchor tag, it automatically:
1.  Prevents the default navigation on click.
2.  Calls `CuboMX.request` using the link's `href`.
3.  Sets `history: true` and `pushUrl: true` to update the browser's address bar and history.

By default, `mx-link` expects the server to control the DOM update by sending an `X-Swap-Strategies` header or by sending a response that is compatible with the **"smart swap"** mechanism. However, you can also control the swap behavior directly from the HTML.

#### Client-Side Swapping with `mx-target`

For greater frontend control, you can add the `mx-target` attribute to your link. This allows you to specify exactly where the content from the AJAX response should be placed, without needing to change the backend.

-   `mx-target`: A CSS selector for the element on the current page that should be updated.
-   `mx-select` (Optional): A CSS selector for the element to extract from the server's HTML response. If omitted, it defaults to the same selector as `mx-target`.

**Example:** Let's refactor a sidebar navigation to be fully declarative.

```html
<!-- The main layout of your page -->
<aside>
    <nav>
        <!-- This link will fetch /profile, find the #main-content element in the response,
             and swap it into the #main-content element on the current page. -->
        <a href="/profile" mx-link mx-target="#main-content">Profile</a>

        <!-- This link does the same for the settings page. -->
        <a href="/settings" mx-link mx-target="#main-content">Settings</a>
    </nav>
</aside>

<main id="main-content">
    <!-- Initial content goes here -->
    <h1>Welcome</h1>
</main>
```
This approach eliminates the need for custom JavaScript functions or backend headers for simple content swaps, making your code cleaner and more declarative.

The server should respond with an `X-Swap-Strategies` header to instruct CuboMX on how to update the DOM. If this header is not found, CuboMX will attempt a **"smart swap"** by automatically comparing the received HTML with the current DOM (see `CuboMX.swapHTML` for details).

**Example:**

```html
<!-- This link will fetch /profile via AJAX instead of doing a full page navigation -->
<a href="/profile" mx-link>My Profile</a>

<!-- The server handling /profile should respond with HTML and a header like: -->
<!-- X-Swap-Strategies: [{ "select": "#main-content", "target": "#main-content" }] -->
```

### `mx-swap-template`

This directive provides a declarative, HTML-first way to swap a client-side template into the DOM, serving as a clean shorthand for the `CuboMX.swapTemplate()` JavaScript function.

It turns any element into a trigger that renders a specified `<template>` into a target container. It requires a companion `mx-target` attribute and can optionally be triggered by different events using `mx-trigger`.

**Attributes:**

-   `mx-swap-template="templateName"`: **(Required)** The name of the template (defined with `mx-template`) to render.
-   `mx-target="css-selector"`: **(Required)** The CSS selector of the element to be updated.
-   `mx-select="css-selector"`: (Optional) A CSS selector to extract a specific fragment from the template. If omitted, the entire template is used.
    -   `mx-trigger="event-name"`: (Optional) The event that triggers the swap. If omitted, it **defaults to `click`**.
-   `url="url"`: (Optional) Specifies the URL to push to the browser's history. Takes precedence over `data-url` on the triggering element and any URL metadata on the template.
-   `data-url="url"`: (Optional) Specifies the URL to push to the browser's history. Takes precedence over any URL metadata on the template.
-   `page-title="title"`: (Optional) Specifies the page title to set. Takes precedence over `data-page-title` on the triggering element and any page title metadata on the template.
-   `data-page-title="title"`: (Optional) Specifies the page title to set. Takes precedence over any page title metadata on the template.
This approach is often cleaner than using `mx-on:click` for simple template swaps.

**Example (Default `click` trigger):**

Instead of writing the JavaScript call in an `mx-on` directive:
```html
<!-- Less declarative -->
<button mx-on:click="CuboMX.swapTemplate('login-form', {target: '#auth-box'})">
    Show Login
</button>
```

You can use the more semantic, declarative approach:
```html
<!-- More declarative and cleaner -->
<button mx-swap-template="login-form" mx-target="#auth-box">
    Show Login
</button>

<div id="auth-box"></div>

<template mx-template="login-form">
    <h2>Login Form</h2>
    <form>...</form>
</template>
```

**Example (Custom `mouseenter` trigger):**

By adding `mx-trigger`, you can change the event, for example, to load a preview when the user hovers over an element.

```html
<div class="user-card" 
    mx-swap-template="user-preview-template" 
    mx-target="#preview-pane"
    mx-trigger="mouseenter">
    <p>Mauro</p>
</div>

<div id="preview-pane"></div>

<template mx-template="user-preview-template">
    <h3>Mauro's Details</h3>
    <p>...</p>
</template>
```
In all cases, the directive automatically calls `event.preventDefault()` to prevent unwanted default behaviors, such as a link navigating to a new page.

### `mx-load`

This directive allows you to load content from a URL and swap it into the DOM as soon as the element is processed by CuboMX. It's a powerful tool for **lazy-loading** content, such as widgets, comment sections, or complex components, without needing to write any JavaScript. It acts as a declarative shorthand for `CuboMX.request`.

**Attributes:**

-   `mx-load="url"`: **(Required)** The URL to fetch the content from.
-   `mx-target="css-selector"`: (Optional) The CSS selector of the element to be updated. If omitted, the element with `mx-load` will be replaced (self-replacement).
-   `mx-select="css-selector"`: (Optional) A CSS selector to extract a specific part of the HTML response.

#### Example 1: Loading Content into a Target

This is the most common use case, where you have a placeholder element that triggers a load into another part of the page.

```html
<!-- This div will be populated with content from /my-widget -->
<div id="widget-container"></div>

<!-- When this div is processed, it will fetch /my-widget, find #widget-content
     in the response, and swap it into #widget-container on this page. -->
<div mx-load="/my-widget" mx-target="#widget-container" mx-select="#widget-content"></div>
```
> **Shorthand:** If `mx-select` is omitted, CuboMX assumes it is the same as `mx-target`.

#### Example 2: Self-Replacement

If you omit the `mx-target` attribute, the element carrying the `mx-load` directive will be replaced.

```html
<!-- This div will replace itself with the ENTIRE body of the /status response -->
<div mx-load="/status">
    Loading status...
</div>

<!-- This div will replace itself with just the #status-badge from the response -->
<div mx-load="/status" mx-select="#status-badge">
    Loading badge...
</div>
```

#### Example 3: The Lazy-Loading Pattern

The true power of `mx-load` is revealed when you combine it with other directives like `mx-swap-template`. This allows you to load content in stages.

```html
<!-- 1. A button to start the process -->
<button mx-swap-template="comments-loader" mx-target="#comments-section:innerHTML">
    Load Comments
</button>

<!-- 3. The final destination for the comments -->
<div id="comments-section"></div>

<!-- 2. The template, which contains a temporary loader state -->
<template mx-template="comments-loader">
    <!-- This div is a temporary loader. As soon as it appears in the DOM,
         it triggers mx-load to fetch the actual comments and update the target. -->
    <div mx-load="/api/comments" mx-target="#comments-section:innerHTML">
        <p>Loading comments...</p>
    </div>
</template>
```
In this powerful pattern, clicking the button first renders a "Loading comments..." state. As soon as that loader element is added to the DOM, its `mx-load` directive is activated automatically, fetching the real content and swapping it into the final destination.

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

### Composite Hydration: Building Objects from Multiple Elements

While `mx-bind` is perfect for hydrating a single element into an object, real-world HTML is often more complex. The data for a single conceptual "item" (like a product in a cart) can be spread across multiple elements in a list.

CuboMX solves this with a powerful composite hydration system using `mx-item` and its property-collecting counterpart, `mx-item:prop`.

#### How It Works: `mx-item` and `mx-item:prop`

The directives work together with distinct roles:

1.  **`mx-item="targetArray"` (The Scope Definer):**
    -   When placed on an element (e.g., a `<tr>`), `mx-item` defines the scope for a single item in a list.
    -   It creates an empty JavaScript object `{}` and pushes it into the specified `targetArray`.
    -   This element acts as the parent container for the properties of that new object.

2.  **`mx-item:SOURCE="propertyName"` (The Property Collector):**
    -   When placed on any element *inside* an `mx-item` scope, `mx-item:prop` collects a piece of data and adds it as a property to the item's object.
    -   It automatically finds its parent `mx-item` scope to know which object to populate.
    -   `SOURCE`: Can be `text`, `html`, `value`, or any attribute on the element (e.g., `data-id`).
    -   `propertyName`: The key to be created on the item's object.

#### Shorthand with `::`

CuboMX provides a convenient shorthand for `mx-item:prop`:

-   `::SOURCE="propertyName"` is the exact equivalent of `mx-item:SOURCE="propertyName"`.

This creates a clear visual distinction:
-   `:` is for binding attributes (`mx-bind:`).
-   `::` is for populating item properties (`mx-item:`).

#### Example: The Shopping Cart

Let's see how to hydrate a shopping cart where each product's data is spread across several `<td>` elements.

**HTML:**
```html
<div mx-data="cart">
    <table>
        <tbody>
            <!-- 1. `mx-item` on `<tr>` creates an empty object in the `items` array. -->
            <tr mx-item="items" ::data-sku="sku" data-sku="MOUSE-G403">
                
                <!-- 2. `::` directives find the parent `mx-item` and populate its object. -->
                <td ::text="description">A very cool gaming mouse</td>
                <td>
                    <div class="quantity-selector">
                        <button>-</button>
                        <span ::text="quantity">2</span>
                        <button>+</button>
                    </div>
                </td>
                <td ::text="price">$119.00</td>

            </tr>
        </tbody>
    </table>
</div>
```

**JavaScript:**
```javascript
CuboMX.component("cart", {
    items: [] // The array to be populated
});
CuboMX.start();
```

**Resulting State:**

After hydration, `CuboMX.cart.items` will be:
```javascript
[
    {
        sku: "MOUSE-G403",
        description: "A very cool gaming mouse",
        quantity: 2,
        price: "$119.00"
    }
]
```
This powerful pattern allows you to keep your HTML semantic and structured logically, while still achieving full, reactive hydration of complex objects and arrays.

### Hydration Rules

-   **Attributes to Properties:** HTML attributes are converted to properties on the object.
-   **Case Conversion:** `kebab-case` becomes `camelCase` (`user-id` -> `userId`).
-   **Value Parsing:** Values are converted to the correct types (`"123"` -> `123`, `"true"` -> `true`). Attributes without a value become `true`.
-   **Special Properties:** `text` (`textContent`), `html` (`innerHTML`), and `class` are always created. The `class` property is special: it's a reactive array-like object that mirrors the element's `classList`. You can manipulate it with standard array methods (`push`, `splice`, etc.) or with convenient helper methods (`add`, `remove`, `toggle`) attached directly to it.

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
> **Note on `:class`:** The `:class` binding is special. Instead of binding to a string, it hydrates the property as a reactive array-like object for managing classes, identical to the `.class` property from a full `mx-bind`. This allows for more powerful and ergonomic class manipulation from your component state.
> ```javascript
> // component.myClasses is now a reactive array with .add(), .remove(), .toggle()
> component.myClasses.add('new-class');
> ```
> **Shorthand and Ambiguity Warning**
>
> The `:` shorthand is an alias **exclusively** for `mx-bind:`. Its purpose is to bind HTML attributes. **Do not** use it as a shorthand for `mx-item:prop`, as this will lead to unexpected behavior.

### Parsers: Transforming Data on the Fly

Parsers allow you to transform data as it moves between the DOM and your component's state. This is incredibly useful for handling numbers, dates, currency, or any other format that needs conversion.

A parser is applied by adding its name to a binding directive, following the syntax `:[source]:[parserName]="property"` or `::[source]:[parserName]="property"`.

#### Built-in Parsers

CuboMX comes with two powerful parsers out of the box:

-   **:number**: Converts formatted strings into numbers. It's smart enough to handle thousand separators.
    ```html
    <div mx-data="calculator" ::data-value:number="value" data-value="1,234.56"></div>
    ```
    After hydration, `CuboMX.calculator.value` will be the number `1234.56`.

-   **:currency**: Parses and formats currency strings based on locale. It automatically creates a two-way transformation.
    ```html
    <div mx-data="cart" ::text:currency="price">$1,999.99</div>
    ```
    The state `CuboMX.cart.price` will be `1999.99`. If you update the state (`CuboMX.cart.price = 2500`), the element's text will be automatically reformatted to `"$2,500.00"`.
    -   **Configuration**: The currency format can be set globally via `CuboMX.start({ locale: 'pt-BR', currency: 'BRL' })` or overridden locally on the element with `data-locale="..."` and `data-currency="..."` attributes.

#### Creating a Custom Parser

You can easily create your own parsers. A parser is a simple JavaScript object with two methods: `parse` and `format`.

-   `parse(value, el, config)`: Receives the string `value` from the DOM and must return the processed value to be stored in the state. It also receives the element `el` and the global `config` object for context.
-   `format(value, el, config)`: Receives the `value` from the state and must return the string to be displayed in the DOM.

Here is an example of a `lowercase` parser:

```javascript
// parsers/lowercaseParser.js
const lowercaseParser = {
    parse(value) {
        return typeof value === 'string' ? value.toLowerCase() : value;
    },
    format(value) {
        return typeof value === 'string' ? value.toLowerCase() : value;
    }
};
```

#### Registering a Custom Parser

To make your parser available, use the `CuboMX.addParser()` method **before** calling `CuboMX.start()`.

```javascript
import { CuboMX } from "cubomx";
import { lowercaseParser } from "./parsers/lowercaseParser.js";

// Register the custom parser
CuboMX.addParser('lowercase', lowercaseParser);

// Register components, etc.
// ...

CuboMX.start();
```

Now you can use it in your HTML:

```html
<div mx-data="myComp">
    <span ::text:lowercase="myText">THIS WILL BECOME LOWERCASE</span>
</div>
```

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
```

### Manipulating CSS Classes

When an element is hydrated using `mx-bind` or a class property is bound using `:class` or `::class`, the corresponding `class` property in your state becomes a powerful, array-like object. It's a proxy to the element's `classList` that you can manipulate directly.

It supports standard array mutation methods:
```javascript
// Adds the "highlight" class
myObject.class.push("highlight");

// Removes the first class
myObject.class.splice(0, 1);
```

For convenience and to mimic the native `classList` API, it also includes `.add()`, `.remove()`, and `.toggle()` methods. The `.add()` method will not add a class if it already exists.
```javascript
// Add a class
myObject.class.add('active');

// Remove a class
myObject.class.remove('highlight');

// Toggle a class
myObject.class.toggle('is-visible');
```
This unified approach works for full bindings (`myObject.class.add(...)`) and granular class bindings (`myClasses.add(...)`).

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

**Step 1: Define Your Template**

The `mx-template` directive is flexible and can be used in two ways, depending on your needs.

#### A) Using the `<template>` Tag for Inert Content

This is the standard approach for defining a piece of UI that you don't want to be visible on initial page load. CuboMX will register the content (`innerHTML`) of the `<template>` tag and then remove the tag itself from the DOM.

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

#### B) Defining a Template from a Visible Element

This powerful feature allows you to create a reusable template from any element that is already part of your rendered page. This is ideal for reducing duplication when you want to be able to re-render a component that was already sent by the server.

When you place `mx-template` on a regular element (like a `<div>`), CuboMX registers the element's **entire `outerHTML`** as the template and **leaves the original element in the DOM**.

**Example:** Imagine a login page where you might want to switch to a "reset password" view and then back again, all on the client side.

```html
<!-- The initial view rendered by the server -->
<div id="auth-box">
    <!-- This login form is visible, but also registered as a template for later use -->
    <div mx-template="login-form">
        <h1>Login</h1>
        <form>...</form>
        <a href="#" mx-on:click.prevent="showReset()">Forgot password?</a>
    </div>
</div>

<!-- The reset form can be an inert template, as it's not visible initially -->
<template mx-template="reset-form">
    <div>
        <h1>Reset Password</h1>
        <form>...</form>
        <a href="#" mx-on:click.prevent="showLogin()">Back to login</a>
    </div>
</template>
```
Now, `CuboMX.renderTemplate('login-form', ...)` can be called at any time to get the full login form HTML, even after you've swapped it out for the reset form.

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

#### Initializing Components with State

A common challenge with client-side rendering is creating new components that need specific, dynamic data from the start. For example, rendering a new chat message requires setting its text and author, and a new alert needs its specific message and type (`success`, `error`, etc.).

CuboMX solves this with the `state` option in `swapTemplate`. This option allows you to "inject" data directly into the components as they are being created from the template, bypassing both the component's default values and the standard DOM hydration.

**Example:** Let's create a system to dynamically add alerts.

**1. The Component Factory (JS):**
Define a component with default values.
```javascript
CuboMX.component('alerta', () => ({
    mensagem: 'Uma mensagem padrão.',
    tipo: 'info' // e.g., 'info', 'success', 'error'
}));
```

**2. The Template (HTML):**
The template uses these properties to render itself.
```html
<template mx-template="alerta-template">
    <div mx-data="alerta()" :class="`alert alert-${tipo}`" mx-show="true">
        <p :text="mensagem">Texto do alerta aqui...</p>
    </div>
</template>
```

**3. Rendering with Initial State (JS):**
When calling `swapTemplate`, pass a `state` object. The keys of this object must match the names of the components you want to initialize.

```javascript
// Add a success alert
CuboMX.swapTemplate('alerta-template', {
  target: '#alert-container:beforeend',
  state: {
    alerta: { // This key matches the component name 'alerta'
      mensagem: 'Operação concluída com sucesso!',
      tipo: 'success'
    }
  }
});

// Add an error alert moments later
CuboMX.swapTemplate('alerta-template', {
  target: '#alert-container:beforeend',
  state: {
    alerta: {
      mensagem: 'Falha ao salvar os dados.',
      tipo: 'danger'
    }
  }
});
```

In this flow, the `state` object provides the initial data, ensuring each new alert component is "born" with the correct message and type, ignoring the defaults in the factory and the static text in the template.


#### Step 4: Using Templates with Metadata

The real power of attaching metadata to your templates comes when you use them for navigation. With the `CuboMX.swapTemplate()` helper function, this entire flow becomes a single, clean function call.

Let's look at the complete, recommended pattern:

**HTML:**
```html
<template
  mx-template="resetPwdTemplate"
  page-title="Reset Password"
  data-url="/reset-password"
>
  <!-- ... form content ... -->
</template>
```

**JavaScript:**
```javascript
const auth = {
  goToResetPwd() {
    // This single call does everything:
    // 1. Gets the template and its metadata.
    // 2. Uses the metadata to set the page title and push the new URL to history.
    // 3. Swaps the template content into the specified target.
    CuboMX.swapTemplate("resetPwdTemplate", { 
        target: "#auth-form-wrapper:innerHTML",
        history: true
    });
  }
};
```
This pattern allows your backend to define not just the template's HTML, but also related configuration like the page title and URL, while keeping your JavaScript components clean and concise.

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
-   **`CuboMX.addParser(name, parserObject)`**: Registers a custom parser.
-   **`CuboMX.start()`**: Starts the framework.
-   **`CuboMX.watch(path, callback)`**: Watches a property on any global store or component (e.g., `'theme.mode'`).
-   **`CuboMX.render(templateString, data)`**: Renders a template string with data.
-   **`CuboMX.renderTemplate(templateName, data)`**: Renders a pre-registered template.
-   **`CuboMX.getTemplate(templateName)`**: Retrieves a pre-registered template, returning an object `{ template: string, data: object }` which contains the raw template HTML and any metadata extracted from its attributes.

### CuboMX.swapTemplate(templateName, options)

A high-level helper function that orchestrates getting a template, swapping it into the DOM, and automatically handling history and title updates. This is the preferred way to perform client-side navigation from a template.

**Parameters:**

-   `templateName` (string): The name of the template to render and swap.
-   `options` (object): A configuration object.
    -   `target` (string, **required**): The CSS selector for the destination element (e.g., `#container:innerHTML`).
    -   `history` (boolean, optional): Explicitly controls history. If a URL is present (in options or metadata), history is enabled by default. Set to `false` to disable.
    -   `url` (string, optional): The URL for the history entry. **Overrides** the `url` or `data-url` from the template's metadata.
    -   `pageTitle` (string, optional): The document title. **Overrides** the `page-title` or `data-page-title` from the template's metadata.
    -   `state` (object, optional): An object containing initial state for the components within the template. The object keys should match the component names (e.g., `{ myComp: { prop1: 'value' } }`). This state takes priority over default component values and DOM hydration.

**Example:**

```javascript
// Given a template: <template mx-template="resetPwd" data-url="/reset" page-title="Reset Password">...</template>

const auth = {
  goToResetPwd() {
    // This single call will get the template, set the title, update the URL, and swap the HTML.
    CuboMX.swapTemplate("resetPwd", { target: "#auth-form-wrapper:innerHTML" });
  },
  
  // You can also override the metadata from JavaScript:
  goToResetPwdAsModal() {
      CuboMX.swapTemplate("resetPwd", {
          target: "#modal-body:innerHTML",
          history: false // Don't create a history entry for a modal
      });
  }
};
```

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
-   `loadingSelectors` (Array): An array of CSS selectors to apply a loading class to during the request.
-   `loadingClass` (string, optional): The CSS class to apply to elements specified in `loadingSelectors`. Defaults to `'x-request'`.
-   `history` (boolean): If `true`, the navigation will be added to the browser's history. Defaults to `false`.
-   `pushUrl` (boolean): A fallback to update the browser URL to the request's final URL if the server does not provide an `X-Push-Url` header. Defaults to `false`.

**Return Value**

The `CuboMX.request` function returns a Promise that resolves to an object containing details about the response:

-   `ok` (boolean): `true` if the HTTP status code was in the 200-299 range.
-   `status` (number): The HTTP status code of the response (e.g., `200`, `404`).
-   `url` (string): The final URL of the response, after any redirects.
-   `redirected` (boolean): `true` if the response was the result of a redirect.
-   `data` (object | null): If the server response includes an `X-Cubo-Data` header, this property will contain the parsed JSON object from that header. Otherwise, it will be `null`.

```javascript
// In an async function
async function fetchUser() {
    const response = await CuboMX.request({ url: '/api/user' });
    if (response.ok && response.data) {
      console.log('User data:', response.data);
      // You can now use this data to update charts, stores, etc.
    }
}
```

**Server-Driven Behavior:**

-   `X-Swap-Strategies`: A header containing a JSON string of swap strategies. `CuboMX.request` will use these if no local `strategies` are provided.
-   `X-Cubo-Actions`: A header with a JSON string of actions to be executed after the swap.
-   `X-Cubo-Data`: A header containing a JSON string. Its parsed content will be available in the `data` property of the object returned by `CuboMX.request`.
-   `X-Push-Url`: A header specifying the URL to push to the browser's address bar.
-   `X-Redirect`: A header that will cause a full page redirect to the specified URL.

### CuboMX.stream(config)

Establishes a persistent connection to the server using [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), allowing for real-time, one-way communication from the server to the client. This is ideal for live notifications, chat messages, or any feature that requires automatic updates without constant polling.

The function returns the underlying `EventSource` instance, allowing you to manually close the connection (e.g., in a component's `destroy` hook) by calling `.close()`.

`CuboMX.stream` can operate in two modes:

#### 1. Client-Decide Mode

You provide an array of `listeners` that define how to handle different named events sent by the server. This gives the client full control over the DOM updates.

**JS:**
```javascript
// In a component's init() method
const stream = CuboMX.stream({
    url: '/sse-endpoint',
    listeners: [
        {
            event: 'new-message',
            strategies: [{ target: '#chat-window:beforeend' }]
        },
        {
            event: 'user-count-update',
            strategies: [{ select: 'this', target: '#user-count:innerHTML' }]
        }
    ]
});

// It's good practice to close the connection when the component is destroyed
// this.stream = stream; // Save the instance
// destroy() { this.stream.close(); }
```

**Server-Side (Example):**
The server just needs to send data preceded by `event: <event-name>\ndata: <html-string>\n\n`.

```
event: new-message
data: <li>User 1: Hello!</li>

event: user-count-update
data: <span>125</span>
```

#### 2. Server-Commands Mode

If you don't provide a `listeners` array, CuboMX will listen for default `message` events. In this mode, the server is expected to send a JSON payload containing the full instructions for the DOM update.

**JS:**
```javascript
// No listeners defined, server is in control
CuboMX.stream({ url: '/sse-endpoint-json' });
```

**Server-Side (Example):**
The server sends a single JSON object with the HTML and the strategies/actions.

```
data: {"html": "<div class=\"toast\">New follower!</div>", "strategies": [{ "target": "#toast-container:afterbegin" }]}

data: {"actions": [{ "action": "setTextContent", "selector": "#status", "text": "Connected" }]}
```

### CuboMX.swapHTML(html, strategies, options)

A powerful utility to swap parts of the DOM from a given HTML string, without making a request. It's the engine used internally by `CuboMX.request`. The optional third argument, `options`, can be used to control history or pass an initial `state` object to components being created.

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

-   **`select`**: A CSS selector that identifies the content to be extracted from the server's HTML response. You can also use the special value `'this'` to refer to the entire root of the incoming HTML fragment. This is particularly useful for responses that don't have a single root element or when you want to swap the entire fragment.
-   **`target`**: A CSS selector for the element on the current page that should be updated.

> #### Shorthand Strategy
>
> To make strategies more concise, you can omit the `select` property. CuboMX will automatically infer its value based on the `target`:
>
> 1.  **For Replacement Swaps:** If the `target`'s swap mode is `innerHTML`, `outerHTML`, or is not specified (defaulting to `outerHTML`), the `select` property will be inferred to be the same as the `target`.
>
>     ```javascript
>     // This strategy:
>     { target: '#content:innerHTML' }
>
>     // ...is equivalent to:
>     { select: '#content:innerHTML', target: '#content:innerHTML' }
>     ```
>
> 2.  **For Insertion Swaps:** If the `target`'s swap mode is for insertion (`beforeend`, `afterbegin`, `beforebegin`, or `afterend`), the `select` property will be automatically inferred as `'this'`. This allows you to easily append or prepend entire fragments received from the server.
>
>     ```javascript
>     // This strategy:
>     { target: '#notifications:beforeend' }
>
>     // ...is equivalent to:
>     { select: 'this', target: '#notifications:beforeend' }
>     ```

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

#### State vs. DOM Actions (`setProperty` vs. `setAttribute`)

When you need to modify an element that is controlled by a reactive binding (e.g., `:company-id="companyId"`), it is crucial to **change the component's state**, not the DOM attribute directly.

-   **`setAttribute`**: Changes the DOM directly. This is fine for elements that are not under reactive control, but can be undone by a reactive binding, as the component's state is still the source of truth.
-   **`setProperty`**: Changes the component's state directly. This is the **recommended** approach for interacting with reactive components. By changing the state, CuboMX's reactivity system will automatically and correctly update the DOM, avoiding race conditions.

**Available Actions:**

-   `{ action: 'setProperty', property: 'componentName.propertyName', value: 'new-value' }`: Directly sets a property on a component's state. The `property` key uses dot notation to specify the target component (or store, or `mx-ref` instance) and the property to change. This is the preferred way to update state from the server.
-   `{ action: 'addClass', selector: '#el', class: 'new-class' }`
-   `{ action: 'removeClass', selector: '#el', class: 'old-class' }`
-   `{ action: 'setAttribute', selector: 'input', attribute: 'disabled', value: '' }`
-   `{ action: 'removeElement', selector: '.temp' }`
-   `{ action: 'setTextContent', selector: 'h1', text: 'New Title' }`
-   `{ action: 'dispatchEvent', selector: 'button', event: 'custom-event', detail: { ... } }`
-   `{ action: 'pushUrl', url: '/new-path', title: 'New Page Title' }`: Updates the browser's URL and, optionally, the document's title, adding a new entry to the session history.
