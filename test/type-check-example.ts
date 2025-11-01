// This file only exists to check TypeScript typings
// It is not executed as a test - only compiled to check types

import { CuboMX, MxComponent, ArrayItems, ClassList } from "../src/cubomx";

// Example 1: TypeScript Class with ArrayItems and ClassList
class MyComponent extends MxComponent {
    // ✅ CORRECT: We just declare the property with !.
    // CuboMX will initialize it during hydration from the HTML.
    items!: ArrayItems<any>;
    classes!: ClassList;

    method() {
        this.classes.add();
    }
}

// Example 2: With initial values
class MyComponent2 extends MxComponent {
    // Initial values should come from the HTML, not the class.
    // The class just declares the property that will be hydrated.
    classes!: ClassList;
}

// Example 3: With generic typing
interface Task {
    id: number;
    text: string;
}

class TaskManager extends MxComponent {
    // ✅ Generic typing should be allowed
    tasks!: ArrayItems<Task>;
}

// Example 4: Autocomplete should work
const component = new MyComponent();

// ✅ Standard array methods should be available
component.items.length;
component.items.push({} as any);
component.classes.push("test");

// If there are no compilation errors, the typing is correct!

// Example 5: Object Literal with Typing
// For object literals, where we can't use `!`, we use type assertion.
// We initialize with `null` and tell TypeScript what the correct type is.
const literalComponent = {
    // ✅ We use `as unknown as ArrayItems` to apply the type
    tasks: null as unknown as ArrayItems<Task>,
    classes: null as unknown as ClassList,
    isLoading: true,

    load() {
        this.isLoading = false;
        // ✅ Autocomplete and typing work!
        this.tasks.add({ id: 1, text: "New Task" });
        this.classes.add("loaded");
    },
};

// CuboMX will register and hydrate this normally
CuboMX.component("literalComponent", literalComponent);