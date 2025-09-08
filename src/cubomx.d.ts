declare module 'cubomx' {
    // Type definitions for CuboMX

    type ComponentDefinition = object | (() => object);

    interface StoreDefinition {
        [key: string]: any;
        init?: () => void;
        onDOMUpdate?: () => void;
    }

    interface RequestConfig {
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
    }

    interface SwapOptions {
        targetUrl?: string;
        history?: boolean;
        actions?: object[] | null;
        rootElement?: HTMLElement;
    }

    interface CuboMXAPI {
        /**
         * Registers a new component.
         * @param name The name of the component, used in the `mx-data` attribute.
         * @param obj The component definition (an object for a singleton, a function for a factory).
         */
        component(name: string, obj: ComponentDefinition): void;

        /**
         * Watches a property on a reactive object (store or ref) for changes.
         * @param pathString The path to the property to watch (e.g., '$stores.theme.mode', '$refs.myComponent.value').
         * @param callback The function to execute when the property changes. It receives (newValue, oldValue).
         */
        watch(pathString: string, callback: (newValue: any, oldValue: any) => void): void;

        /**
         * Initializes all stores and starts the framework.
         * Scans the entire DOM for components, initializes them, and sets up a MutationObserver to handle dynamic changes.
         */
        start(): void;

        /**
         * Registers a new global store. Must be called before start().
         * @param name The name of the store.
         * @param obj The store object, containing state, methods, and optional init/onDOMUpdate hooks.
         */
        store(name: string, obj: StoreDefinition): void;

        /**
         * Performs an asynchronous request and updates the DOM based on the response.
         * @param config The request configuration object.
         * @returns A promise that resolves with the status and final URL of the response.
         */
        request(config: RequestConfig): Promise<{ ok: boolean; status: number; url: string; redirected?: boolean; }>;

        /**
         * Updates the DOM from HTML content and local strategies.
         * @param htmlContent The source HTML content containing the elements to be swapped.
         * @param strategies The list of swap strategies. E.g., [{ select: '#src', target: '#dest' }]
         * @param options Options for URL, history, and scope control.
         */
        swapHTML(htmlContent: string, strategies: object[], options?: SwapOptions): void;

        /**
         * Replaces placeholders in a template string with values from a data object.
         * @param template The template string.
         * @param data A data object with key-value pairs.
         * @returns The rendered template.
         */
        renderTemplate(template: string, data: object): string;

        /**
         * A reactive object containing all component instances named with `mx-ref`.
         */
        readonly refs: { [key: string]: object };

        /**
         * A reactive object containing the instances of all registered stores.
         */
        readonly stores: { [key: string]: object };
    }

    export const CuboMX: CuboMXAPI;
}
