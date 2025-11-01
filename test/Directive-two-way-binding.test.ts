import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX, MxComponent } from "../src/cubomx";

describe("Two-way binding for input[type=text] with value", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="formData">
                <input type="text" value="Initial Value" :value="username" />
            </div>
        `;
    });

    afterEach(() => {});

    it("should hydrate initial value from DOM to state", () => {
        const formData = {
            username: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        expect(CuboMX.formData.username).toBe("Initial Value");
    });

    it("should update state when user types in input (DOM → State)", () => {
        const formData = {
            username: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const input = document.querySelector("input") as HTMLInputElement;
        input.value = "New Username";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        expect(CuboMX.formData.username).toBe("New Username");
    });

    it("should update DOM when state changes programmatically (State → DOM)", () => {
        const formData = {
            username: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const input = document.querySelector("input") as HTMLInputElement;

        CuboMX.formData.username = "Programmatic Value";

        expect(input.value).toBe("Programmatic Value");
    });
});

describe("Two-way binding for textarea with value", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="formData">
                <textarea :value="description">Initial description</textarea>
            </div>
        `;
    });

    afterEach(() => {});

    it("should hydrate initial value from textarea to state", () => {
        const formData = {
            description: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        expect(CuboMX.formData.description).toBe("Initial description");
    });

    it("should update state when user types in textarea (DOM → State)", () => {
        const formData = {
            description: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const textarea = document.querySelector(
            "textarea"
        ) as HTMLTextAreaElement;
        textarea.value = "Updated description";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        expect(CuboMX.formData.description).toBe("Updated description");
    });

    it("should update DOM when state changes programmatically (State → DOM)", () => {
        const formData = {
            description: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const textarea = document.querySelector(
            "textarea"
        ) as HTMLTextAreaElement;

        CuboMX.formData.description = "Programmatic description";

        expect(textarea.value).toBe("Programmatic description");
    });
});

describe("Two-way binding for checkbox with checked - initially checked", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="formData">
                <input type="checkbox" checked :checked="isSubscribed" />
            </div>
        `;
    });

    afterEach(() => {});

    it("should hydrate initial checked state (true) from DOM to state", () => {
        const formData = {
            isSubscribed: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        expect(CuboMX.formData.isSubscribed).toBe(true);
    });

    it("should update state when user unchecks checkbox (DOM → State)", () => {
        const formData = {
            isSubscribed: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const checkbox = document.querySelector(
            "input[type=checkbox]"
        ) as HTMLInputElement;
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));

        expect(CuboMX.formData.isSubscribed).toBe(false);
    });

    it("should update DOM when state changes programmatically (State → DOM)", () => {
        const formData = {
            isSubscribed: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const checkbox = document.querySelector(
            "input[type=checkbox]"
        ) as HTMLInputElement;

        CuboMX.formData.isSubscribed = false;
        expect(checkbox.checked).toBe(false);

        CuboMX.formData.isSubscribed = true;
        expect(checkbox.checked).toBe(true);
    });
});

describe("Two-way binding for checkbox with checked - initially unchecked", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="formData">
                <input type="checkbox" :checked="acceptTerms" />
            </div>
        `;
    });

    afterEach(() => {});

    it("should hydrate initial unchecked state (false) from DOM to state", () => {
        const formData = {
            acceptTerms: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        expect(CuboMX.formData.acceptTerms).toBe(false);
    });

    it("should update state when user checks checkbox (DOM → State)", () => {
        const formData = {
            acceptTerms: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const checkbox = document.querySelector(
            "input[type=checkbox]"
        ) as HTMLInputElement;
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));

        expect(CuboMX.formData.acceptTerms).toBe(true);
    });

    it("should update DOM when state changes programmatically (State → DOM)", () => {
        const formData = {
            acceptTerms: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const checkbox = document.querySelector(
            "input[type=checkbox]"
        ) as HTMLInputElement;

        CuboMX.formData.acceptTerms = true;
        expect(checkbox.checked).toBe(true);

        CuboMX.formData.acceptTerms = false;
        expect(checkbox.checked).toBe(false);
    });
});

describe("Two-way binding for radio buttons with mx-item", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="formData">
                <div mx-item="options">
                    <input type="radio" name="color" value="red" ::value="colorValue" ::checked="isSelected" />
                    <label>Red</label>
                </div>
                <div mx-item="options">
                    <input type="radio" name="color" value="blue" checked ::value="colorValue" ::checked="isSelected" />
                    <label>Blue</label>
                </div>
                <div mx-item="options">
                    <input type="radio" name="color" value="green" ::value="colorValue" ::checked="isSelected" />
                    <label>Green</label>
                </div>
            </div>
        `;
    });

    afterEach(() => {});

    it("should hydrate radio button values and checked states", () => {
        const formData = {
            options: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        expect(CuboMX.formData.options).toHaveLength(3);
        expect(CuboMX.formData.options[0].colorValue).toBe("red");
        expect(CuboMX.formData.options[0].isSelected).toBe(false);
        expect(CuboMX.formData.options[1].colorValue).toBe("blue");
        expect(CuboMX.formData.options[1].isSelected).toBe(true);
        expect(CuboMX.formData.options[2].colorValue).toBe("green");
        expect(CuboMX.formData.options[2].isSelected).toBe(false);
    });

    it("should update state when user selects different radio button (DOM → State)", () => {
        const formData = {
            options: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const radios = Array.from(
            document.querySelectorAll("input[type=radio]")
        ) as HTMLInputElement[];

        // Select the first radio (red)
        radios[0].checked = true;
        radios[0].dispatchEvent(new Event("change", { bubbles: true }));

        expect(CuboMX.formData.options[0].isSelected).toBe(true);
    });

    it("should update DOM when state changes programmatically (State → DOM)", () => {
        const formData = {
            options: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const radios = Array.from(
            document.querySelectorAll("input[type=radio]")
        ) as HTMLInputElement[];

        // Programmatically select the green option
        CuboMX.formData.options[2].isSelected = true;

        expect(radios[2].checked).toBe(true);

        // Programmatically select the red option
        CuboMX.formData.options[0].isSelected = true;

        expect(radios[0].checked).toBe(true);
    });
});

describe("Two-way binding for select with value", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="formData">
                <select :value="selectedCountry">
                    <option value="us">United States</option>
                    <option value="mx" selected>Mexico</option>
                    <option value="ca">Canada</option>
                </select>
            </div>
        `;
    });

    afterEach(() => {});

    it("should hydrate initial selected value from DOM to state", () => {
        const formData = {
            selectedCountry: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        expect(CuboMX.formData.selectedCountry).toBe("mx");
    });

    it("should update state when user selects different option (DOM → State)", () => {
        const formData = {
            selectedCountry: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const select = document.querySelector("select") as HTMLSelectElement;
        select.value = "ca";
        select.dispatchEvent(new Event("input", { bubbles: true }));

        expect(CuboMX.formData.selectedCountry).toBe("ca");
    });

    it("should update DOM when state changes programmatically (State → DOM)", () => {
        const formData = {
            selectedCountry: null,
        };

        CuboMX.component("formData", formData);
        CuboMX.start();

        const select = document.querySelector("select") as HTMLSelectElement;

        CuboMX.formData.selectedCountry = "us";
        expect(select.value).toBe("us");

        CuboMX.formData.selectedCountry = "ca";
        expect(select.value).toBe("ca");
    });
});

describe("Two-way binding with MxComponent class", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="userForm">
                <input type="text" value="John Doe" :value="fullName" />
                <input type="checkbox" checked :checked="isActive" />
                <textarea :value="bio">Software developer</textarea>
            </div>
        `;
    });

    afterEach(() => {});

    it("should work with MxComponent class instances", () => {
        class UserForm extends MxComponent {
            fullName = null;
            isActive = null;
            bio = null;
        }

        const userForm = new UserForm();
        CuboMX.component("userForm", userForm);
        CuboMX.start();

        // Test hydration
        expect(CuboMX.userForm.fullName).toBe("John Doe");
        expect(CuboMX.userForm.isActive).toBe(true);
        expect(CuboMX.userForm.bio).toBe("Software developer");

        // Test DOM → State
        const input = document.querySelector(
            "input[type=text]"
        ) as HTMLInputElement;
        const checkbox = document.querySelector(
            "input[type=checkbox]"
        ) as HTMLInputElement;
        const textarea = document.querySelector(
            "textarea"
        ) as HTMLTextAreaElement;

        input.value = "Jane Smith";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        expect(CuboMX.userForm.fullName).toBe("Jane Smith");

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        expect(CuboMX.userForm.isActive).toBe(false);

        textarea.value = "Updated bio";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        expect(CuboMX.userForm.bio).toBe("Updated bio");

        // Test State → DOM
        CuboMX.userForm.fullName = "Bob Johnson";
        expect(input.value).toBe("Bob Johnson");

        CuboMX.userForm.isActive = true;
        expect(checkbox.checked).toBe(true);

        CuboMX.userForm.bio = "New developer bio";
        expect(textarea.value).toBe("New developer bio");
    });
});
