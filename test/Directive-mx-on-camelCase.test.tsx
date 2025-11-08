import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/cubomx";

describe("mx-on - camelCase modifiers (JSX-friendly)", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should parse clickPrevent and call preventDefault", async () => {
        const handleSubmit = vi.fn();

        CuboMX.component("form", {
            handleSubmit,
        });

        // Using camelCase: clickPrevent instead of click.prevent
        document.body.innerHTML = `
            <form mx-data="form">
                <button mx-on:clickPrevent="handleSubmit()">Submit</button>
            </form>
        `;

        CuboMX.start();

        const button = document.querySelector("button") as HTMLButtonElement;
        const event = new MouseEvent("click", { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        button.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(handleSubmit).toHaveBeenCalled();
    });

    it("should parse submitPrevent and call preventDefault on form", async () => {
        const save = vi.fn();

        CuboMX.component("myForm", {
            save,
        });

        document.body.innerHTML = `
            <form mx-data="myForm" mx-on:submitPrevent="save()">
                <input type="text" />
                <button type="submit">Save</button>
            </form>
        `;

        CuboMX.start();

        const form = document.querySelector("form") as HTMLFormElement;
        const event = new Event("submit", { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        form.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
    });

    it("should parse clickStop and call stopPropagation", async () => {
        const outerClick = vi.fn();
        const innerClick = vi.fn();

        CuboMX.component("nested", {
            outerClick,
            innerClick,
        });

        document.body.innerHTML = `
            <div mx-data="nested" mx-on:click="outerClick()">
                <button mx-on:clickStop="innerClick()">Inner Button</button>
            </div>
        `;

        CuboMX.start();

        const button = document.querySelector("button") as HTMLButtonElement;
        const event = new MouseEvent("click", { bubbles: true, cancelable: true });
        const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

        button.dispatchEvent(event);

        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(innerClick).toHaveBeenCalled();
        expect(outerClick).not.toHaveBeenCalled(); // Should not bubble up
    });

    it("should parse clickOutside correctly", async () => {
        const close = vi.fn();

        CuboMX.component("dropdown", {
            isOpen: true,
            close,
        });

        document.body.innerHTML = `
            <div mx-data="dropdown">
                <div id="dropdown-content" mx-on:clickOutside="close()">
                    Dropdown content
                </div>
            </div>
            <div id="outside">Outside element</div>
        `;

        CuboMX.start();

        const outside = document.getElementById("outside") as HTMLElement;
        const dropdownContent = document.getElementById(
            "dropdown-content"
        ) as HTMLElement;

        // Click inside - should NOT trigger
        dropdownContent.click();
        expect(close).not.toHaveBeenCalled();

        // Click outside - should trigger
        outside.click();
        expect(close).toHaveBeenCalled();
    });

    it("should work with regular events without modifiers", async () => {
        const handleClick = vi.fn();

        CuboMX.component("button", {
            handleClick,
        });

        document.body.innerHTML = `
            <div mx-data="button">
                <button mx-on:click="handleClick()">Click me</button>
            </div>
        `;

        CuboMX.start();

        const button = document.querySelector("button") as HTMLButtonElement;
        button.click();

        expect(handleClick).toHaveBeenCalled();
    });

    it("should maintain backward compatibility with dot notation", async () => {
        const handleSubmit = vi.fn();

        CuboMX.component("form", {
            handleSubmit,
        });

        // Old syntax with dot should still work
        document.body.innerHTML = `
            <form mx-data="form" mx-on:submit.prevent="handleSubmit()">
                <button type="submit">Submit</button>
            </form>
        `;

        CuboMX.start();

        const form = document.querySelector("form") as HTMLFormElement;
        const event = new Event("submit", { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        form.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(handleSubmit).toHaveBeenCalled();
    });

    it("should work with both @ shorthand and mx-on: prefix", async () => {
        const handler = vi.fn();

        CuboMX.component("comp", {
            handler,
        });

        document.body.innerHTML = `
            <div mx-data="comp">
                <button id="btn1" mx-on:clickPrevent="handler()">Button 1</button>
                <button id="btn2" @clickPrevent="handler()">Button 2</button>
            </div>
        `;

        CuboMX.start();

        const btn1 = document.getElementById("btn1") as HTMLButtonElement;
        const btn2 = document.getElementById("btn2") as HTMLButtonElement;

        const event1 = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });
        const event2 = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });

        const spy1 = vi.spyOn(event1, "preventDefault");
        const spy2 = vi.spyOn(event2, "preventDefault");

        btn1.dispatchEvent(event1);
        btn2.dispatchEvent(event2);

        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
        expect(handler).toHaveBeenCalledTimes(2);
    });
});

describe("mx-on - camelCase in JSX components", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should work with JSX components using camelCase modifiers", async () => {
        const save = vi.fn();

        CuboMX.component("form", {
            save,
        });

        // Important: Start CuboMX before swap to activate MutationObserver
        CuboMX.start();

        // Simulate JSX rendering
        const jsxHtml = `
            <div mx-data="form">
                <form mx-on:submitPrevent="save()">
                    <input type="text" />
                    <button type="submit">Save</button>
                </form>
            </div>
        `;

        await CuboMX.swap(jsxHtml, [{ target: "body:innerHTML" }]);

        const form = document.querySelector("form") as HTMLFormElement;
        const event = new Event("submit", { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        form.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
    });

    it("should work with nested JSX components and stopPropagation", async () => {
        const outerClick = vi.fn();
        const innerClick = vi.fn();

        CuboMX.component("nested", {
            outerClick,
            innerClick,
        });

        CuboMX.start();

        const jsxHtml = `
            <div mx-data="nested" mx-on:click="outerClick()">
                <div mx-on:clickStop="innerClick()">
                    Inner div
                </div>
            </div>
        `;

        await CuboMX.swap(jsxHtml, [{ target: "body:innerHTML" }]);

        const innerDiv = document.querySelector("div > div") as HTMLElement;
        const event = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });
        const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

        innerDiv.dispatchEvent(event);

        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(innerClick).toHaveBeenCalled();
        expect(outerClick).not.toHaveBeenCalled();
    });

    it("should handle clickOutside in JSX dropdowns", async () => {
        const close = vi.fn();
        const open = vi.fn();

        CuboMX.component("dropdown", {
            isOpen: false,
            close,
            open,
        });

        CuboMX.start();

        const jsxHtml = `
            <div>
                <div mx-data="dropdown">
                    <button mx-on:click="open()">Open</button>
                    <div id="menu" mx-on:clickOutside="close()">
                        Menu content
                    </div>
                </div>
                <div id="outside">Outside</div>
            </div>
        `;

        await CuboMX.swap(jsxHtml, [{ target: "body:innerHTML" }]);

        const menu = document.getElementById("menu") as HTMLElement;
        const outside = document.getElementById("outside") as HTMLElement;

        // Click inside menu - should not trigger close
        menu.click();
        expect(close).not.toHaveBeenCalled();

        // Click outside - should trigger close
        outside.click();
        expect(close).toHaveBeenCalled();
    });

    it("should support mixed dot notation and camelCase in same component", async () => {
        const handleDotNotation = vi.fn();
        const handleCamelCase = vi.fn();

        CuboMX.component("mixed", {
            handleDotNotation,
            handleCamelCase,
        });

        document.body.innerHTML = `
            <div mx-data="mixed">
                <button id="old" mx-on:click.prevent="handleDotNotation()">Old syntax</button>
                <button id="new" mx-on:clickPrevent="handleCamelCase()">New syntax</button>
            </div>
        `;

        CuboMX.start();

        const oldBtn = document.getElementById("old") as HTMLButtonElement;
        const newBtn = document.getElementById("new") as HTMLButtonElement;

        const event1 = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });
        const event2 = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });

        const spy1 = vi.spyOn(event1, "preventDefault");
        const spy2 = vi.spyOn(event2, "preventDefault");

        oldBtn.dispatchEvent(event1);
        newBtn.dispatchEvent(event2);

        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
        expect(handleDotNotation).toHaveBeenCalled();
        expect(handleCamelCase).toHaveBeenCalled();
    });
});
