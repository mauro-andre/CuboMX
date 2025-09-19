import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Granular Directives", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it("should two-way bind a single `value` property with mx-bind:value", () => {
        CuboMX.component("login", { email: null });
        document.body.innerHTML = `
            <div mx-data="login">
                <input id="el" mx-bind:value="$login.email" value="initial@test.com">
            </div>
        `;
        const input = document.getElementById("el");

        CuboMX.start();

        // 1. Hydration (DOM -> State)
        expect(CuboMX.login.email).toBe("initial@test.com");

        // 2. Reactivity (State -> DOM)
        CuboMX.login.email = "new@test.com";
        expect(input.value).toBe("new@test.com");

        // 3. Reactivity (DOM -> State)
        input.value = "dom@test.com";
        input.dispatchEvent(new Event("input"));
        expect(CuboMX.login.email).toBe("dom@test.com");
    });

    it("should two-way bind a single `checked` property with mx-bind:checked", () => {
        CuboMX.component("settings", { notifications: null });
        document.body.innerHTML = `
            <div mx-data="settings">
                <input id="el" type="checkbox" mx-bind:checked="$settings.notifications" checked>
            </div>
        `;
        const input = document.getElementById("el");

        CuboMX.start();

        // 1. Hydration (DOM -> State)
        expect(CuboMX.settings.notifications).toBe(true);

        // 2. Reactivity (State -> DOM)
        CuboMX.settings.notifications = false;
        expect(input.checked).toBe(false);

        // 3. Reactivity (DOM -> State)
        input.click();
        expect(CuboMX.settings.notifications).toBe(true);
    });

    it("should bind a single `text` property with mx-bind:text", () => {
        CuboMX.component("user", { name: "Initial" });
        document.body.innerHTML = `
            <div mx-data="user">
                <span id="el" mx-bind:text="$user.name">This should be replaced</span>
            </div>
        `;
        const span = document.getElementById("el");

        CuboMX.start();

        // 1. Reactivity (State -> DOM)
        expect(span.textContent).toBe("Initial");

        // 2. Further reactivity
        CuboMX.user.name = "Changed";
        expect(span.textContent).toBe("Changed");
    });

    it("should create an array of primitives with mx-item:value", () => {
        CuboMX.component("myComp", { values: [] });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div>
                    <div mx-item:value="$myComp.values" value="A"></div>
                    <div mx-item:value="$myComp.values" value="B"></div>
                    <span mx-item:value="$myComp.values">C</span>
                </div>
            </div>
        `;

        CuboMX.start();

        expect(CuboMX.myComp.values).toEqual(["A", "B", "C"]);
    });

    it("should hydrate a generic attribute before init() is called", () => {
        let hydratedId = null;
        CuboMX.component("company", {
            companyId: null,
            init() {
                hydratedId = this.companyId;
            },
        });

        document.body.innerHTML = `
            <section 
                mx-data="company" 
                mx-bind:company-id="$company.companyId" 
                company-id="a1b1">
            </section>
        `;

        CuboMX.start();

        // Assert that the value was available inside init()
        expect(hydratedId).toBe("a1b1");
        // Also assert the final state is correct
        expect(CuboMX.company.companyId).toBe("a1b1");
    });

    it("should bind a single `html` property with mx-bind:html", () => {
        CuboMX.component("user", { content: "<span>Initial</span>" });
        document.body.innerHTML = `
            <div mx-data="user">
                <div id="el" mx-bind:html="$user.content">This should be replaced</div>
            </div>
        `;
        const div = document.getElementById("el");

        CuboMX.start();

        // 1. Reactivity (State -> DOM)
        expect(div.innerHTML).toBe("<span>Initial</span>");

        // 2. Further reactivity
        CuboMX.user.content = "<strong>Changed</strong>";
        expect(div.innerHTML).toBe("<strong>Changed</strong>");
    });

    it('should bind a single `text` property with :text shorthand', () => {
        CuboMX.component('user', { name: 'Initial' });
        document.body.innerHTML = `
            <div mx-data="user">
                <span id="el" :text="$user.name">This should be replaced</span>
            </div>
        `;
        const span = document.getElementById('el');

        CuboMX.start();

        expect(span.textContent).toBe('Initial');
        CuboMX.user.name = 'Changed';
        expect(span.textContent).toBe('Changed');
    });

    it('should bind a single `html` property with :html shorthand', () => {
        CuboMX.component('user', { content: '<span>Initial</span>' });
        document.body.innerHTML = `
            <div mx-data="user">
                <div id="el" :html="$user.content">This should be replaced</div>
            </div>
        `;
        const div = document.getElementById('el');

        CuboMX.start();

        expect(div.innerHTML).toBe('<span>Initial</span>');
        CuboMX.user.content = '<strong>Changed</strong>';
        expect(div.innerHTML).toBe('<strong>Changed</strong>');
    });
});
