import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Directive Evaluation", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it("should initialize and reactively update mx-show", () => {
        CuboMX.component("modal", { isOpen: false });

        document.body.innerHTML = `
            <div mx-data="modal">
                <div mx-show="modal.isOpen" style="display: block;">Modal Content</div>
            </div>
        `;

        CuboMX.start();

        const modalContent = document.querySelector("div[mx-show]");

        // 1. Verifica se o elemento está escondido inicialmente (display: none)
        expect(modalContent.style.display).toBe("none");

        // 2. Muda o estado para exibir o elemento
        CuboMX.modal.isOpen = true;

        // 3. Verifica se o elemento voltou a ter seu display original
        expect(modalContent.style.display).toBe("block");

        // 4. Muda o estado para esconder novamente
        CuboMX.modal.isOpen = false;

        // 5. Verifica se foi escondido de novo
        expect(modalContent.style.display).toBe("none");
    });

    it("should correctly toggle visibility for elements with display: flex", () => {
        CuboMX.component("container", { isVisible: false });

        document.body.innerHTML = `
            <div mx-data="container">
                <div mx-show="container.isVisible" style="display: flex;">Flex Content</div>
            </div>
        `;

        CuboMX.start();

        const flexContent = document.querySelector("div[mx-show]");

        // 1. Initial state: should be hidden
        expect(flexContent.style.display).toBe("none");

        // 2. Change state to visible
        CuboMX.container.isVisible = true;

        // 3. Check if it's now display: flex
        expect(flexContent.style.display).toBe("flex");

        // 4. Change state to hidden again
        CuboMX.container.isVisible = false;

        // 5. Check if it's hidden again
        expect(flexContent.style.display).toBe("none");
    });

    it("should handle mx-on:click events", () => {
        const clickHandler = vi.fn();
        CuboMX.component("buttonComp", { handleClick: clickHandler });
        document.body.innerHTML = `
            <div mx-data="buttonComp">
                <button mx-on:click="buttonComp.handleClick()"></button>
            </div>
        `;
        CuboMX.start();
        const button = document.querySelector("button");

        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it("should expose $el and $event to mx-on expressions", () => {
        let receivedEl = null;
        let receivedEvent = null;
        CuboMX.component("buttonComp", {
            handleClick(el, evt) {
                receivedEl = el;
                receivedEvent = evt;
            },
        });
        document.body.innerHTML = `
            <div mx-data="buttonComp">
                <button mx-on:click="buttonComp.handleClick($el, $event)"></button>
            </div>
        `;
        CuboMX.start();
        const button = document.querySelector("button");

        button.click();
        expect(receivedEl).toBe(button);
        expect(receivedEvent).toBeInstanceOf(Event);
    });

    it("should handle the .prevent modifier", () => {
        CuboMX.component("formComp", {});
        document.body.innerHTML = `
            <form mx-data="formComp" mx-on:submit.prevent="() => {}">
                <button type="submit"></button>
            </form>
        `;
        CuboMX.start();
        const form = document.querySelector("form");
        const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
        });

        form.dispatchEvent(submitEvent);

        expect(submitEvent.defaultPrevented).toBe(true);
    });
});
