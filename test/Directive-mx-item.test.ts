import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX, MxComponent } from "../src/cubomx";

describe("Directive mx-item with Singleton", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate a simple array of objects", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items" ::id="id" id="1">
                        <span ::text="name">Item 1</span>
                    </li>
                    <li mx-item="items" ::id="id" id="2">
                        <span ::text="name">Item 2</span>
                    </li>
                </ul>
            </div>
        `;

        const listComponent = {
            items: [],
        };

        CuboMX.component("listComponent", listComponent);
        CuboMX.start();

        const items = CuboMX.listComponent.items;
        expect(items).toBeInstanceOf(Array);
        expect(items.length).toBe(2);
        expect(items[0].id).toBe(1);
        expect(items[0].name).toBe("Item 1");
        expect(items[1].id).toBe(2);
        expect(items[1].name).toBe("Item 2");
    });

    it("should parse various data types for item properties", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items"
                        ::id="id" id="10"
                        ::active="active" active="true"
                        ::price="price" price="99.99"
                        >
                        <span ::text="name">First Item</span>
                    </li>
                </ul>
            </div>
        `;

        const listComponent = {
            items: [],
        };

        CuboMX.component("listComponent", listComponent);
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];
        expect(item.name).toBe("First Item");
        expect(item.id).toBe(10);
        expect(item.active).toBe(true);
        expect(item.price).toBe(99.99);
    });

    it("should handle multiple item properties on the same element", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items" 
                        ::id="id" id="1"
                        ::sku="sku" sku="A-123"
                        ::text="name">
                        My Product
                    </li>
                </ul>
            </div>
        `;

        const listComponent = {
            items: [],
        };

        CuboMX.component("listComponent", listComponent);
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];
        expect(item.id).toBe(1);
        expect(item.sku).toBe("A-123");
        expect(item.name).toBe("My Product");
    });
});

describe("Directive mx-item with Class Component", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate items into a class component property", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items" ::id="id" id="101" ::text="name">Class Item</li>
                </ul>
            </div>
        `;

        class ListComponent extends MxComponent {
            items: any[] = [];
        }

        CuboMX.component("listComponent", new ListComponent());
        CuboMX.start();

        const items = CuboMX.listComponent.items;
        expect(items).toBeInstanceOf(Array);
        expect(items.length).toBe(1);
        expect(items[0].id).toBe(101);
        expect(items[0].name).toBe("Class Item");
    });
});

describe("Directive mx-item with Global Store", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate items into a global store array", () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <ul>
                    <li mx-item="$myStore.items" ::id="id" id="202">
                        <span ::text="name">Store Item</span>
                    </li>
                </ul>
            </div>
        `;

        const myStore = {
            items: [],
        };
        const myComponent = {};

        CuboMX.store("myStore", myStore);
        CuboMX.component("myComponent", myComponent);
        CuboMX.start();

        const items = CuboMX.myStore.items;
        expect(items).toBeInstanceOf(Array);
        expect(items.length).toBe(1);
        expect(items[0].id).toBe(202);
        expect(items[0].name).toBe("Store Item");
    });
});

describe("Directive mx-item with Template Definition", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should use template element to define items for empty container", () => {
        document.body.innerHTML = `
            <div mx-data="alerts">
                <div id="alert-container">
                    <template mx-item="alerts">
                        <div class="alert" ::type="type" ::text="message"></div>
                    </template>
                </div>
            </div>
        `;

        const alertsComponent = {
            alerts: [],
        };

        CuboMX.component("alerts", alertsComponent);
        CuboMX.start();

        const container = document.getElementById("alert-container");
        expect(container?.children.length).toBe(0);

        const alerts = CuboMX.alerts.alerts;
        expect(alerts).toBeInstanceOf(Array);
        expect(alerts.length).toBe(0);
        expect("add" in alerts).toBe(true);

        // Now add an alert dynamically
        const newAlert = alerts.add({ type: "success", message: "Operation completed!" });

        expect(alerts.length).toBe(1);
        expect(newAlert.type).toBe("success");
        expect(newAlert.message).toBe("Operation completed!");
        expect(container?.children.length).toBe(1);

        const alertEl = container?.querySelector(".alert");
        expect(alertEl?.textContent).toBe("Operation completed!");
        expect(alertEl?.getAttribute("type")).toBe("success");
    });

    it("should allow adding multiple items after template definition", () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <template mx-item="items">
                        <li class="todo" ::done="done" ::text="title"></li>
                    </template>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const list = document.getElementById("todo-list");
        const items = CuboMX.todos.items;

        expect(items.length).toBe(0);

        items.add({ title: "Buy milk", done: false });
        items.add({ title: "Walk dog", done: true });
        items.prepend({ title: "Wake up", done: true });

        expect(items.length).toBe(3);
        expect(list?.children.length).toBe(3);
        expect(items[0].title).toBe("Wake up");
        expect(items[1].title).toBe("Buy milk");
        expect(items[2].title).toBe("Walk dog");
    });

    it("should work with template even when there are existing items", () => {
        document.body.innerHTML = `
            <div mx-data="messages">
                <div id="messages-container">
                    <template mx-item="messages">
                        <p ::text="text" ::priority="priority"></p>
                    </template>
                    <p mx-item="messages" ::text="text" ::priority="priority" priority="high">Existing message</p>
                </div>
            </div>
        `;

        const messagesComponent = {
            messages: [],
        };

        CuboMX.component("messages", messagesComponent);
        CuboMX.start();

        const messages = CuboMX.messages.messages;
        const container = document.getElementById("messages-container");

        // Should have the existing item
        expect(messages.length).toBe(1);
        expect(messages[0].text).toBe("Existing message");
        expect(messages[0].priority).toBe("high");

        // Template should still work for new items
        messages.add({ text: "New message", priority: "low" });

        expect(messages.length).toBe(2);
        expect(messages[1].text).toBe("New message");
        expect(messages[1].priority).toBe("low");
        expect(container?.children.length).toBe(2);
    });
});

describe("Directive ::el for element reference in mx-item", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate element references within mx-item", () => {
        document.body.innerHTML = `
            <div mx-data="cards">
                <div class="card-container">
                    <div mx-item="items" ::id="id" id="1" ::el="element">
                        <h3 ::text="title">Card Title 1</h3>
                        <p ::text="description">Description 1</p>
                    </div>
                    <div mx-item="items" ::id="id" id="2" ::el="element">
                        <h3 ::text="title">Card Title 2</h3>
                        <p ::text="description">Description 2</p>
                    </div>
                </div>
            </div>
        `;

        const cards = {
            items: [],
        };

        CuboMX.component("cards", cards);
        CuboMX.start();

        const items = CuboMX.cards.items;

        // Check if elements were hydrated for each item
        expect(items.length).toBe(2);
        expect(items[0].element).toBeInstanceOf(HTMLElement);
        expect(items[1].element).toBeInstanceOf(HTMLElement);

        // Check if we have access to the DOM elements
        expect(items[0].element.classList.contains("card-container")).toBe(false);
        expect(items[0].element.querySelector("h3")?.textContent).toBe("Card Title 1");
        expect(items[1].element.querySelector("h3")?.textContent).toBe("Card Title 2");

        // Check other properties were also hydrated
        expect(items[0].id).toBe(1);
        expect(items[0].title).toBe("Card Title 1");
        expect(items[1].id).toBe(2);
        expect(items[1].title).toBe("Card Title 2");
    });

    it("should work with template and dynamically added items", () => {
        document.body.innerHTML = `
            <div mx-data="widgets">
                <div id="widget-container">
                    <template mx-item="widgets">
                        <div class="widget" ::name="name" ::el="element">
                            <span ::text="label"></span>
                        </div>
                    </template>
                </div>
            </div>
        `;

        const widgetsComp = {
            widgets: [],
        };

        CuboMX.component("widgets", widgetsComp);
        CuboMX.start();

        const widgets = CuboMX.widgets.widgets;

        // Add a widget dynamically
        widgets.add({ name: "widget-1", label: "First Widget" });

        expect(widgets.length).toBe(1);
        expect(widgets[0].element).toBeInstanceOf(HTMLElement);
        expect(widgets[0].element.classList.contains("widget")).toBe(true);
        expect(widgets[0].element.getAttribute("name")).toBe("widget-1");
        expect(widgets[0].element.querySelector("span")?.textContent).toBe("First Widget");

        // Add another widget
        widgets.add({ name: "widget-2", label: "Second Widget" });

        expect(widgets.length).toBe(2);
        expect(widgets[1].element).toBeInstanceOf(HTMLElement);
        expect(widgets[1].element.getAttribute("name")).toBe("widget-2");
    });
});

describe("Directive mx-item with asyncAdd()", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should add item asynchronously at the end and maintain correct order", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 3 items
        expect(items.length).toBe(3);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 2");
        expect(items[2].title).toBe("Item 3");

        // Add new item at the end
        const newItem = await items.asyncAdd({ title: "Item 4", done: false });

        // Check array order
        expect(items.length).toBe(4);
        expect(items[3]).toBe(newItem);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 2");
        expect(items[2].title).toBe("Item 3");
        expect(items[3].title).toBe("Item 4");

        // Check DOM order
        expect(list?.children.length).toBe(4);
        expect(list?.children[0].textContent).toBe("Item 1");
        expect(list?.children[1].textContent).toBe("Item 2");
        expect(list?.children[2].textContent).toBe("Item 3");
        expect(list?.children[3].textContent).toBe("Item 4");

        // Check reactivity
        newItem.title = "Updated Item 4";
        expect(list?.children[3].textContent).toBe("Updated Item 4");
    });

    it("should prepend item asynchronously and maintain correct order", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 3 items
        expect(items.length).toBe(3);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 2");
        expect(items[2].title).toBe("Item 3");

        // Prepend new item (should go to position 0)
        const newItem = await items.asyncPrepend({ title: "Item 0", done: false });

        // Check array order
        expect(items.length).toBe(4);
        expect(items[0]).toBe(newItem);
        expect(items[0].title).toBe("Item 0");
        expect(items[1].title).toBe("Item 1");
        expect(items[2].title).toBe("Item 2");
        expect(items[3].title).toBe("Item 3");

        // Check DOM order
        expect(list?.children.length).toBe(4);
        expect(list?.children[0].textContent).toBe("Item 0");
        expect(list?.children[1].textContent).toBe("Item 1");
        expect(list?.children[2].textContent).toBe("Item 2");
        expect(list?.children[3].textContent).toBe("Item 3");

        // Check reactivity
        newItem.title = "Updated Item 0";
        expect(list?.children[0].textContent).toBe("Updated Item 0");
    });

    it("should delete item asynchronously and maintain correct order", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 4</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 4 items
        expect(items.length).toBe(4);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 2");
        expect(items[2].title).toBe("Item 3");
        expect(items[3].title).toBe("Item 4");

        // Delete item at index 1 (Item 2)
        await items.asyncDelete(1);

        // Check array after deletion
        expect(items.length).toBe(3);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 3"); // Item 2 was removed
        expect(items[2].title).toBe("Item 4");

        // Check DOM after deletion
        expect(list?.children.length).toBe(3);
        expect(list?.children[0].textContent).toBe("Item 1");
        expect(list?.children[1].textContent).toBe("Item 3");
        expect(list?.children[2].textContent).toBe("Item 4");

        // Delete first item (index 0)
        await items.asyncDelete(0);

        expect(items.length).toBe(2);
        expect(items[0].title).toBe("Item 3");
        expect(items[1].title).toBe("Item 4");

        expect(list?.children.length).toBe(2);
        expect(list?.children[0].textContent).toBe("Item 3");
        expect(list?.children[1].textContent).toBe("Item 4");
    });

    it("should remove item asynchronously by reference", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 4</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 4 items
        expect(items.length).toBe(4);

        // Get reference to Item 2
        const itemToRemove = items[1];
        expect(itemToRemove.title).toBe("Item 2");

        // Remove item by reference
        await items.asyncRemove(itemToRemove);

        // Check array after removal
        expect(items.length).toBe(3);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 3"); // Item 2 was removed
        expect(items[2].title).toBe("Item 4");

        // Check DOM after removal
        expect(list?.children.length).toBe(3);
        expect(list?.children[0].textContent).toBe("Item 1");
        expect(list?.children[1].textContent).toBe("Item 3");
        expect(list?.children[2].textContent).toBe("Item 4");
    });

    it("should pop item asynchronously (remove last item)", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 3 items
        expect(items.length).toBe(3);
        expect(items[2].title).toBe("Item 3");

        // Pop last item (Item 3)
        await items.asyncPop();

        // Check array after pop
        expect(items.length).toBe(2);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 2");

        // Check DOM after pop
        expect(list?.children.length).toBe(2);
        expect(list?.children[0].textContent).toBe("Item 1");
        expect(list?.children[1].textContent).toBe("Item 2");

        // Pop again (Item 2)
        await items.asyncPop();

        expect(items.length).toBe(1);
        expect(items[0].title).toBe("Item 1");
        expect(list?.children.length).toBe(1);
        expect(list?.children[0].textContent).toBe("Item 1");
    });

    it("should shift item asynchronously (remove first item)", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 3 items
        expect(items.length).toBe(3);
        expect(items[0].title).toBe("Item 1");

        // Shift first item (Item 1)
        await items.asyncShift();

        // Check array after shift
        expect(items.length).toBe(2);
        expect(items[0].title).toBe("Item 2"); // Item 1 was removed
        expect(items[1].title).toBe("Item 3");

        // Check DOM after shift
        expect(list?.children.length).toBe(2);
        expect(list?.children[0].textContent).toBe("Item 2");
        expect(list?.children[1].textContent).toBe("Item 3");

        // Shift again (Item 2)
        await items.asyncShift();

        expect(items.length).toBe(1);
        expect(items[0].title).toBe("Item 3");
        expect(list?.children.length).toBe(1);
        expect(list?.children[0].textContent).toBe("Item 3");
    });

    it("should clear all items asynchronously", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 4</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 4 items
        expect(items.length).toBe(4);
        expect(list?.children.length).toBe(4);

        // Clear all items asynchronously
        await items.asyncClear();

        // Check array is empty
        expect(items.length).toBe(0);

        // Check DOM is empty
        expect(list?.children.length).toBe(0);

        // Verify we can still add items after clearing (template should be preserved)
        const newItem = items.add({ title: "New Item", done: false });
        expect(items.length).toBe(1);
        expect(newItem.title).toBe("New Item");
        expect(list?.children.length).toBe(1);
        expect(list?.children[0].textContent).toBe("New Item");
    });

    it("should replace item asynchronously and maintain correct order", async () => {
        document.body.innerHTML = `
            <div mx-data="todos">
                <ul id="todo-list">
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 1</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 2</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="true">Item 3</li>
                    <li mx-item="items" class="todo" ::done="done" ::text="title" done="false">Item 4</li>
                </ul>
            </div>
        `;

        const todosComponent = {
            items: [],
        };

        CuboMX.component("todos", todosComponent);
        CuboMX.start();

        const items = CuboMX.todos.items;
        const list = document.getElementById("todo-list");

        // Should have hydrated 4 items
        expect(items.length).toBe(4);
        expect(items[0].title).toBe("Item 1");
        expect(items[1].title).toBe("Item 2");
        expect(items[2].title).toBe("Item 3");
        expect(items[3].title).toBe("Item 4");

        // Replace item at index 1 (Item 2 -> New Item)
        const replacedItem = await items.asyncReplace(1, { title: "New Item", done: true });

        // Check array after replacement
        expect(items.length).toBe(4);
        expect(items[0].title).toBe("Item 1");
        expect(items[1]).toBe(replacedItem);
        expect(items[1].title).toBe("New Item");
        expect(items[1].done).toBe(true);
        expect(items[2].title).toBe("Item 3");
        expect(items[3].title).toBe("Item 4");

        // Check DOM after replacement
        expect(list?.children.length).toBe(4);
        expect(list?.children[0].textContent).toBe("Item 1");
        expect(list?.children[1].textContent).toBe("New Item");
        expect(list?.children[1].getAttribute("done")).toBe("true");
        expect(list?.children[2].textContent).toBe("Item 3");
        expect(list?.children[3].textContent).toBe("Item 4");

        // Check reactivity of replaced item
        replacedItem.title = "Updated Item";
        expect(list?.children[1].textContent).toBe("Updated Item");

        // Replace first item (index 0)
        const firstReplaced = await items.asyncReplace(0, { title: "First Replaced", done: false });

        expect(items.length).toBe(4);
        expect(items[0]).toBe(firstReplaced);
        expect(items[0].title).toBe("First Replaced");
        expect(list?.children[0].textContent).toBe("First Replaced");
    });
});
