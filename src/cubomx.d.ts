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
     * Represents a reactive proxy for an array of items created with `mx-item`.
     * It extends the standard Array and adds methods for dynamic DOM manipulation.
     * @template T The type of the items in the array.
     */
    export type ItemArrayProxy<T> = Array<T> & {
        /**
         * Adds a new item to the end of the list and updates the DOM.
         * @param {Partial<T>} itemData The data for the new item.
         */
        add: (itemData: Partial<T>) => void;

        /**
         * Adds a new item to the beginning of the list and updates the DOM.
         * @param {Partial<T>} itemData The data for the new item.
         */
        prepend: (itemData: Partial<T>) => void;

        /**
         * Inserts a new item at a specific index and updates the DOM.
         * @param {Partial<T>} itemData The data for the new item.
         * @param {number} index The index at which to insert the item.
         */
        insert: (itemData: Partial<T>, index: number) => void;

        /**
         * Removes the item at the specified index and updates the DOM.
         * @param {number} index The index of the item to remove.
         */
        delete: (index: number) => void;
    };

    /**
     * Represents a reactive proxy for an element's class list.
     * It behaves like an array of strings, but also includes helper methods
     * for common class manipulations.
     */
    export type ClassListProxy = Array<string> & {
        /**
         * Adds a class to the element, if it's not already present.
         * @param {string} className The class to add.
         */
        add: (className: string) => void;

        /**
         * Removes a class from the element.
         * @param {string} className The class to remove.
         */
        remove: (className: string) => void;

        /**
         * Adds a class if it's not present, or removes it if it is.
         * @param {string} className The class to toggle.
         */
        toggle: (className: string) => void;

        /**
         * Checks if the element has a given class.
         * @param {string} className The class to check for.
         * @returns {boolean}
         */
        contains: (className: string) => boolean;
    };

    export interface ItemProxy {
        /** A reactive proxy for the element's class list. */
        class: ClassListProxy;
        /** The reactive `textContent` of the element. */
        text: string;
        /** The reactive `innerHTML` of the element. */
        html: string;
        /** The reactive `value` of a form element. */
        value?: any;
        /** The reactive `checked` state of a checkbox or radio button. */
        checked?: boolean;
        [key: string]: any;
    }

    /**
     * Describes the `this` context within a component's methods, including
     * the magic properties injected by the CuboMX runtime.
     */
    /**
     * The base class for creating strongly-typed CuboMX components.
     * Extend this class to automatically inherit the framework's "magic" properties
     * like `$el`, `$watch`, and `$watchArrayItems`.
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
         */
        $watch!: <K extends keyof this>(prop: K, callback: (newValue: this[K], oldValue: this[K]) => void) => void;

        /**
         * Watches mutations on an array of items created with `mx-item`.
         * This method is injected by the CuboMX runtime.
         */
        $watchArrayItems!: <K extends keyof this>(arrayName: K, callback: (mutation: any) => void) => void;
    }

    /**
     * The core CuboMX API.
     */
    interface CuboMXAPI {
        /**
         * An abstract base class for creating strongly-typed CuboMX components.
         * Extend this class to automatically inherit the framework's "magic" properties
         * like `$el`, `$watch`, and `$watchArrayItems`.
         * @example
         * class MyComponent extends CuboMX.MxComponent {
         *   // ...
         * }
         */
        MxComponent: typeof MxComponent;


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
         * @summary Performs an asynchronous request, updates the DOM, and returns response data.
         * @description Makes an AJAX request and orchestrates DOM updates via server headers like `X-Swap-Strategies` and `X-Cubo-Actions`. It can also return a JSON payload from the `X-Cubo-Data` header.
         * @param {Object} config - The request configuration object.
         * @param {string} config.url - The URL to which the request will be sent.
         * @param {string} [config.method='GET'] - The HTTP method to use.
         * @param {Object|FormData} [config.body=null] - The request body.
         * @param {Object} [config.headers={}] - Custom request headers.
         * @param {boolean} [config.pushUrl=false] - Fallback to update the URL if the backend does not send `X-Push-Url`.
         * @param {boolean} [config.history=false] - Whether the change should be added to the browser history.
         * @param {Array<string>} [config.loadingSelectors=[]] - Selectors to apply the loading class to during the request.
         * @param {string} [config.loadingClass='x-request'] - The CSS class to apply to loading selectors.
         * @param {Array<Object>} [config.strategies=null] - Swap strategies, with priority over server-sent ones.
         * @param {Array<Object>} [config.actions=null] - Imperative actions to execute after the swap, with priority over server-sent ones.
         * @param {HTMLElement} [config.rootElement=document] - The root element for selector queries.
         * @returns {Promise<{ok: boolean, status: number, url: string, redirected: boolean, data: object | null}>} A promise that resolves to an object with the response status and data.
         */
        request(config: {
            url: string;
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            body?: object | FormData | null;
            headers?: object;
            pushUrl?: boolean;
            history?: boolean;
            loadingSelectors?: string[];
            loadingClass?: string;
            strategies?: object[];
            actions?: object[];
            rootElement?: HTMLElement;
        }): Promise<{ ok: boolean; status: number; url: string; redirected: boolean; data: object | null; }>;

        /**
         * @summary Updates the DOM from an HTML string using specified strategies.
         * @param {string} htmlContent - The source HTML content.
         * @param {Array<Object>} strategies - The list of swap strategies.
         * @param {Object} [options={}] - Options for URL, history, and scope control.
         * @param {string} [options.targetUrl] - The new URL to display in the address bar.
         * @param {boolean} [options.history] - Whether the change should be added to the browser history.
         * @param {Array<Object>} [options.actions=null] - Imperative actions to execute after the swap.
         * @param {HTMLElement} [options.rootElement=document] - The root element for selector queries.
         * @param {object} [options.state] - An object containing initial state for any components in the `htmlContent`.
         */
        swapHTML(htmlContent: string, strategies: object[], options?: {
            targetUrl?: string;
            history?: boolean;
            actions?: object[] | null;
            rootElement?: HTMLElement;
            state?: object;
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
         * @description This function looks for URL and title information first in the `options` object, then in the template's HTML attributes (e.g., `url="..."` or `data-url="..."`). It also allows passing an initial state to the components being rendered.
         * @param {string} templateName The name of the template to swap.
         * @param {object} options Configuration for the swap operation.
         * @param {string} options.target The CSS selector for the destination element (e.g., '#container:innerHTML').
         * @param {string} [options.select] A CSS selector to extract a fragment from the template. If omitted, the entire template content is used.
         * @param {boolean} [options.history] Explicitly controls history. If a URL is present, history is enabled by default. Set to `false` to disable.
         * @param {string} [options.url] The URL for the history entry. Overrides URL from template metadata.
         * @param {string} [options.pageTitle] The document title. Overrides title from template metadata.
         * @param {object} [options.state] An object containing initial state for the components in the template. The keys should match the component names.
         */
        swapTemplate(templateName: string, options: { 
            target: string; 
            select?: string;
            history?: boolean; 
            url?: string; 
            pageTitle?: string; 
            state?: object;
        }): void;

        /**
         * @summary Renders a pre-registered template.
         * @param {string} templateName The name of the template to render.
         * @param {object} data A data object to populate the template.
         * @returns {string} The rendered HTML string.
         */
        renderTemplate(templateName: string, data: object): string;

        /**
         * @summary Programmatically executes a list of DOM and state actions.
         * @description Available actions: `setProperty`, `addClass`, `removeClass`, `setAttribute`, `removeElement`, `setTextContent`, `dispatchEvent`, `pushUrl`.
         * @param {Array<Object>} actions An array of action objects.
         * @param {HTMLElement} [rootElement=document] The root element for selector queries.
         */
        actions(actions: object[], rootElement?: HTMLElement): void;

        /**
         * @summary Resets the internal state of CuboMX. Used primarily for testing.
         */
        reset(): void;
    }

    /**
     * The core CuboMX instance with typed methods and dynamic property access.
     * Allows access to registered stores and components via their names
     * (e.g., `CuboMX.myStore`, `CuboMX.myComponentRef`).
     */
    export const CuboMX: CuboMXAPI & Record<string, any>;
}
