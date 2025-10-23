type MxProxy = Record<string, any> & {
    $watch?: Function;
};

type MxElProxy = MxProxy & {
    $el: HTMLElement;
};

type PublicAPI = {
    reset: () => void;
    start: () => void;
    component: (name: string, def: object | Function) => void;
    store: (name: string, def: object) => void;
    [key: string]: any;
};

interface MxElement extends HTMLElement {
    __doNotProcessNode__?: boolean;
    __mxProxy__?: MxElProxy;
}

interface Reaction {
    element: MxElement;
    type: "text" | "html" | "attribute" | "class" | "item";
    attrName?: string;
    template?: string;
}

class MxComponent {
    $el!: HTMLElement;
    $watch!: <K extends keyof this>(
        prop: string,
        callback: (newValue: this[K], oldValue: this[K]) => void
    ) => void;
}

export { MxProxy, MxElProxy, MxComponent, PublicAPI, MxElement, Reaction };
