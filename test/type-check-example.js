// This file only exists to check TypeScript typings
// It is not executed as a test - only compiled to check types
import { CuboMX, MxComponent } from "../src/cubomx";
// Example 1: TypeScript Class with ArrayItems and ClassList
class MyComponent extends MxComponent {
    method() {
        this.classes.add();
    }
}
// Example 2: With initial values
class MyComponent2 extends MxComponent {
}
class TaskManager extends MxComponent {
}
// Example 4: Autocomplete should work
const component = new MyComponent();
// ✅ Standard array methods should be available
component.items.length;
component.items.push({});
component.classes.push("test");
// If there are no compilation errors, the typing is correct!
// Example 5: Object Literal with Typing
// For object literals, where we can't use `!`, we use type assertion.
// We initialize with `null` and tell TypeScript what the correct type is.
const literalComponent = {
    // ✅ We use `as unknown as ArrayItems` to apply the type
    tasks: null,
    classes: null,
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
