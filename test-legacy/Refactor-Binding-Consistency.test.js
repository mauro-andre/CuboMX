import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Refactoring Binding Logic Consistency", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it("TDD: mx-bind should provide two-way data binding for input value", () => {
        CuboMX.component("formComp", { form: null });
        document.body.innerHTML = `
            <div mx-data="formComp">
                <input id="text-input" type="text" mx-bind="form" value="Initial Name" />
            </div>
        `;
        const textInput = document.getElementById('text-input');

        CuboMX.start();

        const form = CuboMX.formComp.form;

        // 1. --- Initial Hydration (DOM -> State) ---
        expect(form.value).toBe('Initial Name');

        // 2. --- Reactivity (State -> DOM) ---
        form.value = 'Set from JS';
        expect(textInput.value).toBe('Set from JS');

        // 3. --- Reactivity (DOM -> State) ---
        // This is the part that might fail before the refactor
        textInput.value = 'Typed by user';
        textInput.dispatchEvent(new Event('input'));
        expect(form.value).toBe('Typed by user');
    });

    it("TDD: mx-bind should provide two-way data binding for checkbox checked property", () => {
        CuboMX.component("formComp", { form: null });
        document.body.innerHTML = `
            <div mx-data="formComp">
                <input id="check-input" type="checkbox" mx-bind="form" checked />
            </div>
        `;
        const checkInput = document.getElementById('check-input');

        CuboMX.start();

        const form = CuboMX.formComp.form;

        // 1. --- Initial Hydration (DOM -> State) ---
        expect(form.checked).toBe(true);

        // 2. --- Reactivity (State -> DOM) ---
        form.checked = false;
        expect(checkInput.checked).toBe(false);

        // 3. --- Reactivity (DOM -> State) ---
        // This is the part that might fail before the refactor
        checkInput.click(); // Triggers a 'change' event
        expect(form.checked).toBe(true);
    });
});
