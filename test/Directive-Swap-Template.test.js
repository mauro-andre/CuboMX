import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive: mx-swap-template", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should trigger on click by default', async () => {
        const swapTemplateSpy = vi.spyOn(CuboMX, 'swapTemplate');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template">Swapped Content</template>
            <button mx-swap-template="my-template" mx-target="#container">Click Me</button>
        `;
        CuboMX.start();

        const button = document.querySelector('button');
        button.click();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(swapTemplateSpy).toHaveBeenCalledOnce();
        expect(swapTemplateSpy).toHaveBeenCalledWith('my-template', { target: '#container' });
    });

    it('should trigger on a custom event specified by mx-trigger', async () => {
        const swapTemplateSpy = vi.spyOn(CuboMX, 'swapTemplate');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template">Swapped Content</template>
            <div mx-swap-template="my-template" mx-target="#container" mx-trigger="mouseenter">Hover Me</div>
        `;
        CuboMX.start();

        const div = document.querySelector('div[mx-swap-template]');
        
        // A click should do nothing
        div.click();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(swapTemplateSpy).not.toHaveBeenCalled();

        // A mouseenter should trigger the swap
        div.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(swapTemplateSpy).toHaveBeenCalledOnce();
        expect(swapTemplateSpy).toHaveBeenCalledWith('my-template', { target: '#container' });
    });

    it('should prevent default action of the event', async () => {
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template">Swapped Content</template>
            <a href="#foo" mx-swap-template="my-template" mx-target="#container">Click Me</a>
        `;
        CuboMX.start();

        const link = document.querySelector('a');
        
        let defaultPrevented = false;
        const clickHandler = (e) => {
            defaultPrevented = e.defaultPrevented;
        };
        window.addEventListener('click', clickHandler, { once: true });

        link.click();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(defaultPrevented).toBe(true);
        expect(window.location.hash).not.toBe('#foo');
    });

    it('should log an error and do nothing if mx-target is missing', async () => {
        const swapTemplateSpy = vi.spyOn(CuboMX, 'swapTemplate');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        document.body.innerHTML = `
            <button mx-swap-template="my-template">Click Me</button>
        `;
        CuboMX.start();

        const button = document.querySelector('button');
        button.click();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(swapTemplateSpy).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[CuboMX] The mx-target attribute is required for mx-swap-template."));

        consoleSpy.mockRestore();
    });
});
