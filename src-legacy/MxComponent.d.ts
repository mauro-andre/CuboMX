/**
 * Type definitions for the MxComponent runtime class.
 * This file provides TypeScript type information for the empty runtime class
 * defined in MxComponent.js.
 */

/**
 * The base class for creating strongly-typed CuboMX components.
 * Extend this class to automatically inherit the framework's "magic" properties
 * like `$el`, `$watch`, and `$watchArrayItems`.
 *
 * @example
 * class MyComponent extends MxComponent {
 *   count: number = 0;
 *
 *   init() {
 *     this.$watch('count', (newVal, oldVal) => {
 *       console.log(`Count changed from ${oldVal} to ${newVal}`);
 *     });
 *   }
 * }
 */
export class MxComponent {
    /**
     * A direct reference to the component's root DOM element.
     * This property is injected by the CuboMX runtime.
     */
    $el!: HTMLElement;

    /**
     * Watches a property on the current component instance for changes.
     * This method is injected by the CuboMX runtime.
     *
     * @param prop The property name to watch
     * @param callback Function called when the property changes
     */
    $watch!: <K extends keyof this>(
        prop: K,
        callback: (newValue: this[K], oldValue: this[K]) => void
    ) => void;

    /**
     * Watches mutations on an array of items created with `mx-item`.
     * This method is injected by the CuboMX runtime.
     *
     * @param arrayName The name of the array property to watch
     * @param callback Function called when the array mutates
     */
    $watchArrayItems!: <K extends keyof this>(
        arrayName: K,
        callback: (mutation: any) => void
    ) => void;
}
