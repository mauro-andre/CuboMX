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
