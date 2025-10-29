import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX, MxComponent } from "../src-refactor/cubomx";

describe("Directive mx-on or @", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should trigger a mx-on:click event and update state", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <p :text="count">0</p>
                <button mx-on:click="increment()">Increment</button>
            </div>
        `;

        const myComp = {
            count: 0,
            increment() {
                this.count += 1;
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("0");
        expect(CuboMX.myComp.count).toBe(0);

        // Click the button
        button.click();

        expect(CuboMX.myComp.count).toBe(1);
        expect(p.textContent).toBe("1");

        // Click again
        button.click();

        expect(CuboMX.myComp.count).toBe(2);
        expect(p.textContent).toBe("2");
    });

    it("should trigger a @ shorthand event", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <p :text="count">0</p>
                <button @click="increment()">Increment</button>
            </div>
        `;

        const myComp = {
            count: 0,
            increment() {
                this.count += 1;
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("0");

        button.click();

        expect(CuboMX.myComp.count).toBe(1);
        expect(p.textContent).toBe("1");
    });

    it("should trigger a @ event on store with $ prefix", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <p :text="$myStore.counter">0</p>
                <button @click="$myStore.increment()">Increment Store</button>
            </div>
        `;

        const myComp = {
            count: 0,
        };

        const myStore = {
            counter: 0,
            increment() {
                this.counter += 1;
            },
        };

        CuboMX.store("myStore", myStore);
        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("0");
        expect(CuboMX.myStore.counter).toBe(0);

        button.click();

        expect(CuboMX.myStore.counter).toBe(1);
        expect(p.textContent).toBe("1");
    });

    it("should apply .prevent modifier and prevent default behavior", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <form @submit.prevent="handleSubmit()">
                    <button type="submit">Submit</button>
                </form>
            </div>
        `;

        let submitCalled = false;
        const myComp = {
            handleSubmit() {
                submitCalled = true;
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const form = document.querySelector("form")!;
        const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
        });

        form.dispatchEvent(submitEvent);

        expect(submitCalled).toBe(true);
        expect(submitEvent.defaultPrevented).toBe(true);
    });

    it("should apply .stop modifier and stop propagation", () => {
        document.body.innerHTML = `
            <div mx-data="myComp" @click="outerClick()">
                <button @click.stop="innerClick()">Click Me</button>
            </div>
        `;

        let outerClicked = false;
        let innerClicked = false;

        const myComp = {
            outerClick() {
                outerClicked = true;
            },
            innerClick() {
                innerClicked = true;
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        button.click();

        expect(innerClicked).toBe(true);
        expect(outerClicked).toBe(false); // Propagation was stopped
    });

    it("should execute expression with $event and $el magic variables", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <button @click="handleClick($event, $el)">Click</button>
            </div>
        `;

        let receivedEvent: Event | null = null;
        let receivedEl: HTMLElement | null = null;

        const myComp = {
            handleClick(event: Event, el: HTMLElement) {
                receivedEvent = event;
                receivedEl = el;
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        button.click();

        expect(receivedEvent).toBeInstanceOf(Event);
        expect(receivedEvent).not.toBeNull();
        expect(receivedEvent!.type).toBe("click");
        expect(receivedEl).toBe(button);
    });



    it("should work with multiple events on same element", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <p :text="message">initial</p>
                <button @click="onClick()" @mouseenter="onHover()">Interact</button>
            </div>
        `;

        const myComp = {
            message: "initial",
            onClick() {
                this.message = "clicked";
            },
            onHover() {
                this.message = "hovered";
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("initial");

        // Trigger mouseenter
        button.dispatchEvent(new Event("mouseenter"));
        expect(p.textContent).toBe("hovered");

        // Trigger click
        button.click();
        expect(p.textContent).toBe("clicked");
    });

    it("should handle multiple handlers for the same event", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <p :text="a">0</p>
                <p :text="b">0</p>
                <button @click="incrementA()" mx-on:click="incrementB()">Click</button>
            </div>
        `;

        const myComp = {
            a: 0,
            b: 0,
            incrementA() {
                this.a += 1;
            },
            incrementB() {
                this.b += 1;
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const [pA, pB] = Array.from(document.querySelectorAll("p"));

        expect(pA.textContent).toBe("0");
        expect(pB.textContent).toBe("0");
        expect(CuboMX.myComp.a).toBe(0);
        expect(CuboMX.myComp.b).toBe(0);

        // Click once - both handlers should execute
        button.click();

        expect(CuboMX.myComp.a).toBe(1);
        expect(CuboMX.myComp.b).toBe(1);
        expect(pA.textContent).toBe("1");
        expect(pB.textContent).toBe("1");

        // Click again - both should increment again
        button.click();

        expect(CuboMX.myComp.a).toBe(2);
        expect(CuboMX.myComp.b).toBe(2);
        expect(pA.textContent).toBe("2");
        expect(pB.textContent).toBe("2");
    });

    it("should pass $item to event handlers inside mx-item", () => {
        document.body.innerHTML = `
            <div mx-data="todoList">
                <ul>
                    <li mx-item="todos">
                        <span ::text="title">Task 1</span>
                        <button @click="logItem($item)">Log</button>
                    </li>
                    <li mx-item="todos">
                        <span ::text="title">Task 2</span>
                        <button @click="logItem($item)">Log</button>
                    </li>
                    <li mx-item="todos">
                        <span ::text="title">Task 3</span>
                        <button @click="logItem($item)">Log</button>
                    </li>
                </ul>
            </div>
        `;

        // let loggedItem: any = null;

        const todoList = {
            loggedItem: null,
            todos: [],
            logItem(item: any) {
                this.loggedItem = item;
            },
        };

        CuboMX.component("todoList", todoList);
        CuboMX.start();

        const buttons = document.querySelectorAll("button");

        // Click first button
        buttons[0].click();
        expect(CuboMX.todoList.loggedItem).not.toBeNull();
        expect(CuboMX.todoList.loggedItem.title).toBe("Task 1");

        // Click second button
        buttons[1].click();
        expect(CuboMX.todoList.loggedItem.title).toBe("Task 2");

        // Click third button
        buttons[2].click();
        expect(CuboMX.todoList.loggedItem.title).toBe("Task 3");
    });

    it("should allow $item to modify its own properties", () => {
        document.body.innerHTML = `
            <div mx-data="taskManager">
                <ul>
                    <li mx-item="tasks" ::completed="completed" completed="false">
                        <span ::text="name">Write tests</span>
                        <span ::text="completed">false</span>
                        <button @click="toggleTask($item)">Toggle</button>
                    </li>
                    <li mx-item="tasks" ::completed="completed" completed="false">
                        <span ::text="name">Review code</span>
                        <span ::text="completed">false</span>
                        <button @click="toggleTask($item)">Toggle</button>
                    </li>
                </ul>
            </div>
        `;

        const taskManager = {
            tasks: [],
            toggleTask(item: any) {
                item.completed = !item.completed;
            },
        };

        CuboMX.component("taskManager", taskManager);
        CuboMX.start();

        const buttons = document.querySelectorAll("button");
        const [task1Spans, task2Spans] = [
            document.querySelectorAll("li")[0].querySelectorAll("span"),
            document.querySelectorAll("li")[1].querySelectorAll("span"),
        ];

        // Initially both tasks are not completed
        expect(task1Spans[1].textContent).toBe("false");
        expect(task2Spans[1].textContent).toBe("false");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(false);
        expect(CuboMX.taskManager.tasks[1].completed).toBe(false);

        // Toggle first task
        buttons[0].click();
        expect(task1Spans[1].textContent).toBe("true");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(true);
        expect(task2Spans[1].textContent).toBe("false");
        expect(CuboMX.taskManager.tasks[1].completed).toBe(false);

        // Toggle second task
        buttons[1].click();
        expect(task1Spans[1].textContent).toBe("true");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(true);
        expect(task2Spans[1].textContent).toBe("true");
        expect(CuboMX.taskManager.tasks[1].completed).toBe(true);

        // Toggle first task back
        buttons[0].click();
        expect(task1Spans[1].textContent).toBe("false");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(false);
    });

    it("should allow $item to modify its own properties with class object", () => {
        document.body.innerHTML = `
            <div mx-data="taskManager">
                <ul>
                    <li mx-item="tasks" ::completed="completed" completed="false">
                        <span ::text="name">Write tests</span>
                        <span ::text="completed">false</span>
                        <button @click="toggleTask($item)">Toggle</button>
                    </li>
                    <li mx-item="tasks" ::completed="completed" completed="false">
                        <span ::text="name">Review code</span>
                        <span ::text="completed">false</span>
                        <button @click="toggleTask($item)">Toggle</button>
                    </li>
                </ul>
            </div>
        `;

        interface Item {
            completed: boolean;
            name: string;
        }

        class taskManager extends MxComponent {
            tasks!: Item[];
            toggleTask(item: any) {
                item.completed = !item.completed;
            }
        }

        CuboMX.component("taskManager", new taskManager());
        CuboMX.start();

        const buttons = document.querySelectorAll("button");
        const [task1Spans, task2Spans] = [
            document.querySelectorAll("li")[0].querySelectorAll("span"),
            document.querySelectorAll("li")[1].querySelectorAll("span"),
        ];

        // Initially both tasks are not completed
        expect(task1Spans[1].textContent).toBe("false");
        expect(task2Spans[1].textContent).toBe("false");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(false);
        expect(CuboMX.taskManager.tasks[1].completed).toBe(false);

        // Toggle first task
        buttons[0].click();
        expect(task1Spans[1].textContent).toBe("true");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(true);
        expect(task2Spans[1].textContent).toBe("false");
        expect(CuboMX.taskManager.tasks[1].completed).toBe(false);

        // Toggle second task
        buttons[1].click();
        expect(task1Spans[1].textContent).toBe("true");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(true);
        expect(task2Spans[1].textContent).toBe("true");
        expect(CuboMX.taskManager.tasks[1].completed).toBe(true);

        // Toggle first task back
        buttons[0].click();
        expect(task1Spans[1].textContent).toBe("false");
        expect(CuboMX.taskManager.tasks[0].completed).toBe(false);
    });

    it("should allow $item to call component methods with item data", () => {
        document.body.innerHTML = `
            <div mx-data="shoppingCart">
                <ul>
                    <li mx-item="items" ::data-id="id" data-id="1">
                        <span ::text="product">Mouse</span>
                        <span ::text="quantity">2</span>
                        <button @click="removeItem($item.id)">Remove</button>
                    </li>
                    <li mx-item="items" ::data-id="id" data-id="2">
                        <span ::text="product">Keyboard</span>
                        <span ::text="quantity">1</span>
                        <button @click="removeItem($item.id)">Remove</button>
                    </li>
                    <li mx-item="items" ::data-id="id" data-id="3">
                        <span ::text="product">Monitor</span>
                        <span ::text="quantity">1</span>
                        <button @click="removeItem($item.id)">Remove</button>
                    </li>
                </ul>
            </div>
        `;

        const removedIds: number[] = [];

        const shoppingCart = {
            items: [],
            removeItem(id: number) {
                removedIds.push(id);
            },
        };

        CuboMX.component("shoppingCart", shoppingCart);
        CuboMX.start();

        const buttons = document.querySelectorAll("button");

        expect(CuboMX.shoppingCart.items.length).toBe(3);

        // Remove second item (Keyboard, id=2)
        buttons[1].click();
        expect(removedIds).toEqual([2]);

        // Remove first item (Mouse, id=1)
        buttons[0].click();
        expect(removedIds).toEqual([2, 1]);

        // Remove third item (Monitor, id=3)
        buttons[2].click();
        expect(removedIds).toEqual([2, 1, 3]);
    });

    it("should have $item undefined when not inside mx-item scope", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <button @click="checkItem($item)">Check</button>
            </div>
        `;

        let receivedItem: any = "not-called";

        const myComp = {
            checkItem(item: any) {
                receivedItem = item;
            },
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const button = document.querySelector("button")!;
        button.click();

        expect(receivedItem).toBeNull();
    });

    it("should call method on another component using $ prefix", () => {
        document.body.innerHTML = `
            <div mx-data="receiver">
                <p :text="message">initial</p>
            </div>
            <div mx-data="sender">
                <button @click="$receiver.updateMessage('Hello from sender!')">Send</button>
            </div>
        `;

        const receiver = {
            message: "initial",
            updateMessage(newMessage: string) {
                this.message = newMessage;
            },
        };

        const sender = {
            // Empty component, just triggers the event
        };

        CuboMX.component("receiver", receiver);
        CuboMX.component("sender", sender);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("initial");
        expect(CuboMX.receiver.message).toBe("initial");

        button.click();

        expect(CuboMX.receiver.message).toBe("Hello from sender!");
        expect(p.textContent).toBe("Hello from sender!");
    });

    it("should call method on component via mx-ref using $ prefix", () => {
        document.body.innerHTML = `
            <div mx-data="modal()" mx-ref="loginModal">
                <p :text="isOpen">false</p>
            </div>
            <div mx-data="navbar">
                <button @click="$loginModal.open()">Open Login</button>
            </div>
        `;

        const modal = () => ({
            isOpen: false,
            open() {
                this.isOpen = true;
            },
            close() {
                this.isOpen = false;
            },
        });

        const navbar = {
            // Empty component
        };

        CuboMX.component("modal", modal);
        CuboMX.component("navbar", navbar);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("false");
        expect(CuboMX.loginModal.isOpen).toBe(false);

        button.click();

        expect(CuboMX.loginModal.isOpen).toBe(true);
        expect(p.textContent).toBe("true");
    });

    it("should call store method using $ prefix from component", () => {
        document.body.innerHTML = `
            <div mx-data="dashboard">
                <p id="count" :text="$counterStore.count">0</p>
                <button @click="$counterStore.increment()">Increment</button>
            </div>
        `;

        const counterStore = {
            count: 0,
            increment() {
                this.count += 1;
            },
        };

        const dashboard = {};

        CuboMX.store("counterStore", counterStore);
        CuboMX.component("dashboard", dashboard);
        CuboMX.start();

        const button = document.querySelector("button")!;
        const countP = document.querySelector("#count")!;

        expect(countP.textContent).toBe("0");
        expect(CuboMX.counterStore.count).toBe(0);

        button.click();

        expect(CuboMX.counterStore.count).toBe(1);
        expect(countP.textContent).toBe("1");

        button.click();

        expect(CuboMX.counterStore.count).toBe(2);
        expect(countP.textContent).toBe("2");
    });
});
