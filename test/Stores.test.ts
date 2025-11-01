import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX, MxComponent } from "../src/cubomx";

describe("Stores", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div>
                <ul id="list">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                    <li>Item 4</li>
                    <li>Item 5</li>
                </ul>
            </div>
        `;
    });

    afterEach(() => {});

    it("should create store with literals", () => {
        const theme = {
            mode: "dark",
        };

        CuboMX.store("theme", theme);
        CuboMX.start();

        // Store should be globally accessible
        expect(CuboMX.theme).toBeDefined();
        expect(CuboMX.theme.mode).toBe("dark");

        // Store should NOT have $el (no DOM element)
        expect(CuboMX.theme.$el).toBeNull();

        // Store should be reactive
        CuboMX.theme.mode = "light";
        expect(CuboMX.theme.mode).toBe("light");
    });

    it("should create store with class", () => {
        class Theme extends MxComponent {
            mode: string = "dark";
        }
        const theme = new Theme();
        CuboMX.store("theme", theme);
        CuboMX.start();

        // Store should be globally accessible
        expect(CuboMX.theme).toBeDefined();
        expect(CuboMX.theme.mode).toBe("dark");

        // Store should NOT have $el (no DOM element)
        expect(CuboMX.theme.$el).toBeNull();

        // Should be reactive
        CuboMX.theme.anotherProp = "test";
        expect(CuboMX.theme.anotherProp).toBe("test");
    });
});
