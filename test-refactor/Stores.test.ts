import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX } from "../src-refactor/cubomx";

describe("Stores", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div">
                <ul id="list">
                    <li mx-item="items" ::text="name">Item 1</li>
                    <li mx-item="items" ::text="name">Item 2</li>
                    <li mx-item="items" ::text="name">Item 3</li>
                    <li mx-item="items" ::text="name">Item 4</li>
                    <li mx-item="items" ::text="name">Item 5</li>
                </ul>
            </div>
        `;
    });

    afterEach(() => {});

    it("should create store with literals", () => {
        const theme = {
            mode: "dark"
        };

        CuboMX.store("theme", theme);
        CuboMX.start()
    });

    it("should create store with class", () => {
        class Theme {
            mode!: string
        }
        const theme = new Theme()
        CuboMX.store("theme", theme);
        CuboMX.start()
    });
});