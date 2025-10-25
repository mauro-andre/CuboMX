import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX } from "../src-refactor/cubomx";

beforeEach(() => {
    CuboMX.reset();
});

describe("Text Reactions (:text)", () => {
    it("should update textContent when property changes", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <h1 id="greeting" :text="greeting">Initial</h1>
            </div>
        `;

        CuboMX.component("myComp", { greeting: null });
        CuboMX.start();

        CuboMX.myComp.greeting = "Hello World";
        const greetingEl = document.querySelector("#greeting");
        expect(greetingEl?.textContent).toBe("Hello World");
    });

    it("should handle null and undefined values", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span id="msg" :text="message">Initial</span>
            </div>
        `;

        CuboMX.component("myComp", { message: "Hello" });
        CuboMX.start();

        CuboMX.myComp.message = null;
        expect(document.querySelector("#msg")?.textContent).toBe("");

        CuboMX.myComp.message = undefined;
        expect(document.querySelector("#msg")?.textContent).toBe("");
    });

    it("should update multiple elements bound to same property", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span id="first" :text="count">0</span>
                <span id="second" :text="count">0</span>
            </div>
        `;

        CuboMX.component("myComp", { count: 0 });
        CuboMX.start();

        CuboMX.myComp.count = 42;
        expect(document.querySelector("#first")?.textContent).toBe("42");
        expect(document.querySelector("#second")?.textContent).toBe("42");
    });
});

describe("HTML Reactions (:html)", () => {
    it("should update innerHTML when property changes", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="content" :html="markup">Initial</div>
            </div>
        `;

        CuboMX.component("myComp", { markup: null });
        CuboMX.start();

        CuboMX.myComp.markup = "<strong>Bold Text</strong>";
        const contentEl = document.querySelector("#content");
        expect(contentEl?.innerHTML).toBe("<strong>Bold Text</strong>");
    });

    it("should render complex HTML structures", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="list" :html="listHtml"></div>
            </div>
        `;

        CuboMX.component("myComp", { listHtml: "" });
        CuboMX.start();

        CuboMX.myComp.listHtml = "<ul><li>Item 1</li><li>Item 2</li></ul>";
        const listEl = document.querySelector("#list");
        expect(listEl?.querySelectorAll("li").length).toBe(2);
    });
});

describe("Attribute Reactions - Normal Attributes", () => {
    it("should update regular attributes", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :data-status="status" data-status="initial"></div>
            </div>
        `;

        CuboMX.component("myComp", { status: null });
        CuboMX.start();

        CuboMX.myComp.status = "active";
        const boxEl = document.querySelector("#box");
        expect(boxEl?.getAttribute("data-status")).toBe("active");
    });

    it("should update multiple attributes", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <img id="avatar" :src="imgSrc" :alt="imgAlt" src="" alt="">
            </div>
        `;

        CuboMX.component("myComp", { imgSrc: "", imgAlt: "" });
        CuboMX.start();

        CuboMX.myComp.imgSrc = "https://example.com/avatar.png";
        CuboMX.myComp.imgAlt = "User Avatar";

        const imgEl = document.querySelector("#avatar");
        expect(imgEl?.getAttribute("src")).toBe(
            "https://example.com/avatar.png"
        );
        expect(imgEl?.getAttribute("alt")).toBe("User Avatar");
    });

    it("should update title attribute", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <button id="btn" :title="tooltip" title="">Hover</button>
            </div>
        `;

        CuboMX.component("myComp", { tooltip: "" });
        CuboMX.start();

        CuboMX.myComp.tooltip = "Click to submit";
        expect(document.querySelector("#btn")?.getAttribute("title")).toBe(
            "Click to submit"
        );
    });
});

describe("Attribute Reactions - Input Value", () => {
    it("should update input value property", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <input id="name" :value="userName" value="initial">
            </div>
        `;

        CuboMX.component("myComp", { userName: null });
        CuboMX.start();

        CuboMX.myComp.userName = "John Doe";
        const inputEl = document.querySelector("#name") as HTMLInputElement;
        expect(inputEl.value).toBe("John Doe");
    });

    it("should update textarea value", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <textarea id="bio" :value="biography">Initial</textarea>
            </div>
        `;

        CuboMX.component("myComp", { biography: null });
        CuboMX.start();

        CuboMX.myComp.biography = "Software Developer";
        const textareaEl = document.querySelector("#bio") as HTMLInputElement;
        expect(textareaEl.value).toBe("Software Developer");
    });
});

describe("Attribute Reactions - Checkbox Checked", () => {
    it("should update checkbox checked property", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <input id="agree" type="checkbox" :checked="isAgreed">
            </div>
        `;

        CuboMX.component("myComp", { isAgreed: false });
        CuboMX.start();

        CuboMX.myComp.isAgreed = true;
        const checkboxEl = document.querySelector("#agree") as HTMLInputElement;
        expect(checkboxEl.checked).toBe(true);

        CuboMX.myComp.isAgreed = false;
        expect(checkboxEl.checked).toBe(false);
    });

    it("should handle truthy/falsy values for checked", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <input id="toggle" type="checkbox" :checked="value">
            </div>
        `;

        CuboMX.component("myComp", { value: null });
        CuboMX.start();

        const checkboxEl = document.querySelector(
            "#toggle"
        ) as HTMLInputElement;

        CuboMX.myComp.value = 1;
        expect(checkboxEl.checked).toBe(true);

        CuboMX.myComp.value = 0;
        expect(checkboxEl.checked).toBe(false);

        CuboMX.myComp.value = "yes";
        expect(checkboxEl.checked).toBe(true);

        CuboMX.myComp.value = "";
        expect(checkboxEl.checked).toBe(false);
    });
});

describe("Global Store Reactions", () => {
    it("should update DOM when store property changes", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span id="theme" :text="$appStore.theme">light</span>
            </div>
        `;

        CuboMX.component("myComp", {});
        CuboMX.store("appStore", { theme: null });
        CuboMX.start();

        CuboMX.appStore.theme = "dark";
        expect(document.querySelector("#theme")?.textContent).toBe("dark");
    });

    it("should work with multiple components bound to same store", () => {
        document.body.innerHTML = `
            <div mx-data="comp1">
                <span id="count1" :text="$counter.value">0</span>
            </div>
            <div mx-data="comp2">
                <span id="count2" :text="$counter.value">0</span>
            </div>
        `;

        CuboMX.component("comp1", {});
        CuboMX.component("comp2", {});
        CuboMX.store("counter", { value: 0 });
        CuboMX.start();

        CuboMX.counter.value = 99;
        expect(document.querySelector("#count1")?.textContent).toBe("99");
        expect(document.querySelector("#count2")?.textContent).toBe("99");
    });
});

describe("Class Reactions (:class)", () => {
    it("should update classes from array", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="initial old"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: [] });
        CuboMX.start();

        CuboMX.myComp.boxClasses = ["btn", "primary"];
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("btn primary");
    });

    it("should update classes from string", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class=""></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: "" });
        CuboMX.start();

        CuboMX.myComp.boxClasses = "btn primary active";
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("btn primary active");
    });

    it("should replace all classes (not merge)", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="old existing"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: [] });
        CuboMX.start();

        CuboMX.myComp.boxClasses = ["new"];
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("new");
        expect(boxEl?.classList.contains("old")).toBe(false);
        expect(boxEl?.classList.contains("existing")).toBe(false);
    });

    it("should filter out falsy values in array", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class=""></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: [] });
        CuboMX.start();

        CuboMX.myComp.boxClasses = [
            "btn",
            null,
            "primary",
            undefined,
            "",
            "active",
        ];
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("btn primary active");
    });

    it("should clear classes when set to empty array", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="btn primary"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: [] });
        CuboMX.start();

        CuboMX.myComp.boxClasses = [];
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("");
    });

    it("should clear classes when set to empty string", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="btn primary"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: "" });
        CuboMX.start();

        CuboMX.myComp.boxClasses = "";
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("");
    });
});

describe("ClassList Methods", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should add classes using .add() method", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="btn"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: ["btn"] });
        CuboMX.start();

        CuboMX.myComp.boxClasses.add("active");

        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("btn active");
        expect(CuboMX.myComp.boxClasses.contains("active")).toBe(true);
    });

    it("should remove classes using .remove() method", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="btn active"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: ["btn", "active"] });
        CuboMX.start();

        CuboMX.myComp.boxClasses.remove("active");

        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("btn");
    });

    it("should toggle class with .toggle()", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="btn"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: ["btn"] });
        CuboMX.start();

        const result = CuboMX.myComp.boxClasses.toggle("active");

        expect(result).toBe(true);
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("btn active");
    });

    it("should check if class exists with .contains()", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="btn active"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: ["btn", "active"] });
        CuboMX.start();

        expect(CuboMX.myComp.boxClasses.contains("active")).toBe(true);
        expect(CuboMX.myComp.boxClasses.contains("primary")).toBe(false);
    });

    it("should replace class with .replace()", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box" :class="boxClasses" class="btn active"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: ["btn", "active"] });
        CuboMX.start();

        const result = CuboMX.myComp.boxClasses.replace("active", "disabled");

        expect(result).toBe(true);
        const boxEl = document.querySelector("#box");
        expect(boxEl?.className).toBe("btn disabled");
    });

    it("should update all elements with same class binding", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="box1" :class="boxClasses" class="btn"></div>
                <div id="box2" :class="boxClasses" class="btn"></div>
            </div>
        `;

        CuboMX.component("myComp", { boxClasses: ["btn"] });
        CuboMX.start();

        CuboMX.myComp.boxClasses.add("active");

        const box1El = document.querySelector("#box1");
        const box2El = document.querySelector("#box2");
        expect(box1El?.className).toBe("btn active");
        expect(box2El?.className).toBe("btn active");
    });
});

describe("ClassList Methods with mx-item", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should add classes to specific item using .add()", () => {
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name" ::class="classes" class="item"></li>
                </ul>
            </div>
        `;

        CuboMX.component("listComp", { items: [] });
        CuboMX.start();

        CuboMX.listComp.items.add({ name: "Item 1", classes: ["item"] });
        CuboMX.listComp.items.add({ name: "Item 2", classes: ["item"] });

        // Act - adicionar classe apenas no primeiro item
        CuboMX.listComp.items[0].classes.add("active");

        // Assert
        const list = document.querySelector("#list");
        expect(list?.children[0].className).toBe("item active");
        expect(list?.children[1].className).toBe("item");
    });

    it("should toggle classes independently for each item", () => {
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name" ::class="classes" class="item"></li>
                </ul>
            </div>
        `;

        CuboMX.component("listComp", { items: [] });
        CuboMX.start();

        CuboMX.listComp.items.add({ name: "Item 1", classes: ["item"] });
        CuboMX.listComp.items.add({ name: "Item 2", classes: ["item"] });
        CuboMX.listComp.items.add({ name: "Item 3", classes: ["item"] });

        // Act
        CuboMX.listComp.items[0].classes.toggle("active");
        CuboMX.listComp.items[2].classes.toggle("active");

        // Assert
        const list = document.querySelector("#list");
        expect(list?.children[0].className).toBe("item active");
        expect(list?.children[1].className).toBe("item");
        expect(list?.children[2].className).toBe("item active");
    });

    it("should remove classes from specific item", () => {
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name" ::class="classes" class="item active"></li>
                </ul>
            </div>
        `;

        CuboMX.component("listComp", { items: [] });
        CuboMX.start();

        CuboMX.listComp.items.add({
            name: "Item 1",
            classes: ["item", "active"],
        });
        CuboMX.listComp.items.add({
            name: "Item 2",
            classes: ["item", "active"],
        });

        // Act
        CuboMX.listComp.items[1].classes.remove("active");

        // Assert
        const list = document.querySelector("#list");
        expect(list?.children[0].className).toBe("item active");
        expect(list?.children[1].className).toBe("item");
    });

    it("should check .contains() on item classes", () => {
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name" ::class="classes" class="item">Item 1</li>
                </ul>
            </div>
        `;

        CuboMX.component("listComp", { items: [] });
        CuboMX.start();

        CuboMX.listComp.items.add({
            name: "Item 2",
            classes: ["item", "active"],
        });
        CuboMX.listComp.items.add({ name: "Item 3", classes: ["item"] });

        // Assert
        expect(CuboMX.listComp.items[0].classes.contains("active")).toBe(false);
        expect(CuboMX.listComp.items[1].classes.contains("active")).toBe(true);
        expect(CuboMX.listComp.items[2].classes.contains("active")).toBe(false);
    });

    it("should replace classes on item", () => {
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name" ::class="classes" class="item active"></li>
                </ul>
            </div>
        `;

        CuboMX.component("listComp", { items: [] });
        CuboMX.start();

        CuboMX.listComp.items.add({
            name: "Item 1",
            classes: ["item", "active"],
        });

        // Act
        const result = CuboMX.listComp.items[0].classes.replace(
            "active",
            "disabled"
        );

        // Assert
        expect(result).toBe(true);
        const list = document.querySelector("#list");
        expect(list?.children[0].className).toBe("item disabled");
    });

    it("should maintain independent ClassLists when adding multiple items", () => {
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name" ::class="classes" class="item">Item 1</li>
                </ul>
            </div>
        `;

        CuboMX.component("listComp", { items: [] });
        CuboMX.start();

        CuboMX.listComp.items.add({ name: "Item 2", classes: ["item", "red"] });
        CuboMX.listComp.items.add({
            name: "Item 3",
            classes: ["item", "blue"],
        });
        CuboMX.listComp.items.add({
            name: "Item 4",
            classes: ["item", "green"],
        });

        // Act - modificar apenas o item do meio
        CuboMX.listComp.items[1].classes.add("active");
        CuboMX.listComp.items[1].classes.remove("red");

        // Assert
        const list = document.querySelector("#list");
        expect(list?.children[0].className).toBe("item");
        expect(list?.children[1].className).toBe("item active");
        expect(list?.children[2].className).toBe("item blue");
        expect(list?.children[3].className).toBe("item green");
    });

    it("should toggle classes on dynamically added items", () => {
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name" ::class="classes" class="item"></li>
                </ul>
            </div>
        `;

        CuboMX.component("listComp", { items: [] });
        CuboMX.start();

        // Clear template
        CuboMX.listComp.items.clear();

        // Add items
        CuboMX.listComp.items.add({ name: "Item 1", classes: ["item"] });
        CuboMX.listComp.items.add({ name: "Item 2", classes: ["item"] });
        CuboMX.listComp.items.add({ name: "Item 3", classes: ["item"] });

        const list = document.querySelector("#list");

        // Act - toggle on first item
        let result1 = CuboMX.listComp.items[0].classes.toggle("active");
        expect(result1).toBe(true);
        expect(list?.children[0].className).toBe("item active");
        expect(CuboMX.listComp.items[0].classes.contains("active")).toBe(true);

        // Toggle off
        let result2 = CuboMX.listComp.items[0].classes.toggle("active");
        expect(result2).toBe(false);
        expect(list?.children[0].className).toBe("item");
        expect(CuboMX.listComp.items[0].classes.contains("active")).toBe(false);

        // Toggle on multiple items
        CuboMX.listComp.items[0].classes.toggle("selected");
        CuboMX.listComp.items[2].classes.toggle("selected");

        // Assert
        expect(list?.children[0].className).toBe("item selected");
        expect(list?.children[1].className).toBe("item");
        expect(list?.children[2].className).toBe("item selected");
    });
});

describe("Edge Cases", () => {
    it("should not trigger reactions during hydration", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span id="counter" :text="count">42</span>
            </div>
        `;

        CuboMX.component("myComp", { count: 999 });
        CuboMX.start();

        // Durante hidratação, o HTML (42) deve sobrescrever o componente (999)
        expect(document.querySelector("#counter")?.textContent).toBe("42");
        expect(CuboMX.myComp.count).toBe(42);
    });

    it("should handle rapid successive updates", () => {
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span id="value" :text="num">0</span>
            </div>
        `;

        CuboMX.component("myComp", { num: 0 });
        CuboMX.start();

        CuboMX.myComp.num = 1;
        CuboMX.myComp.num = 2;
        CuboMX.myComp.num = 3;

        expect(document.querySelector("#value")?.textContent).toBe("3");
    });
});

describe("Array Reactions (add/push)", () => {
    beforeEach(() => {
        // O HTML agora contém o estado inicial
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="item-list">
                    <li mx-item="items">
                        <span ::text="name">Initial Item</span>
                    </li>
                </ul>
            </div>
        `;

        // O componente é inicializado com array vazio
        CuboMX.component("listComp", {
            items: [],
        });
    });

    it("should add a new element to the DOM when .add() is called", () => {
        CuboMX.start();

        // Verifica o estado após a hidratação
        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(1);
        expect(list?.firstElementChild?.textContent?.trim()).toBe(
            "Initial Item"
        );
        expect(CuboMX.listComp.items.length).toBe(1);
        expect(CuboMX.listComp.items[0].name).toBe("Initial Item");

        // Act
        CuboMX.listComp.items.add({ name: "Second Item" });

        // Assert
        expect(list?.children.length).toBe(2);
        expect(list?.lastElementChild?.textContent?.trim()).toBe("Second Item");
        expect(CuboMX.listComp.items.length).toBe(2);
        expect(CuboMX.listComp.items[1].name).toBe("Second Item");
    });

    it("should add a new element to the DOM when .push() is called", () => {
        CuboMX.start();

        // Verifica o estado após a hidratação
        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(1);
        expect(CuboMX.listComp.items.length).toBe(1);

        // Act
        CuboMX.listComp.items.push({ name: "Pushed Item" });

        // Assert
        expect(list?.children.length).toBe(2);
        expect(list?.lastElementChild?.textContent?.trim()).toBe("Pushed Item");
        expect(CuboMX.listComp.items.length).toBe(2);
        expect(CuboMX.listComp.items[1].name).toBe("Pushed Item");
    });

    it("should add a new element at the beginning when .prepend() is called", () => {
        CuboMX.start();

        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(1);

        // Act
        CuboMX.listComp.items.prepend({ name: "First Item" });

        // Assert - Deve ser o primeiro elemento
        expect(list?.children.length).toBe(2);
        expect(list?.firstElementChild?.textContent?.trim()).toBe("First Item");
        expect(CuboMX.listComp.items.length).toBe(2);
        expect(CuboMX.listComp.items[0].name).toBe("First Item");
        expect(CuboMX.listComp.items[1].name).toBe("Initial Item");
    });

    it("should add a new element at the beginning when .unshift() is called", () => {
        CuboMX.start();

        const list = document.querySelector("#item-list");

        // Act
        CuboMX.listComp.items.unshift({ name: "Unshifted Item" });

        // Assert
        expect(list?.children.length).toBe(2);
        expect(list?.firstElementChild?.textContent?.trim()).toBe(
            "Unshifted Item"
        );
        expect(CuboMX.listComp.items[0].name).toBe("Unshifted Item");
    });

    it("should remove an element from the DOM when .delete() is called", () => {
        CuboMX.start();

        // Adicionar mais itens primeiro
        CuboMX.listComp.items.add({ name: "Second Item" });
        CuboMX.listComp.items.add({ name: "Third Item" });

        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(3);

        // Act - Remover o item do meio (índice 1)
        CuboMX.listComp.items.delete(1);

        // Assert
        expect(list?.children.length).toBe(2);
        expect(CuboMX.listComp.items.length).toBe(2);
        expect(CuboMX.listComp.items[0].name).toBe("Initial Item");
        expect(CuboMX.listComp.items[1].name).toBe("Third Item");

        // Verificar que "Second Item" não está mais no DOM
        const allText = list?.textContent?.trim();
        expect(allText).not.toContain("Second Item");
    });

    it("should handle delete with invalid index gracefully", () => {
        CuboMX.start();

        const list = document.querySelector("#item-list");
        const initialLength = list?.children.length;

        // Act - Tentar remover índice inválido
        CuboMX.listComp.items.delete(999);
        CuboMX.listComp.items.delete(-1);

        // Assert - Nada deve mudar
        expect(list?.children.length).toBe(initialLength);
        expect(CuboMX.listComp.items.length).toBe(1);
    });

    it("should remove last element from DOM when .pop() is called", () => {
        CuboMX.start();

        // Adicionar mais itens
        CuboMX.listComp.items.add({ name: "Second Item" });
        CuboMX.listComp.items.add({ name: "Third Item" });

        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(3);

        // Act
        CuboMX.listComp.items.pop();

        // Assert
        expect(list?.children.length).toBe(2);
        expect(CuboMX.listComp.items.length).toBe(2);
        expect(CuboMX.listComp.items[0].name).toBe("Initial Item");
        expect(CuboMX.listComp.items[1].name).toBe("Second Item");

        // Verificar que "Third Item" não está mais no DOM
        const allText = list?.textContent?.trim();
        expect(allText).not.toContain("Third Item");
    });

    it("should remove first element from DOM when .shift() is called", () => {
        CuboMX.start();

        // Adicionar mais itens
        CuboMX.listComp.items.add({ name: "Second Item" });
        CuboMX.listComp.items.add({ name: "Third Item" });

        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(3);

        // Act
        CuboMX.listComp.items.shift();

        // Assert
        expect(list?.children.length).toBe(2);
        expect(CuboMX.listComp.items.length).toBe(2);
        expect(CuboMX.listComp.items[0].name).toBe("Second Item");
        expect(CuboMX.listComp.items[1].name).toBe("Third Item");

        // Verificar que "Initial Item" não está mais no DOM
        const allText = list?.textContent?.trim();
        expect(allText).not.toContain("Initial Item");
    });

    it("should handle pop and shift on empty array gracefully", () => {
        CuboMX.start();

        const list = document.querySelector("#item-list");

        // Clear array
        CuboMX.listComp.items.clear();
        expect(list?.children.length).toBe(0);

        // Act - Tentar pop e shift em array vazio
        CuboMX.listComp.items.pop();
        CuboMX.listComp.items.shift();

        // Assert - Nada deve mudar
        expect(list?.children.length).toBe(0);
        expect(CuboMX.listComp.items.length).toBe(0);
    });

    it("should remove all items from DOM when .clear() is called", () => {
        CuboMX.start();

        // Adicionar mais itens
        CuboMX.listComp.items.add({ name: "Second Item" });
        CuboMX.listComp.items.add({ name: "Third Item" });

        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(3);

        // Act
        CuboMX.listComp.items.clear();

        // Assert
        expect(list?.children.length).toBe(0);
        expect(CuboMX.listComp.items.length).toBe(0);
    });

    it("should allow adding items after clear() using saved template", () => {
        CuboMX.start();

        const list = document.querySelector("#item-list");

        // Clear todos os items
        CuboMX.listComp.items.clear();
        expect(list?.children.length).toBe(0);
        expect(CuboMX.listComp.items.length).toBe(0);

        // Act - Adicionar novo item (deve usar template salvo)
        CuboMX.listComp.items.add({ name: "New Item After Clear" });

        // Assert
        expect(list?.children.length).toBe(1);
        expect(list?.firstElementChild?.textContent?.trim()).toBe(
            "New Item After Clear"
        );
        expect(CuboMX.listComp.items.length).toBe(1);
        expect(CuboMX.listComp.items[0].name).toBe("New Item After Clear");
    });

    it("should replace an item at specific index", () => {
        CuboMX.start();

        // Adicionar mais itens
        CuboMX.listComp.items.add({ name: "Second Item" });
        CuboMX.listComp.items.add({ name: "Third Item" });

        const list = document.querySelector("#item-list");
        expect(list?.children.length).toBe(3);

        // Act - Substituir o item do meio
        CuboMX.listComp.items.replace(1, { name: "Replaced Item" });

        // Assert
        expect(list?.children.length).toBe(3);
        expect(CuboMX.listComp.items.length).toBe(3);
        expect(CuboMX.listComp.items[0].name).toBe("Initial Item");
        expect(CuboMX.listComp.items[1].name).toBe("Replaced Item");
        expect(CuboMX.listComp.items[2].name).toBe("Third Item");

        // Verificar DOM
        const names = list?.querySelectorAll("span");
        expect(names?.[0].textContent).toBe("Initial Item");
        expect(names?.[1].textContent).toBe("Replaced Item");
        expect(names?.[2].textContent).toBe("Third Item");
    });
});
