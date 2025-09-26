declare module 'cubomx' {
    // Type definitions for CuboMX (Refactored)

    /**
     * Defines the structure for a custom parser, which transforms data
     * between the DOM and the component state.
     */
    type Parser = {
        /**
         * Receives the string value from the DOM and returns the processed value
         * to be stored in the state.
         * @param value The string value from the DOM.
         * @param el The element the directive is on.
         * @param config The global CuboMX config object.
         * @returns The parsed value for the state.
         */
        parse(value: string, el: HTMLElement, config: object): any;

        /**
         * Receives the value from the state and returns the string to be
         * displayed in the DOM.
         * @param value The value from the state.
         * @param el The element the directive is on.
         * @param config The global CuboMX config object.
         * @returns The formatted string for the DOM.
         */
        format(value: any, el: HTMLElement, config: object): string;
    };

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
         * @summary Registers a component.
         * @param {string} name The name used in the `mx-data` attribute.
         * @param {ComponentDefinition} definition The component object (singleton) or factory function.
         */
        component(name: string, definition: ComponentDefinition): void;

        /**
         * @summary Registers a global store.
         * @param {string} name The name of the store, used for global access (e.g., `CuboMX.storeName`).
         * @param {StoreDefinition} object The store object.
         */
        store(name: string, object: StoreDefinition): void;

        /**
         * @summary Registers a custom parser to transform data.
         * @param {string} name The name of the parser, used in directives (e.g., `::text:my-parser`).
         * @param {Parser} parser The parser object, containing `parse` and `format` methods.
         */
        addParser(name: string, parser: Parser): void;

        /**
         * @summary Watches a property on any global store or component for changes.
         * @param {string} path A string path to the property (e.g., 'componentName.propertyName').
         * @param {function} callback A function to execute when the property changes.
         */
        watch(path: string, callback: (newValue: any, oldValue: any) => void): void;

        /**
         * @summary Initializes the framework, scanning the DOM and activating components.
         * @param {object} [config] - Optional configuration object.
         * @param {string} [config.locale='en-US'] - The default locale for formatting.
         * @param {string} [config.currency='USD'] - The default currency code for formatting.
         */
        start(config?: {
            locale?: string;
            currency?: string;
        }): void;

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
         * @summary Updates the DOM from an HTML string using specified strategies.
         * @param {string} htmlContent - The source HTML content.
         * @param {Array<Object>} strategies - The list of swap strategies.
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
         * @summary Renders a template string with data by replacing `{{key}}` placeholders.
         * @param {string} templateString The template string to process.
         * @param {object} data A data object where keys match the placeholders.
         * @returns {string} The rendered HTML string.
         */
        render(templateString: string, data: object): string;

        /**
         * @summary Gets a pre-registered template and its associated metadata.
         * @param {string} templateName The name of the template to get.
         * @returns {{ template: string, data: object } | undefined} An object with the template string and a data object with the metadata, or undefined if not found.
         */
        getTemplate(templateName: string): { template: string, data: object } | undefined;

        /**
         * @summary Swaps a pre-registered template into the DOM, with automatic history handling.
         * @description This function looks for URL and title information first in the `options` object, then in the template's HTML attributes (e.g., `url="..."` or `data-url="..."`).
         * @param {string} templateName The name of the template to swap.
         * @param {object} options Configuration for the swap operation.
         * @param {string} options.target The CSS selector for the destination element (e.g., '#container:innerHTML').
         * @param {boolean} [options.history] Explicitly controls history. If a URL is present, history is enabled by default. Set to `false` to disable.
         * @param {string} [options.url] The URL for the history entry. Overrides URL from template metadata (e.g., `url="..."` or `data-url="..."`).
         * @param {string} [options.pageTitle] The document title. Overrides title from template metadata (e.g., `page-title="..."` or `data-page-title="..."`).
         */
        swapTemplate(templateName: string, options: { 
            target: string; 
            history?: boolean; 
            url?: string; 
            pageTitle?: string; 
        }): void;

        /**
         * @summary Renders a pre-registered template.
         * @param {string} templateName The name of the template to render.
         * @param {object} data A data object to populate the template.
         * @returns {string} The rendered HTML string.
         */
        renderTemplate(templateName: string, data: object): string;

        /**
         * @summary Programmatically executes a list of DOM actions.
         * @param {Array<Object>} actions An array of action objects.
         * @param {HTMLElement} [rootElement=document] The root element for selector queries.
         */
        actions(actions: object[], rootElement?: HTMLElement): void;

        /**
         * @summary Resets the internal state of CuboMX. Used primarily for testing.
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
