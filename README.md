# CuboMX Documentation

## Introduction

CuboMX is a reactive micro-framework for developers who believe in the power of Server-Side Rendered (SSR) applications and the simplicity of HTML. It challenges the complexity of modern SPAs by embracing a simple, powerful idea: **your server should send HTML, not JSON.**

Following a server-centric philosophy, CuboMX is designed to seamlessly "hydrate" your server-rendered HTML into reactive JavaScript components. It's backend-agnostic, allowing you to enhance applications written in any language—PHP, Python, Ruby, Java, or Node.js—with a modern, reactive user experience without a full rewrite.

**Core Principles:**

-   **HTML as the Source of Truth:** CuboMX starts where your server finishes. It treats the initial server-rendered HTML as the definitive source of state, declaratively hydrating your JavaScript objects directly from the DOM. No need to fetch the same data twice.
-   **JavaScript is for Behavior, Not Structure:** Keep your logic where it belongs—in pure JavaScript modules. CuboMX uses simple directives as bridges to your state, not as a place for inline mini-programs, keeping your HTML clean and focused on structure.
-   **Hierarchical & Predictable State:** CuboMX offers a powerful two-tier state management system. All components and stores are globally accessible for easy debugging and cross-component communication, but within a component's template, you have direct, local access to its properties. This provides the perfect balance of encapsulation and global predictability.
-   **Enhance, Don't Replace:** CuboMX is designed to enhance existing server-rendered applications. You don't need to build a separate SPA. Add reactivity where you need it, from simple components to dynamic AJAX-driven content swaps.

## Installation and Initialization

### Installation via NPM

To get started, add CuboMX to your project using npm:

```bash
npm install cubomx
```

### Basic Setup

Let's see a basic example in an `index.js` file:

```javascript
import { CuboMX } from "cubomx";
import { loginControl } from "./components/loginControl.js";
import { passwordInput } from "./components/passwordInput.js";

// 1. (Optional) Register "Stores" for global state.
const themeStore = {
    mode: "light",
    changeTheme() {
        this.mode = this.mode === "light" ? "dark" : "light";
    },
};
CuboMX.store("theme", themeStore);

// 2. Register your components.
CuboMX.component("loginControl", loginControl);
CuboMX.component("passwordInput", passwordInput);

// 3. Start CuboMX.
CuboMX.start();
```

## How It Works

In CuboMX, everything is resolved by components, and there are three types of components: Singletons, Factories, and Stores.

### Types of Components

#### Singletons

A Singleton is a component that will have only **one instance** per page. It is defined as a simple JavaScript object. It is ideal for managing the state of an entire page or a main section that does not repeat.

**When to use:** Page controllers, main app state, unique UI elements.

**Definition (JS):**

```javascript
// components/pageController.js
export const pageController = {
    title: "My Page",
    isLoading: true,
    loadContent() {
        this.isLoading = false;
    },
};
```

**Registration (JS):**

```javascript
import { pageController } from "./components/pageController.js";
CuboMX.component("pageController", pageController);
```

**Usage (HTML):**

```html
<div mx-data="pageController">
    <h1 :text="title">My Page</h1>
    <div mx-show="isLoading">Loading...</div>
</div>
```

#### Factories

A Factory is used for **reusable** components, such as modals, dropdowns, or list items. Instead of an object, you define a **function that returns a new object**. Each time CuboMX encounters the component in the HTML, it calls this function to create a new, independent instance.

**When to use:** Dropdowns, modals, cards, any repeatable UI element.

**Definition (JS):**

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

**Registration (JS):**

```javascript
import { dropdown } from "./components/dropdown.js";
CuboMX.component("dropdown", dropdown);
```

**Usage (HTML):**

```html
<!-- Two independent dropdowns -->
<div mx-data="dropdown()" mx-ref="headerMenu">
    <button @click="toggle()">Menu</button>
    <div mx-show="isOpen">...</div>
</div>

<div mx-data="dropdown()" mx-ref="userMenu">
    <button @click="toggle()">User</button>
    <div mx-show="isOpen">...</div>
</div>
```

#### Stores

A Store is semantically similar to a Singleton: it is also a single, global instance. The difference is its purpose. Use Stores to hold **shared global state** that is not directly tied to a specific part of the DOM, such as user information, theme preferences, or authentication status.

**When to use:** Global app state, user session, theme, settings.

**Definition & Registration (JS):**

```javascript
const authStore = {
    isLoggedIn: false,
    user: null,
    login(userData) {
        this.isLoggedIn = true;
        this.user = userData;
    },
    logout() {
        this.isLoggedIn = false;
        this.user = null;
    },
};

CuboMX.store("auth", authStore);
```

**Usage (HTML - accessing from any component):**

```html
<div mx-data="navbar">
    <div mx-show="$auth.isLoggedIn">
        Welcome, <span :text="$auth.user.name"></span>
    </div>
    <button @click="$auth.logout()">Logout</button>
</div>
```

## Hydration

One of CuboMX's most powerful features is **hydration**. This process consists of extracting data directly from your server-rendered HTML and injecting it into JavaScript objects, which become fully reactive.

To achieve this goal, CuboMX primarily uses two directives: `mx-bind` and `mx-item`.

## Directives

Directives are special HTML attributes that CuboMX understands. They are the bridge between your DOM and your JavaScript components.

### Granular Hydration with `mx-bind` (or `:`)

This is the primary way to link a piece of DOM information to a component property. The directive is `mx-bind:attribute="propertyName"`, which can be shortened to `:attribute-name="propertyName"`.

It tells CuboMX: "Take the value of this element's `attribute` and assign it to the `propertyName` on my component."

**HTML Example:**

```html
<div mx-data="loginForm">
    <input type="text" :value="email" value="user@example.com" />
    <input type="password" :value="password" value="" />
    <button :button-id="buttonId" button-id="login-btn-123">Login</button>
</div>
```

**JavaScript:**

```javascript
CuboMX.component("loginForm", {
    email: null,
    password: null,
    buttonId: null,
});
CuboMX.start();

// After hydration:
console.log(CuboMX.loginForm.email); // "user@example.com"
console.log(CuboMX.loginForm.password); // ""
console.log(CuboMX.loginForm.buttonId); // "login-btn-123"
```

#### Hydration Rules

CuboMX is smart about converting DOM values into JavaScript types:

1.  **Attribute vs. Property:** The directive is `:attribute-name="propertyName"`. CuboMX reads the value from the `attribute-name` in the DOM and assigns it to the `propertyName` on your component.
2.  **Automatic Type Parsing:** Attribute values are automatically converted to their most likely JavaScript type.
    -   `"123"` → `123` (Number)
    -   `"3.14"` → `3.14` (Number)
    -   `"true"` → `true` (Boolean)
    -   `"false"` → `false` (Boolean)
    -   `"null"` → `null`
    -   `"undefined"` → `undefined`
    -   `"hello world"` → `"hello world"` (String)
3.  **Boolean Attributes:** Attributes that are present without a value (like `disabled` or `readonly`) are treated as `true`.

#### Special Bindings

Besides standard attributes, `mx-bind` has special keywords for the attribute part:

-   `:text="prop"`: Hydrates the `textContent` of the element into `prop`.
-   `:html="prop"`: Hydrates the `innerHTML` of the element into `prop`.
-   `:class="prop"`: Hydrates the element's `classList` into `prop` as a reactive array.

#### Two-Way Data Binding

When `:value` (for text inputs, textareas, etc.) or `:checked` (for checkboxes and radio buttons) is used on a form element, CuboMX automatically creates a **two-way binding**.

-   **Hydration:** The initial value from the DOM populates the component property.
-   **Reactivity:** If the user changes the input's value, the component property is automatically updated. If you change the property in JavaScript, the input's value in the DOM is updated.

### List Hydration with `mx-item` (and `::`)

For hydrating lists of items (like rows in a table or items in a list), CuboMX provides the `mx-item` and `::` directives. This allows deconstructing a complex DOM structure into a clean array of JavaScript objects.

#### How It Works

1.  **`mx-item="arrayName"`**: This directive is placed on the root element of a repeating item. It tells CuboMX, "This element represents one item in the `arrayName` array of my component."
2.  **`::attribute="propertyName"`**: This is the item-specific version of `:`. It can be placed on the `mx-item` element itself or any of its children. It tells CuboMX, "Take the value from this `attribute` and add it to the current item object as `propertyName`."

The `::` syntax is a shorthand for `mx-item:attribute`.

#### Example: Shopping Cart

**HTML:**

```html
<div mx-data="cart">
    <table>
        <tbody>
            <!-- Each <tr> is an item in the "items" array -->
            <tr mx-item="items" ::sku="sku" sku="MOUSE-G403">
                <!-- `::` directives find their parent `mx-item` and populate its object -->
                <td ::text="description">A very cool gaming mouse</td>
                <td>
                    <span ::text="quantity">2</span>
                </td>
                <td ::text="price">$119.00</td>
            </tr>
            <tr mx-item="items" ::sku="sku" sku="KEYB-MCH-01">
                <td ::text="description">Mechanical Keyboard</td>
                <td>
                    <span ::text="quantity">1</span>
                </td>
                <td ::text="price">$180.00</td>
            </tr>
        </tbody>
    </table>
</div>
```

**JavaScript:**

```javascript
CuboMX.component("cart", {
    items: [], // This array will be populated by `mx-item`
});
CuboMX.start();

console.log(CuboMX.cart.items);
// [
//     {
//         sku: "MOUSE-G403",
//         description: "A very cool gaming mouse",
//         quantity: 2,
//         price: 119.00
//     },
//     {
//         sku: "KEYB-MCH-01",
//         description: "Mechanical Keyboard",
//         quantity: 1,
//         price: 180.00
//     }
// ]
```

#### How `.add()` Creates New Elements: The Templating Mechanism

When you call a method like `items.add(newItemObject)`, you might wonder how CuboMX knows what HTML to generate for the new list item.

This is handled by a simple yet powerful templating mechanism. CuboMX supports two ways to define templates:

##### 1. Implicit Template (First Item)

CuboMX automatically uses the **first element marked with `mx-item`** in your list as a template.

Here's the process:

1.  The first `<tr>` in the shopping cart example is internally saved as a template.
2.  When you call `cart.items.add({ ... })`, CuboMX clones this template `<tr>`.
3.  It then binds all the properties from your new object to the corresponding `::` directives within the cloned HTML.
4.  Finally, it appends the newly created and fully reactive element to the DOM.

This means you can design a complex and richly styled list item directly in your server-rendered HTML, and CuboMX will seamlessly replicate that structure for any items you add dynamically on the client side.

##### 2. Explicit Template (Using `<template>`)

For containers that start **empty** (like a notifications list or alerts container), you can define an explicit template using the HTML `<template>` element with the `mx-item` directive.

**HTML:**

```html
<div mx-data="alerts">
    <div id="alert-container">
        <!-- Define the template for items -->
        <template mx-item="alerts">
            <div class="alert" ::type="type" ::text="message"></div>
        </template>
        <!-- Container starts empty, ready to receive alerts -->
    </div>
</div>
```

**JavaScript:**

```javascript
CuboMX.component("alerts", {
    alerts: [], // Starts empty
});
CuboMX.start();

// Now you can add alerts dynamically
CuboMX.alerts.alerts.add({
    type: "success",
    message: "Operation completed!",
});

CuboMX.alerts.alerts.add({
    type: "error",
    message: "Something went wrong!",
});
```

**How It Works:**

1.  The `<template>` element is processed during initialization but removed from the DOM.
2.  Its first child element is saved internally as the template for all future items.
3.  When you call `.add()`, CuboMX clones this template and hydrates it with your data.
4.  The new element is inserted into the parent container (where the `<template>` was located).

**Benefits of Explicit Templates:**

-   Perfect for **dynamic lists** that start empty (notifications, logs, search results, etc.)
-   Clean HTML structure with no placeholder items
-   Template definition is clear and intentional
-   Works seamlessly with existing items if you have both a `<template>` and server-rendered items

**Note:** If you provide both a `<template>` and existing `mx-item` elements, the `<template>` takes precedence and will be used for all new items added via `.add()`, `.prepend()`, or `.replace()`.

### A Note on Special Proxy Objects

> **Attention:** When you use `mx-item` or bind to a `class` attribute, CuboMX does not create standard JavaScript arrays or strings. Instead, it creates special, powerful **Proxy Objects** that have extra capabilities.

#### `ArrayItems`

When an array is hydrated using `mx-item`, it becomes an `ArrayItems` proxy. This object has all the standard JavaScript array methods (`forEach`, `map`, `filter`, etc.), but it also includes special **asynchronous methods** for safe DOM manipulation:

-   `add(itemData)`
-   `prepend(itemData)`
-   `delete(index)`
-   `pop()`
-   `shift()`
-   `clear()`
-   `replace(index, itemData)`

Using these methods is the recommended way to modify lists, as they ensure that DOM updates and state changes are handled correctly by CuboMX.

> **Important: Do Not Reassign `ArrayItems`**
>
> You **must not** reassign an `ArrayItems` property to a new array, as this will break the connection to the DOM. Always use the provided methods to modify the list.
>
> **Incorrect:**
>
> ```javascript
> // DON'T DO THIS. DOM reactivity will be lost.
> this.items = [];
> this.items = [{ name: "A" }, { name: "B" }];
> ```
>
> **Correct:**
>
> ```javascript
> // Use the proxy's methods to manipulate the list
> this.items.clear();
> this.items.add({ name: "New Item" });
> ```
>
> Unlike `ArrayItems`, `ClassList` properties _can_ be reassigned to a new string or array of strings.

#### `ClassList`

When you bind to a `class` attribute (e.g., `:class="myClasses"`), the `myClasses` property becomes a `ClassList` proxy, not just an array of strings. It is a reactive object that mirrors the element's `classList`.

In addition to standard array methods like `push()` and `splice()`, it includes convenient helper methods:

-   `add(className)`
-   `remove(className)`
-   `toggle(className)`
-   `contains(className)`

#### TypeScript Recommendation

If you are using TypeScript, it is highly recommended to import these types from `cubomx` to get full type safety and autocompletion for their special methods.

```typescript
import { MxComponent, ArrayItems, ClassList } from "cubomx";

interface Product {
    sku: string;
    description: string;
}

class MyComponent extends MxComponent {
    items: ArrayItems<Product>;
    cardClasses: ClassList;
}
```

### `mx-show`

This directive shows or hides an element by toggling its `display` style between `none` and its original value. It reacts to the truthiness of a JavaScript expression.

```html
<div mx-data="dropdown">
    <button @click="toggle()">Toggle Menu</button>

    <!-- This div will be shown only when `isOpen` is true -->
    <div mx-show="isOpen">Menu contents</div>
</div>
```

```javascript
CuboMX.component("dropdown", {
    isOpen: false,
    toggle() {
        this.isOpen = !this.isOpen;
    },
});
```

-   **Truthy values** (element is visible): `true`, `1`, `"hello"`, `[]`, `{}`
-   **Falsy values** (element is hidden): `false`, `0`, `""`, `null`, `undefined`

### Preventing "Flicker" on Load with `mx-cloak`

When the page loads, there might be a brief moment where elements controlled by `mx-show` are visible before CuboMX hides them, causing a "flicker" effect. To prevent this, you can use the `mx-cloak` directive.

It hides the element until CuboMX is ready to manage it.

**HTML:**

```html
<head>
    <style>
        [mx-cloak] {
            display: none !important;
        }
    </style>
</head>
<body>
    <div mx-data="dropdown">
        <!-- This menu won't "flicker" on the screen during load -->
        <div mx-show="isOpen" mx-cloak>Menu contents</div>
    </div>
</body>
```

### Animating with `mx-transition`

You can create smooth transitions for elements controlled by `mx-show` by adding the `mx-transition` attribute. This allows for CSS-based animations instead of elements simply appearing and disappearing abruptly.

**How It Works**

1.  Add `mx-transition="your-animation-name"` to the same element that has `mx-show`.
2.  In your CSS, define four classes based on this name to control the different states of the animation.

**The CSS Classes**

For a given name, like `fade`, you need to define:

-   `[name]-enter-start`: The state of the element **before** it starts entering (e.g., `opacity: 0`).
-   `[name]-enter-end`: The state the element animates **to** when entering (e.g., `opacity: 1`).
-   `[name]-leave-start`: The state of the element **before** it starts leaving (e.g., `opacity: 1`).
-   `[name]-leave-end`: The state the element animates **to** when leaving (e.g., `opacity: 0`).

**Example: Dropdown with Fade & Slide Animation**

**HTML:**

```html
<div mx-data="dropdown" class="relative">
    <button @click="toggle()">Options</button>

    <div class="dropdown-menu" mx-show="isOpen" mx-transition="fade-slide">
        <a href="#">Profile</a>
        <a href="#">Settings</a>
    </div>
</div>
```

**CSS:**

```css
.dropdown-menu {
    transition: opacity 200ms, transform 200ms;
}

/* Enter: from invisible and up, to visible and at rest */
.fade-slide-enter-start {
    opacity: 0;
    transform: translateY(-10px);
}
.fade-slide-enter-end {
    opacity: 1;
    transform: translateY(0);
}

/* Leave: from visible and at rest, to invisible and up */
.fade-slide-leave-start {
    opacity: 1;
    transform: translateY(0);
}
.fade-slide-leave-end {
    opacity: 0;
    transform: translateY(-10px);
}
```

### Handling User Events with `mx-on` (or `@`)

This directive attaches an event listener to an element, allowing you to call a method on your component in response to a user interaction.

**Basic Syntax:**

```html
<!-- Both are equivalent -->
<button mx-on:click="increment()">Click me</button>
<button @click="increment()">Click me</button>
```

#### Event Types

**Standard DOM Events**

You can use any standard browser DOM event:

```html
<button @click="handleClick()">Click me</button>
<form @submit="handleSubmit()">Submit</form>
<input @keydown="handleKeyPress($event)" />
```

**Other Events**

CuboMX provides additional pseudo-events for common patterns:

```html
<div @appear="onElementAppear($el)">This triggers when element appears in DOM</div>
```

The `appear` event is triggered when an element is inserted into the DOM. It's particularly useful for initializing animations, focusing elements, or triggering actions on dynamically added content. Unlike standard DOM events, `@appear` does not receive an `$event` parameter, but you can use `$el` and `$item` (in `mx-item` contexts).

#### Modifiers

You can chain modifiers to the event name to change its behavior:

-   **`.prevent`**: Calls `event.preventDefault()` on the triggered event. Essential for handling form submissions without a page reload.
    ```html
    <form @submit.prevent="saveData()">
        <!-- Form won't reload the page -->
    </form>
    ```
-   **`.stop`**: Calls `event.stopPropagation()`, preventing the event from bubbling up to parent elements.
    ```html
    <div @click="outerClick()">
        <button @click.stop="innerClick()">Click me</button>
        <!-- `outerClick` will not be called when the button is clicked -->
    </div>
    ```
-   **`.outside`**: A special modifier that listens for a click _outside_ of the element it is placed on. This is extremely useful for closing modals, dropdowns, and popovers.
    ```html
    <div mx-data="dropdown">
        <div mx-show="isOpen" @click.outside="close()">Dropdown content</div>
    </div>
    ```
    ```javascript
    CuboMX.component("dropdown", {
        isOpen: true,
        close() {
            this.isOpen = false;
        },
    });
    ```

#### Passing Data with Magic Variables

To pass context from the DOM to your component's method, you can use special "magic variables" as arguments:

-   **`$event`**: The raw browser `Event` object.
    ```html
    <input @keydown="logKey($event)" />
    ```
    ```javascript
    // In your component:
    logKey(event) {
        console.log(event.key);
    }
    ```
-   **`$el`**: A reference to the DOM element the listener is attached to.
    ```html
    <button @click="updateText($el)">Click me</button>
    ```
    ```javascript
    // In your component:
    updateText(element) {
        element.innerText = 'Clicked!';
    }
    ```
-   **`$item`**: When an event is triggered on an element _inside_ an `mx-item` scope, this variable provides direct access to that item's reactive proxy object.
    ```html
    <div mx-data="cart">
        <ul>
            <li mx-item="items" ::sku="sku" sku="SHOE-01">
                <span ::text="description">Running Shoes</span>
                <button @click="removeItem($item)">Remove</button>
            </li>
        </ul>
    </div>
    ```
    ```javascript
    CuboMX.component("cart", {
        items: [],
        removeItem(item) {
            console.log("Removing item:", item.sku); // Logs "SHOE-01"
            // Logic to remove the item from the array...
        },
    });
    ```

### Naming Factory Instances with `mx-ref`

When you create multiple components from the same factory, they are anonymous by default. You can interact with them from within their own local scope, but you cannot access them from the outside.

The `mx-ref` directive solves this by giving a unique, global name to a specific instance of a factory component.

```html
<!-- Two independent dropdowns, one of which is named -->
<div mx-data="dropdown()" mx-ref="headerMenu">...</div>
<div mx-data="dropdown()">...</div>
```

-   The first dropdown can now be accessed globally from anywhere in your JavaScript via `CuboMX.headerMenu` or from another component's HTML via `$headerMenu`.
-   The second dropdown is anonymous. The only way to interact with it is through directives within its own `<div>`, like `@click="toggle()"`.

You must declare an `mx-ref` if you ever need to interact with a specific factory instance from the global scope.

### SPA-Like Navigation with `mx-link`

The `mx-link` directive enables SPA-style (Single Page Application) navigation by intercepting link clicks and performing AJAX-based content swaps instead of full page reloads. This provides a faster, smoother user experience while maintaining the benefits of server-rendered HTML.

**Basic Usage:**

```html
<a href="/about.html" mx-link>About</a>
```

When clicked, this link will:
1. Prevent the default browser navigation
2. Fetch the content from `/about.html` via AJAX
3. Swap the response into the `body` (default target)
4. Update the browser history and URL

#### Controlling the Target

Use `mx-target` to specify where the fetched content should be inserted. The format is `selector:mode`, where mode controls how the swap happens.

```html
<!-- Replace the innerHTML of #main-content -->
<a href="/dashboard.html" mx-link mx-target="#main-content:innerHTML">Dashboard</a>

<!-- Replace the entire #page element -->
<a href="/profile.html" mx-link mx-target="#page:outerHTML">Profile</a>

<!-- Append to the end of #notifications -->
<a href="/notification.html" mx-link mx-target="#notifications:beforeend">Load More</a>
```

**Available Swap Modes:**
- `:innerHTML` - Replace the content inside the target element
- `:outerHTML` - Replace the entire target element (default)
- `:beforebegin` - Insert before the target element
- `:afterbegin` - Insert as the first child of the target
- `:beforeend` - Insert as the last child of the target
- `:afterend` - Insert after the target element

#### Selecting Specific Content

Use `mx-select` to extract only a specific part of the fetched HTML response.

```html
<!-- Fetch /page.html but only use the content inside #article -->
<a
    href="/page.html"
    mx-link
    mx-select="#article"
    mx-target="#main:innerHTML">
    Read Article
</a>
```

This is extremely useful when your server returns a full HTML page but you only want to swap a portion of it into your current page.

#### Setting the Page Title

Use `mx-title` to update the document title during navigation.

```html
<a
    href="/contact.html"
    mx-link
    mx-title="Contact Us - My App">
    Contact
</a>
```

When clicked, this will update `document.title` to "Contact Us - My App" and push this title to the browser history.

#### Loading Cached Content from Components

Instead of fetching from the server, you can load pre-cached HTML from a component property by giving `mx-link` a value.

```html
<div mx-data="pageCache">
    <!-- Load HTML from the component's 'aboutPage' property -->
    <a
        href="/about.html"
        mx-link="aboutPage"
        mx-target="#main:innerHTML">
        About (Cached)
    </a>
</div>
```

```javascript
CuboMX.component("pageCache", {
    aboutPage: "<div><h1>About Us</h1><p>We are awesome!</p></div>",
});
```

This is useful for instant navigation to frequently accessed pages without any network delay.

#### Loading from Global Stores

You can also reference content stored in a global store using the `$` prefix.

```html
<div mx-data="navigation">
    <a
        href="/terms.html"
        mx-link="$contentStore.termsPage"
        mx-target="#main:innerHTML">
        Terms of Service
    </a>
</div>
```

```javascript
CuboMX.store("contentStore", {
    termsPage: "<div>Terms and Conditions...</div>",
    privacyPage: "<div>Privacy Policy...</div>",
});

CuboMX.component("navigation", {});
```

#### Combining Options

All options can be combined for precise control over navigation behavior:

```html
<a
    href="/products.html"
    mx-link
    mx-select="#product-list"
    mx-target="#main:innerHTML"
    mx-title="Our Products">
    View Products
</a>
```

#### How It Works with History

When using `mx-link`, CuboMX automatically:
1. Captures the current state of the target elements before swapping
2. Pushes the new URL to the browser history using `history.pushState()`
3. Restores the previous content when the user clicks the back button

This creates a seamless SPA-like experience where the browser's back and forward buttons work exactly as users expect, without requiring additional server requests.

#### Error Handling

If a fetch request fails, `mx-link` will:
- Log a descriptive error to the console
- Preserve the current page content unchanged
- Not update the URL or history

```html
<a href="/broken-link.html" mx-link>This Link</a>
<!-- If the request fails, the page stays unchanged and an error is logged -->
```

#### Complete Example: Multi-Section Navigation

```html
<div mx-data="app">
    <nav>
        <a href="/" mx-link mx-title="Home">Home</a>
        <a
            href="/about.html"
            mx-link
            mx-select="#content"
            mx-target="#main:innerHTML"
            mx-title="About Us">
            About
        </a>
        <a
            href="/contact.html"
            mx-link
            mx-select="#content"
            mx-target="#main:innerHTML"
            mx-title="Contact">
            Contact
        </a>
    </nav>

    <main id="main">
        <!-- Content will be swapped here -->
    </main>
</div>
```

This navigation setup creates a smooth, SPA-like experience where only the main content area is updated on each click, while the navigation remains in place.

## Scopes

CuboMX has a two-tier scope system that is simple but powerful. Understanding it is key to managing your application's state.

### Local Scope

By default, all directives operate within a **local scope**. This means they interact with the properties and methods of the nearest parent component defined by `mx-data`. This makes components self-contained and predictable.

**Example:**
In the following example, `:text`, `@click`, and `mx-item` all refer to `title`, `addItem`, and `items` on the `listManager` component, because it's the closest `mx-data` ancestor.

```html
<div mx-data="listManager">
    <h1 :text="title">Default Title</h1>
    <button @click="addItem()">Add Item</button>
    <ul>
        <!-- `items` refers to `listManager.items` -->
        <li mx-item="items">
            <!-- `name` refers to a property on an object inside the `items` array -->
            <span ::text="name"></span>
        </li>
    </ul>
</div>
```

```javascript
CuboMX.component("listManager", {
    title: "My Interactive List",
    items: [],
    addItem() {
        const count = this.items.length + 1;
        this.items.add({ name: `Item #${count}` });
    },
});
```

### Global Scope

To access a component or store outside of the current local scope, you must use the **global scope**. This is done by prefixing the component's name with a `$` sign. This tells CuboMX to "escape" the local context and look for the component at the global level.

**Example:**
Here, the `mainControls` component needs to show a message using a separate, global `notifier` component.

```html
<!-- A global notifier component -->
<div mx-data="notifier">
    <div mx-show="message" class="notification">
        <p :text="message"></p>
    </div>
</div>

<!-- Another component that interacts with the notifier -->
<div mx-data="mainControls">
    <h2>Dashboard</h2>
    <!-- This button calls a method on the global notifier -->
    <button @click="$notifier.show('Data saved successfully!')">
        Save Data
    </button>
</div>
```

```javascript
// The global notifier component
CuboMX.component("notifier", {
    message: "",
    show(msg) {
        this.message = msg;
        // Hide the message after 3 seconds
        setTimeout(() => {
            this.message = "";
        }, 3000);
    },
});

// The component that triggers the notification
CuboMX.component("mainControls", {
    // ... other properties and methods
});
```

> **Note on Global Access**
> The `$` prefix can access any globally registered resource:
>
> -   **Stores**: e.g., `$theme.toggle()`
> -   **Singletons**: e.g., `$notifier.show()`
> -   **Factories (via `mx-ref`)**: For a factory defined as `<div mx-data="dropdown()" mx-ref="userMenu">`, you can access it globally via `$userMenu.toggle()`.

## Lifecycle Hooks

CuboMX provides lifecycle hooks that allow you to run code at specific moments in a component's life.

### `init()`

The `init()` method is called on a component or store right after it has been initialized and its properties have been hydrated from the DOM. It runs before the component is fully active and reactive.

This is the perfect place to set up third-party libraries, add complex event listeners, or fetch initial data.

**Example: Initializing a Date Picker**

```javascript
CuboMX.component("datePicker", {
    selectedDate: null,
    init() {
        // `this.$el` is available here for components
        const input = this.$el.querySelector("input");

        // Initialize a 3rd-party library like Flatpickr
        flatpickr(input, {
            onChange: (selectedDates) => {
                // Update the component's state when the library's value changes
                this.selectedDate = selectedDates[0];
            },
        });
    },
});
```

### `destroy()`

The `destroy()` method is called on a component just before its root element (`mx-data`) is removed from the DOM. This is your opportunity to perform any necessary cleanup.

Common use cases include removing manual event listeners, clearing timers set with `setInterval`, or cleaning up instances of third-party libraries.

> **Note:** The `destroy()` hook only exists on components (Singletons and Factories). It is **not** called on Stores, as they are not tied to a DOM element and live for the entire duration of the page.

**Example: Cleaning up a Timer**

```javascript
CuboMX.component("stopwatch", {
    seconds: 0,
    timerId: null,
    init() {
        this.timerId = setInterval(() => {
            this.seconds++;
        }, 1000);
    },
    destroy() {
        // Clear the interval to prevent memory leaks
        clearInterval(this.timerId);
        console.log("Stopwatch destroyed and timer cleared!");
    },
});
```

## Magic Properties

Within a component's methods, you have access to special properties provided by CuboMX, prefixed with `$`.

### `$watch(property, callback)`

This method allows you to "watch" a property on the current component instance and execute a callback function whenever its value changes.

The callback receives the new and old values as arguments: `(newValue, oldValue) => { ... }`.

It is common to set up watchers inside the `init()` method to react to state changes throughout the component's life.

**Example: Watching a counter**

```javascript
CuboMX.component("counter", {
    count: 0,
    init() {
        this.$watch("count", (newVal, oldVal) => {
            console.log(`Counter changed from ${oldVal} to ${newVal}`);

            if (newVal > 5) {
                console.log("Counter has exceeded 5!");
            }
        });
    },
    increment() {
        this.count++;
    },
});
```

### `$el`

This property holds a direct reference to the component's root DOM element (the one with the `mx-data` attribute). This is useful for direct DOM manipulations or for integrating with third-party libraries that need a reference to an element.

**Example: Focusing an input on initialization**

```javascript
CuboMX.component("searchField", {
    init() {
        // this.$el refers to the div with mx-data="searchField"
        const inputElement = this.$el.querySelector("input");
        inputElement.focus();
    },
});
```

```html
<div mx-data="searchField">
    <input type="search" placeholder="Search..." />
</div>
```

## Public API

The global `CuboMX` object is the entry point for interacting with your components and the framework itself from your JavaScript code.

### Accessing Components and State

Once CuboMX is started, every registered Store, Singleton, and named Factory instance (via `mx-ref`) is attached directly to the `CuboMX` object. This allows for easy cross-component communication directly in your JavaScript.

You can get properties, set new values, and call methods on any global component.

**Example:**

Given the following components:

```html
<!-- A store for theme -->
<!-- (Registered in JS: CuboMX.store('theme', ...)) -->

<!-- A singleton component -->
<div mx-data="notifier">...</div>

<!-- A named factory instance -->
<div mx-data="dropdown()" mx-ref="headerMenu">...</div>
```

You can interact with all of them from your JavaScript code:

```javascript
// Get a value from a store
const currentMode = CuboMX.theme.mode;
console.log(currentMode); // "light"

// Set a property on a singleton
// This will trigger reactivity and update the DOM
CuboMX.notifier.message = "New notification!";

// Call a method on a named factory instance
CuboMX.headerMenu.close();
```

### Registration

#### `CuboMX.component(name, definition)`

Registers a component with the framework. This method must be called before `CuboMX.start()`.

-   If `definition` is an object, it registers a **Singleton**.
-   If `definition` is a function, it registers a **Factory**.

#### `CuboMX.store(name, definition)`

Registers a global store. Stores are reactive objects intended to hold shared state (e.g., theme, user authentication). This must be called before `CuboMX.start()`.

### Lifecycle

#### `CuboMX.start()`

Initializes the framework. This function scans the entire document for CuboMX directives, hydrates the initial state, activates all components, and starts the `MutationObserver` to watch for future DOM changes. It should only be called once, after all your components and stores have been registered.

#### `CuboMX.reset()`

Resets the entire framework state. It clears all registered components and stores, and disconnects all observers and event listeners. This is primarily a utility for testing environments to ensure a clean slate between tests.

### HTTP Requests

#### `CuboMX.request(config)`

The core function for making AJAX requests. It returns a `Promise` that resolves to an object containing the response details.

**Configuration Object:**

-   `url` (string, required): The URL to request.
-   `method` (string, optional): HTTP method, defaults to `GET`.
-   `body` (Object | FormData, optional): The request body. For GET requests, this object is converted into URL query parameters.
-   `headers` (Object, optional): Custom request headers.

**Return Value:**
The `Promise` resolves with an object containing:

-   `ok` (boolean): `true` if the status is 200-299.
-   `status` (number): The HTTP status code.
-   `text` (string): The response body as plain text.
-   `json` (any | null): The parsed JSON if the response is JSON, otherwise `null`.

**Example:**

```javascript
async function saveUser(userData) {
    const response = await CuboMX.request({
        url: "/api/users",
        method: "POST",
        body: userData,
    });

    if (response.ok) {
        console.log("User saved!", response.json);
    } else {
        console.error("Failed to save user", response.status);
    }
}
```

### Manual DOM Swapping

#### `CuboMX.swap(html, swaps, options)`

A low-level utility to swap fragments of an HTML string into the live DOM. This is useful when you receive HTML from a request and want to precisely control how it updates the page.

-   `html` (string): The HTML string to source the content from.
-   `swaps` (Array): An array of swap strategy objects. Each object defines how a piece of the new `html` should be placed into the DOM.
-   `options` (Object, optional): An object for additional controls.
    -   `pushUrl` (string): A URL to push to the browser's history stack. When this option is used, CuboMX enables support for the browser's back and forward buttons. It works by automatically capturing the current state of the swapped elements _before_ the swap, and when the user navigates back, it restores the captured HTML, providing a fast, SPA-like navigation experience without extra server requests.
    -   `title` (string): The document title to set after the swap.

**Swap Object Details:**
A swap object in the `swaps` array can have the following properties:

-   `select` (string): A CSS selector for the content to extract from the `html` string.
-   `target` (string): A CSS selector for the element on the page to be updated. You can append a modifier to control _how_ the target is updated (e.g., `'#my-div:innerHTML'`).

**Example:**

```javascript
function updateContent(newHtml) {
    CuboMX.swap(
        newHtml,
        [
            // Standard swap: replaces #main-content with the #main-content from newHtml.
            // If `select` is omitted, it defaults to the `target` selector.
            { target: "#main-content" },

            // Replaces only the inner HTML of #page-title with the content of #page-title from newHtml.
            { select: "#page-title", target: "#page-title:innerHTML" },

            // Replaces the entire #user-card element.
            // :outerHTML is the default behavior if no modifier is given.
            { select: "#user-card", target: "#user-card:outerHTML" },

            // Appends a new notification to the container.
            { select: ".new-notification", target: "#notifications:beforeend" },
        ],
        {
            pushUrl: "/new-page",
            title: "New Page Title",
        }
    );
}
```

**Swap Modifiers:**
You can append a modifier to the `target` selector to control the swap behavior.

-   **`:outerHTML`** (Default): Replaces the entire target element with the selected content.
-   **`:innerHTML`**: Replaces the inner content of the target element.
-   **`:beforebegin`**: Inserts the content immediately before the target element.
-   **`:afterbegin`**: Inserts the content as the first child of the target element.
-   **`:beforeend`**: Inserts the content as the last child of the target element.
-   **`:afterend`**: Inserts the content immediately after the target element.

## TypeScript Integration

While CuboMX works perfectly with plain JavaScript, its full potential and the best developer experience (DX) are unlocked when using TypeScript. You get full type safety and autocompletion for your components, stores, and special proxy objects like `ArrayItems` and `ClassList`.

### Class-Based Components

The recommended way to write components in a TypeScript project is by using ES6 classes that extend the `MxComponent` base class. This approach provides a structured and type-safe way to define your component's properties, methods, and lifecycle.

#### Best Practice: Non-initialized Properties

When defining properties that will be hydrated from the DOM (via `mx-bind`, `mx-item`, `:class`, etc.), it is recommended to declare them without an initial value, using TypeScript's definite assignment assertion operator (`!`)

This tells TypeScript that the property will be initialized by CuboMX during the hydration phase. This avoids creating temporary arrays or default values that are immediately overwritten, making your code cleaner and more efficient.

**Example: A Type-Safe `TodoList` Component**

Here is how you would define a `TodoList` component using a class.

**`components/todoList.ts`:**

```typescript
import { CuboMX, MxComponent, ArrayItems, ClassList } from "cubomx";

// 1. Define an interface for your data structures
interface Task {
    id: number;
    text: string;
    completed: boolean;
}

// 2. Extend MxComponent to create your component class
export class TodoList extends MxComponent {
    // 3. Use `!` for properties that will be hydrated from the DOM.
    // CuboMX will assign them based on the HTML attributes.
    listTitle!: string;
    tasks!: ArrayItems<Task>;
    containerClasses!: ClassList;
    newTaskText!: string;

    // 4. Use lifecycle hooks like init()
    init() {
        console.log(`Todo list "${this.listTitle}" initialized.`);
        this.containerClasses.add("active-list");

        // $watch is fully typed
        this.$watch("newTaskText", (newValue) => {
            console.log(`New task text is: ${newValue}`);
        });
    }

    // 5. Define methods to manipulate state
    addTask() {
        if (!this.newTaskText.trim()) return;

        const newTask: Task = {
            id: Date.now(),
            text: this.newTaskText,
            completed: false,
        };
        this.tasks.add(newTask);
        this.newTaskText = ""; // Clear the input after adding
    }

    toggleTask(item: Task) {
        // The '$item' magic variable gives you the reactive proxy
        item.completed = !item.completed;
    }
}
```

**Registration (`index.ts`):**

For a class to be used as a **Factory** (i.e., a new instance for each `mx-data="todoList()"`), you must register a function that returns a new instance of the class.

```typescript
import { TodoList } from "./components/todoList.js";

// Register a function that creates a new instance
CuboMX.component("todoList", () => new TodoList());

CuboMX.start();
```

If you wanted to use the class as a **Singleton** (one instance for the entire page), you would register a single instance:

```typescript
// For Singleton usage (<div mx-data="todoList">)
// CuboMX.component("todoList", new TodoList());
```

**HTML Usage:**

The component is instantiated as a factory (`todoList()`). Notice the two-way binding on the input with `:value="newTaskText"`.

```html
<div mx-data="todoList()" :class="containerClasses" class="todo-container">
    <h2 :text="listTitle">My Tasks for Today</h2>

    <form @submit.prevent="addTask()">
        <input type="text" placeholder="New task..." :value="newTaskText" />
        <button type="submit">Add</button>
    </form>

    <ul>
        <li mx-item="tasks" ::task-id="id" task-id="1">
            <input
                type="checkbox"
                ::checked="completed"
                @click="toggleTask($item)"
            />
            <span ::text="text">My first task</span>
        </li>
    </ul>
</div>
```
