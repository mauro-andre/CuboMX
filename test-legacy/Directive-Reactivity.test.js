import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive Reactivity Integration", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it('should re-bind mx-on listeners in content inserted by :html', async () => {
        const methodWasCalled = vi.fn(); // Define spy outside
        const componentLogic = {
            htmlContent: `<button mx-on:click="methodWasCalled()">Click Me</button>`,
            methodWasCalled: methodWasCalled // Assign it here
        };
        CuboMX.component('myComp', componentLogic);

        document.body.innerHTML = `
            <div mx-data="myComp" :html="htmlContent">
                <p>Initial content that will be replaced.</p>
            </div>
        `;

        CuboMX.start();

        // Wait for the MutationObserver and bindings to process
        await new Promise(resolve => setTimeout(resolve, 0));

        const button = document.querySelector('button');
        expect(button).not.toBeNull();

        button.click();

        // Assert on the original spy reference
        expect(methodWasCalled).toHaveBeenCalled();
    });
});
