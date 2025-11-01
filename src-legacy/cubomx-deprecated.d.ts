declare module 'cubomx' {
    // Type definitions for CuboMX

    type ComponentDefinition = object | (() => object);

    interface StoreDefinition {
        [key: string]: any;
        init?: () => void;
        onDOMUpdate?: () => void;
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
         * @summary Performs an asynchronous request and updates the DOM based on the response.
         * @param {Object} config - The request configuration object.
         * @param {string} config.url - The URL to which the request will be sent.
         * @param {string} [config.method='GET'] - The HTTP method to use.
         * @param {Object|FormData} [config.body=null] - The request body.
         * @param {Object} [config.headers={}] - Custom request headers.
         * @param {boolean} [config.pushUrl=false] - Fallback to update the URL if the backend does not send `X-Push-Url`.
         * @param {boolean} [config.history=false] - Whether the change should be added to the browser history.
         * @param {Array<string>} [config.loadingSelectors=[]] - Selectors to apply the 'x-request' class during the request.
         * @param {Array<Object>} [config.strategies=null] - Swap strategies, with priority over server-sent ones.
         * @param {Array<Object>} [config.actions=null] - Imperative actions to execute after the swap, with priority over server-sent ones.
         * @param {HTMLElement} [config.rootElement=document] - The root element for selector queries.
         * @returns {Promise<Object>} A promise that resolves with the status and final URL of the response.
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
         * @summary Updates the DOM from HTML content and local strategies.
         * @param {string} htmlContent - The source HTML content containing the elements to be swapped.
         * @param {Array<Object>} strategies - The list of swap strategies. E.g., [{ select: '#src', target: '#dest' }]
         * @param {Object} [options={}] - Options for URL, history, and scope control.
         * @param {string} [options.targetUrl] - The new URL to display in the address bar.
         * @param {boolean} [options.history] - Whether the change should be added to the browser history.
         * @param {Array<Object>} [options.actions=null] - Imperative actions to execute after the swap.
         * @param {HTMLElement} [options.rootElement=document] - The root element for selector queries.
         */
        swapHTML(htmlContent: string, strategies: object[], options?: {
            targetUrl?: string;
            history?: boolean;
            actions?: object[] | null;
            rootElement?: HTMLElement;
        }): void;

        /**
         * Replaces placeholders in a template string with values from a data object.
         * @param template The template string.
         * @param data A data object with key-value pairs.
         * @returns The rendered template.
         */
        renderTemplate(template: string, data: object): string;

        /**
         * Programmatically executes a list of actions on the DOM.
         * @param actions An array of action objects to execute.
         * @param rootElement Optional. The root element for selector queries. Defaults to `document`.
         */
        actions(actions: object[], rootElement?: HTMLElement): void;

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
