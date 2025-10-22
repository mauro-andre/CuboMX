interface MxElement extends HTMLElement {
    __doNotProcessNode__?: boolean
}

const CuboMX = (() => {
    let registeredComponents: Record<string, object> = {};
    // let registeredStores = {};
    let activeProxies = {};
    let observer: MutationObserver | null = null

    const reset = () => {
        registeredComponents = {};
        // registeredStores = {};
        activeProxies = {};
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };

    const resolveNode = (node: MxElement) => {
        console.log("*************************************")
        console.log(node.outerHTML)
        console.log("*************************************")
    }

    const start = () => {
        console.log("Start")
        resolveNode(document.body)
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if ((node as MxElement).__doNotProcessNode__) {
                            continue
                        }
                        resolveNode(node as MxElement)
                    }
                }

                for (const node of mutation.removedNodes) {
                    if (node.nodeType === 1) { // Node.ELEMENT_NODE
                        // node as MxElement
                        console.log("REMOVE NODE")
                    }
                }
            }
        })
        observer.observe(document.body, { childList: true, subtree: true });
        
    }

    const component = (name: string, def: object | Function) => {
        // console.log("Cadastrando componente");
        // console.log(typeof(def))
    };

    const store = (name: string, def: object) => {
        registeredComponents[name] = def
    }

    return {
        reset,
        start,
        component,
        store
    };
})();

export { CuboMX, MxElement };
