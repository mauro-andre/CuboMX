import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX, MxElement } from "../src-refactor/cubomx";

describe("Directive mx-data singletons", () => {
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
    });

    afterEach(() => {});

    it("should create singleton with literals", () => {
        const listComp = {
            list: null
        };

        CuboMX.component("listComp", listComp);
        CuboMX.start()
    });

    it("should create singleton with class", () => {
        class ListComp {
            list!: Array<string>
        }
        const listComp = new ListComp()
        CuboMX.component("listComp", listComp);
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

describe("Directive mx-data factory", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="listComp()">
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

    it("should create factory with literals", () => {
        const listComp = () => ({
            list: null
        });

        CuboMX.component("listComp", listComp);
        CuboMX.start()
    });

    it("should create factory with class", () => {
        class ListComp {
            list!: Array<string>
        }
        const listComp = () => new ListComp()
        CuboMX.component("listComp", listComp);
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

describe("Directive mx-data factory with mx-ref", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="listComp()" mx-ref="listCompRef1">
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

    it("should create factory with mx-ref with literals", () => {
        const listComp = () => ({
            list: null
        });

        CuboMX.component("listComp", listComp);
        CuboMX.start()
    });

    it("should create factory with mx-ref with class", () => {
        class ListComp {
            list!: Array<string>
        }
        const listComp = () => new ListComp()
        CuboMX.component("listComp", listComp);
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
