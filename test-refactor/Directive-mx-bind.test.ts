import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX, MxComponent } from "../src-refactor/cubomx";

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
