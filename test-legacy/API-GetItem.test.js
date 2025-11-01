import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX.getItem() API", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    const setupComponent = () => {
        CuboMX.component("myComp", { items: [] });
        document.body.innerHTML = `
            <div mx-data="myComp" id="comp-root">
                <ul id="list">
                    <li mx-item="items" ::text="name">Item 1</li>
                    <li mx-item="items" ::text="name">Item 2</li>
                </ul>
            </div>
        `;
        CuboMX.start();
    };

    it("should return the correct item proxy for a given mx-item element", () => {
        setupComponent();
        const secondLi = document.querySelector("#list > li:nth-child(2)");

        const item = CuboMX.getItem(secondLi);

        expect(item).not.toBeNull();
        expect(item.name).toBe("Item 2");

        // Verify it's the same instance as the one in the state array
        const itemFromState = CuboMX.myComp.items[1];
        expect(item).toBe(itemFromState);
    });

    it("should return null for an element that is not an mx-item", () => {
        setupComponent();
        const listElement = document.getElementById("list");
        const item = CuboMX.getItem(listElement);
        expect(item).toBeNull();
    });

    it("should return null for an element that is a parent of an mx-item", () => {
        setupComponent();
        const componentRoot = document.getElementById("comp-root");
        const item = CuboMX.getItem(componentRoot);
        expect(item).toBeNull();
    });

    it("should return null for a null or undefined element", () => {
        setupComponent();
        expect(CuboMX.getItem(null)).toBeNull();
        expect(CuboMX.getItem(undefined)).toBeNull();
    });
});
