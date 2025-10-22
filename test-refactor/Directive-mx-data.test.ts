import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX, MxElement } from "../src-refactor/cubomx";

describe("Directive mx-data", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name">Item 1</li>
                    <li mx-item="items" ::text="name">Item 2</li>
                    <li mx-item="items" ::text="name">Item 3</li>
                    <li mx-item="items" ::text="name">Item 4</li>
                    <li mx-item="items" ::text="name">Item 5</li>
                </ul>
            </div>
        `;
        console.log("RESETEI")
    });

    afterEach(() => {});

    it("should create components with literals", () => {
        const listComp = {
            list: null
        };

        CuboMX.component("listComp", listComp);
        CuboMX.start()
    });

    it("should create components with class", () => {
        class ListComp {
            list!: Array<string>
        }
        const listComp = new ListComp()
        CuboMX.component("ListComp", listComp);
        CuboMX.start()
        const el = document.querySelector('#list')
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = '<li mx-item="items" ::text="name">Item 6</li>';
        const newItem = tempDiv.firstElementChild
        if (newItem) {
            // (newItem as MxElement).__doNotProcessNode__ = true
            el?.appendChild(newItem)
        }
    });
});
