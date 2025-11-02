import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX, MxComponent } from "../src/cubomx";

describe("Directive mx-bind singletons hydration", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="mySingleton" class="class-one class-two" mx-bind:class="componentClass">
                <h1 my-prop="123", mx-bind:my-prop="myProp" mx-bind:text="name">Title</h1>
                <p mx-bind:text="$mySecondSingleton.text">A paragraph</p>
            </div>
            <div mx-data="mySecondSingleton"></div>
        `;
    });

    afterEach(() => {});

    it("should bind mx-bind", () => {
        const mySingleton = {
            componentClass: null,
            myProp: null,
            name: null,
        };

        const mySecondSingleton = {
            text: null,
        };

        CuboMX.component("mySingleton", mySingleton);
        CuboMX.component("mySecondSingleton", mySecondSingleton);
        CuboMX.start();

        // Test class binding (array)
        expect(CuboMX.mySingleton.componentClass).toEqual([
            "class-one",
            "class-two",
        ]);

        // Test number parsing
        expect(CuboMX.mySingleton.myProp).toBe(123);

        // Test text binding
        expect(CuboMX.mySingleton.name).toBe("Title");

        // Test global scope ($componentName)
        expect(CuboMX.mySecondSingleton.text).toBe("A paragraph");
    });
});

describe("Directive bind (:) singletons hydration", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="mySingleton" class="class-one class-two" :class="componentClass">
                <h1 my-prop="123", :my-prop="myProp" :text="name">Title</h1>
                <p :text="$mySecondSingleton.text">A paragraph</p>
            </div>
            <div mx-data="mySecondSingleton"></div>
        `;
    });

    afterEach(() => {});

    it("should bind with colon syntax", () => {
        const mySingleton = {
            componentClass: null,
            myProp: null,
            name: null,
        };

        const mySecondSingleton = {
            text: null,
        };

        CuboMX.component("mySingleton", mySingleton);
        CuboMX.component("mySecondSingleton", mySecondSingleton);
        CuboMX.start();

        // Test class binding (array)
        expect(CuboMX.mySingleton.componentClass).toEqual([
            "class-one",
            "class-two",
        ]);

        // Test number parsing
        expect(CuboMX.mySingleton.myProp).toBe(123);

        // Test text binding
        expect(CuboMX.mySingleton.name).toBe("Title");

        // Test global scope ($componentName)
        expect(CuboMX.mySecondSingleton.text).toBe("A paragraph");
    });
});

describe("parseValue data types", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div
                mx-data="dataTypes"
                num-int="42"
                num-float="3.14"
                bool-true="true"
                bool-false="false"
                null-value="null"
                none-value="none"
                undefined-value="undefined"
                string-value="hello world"
                :num-int="numInt"
                :num-float="numFloat"
                :bool-true="boolTrue"
                :bool-false="boolFalse"
                :null-value="nullValue"
                :none-value="noneValue"
                :undefined-value="undefinedValue"
                :string-value="stringValue"
                :html="htmlValue"
            >
                <span>Inner <strong>HTML</strong></span>
            </div>
        `;
    });

    afterEach(() => {});

    it("should parse numbers correctly", () => {
        const dataTypes = {
            numInt: null,
            numFloat: null,
            boolTrue: null,
            boolFalse: null,
            nullValue: null,
            noneValue: null,
            undefinedValue: null,
            stringValue: null,
            htmlValue: null,
        };

        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test integer parsing
        expect(CuboMX.dataTypes.numInt).toBe(42);
        expect(typeof CuboMX.dataTypes.numInt).toBe("number");

        // Test float parsing
        expect(CuboMX.dataTypes.numFloat).toBe(3.14);
        expect(typeof CuboMX.dataTypes.numFloat).toBe("number");
    });

    it("should parse booleans correctly", () => {
        const dataTypes = {
            numInt: null,
            numFloat: null,
            boolTrue: null,
            boolFalse: null,
            nullValue: null,
            noneValue: null,
            undefinedValue: null,
            stringValue: null,
            htmlValue: null,
        };

        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test boolean true
        expect(CuboMX.dataTypes.boolTrue).toBe(true);
        expect(typeof CuboMX.dataTypes.boolTrue).toBe("boolean");

        // Test boolean false
        expect(CuboMX.dataTypes.boolFalse).toBe(false);
        expect(typeof CuboMX.dataTypes.boolFalse).toBe("boolean");
    });

    it("should parse null and undefined correctly", () => {
        const dataTypes = {
            numInt: null,
            numFloat: null,
            boolTrue: null,
            boolFalse: null,
            nullValue: null,
            noneValue: null,
            undefinedValue: null,
            stringValue: null,
            htmlValue: null,
        };

        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test null
        expect(CuboMX.dataTypes.nullValue).toBe(null);

        // Test none (treated as null)
        expect(CuboMX.dataTypes.noneValue).toBe(null);

        // Test undefined
        expect(CuboMX.dataTypes.undefinedValue).toBe(undefined);
    });

    it("should parse strings correctly", () => {
        const dataTypes = {
            numInt: null,
            numFloat: null,
            boolTrue: null,
            boolFalse: null,
            nullValue: null,
            noneValue: null,
            undefinedValue: null,
            stringValue: null,
            htmlValue: null,
        };

        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test string
        expect(CuboMX.dataTypes.stringValue).toBe("hello world");
        expect(typeof CuboMX.dataTypes.stringValue).toBe("string");
    });

    it("should bind html/text correctly", () => {
        const dataTypes = {
            numInt: null,
            numFloat: null,
            boolTrue: null,
            boolFalse: null,
            nullValue: null,
            noneValue: null,
            undefinedValue: null,
            stringValue: null,
            htmlValue: null,
        };

        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test html binding (innerHTML)
        expect(CuboMX.dataTypes.htmlValue).toContain("Inner");
        expect(CuboMX.dataTypes.htmlValue).toContain("<strong>HTML</strong>");
    });
});

describe("parseValue attributes without value", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="emptyAttrs">
                <div my-prop :my-prop="myProp"></div>
                <input disabled :disabled="isDisabled" />
                <button readonly :readonly="isReadonly"></button>
            </div>
        `;
    });

    afterEach(() => {});

    it("should parse attributes without value as true", () => {
        const emptyAttrs = {
            myProp: null,
            isDisabled: null,
            isReadonly: null,
        };

        CuboMX.component("emptyAttrs", emptyAttrs);
        CuboMX.start();

        // Attributes without value should become true
        expect(CuboMX.emptyAttrs.myProp).toBe(true);
        expect(typeof CuboMX.emptyAttrs.myProp).toBe("boolean");

        expect(CuboMX.emptyAttrs.isDisabled).toBe(true);
        expect(typeof CuboMX.emptyAttrs.isDisabled).toBe("boolean");

        expect(CuboMX.emptyAttrs.isReadonly).toBe(true);
        expect(typeof CuboMX.emptyAttrs.isReadonly).toBe("boolean");
    });
});

describe("parseValue attributes without value with class", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="emptyAttrs">
                <div my-prop :my-prop="myProp"></div>
                <input disabled :disabled="isDisabled" />
                <button readonly :readonly="isReadonly"></button>
            </div>
        `;
    });

    afterEach(() => {});

    it("should parse attributes without value as true with class instance", () => {
        class EmptyAttrs extends MxComponent {
            myProp = null;
            isDisabled = null;
            isReadonly = null;
        }

        const emptyAttrs = new EmptyAttrs();
        CuboMX.component("emptyAttrs", emptyAttrs);
        CuboMX.start();

        // Attributes without value should become true
        expect(CuboMX.emptyAttrs.myProp).toBe(true);
        expect(typeof CuboMX.emptyAttrs.myProp).toBe("boolean");

        expect(CuboMX.emptyAttrs.isDisabled).toBe(true);
        expect(typeof CuboMX.emptyAttrs.isDisabled).toBe("boolean");

        expect(CuboMX.emptyAttrs.isReadonly).toBe(true);
        expect(typeof CuboMX.emptyAttrs.isReadonly).toBe("boolean");
    });
});

describe("parseValue data types with class", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div
                mx-data="dataTypes"
                num-int="42"
                num-float="3.14"
                bool-true="true"
                bool-false="false"
                null-value="null"
                none-value="none"
                undefined-value="undefined"
                string-value="hello world"
                :num-int="numInt"
                :num-float="numFloat"
                :bool-true="boolTrue"
                :bool-false="boolFalse"
                :null-value="nullValue"
                :none-value="noneValue"
                :undefined-value="undefinedValue"
                :string-value="stringValue"
                :html="htmlValue"
            >
                <span>Inner <strong>HTML</strong></span>
            </div>
        `;
    });

    afterEach(() => {});

    it("should parse numbers correctly", () => {
        class DataTypes extends MxComponent {
            numInt = null;
            numFloat = null;
            boolTrue = null;
            boolFalse = null;
            nullValue = null;
            noneValue = null;
            undefinedValue = null;
            stringValue = null;
            htmlValue = null;
        }

        const dataTypes = new DataTypes();
        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test integer parsing
        expect(CuboMX.dataTypes.numInt).toBe(42);
        expect(typeof CuboMX.dataTypes.numInt).toBe("number");

        // Test float parsing
        expect(CuboMX.dataTypes.numFloat).toBe(3.14);
        expect(typeof CuboMX.dataTypes.numFloat).toBe("number");
    });

    it("should parse booleans correctly", () => {
        class DataTypes extends MxComponent {
            numInt = null;
            numFloat = null;
            boolTrue = null;
            boolFalse = null;
            nullValue = null;
            noneValue = null;
            undefinedValue = null;
            stringValue = null;
            htmlValue = null;
        }

        const dataTypes = new DataTypes();
        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test boolean true
        expect(CuboMX.dataTypes.boolTrue).toBe(true);
        expect(typeof CuboMX.dataTypes.boolTrue).toBe("boolean");

        // Test boolean false
        expect(CuboMX.dataTypes.boolFalse).toBe(false);
        expect(typeof CuboMX.dataTypes.boolFalse).toBe("boolean");
    });

    it("should parse null and undefined correctly", () => {
        class DataTypes extends MxComponent {
            numInt = null;
            numFloat = null;
            boolTrue = null;
            boolFalse = null;
            nullValue = null;
            noneValue = null;
            undefinedValue = null;
            stringValue = null;
            htmlValue = null;
        }

        const dataTypes = new DataTypes();
        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test null
        expect(CuboMX.dataTypes.nullValue).toBe(null);

        // Test none (treated as null)
        expect(CuboMX.dataTypes.noneValue).toBe(null);

        // Test undefined
        expect(CuboMX.dataTypes.undefinedValue).toBe(undefined);
    });

    it("should parse strings correctly", () => {
        class DataTypes extends MxComponent {
            numInt = null;
            numFloat = null;
            boolTrue = null;
            boolFalse = null;
            nullValue = null;
            noneValue = null;
            undefinedValue = null;
            stringValue = null;
            htmlValue = null;
        }

        const dataTypes = new DataTypes();
        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test string
        expect(CuboMX.dataTypes.stringValue).toBe("hello world");
        expect(typeof CuboMX.dataTypes.stringValue).toBe("string");
    });

    it("should bind html/text correctly", () => {
        class DataTypes extends MxComponent {
            numInt = null;
            numFloat = null;
            boolTrue = null;
            boolFalse = null;
            nullValue = null;
            noneValue = null;
            undefinedValue = null;
            stringValue = null;
            htmlValue = null;
        }

        const dataTypes = new DataTypes();
        CuboMX.component("dataTypes", dataTypes);
        CuboMX.start();

        // Test html binding (innerHTML)
        expect(CuboMX.dataTypes.htmlValue).toContain("Inner");
        expect(CuboMX.dataTypes.htmlValue).toContain("<strong>HTML</strong>");
    });
});

describe("Directive :el for element reference", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate element reference with :el", () => {
        document.body.innerHTML = `
            <div mx-data="pageManager">
                <div id="main-content" :el="mainElement">
                    <h1>Main Content</h1>
                </div>
                <header id="page-header" :el="headerElement">
                    <h2>Header</h2>
                </header>
            </div>
        `;

        const pageManager = {
            mainElement: null,
            headerElement: null,
        };

        CuboMX.component("pageManager", pageManager);
        CuboMX.start();

        // Check if elements were hydrated
        expect(CuboMX.pageManager.mainElement).toBeInstanceOf(HTMLElement);
        expect(CuboMX.pageManager.headerElement).toBeInstanceOf(HTMLElement);

        // Check if we got the correct elements
        expect(CuboMX.pageManager.mainElement.id).toBe("main-content");
        expect(CuboMX.pageManager.headerElement.id).toBe("page-header");

        // Check if we can access element content
        expect(CuboMX.pageManager.mainElement.querySelector("h1")?.textContent).toBe("Main Content");
        expect(CuboMX.pageManager.headerElement.querySelector("h2")?.textContent).toBe("Header");
    });

    it("should work with global scope ($componentName)", () => {
        document.body.innerHTML = `
            <div mx-data="layout">
                <main :el="$pageContent.mainEl">
                    <p>Page content</p>
                </main>
            </div>
            <div mx-data="pageContent"></div>
        `;

        const layout = {};
        const pageContent = {
            mainEl: null,
        };

        CuboMX.component("layout", layout);
        CuboMX.component("pageContent", pageContent);
        CuboMX.start();

        // Check if element was hydrated to pageContent component
        expect(CuboMX.pageContent.mainEl).toBeInstanceOf(HTMLElement);
        expect(CuboMX.pageContent.mainEl.tagName).toBe("MAIN");
        expect(CuboMX.pageContent.mainEl.querySelector("p")?.textContent).toBe("Page content");
    });

    it("should not create reactions for :el (static reference)", () => {
        document.body.innerHTML = `
            <div mx-data="testComp">
                <div id="test-div" :el="divElement">Test</div>
            </div>
        `;

        const testComp = {
            divElement: null,
        };

        CuboMX.component("testComp", testComp);
        CuboMX.start();

        const originalElement = CuboMX.testComp.divElement;

        // Try to change the property (should not affect DOM since there's no reaction)
        CuboMX.testComp.divElement = document.createElement("span");

        // The property changed, but DOM should remain the same
        expect(CuboMX.testComp.divElement.tagName).toBe("SPAN");
        expect(document.querySelector("#test-div")).toBeTruthy();
        expect(originalElement.textContent).toBe("Test");
    });
});
