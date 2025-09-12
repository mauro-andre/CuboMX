declare module 'cubomx' {
    // Type definitions for CuboMX (Refactored)

    /**
     * Represents the definition of a component.
     * It can be a simple object for a singleton component,
     * or a function that returns an object for a factory component.
     */
    type ComponentDefinition = object | (() => object);

    /**
     * Represents the definition of a global store.
     * It's an object containing state and methods.
     */
    type StoreDefinition = {
        [key: string]: any;
        init?: () => void | Promise<void>;
        destroy?: () => void;
        onDOMUpdate?: () => void;
    };

    /**
     * The core CuboMX API.
     * This interface includes the static methods for registering components/stores,
     * starting the framework, and watching for changes.
     * It also allows for dynamic properties, representing the globally accessible
     * stores and component instances.
     */
    interface CuboMXAPI {
        /**
         * Registers a component. A component can be a singleton (plain object)
         * or a factory (a function that returns an object).
         * @param name The name used in the `mx-data` attribute.
         * @param definition The component object or factory function.
         */
        component(name: string, definition: ComponentDefinition): void;

        /**
         * Registers a global store. Stores are always singletons.
         * @param name The name of the store, used to access it globally (e.g., `CuboMX.storeName`).
         * @param object The store object.
         */
        store(name: string, object: StoreDefinition): void;

        /**
         * Watches a property on any global store or component for changes.
         * @param path A string path to the property (e.g., 'componentName.propertyName' or 'storeName.propertyName').
         * @param callback A function to execute when the property changes. It receives the new and old values.
         */
        watch(path: string, callback: (newValue: any, oldValue: any) => void): void;

        /**
         * Scans the DOM, initializes all registered stores and components,
         * and starts listening for DOM mutations. This function should be called
         * once the entire application is ready.
         */
        start(): void;

        /**
         * Performs an asynchronous request and updates the DOM based on the response.
         * @param config The request configuration object.
         */
        request(config: {
            url: string;
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            body?: object | FormData | null;
            headers?: object;
            pushUrl?: boolean;
            history?: boolean;
            loadingSelectors?: string[];
            strategies?: object[];
            actions?: object[];
            rootElement?: HTMLElement;
        }): Promise<{ ok: boolean; status: number; url: string; redirected?: boolean; }>;

        /**
         * Updates the DOM from an HTML string using specified strategies.
         * @param htmlContent The source HTML content.
         * @param strategies The list of swap strategies.
         * @param options Options for URL, history, and scope control.
         */
        swapHTML(htmlContent: string, strategies: object[], options?: {
            targetUrl?: string;
            history?: boolean;
            actions?: object[] | null;
            rootElement?: HTMLElement;
        }): void;

        /**
         * Renders a template string with data.
         * @param template The template string.
         * @param data A data object.
         * @returns The rendered template.
         */
        renderTemplate(template: string, data: object): string;

        /**
         * Programmatically executes a list of DOM actions.
         * @param actions An array of action objects.
         * @param rootElement The root element for selector queries.
         */
        actions(actions: object[], rootElement?: HTMLElement): void;

        /**
         * Resets the internal state of CuboMX. Used primarily for testing.
         */
        reset(): void;

        /**
         * Allows dynamic access to any registered store or component instance.
         * For example, `CuboMX.myStore` or `CuboMX.myComponentRef`.
         */
        [key: string]: any;
    }

    export const CuboMX: CuboMXAPI;
}
