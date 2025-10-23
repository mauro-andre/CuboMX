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
            list: null,
        };

        CuboMX.component("listComp", listComp);
        CuboMX.start();

        // Should be accessible globally
        expect(CuboMX.listComp).toBeDefined();

        // Should have component property
        expect(CuboMX.listComp.list).toBe(null);

        // Should have $el magic property
        expect(CuboMX.listComp.$el).toBeInstanceOf(HTMLElement);
        expect(CuboMX.listComp.$el.getAttribute("mx-data")).toBe("listComp");

        // Element should have the proxy attached
        const el = document.querySelector('[mx-data="listComp"]') as any;
        expect(el.__mxProxy__).toBeDefined();
        expect(el.__mxProxy__).toBe(CuboMX.listComp);
    });

    it("should create singleton with class", () => {
        class ListComp {
            list: Array<string> = [];
        }
        const listComp = new ListComp();
        CuboMX.component("listComp", listComp);
        CuboMX.start();

        // Should be accessible globally
        expect(CuboMX.listComp).toBeDefined();

        // Should have class property
        expect(CuboMX.listComp.list).toEqual([]);

        // Should have $el magic property
        expect(CuboMX.listComp.$el).toBeInstanceOf(HTMLElement);

        // Should be reactive (basic set test)
        CuboMX.listComp.testProp = "test";
        expect(CuboMX.listComp.testProp).toBe("test");
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
            list: null,
        });

        CuboMX.component("listComp", listComp);
        CuboMX.start();

        // Factory without mx-ref should NOT be globally accessible
        expect(CuboMX.listComp).toBeUndefined();

        // But should have proxy in element
        const el = document.querySelector('[mx-data="listComp()"]') as any;
        expect(el.__mxProxy__).toBeDefined();
        expect(el.__mxProxy__.list).toBe(null);
        expect(el.__mxProxy__.$el).toBe(el);
    });

    it("should create factory with class", () => {
        class ListComp {
            list: Array<string> = [];
        }
        const listComp = () => new ListComp();
        CuboMX.component("listComp", listComp);
        CuboMX.start();

        // Factory without mx-ref should NOT be globally accessible
        expect(CuboMX.listComp).toBeUndefined();

        // But should have proxy in element
        const el = document.querySelector('[mx-data="listComp()"]') as any;
        expect(el.__mxProxy__).toBeDefined();
        expect(el.__mxProxy__.list).toEqual([]);
        expect(el.__mxProxy__.$el).toBeInstanceOf(HTMLElement);
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
            list: null,
        });

        CuboMX.component("listComp", listComp);
        CuboMX.start();

        // Factory WITH mx-ref SHOULD be globally accessible via ref name
        expect(CuboMX.listCompRef1).toBeDefined();
        expect(CuboMX.listCompRef1.list).toBe(null);
        expect(CuboMX.listCompRef1.$el).toBeInstanceOf(HTMLElement);
        expect(CuboMX.listCompRef1.$el.getAttribute("mx-ref")).toBe(
            "listCompRef1"
        );

        // Element should have the proxy
        const el = document.querySelector('[mx-ref="listCompRef1"]') as any;
        expect(el.__mxProxy__).toBeDefined();
        expect(el.__mxProxy__).toBe(CuboMX.listCompRef1);
    });

    it("should create factory with mx-ref with class", () => {
        class ListComp {
            list: Array<string> = [];
        }
        const listComp = () => new ListComp();
        CuboMX.component("listComp", listComp);
        CuboMX.start();

        // Factory WITH mx-ref SHOULD be globally accessible via ref name
        expect(CuboMX.listCompRef1).toBeDefined();
        expect(CuboMX.listCompRef1.list).toEqual([]);
        expect(CuboMX.listCompRef1.$el).toBeInstanceOf(HTMLElement);

        // Should be reactive
        CuboMX.listCompRef1.newProp = "value";
        expect(CuboMX.listCompRef1.newProp).toBe("value");
    });
});
