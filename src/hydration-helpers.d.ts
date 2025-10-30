import { MxElement, PublicAPI, MxElProxy, MxProxy, Reaction } from "./types";
declare const parseValue: (value: string | null) => any;
declare const parseAttrToBind: (attr: Attr, prefixes: Array<string>) => {
    attrToBind: string;
    modifier: string;
} | undefined;
declare const getComponentNameAttr: (attr: Attr) => {
    componentName: string | null;
    componentAttr: string;
};
declare const getProxyInfo: (el: MxElement, attr: Attr, publicAPI: PublicAPI) => {
    proxy: MxProxy | MxElProxy | null;
    componentName: string | null;
    componentAttr: string;
};
declare const parseAttrValue: (el: MxElement, attrToBind: string) => any;
declare const assignValue: (obj: any, attrToAssign: string, valueToAssign: any, modifier: string | undefined | null) => void;
declare const createReaction: (el: MxElement, attrToBind: string) => Reaction;
declare const addReaction: (proxy: MxElProxy | MxProxy, propName: string, reaction: Reaction) => void;
declare const twoWayBinding: (attrToBind: string, propName: string, proxy: MxElProxy, el: MxElement) => void;
export { parseValue, parseAttrToBind, getComponentNameAttr, getProxyInfo, parseAttrValue, assignValue, createReaction, addReaction, twoWayBinding, };
