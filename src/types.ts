type MxProxy = Record<string, any> & {
    $watch?: <K extends string>(
        property: K,
        callback: (this: MxProxy, newValue: any, oldValue: any) => void
    ) => void;
    init?: (this: MxProxy) => void;
    onDOMUpdate?: (this: MxProxy) => void;
};

type MxElProxy = MxProxy & {
    $el: HTMLElement;
    destroy?: (this: MxElProxy) => void;
};

type RequestResponse = {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Headers;
    url: string;
    redirected: boolean;
    text: string;
    json: any | null;
};

type ArrayItems<T> = Array<T & MxElProxy> & {
    add(item: T): Promise<T & MxElProxy>;
    prepend(item: T): Promise<T & MxElProxy>;
    delete(index: number): Promise<void>;
    remove(item: T): Promise<void>;
    pop(): Promise<void>;
    shift(): Promise<void>;
    clear(): Promise<void>;
    replace(index: number, item: T): Promise<T & MxElProxy>;
    _hydrateAdd?: (itemProxy: MxElProxy, index?: number) => void;
    _setTemplate?: (template: MxElement) => void;
    _setParent?: (parent: MxElement) => void;
};

type ClassList = Array<string> & {
    add(...classNames: string[]): void;
    remove(...classNames: string[]): void;
    toggle(className: string, force?: boolean): boolean;
    contains(className: string): boolean;
    replace(oldClass: string, newClass: string): boolean;
};

type PublicAPI = {
    reset: () => void;
    start: () => void;
    component: (name: string, def: object | Function) => void;
    store: (name: string, def: object) => void;
    swap: (
        html: string,
        swaps: Array<{ select?: string; target: string }>,
        options?: { pushUrl?: string; title?: string }
    ) => void;
    request: (config: {
        url: string;
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        body?: Record<string, any> | FormData | null;
        headers?: Record<string, string>;
    }) => Promise<RequestResponse>;
    [key: string]: any;
};

interface MxElement extends HTMLElement {
    __mxProxy__?: MxElProxy;
    __itemProxy__?: MxElProxy;
    __mxItemProcessed__?: boolean;
    __mx_transition_timeout__?: ReturnType<typeof setTimeout>;
    __mx_transition_handler__?: (event: TransitionEvent) => void;
    __resolveHydration__?: (proxy: MxElProxy) => void;
    __resolveDelete__?: () => void;
}

interface Reaction {
    element: MxElement;
    type: "text" | "html" | "attribute" | "class" | "item" | "mx-show" | "none";
    attrName?: string;
    template?: string;
}

class MxComponent {
    $el!: HTMLElement;
    $watch!: <K extends keyof this>(
        prop: K,
        callback: (this: this, newValue: this[K], oldValue: this[K]) => void
    ) => void;
    init?(): void;
    onDOMUpdate?(): void;
    destroy?(): void;
}

export {
    MxProxy,
    MxElProxy,
    MxComponent,
    PublicAPI,
    MxElement,
    Reaction,
    RequestResponse,
    ArrayItems,
    ClassList,
};
