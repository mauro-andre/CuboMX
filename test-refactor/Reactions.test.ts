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

