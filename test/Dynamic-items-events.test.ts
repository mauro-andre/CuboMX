import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX, ArrayItems } from "../src/cubomx";

describe("Dynamic items with events", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should trigger @click event on dynamically added items with $item", async () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <div id="container">
                    <template mx-item="items">
                        <div mx-item="items">
                            <h1 ::text="title">Item title</h1>
                            <button class="item-btn" @click="showItem($item)">Click</button>
                        </div>
                    </template>
                </div>
            </div>
        `;

        const myComponent = {
            items: [],
            loggedItem: null as any,
            showItem(item: any) {
                this.loggedItem = item;
            },
        };

        CuboMX.component("myComponent", myComponent);
        CuboMX.start();

        // Add items dynamically
        CuboMX.myComponent.items.add({ title: "First Item" });
        CuboMX.myComponent.items.add({ title: "Second Item" });

        // Wait for MutationObserver to process
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Get the buttons
        const buttons = document.querySelectorAll(".item-btn");
        expect(buttons.length).toBe(2);

        // Click the first button
        (buttons[0] as HTMLButtonElement).click();

        // Verify showItem was called with the correct item
        expect(CuboMX.myComponent.loggedItem).not.toBeNull();
        expect(CuboMX.myComponent.loggedItem.title).toBe("First Item");

        // Click the second button
        (buttons[1] as HTMLButtonElement).click();

        expect(CuboMX.myComponent.loggedItem).not.toBeNull();
        expect(CuboMX.myComponent.loggedItem.title).toBe("Second Item");
    });

    it("should allow $item to modify its own properties on dynamic items", async () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <div id="container">
                    <template mx-item="items">
                        <div mx-item="items">
                            <span ::text="title">Title</span>
                            <span class="completed-status" ::text="completed">false</span>
                            <button class="toggle-btn" @click="toggleItem($item)">Toggle</button>
                        </div>
                    </template>
                </div>
            </div>
        `;

        const myComponent = {
            items: [],
            toggleItem(item: any) {
                item.completed = !item.completed;
            },
        };

        CuboMX.component("myComponent", myComponent);
        CuboMX.start();

        // Add items
        CuboMX.myComponent.items.add({ title: "Task 1", completed: false });
        CuboMX.myComponent.items.add({ title: "Task 2", completed: false });

        // Wait for MutationObserver to process
        await new Promise((resolve) => setTimeout(resolve, 0));

        const buttons = document.querySelectorAll(".toggle-btn");
        const statuses = document.querySelectorAll(".completed-status");

        // Initially both are false
        expect(statuses[0].textContent).toBe("false");
        expect(statuses[1].textContent).toBe("false");
        expect(CuboMX.myComponent.items[0].completed).toBe(false);
        expect(CuboMX.myComponent.items[1].completed).toBe(false);

        // Toggle first item
        (buttons[0] as HTMLButtonElement).click();
        expect(statuses[0].textContent).toBe("true");
        expect(CuboMX.myComponent.items[0].completed).toBe(true);
        expect(statuses[1].textContent).toBe("false");
        expect(CuboMX.myComponent.items[1].completed).toBe(false);

        // Toggle second item
        (buttons[1] as HTMLButtonElement).click();
        expect(statuses[0].textContent).toBe("true");
        expect(statuses[1].textContent).toBe("true");
        expect(CuboMX.myComponent.items[1].completed).toBe(true);
    });

    it("should remove items using .remove(item) method", async () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <div id="container">
                    <template mx-item="items">
                        <div mx-item="items" class="item">
                            <span ::text="title">Title</span>
                            <button class="remove-btn" @click="removeItem($item)">Remove</button>
                        </div>
                    </template>
                </div>
            </div>
        `;

        interface Item {
            title: string;
        }

        const myComponent: {
            items: ArrayItems<Item>;
            removeItem: (item: any) => void;
        } = {
            items: [] as any,
            removeItem(item: any) {
                this.items.remove(item);
            },
        };

        CuboMX.component("myComponent", myComponent);
        CuboMX.start();

        // Add items
        CuboMX.myComponent.items.add({ title: "Item 1" });
        CuboMX.myComponent.items.add({ title: "Item 2" });
        CuboMX.myComponent.items.add({ title: "Item 3" });

        // Wait for MutationObserver
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(CuboMX.myComponent.items.length).toBe(3);
        expect(document.querySelectorAll(".item").length).toBe(3);

        // Click remove button on second item
        const buttons = document.querySelectorAll(".remove-btn");
        (buttons[1] as HTMLButtonElement).click();

        expect(CuboMX.myComponent.items.length).toBe(2);
        expect(document.querySelectorAll(".item").length).toBe(2);
        expect(CuboMX.myComponent.items[0].title).toBe("Item 1");
        expect(CuboMX.myComponent.items[1].title).toBe("Item 3");

        // Click remove button on first item
        const updatedButtons = document.querySelectorAll(".remove-btn");
        (updatedButtons[0] as HTMLButtonElement).click();

        expect(CuboMX.myComponent.items.length).toBe(1);
        expect(document.querySelectorAll(".item").length).toBe(1);
        expect(CuboMX.myComponent.items[0].title).toBe("Item 3");
    });
});
