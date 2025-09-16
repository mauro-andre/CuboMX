import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Granular Directives", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it('should two-way bind a single `value` property with mx-attrs:value', () => {
        CuboMX.component('login', { email: null });
        document.body.innerHTML = `
            <div mx-data="login">
                <input id="el" mx-attrs:value="$login.email" value="initial@test.com">
            </div>
        `;
        const input = document.getElementById('el');

        CuboMX.start();

        // 1. Hydration (DOM -> State)
        expect(CuboMX.login.email).toBe('initial@test.com');

        // 2. Reactivity (State -> DOM)
        CuboMX.login.email = 'new@test.com';
        expect(input.value).toBe('new@test.com');

        // 3. Reactivity (DOM -> State)
        input.value = 'dom@test.com';
        input.dispatchEvent(new Event('input'));
        expect(CuboMX.login.email).toBe('dom@test.com');
    });

    it('should two-way bind a single `checked` property with mx-attrs:checked', () => {
        CuboMX.component('settings', { notifications: null });
        document.body.innerHTML = `
            <div mx-data="settings">
                <input id="el" type="checkbox" mx-attrs:checked="$settings.notifications" checked>
            </div>
        `;
        const input = document.getElementById('el');

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

    it('should bind a single `text` property with mx-attrs:text', () => {
        CuboMX.component('user', { name: 'Initial' });
        document.body.innerHTML = `
            <div mx-data="user">
                <span id="el" mx-attrs:text="$user.name">This should be replaced</span>
            </div>
        `;
        const span = document.getElementById('el');

        CuboMX.start();

        // 1. Reactivity (State -> DOM)
        expect(span.textContent).toBe('Initial');

        // 2. Further reactivity
        CuboMX.user.name = 'Changed';
        expect(span.textContent).toBe('Changed');
    });

    it('should create an array of primitives with mx-item:value', () => {
        CuboMX.component('myComp', { values: [] });
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

        expect(CuboMX.myComp.values).toEqual(['A', 'B', 'C']);
    });

    it('should hydrate a generic attribute before init() is called', () => {
        let hydratedId = null;
        CuboMX.component('company', {
            companyId: null,
            init() {
                hydratedId = this.companyId;
            }
        });

        document.body.innerHTML = `
            <section 
                mx-data="company" 
                mx-attrs:company-id="$company.companyId" 
                company-id="a1b1">
            </section>
        `;

        CuboMX.start();

        // Assert that the value was available inside init()
        expect(hydratedId).toBe('a1b1');
        // Also assert the final state is correct
        expect(CuboMX.company.companyId).toBe('a1b1');
    });
});
