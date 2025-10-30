import { MxElement, MxElProxy, MxProxy } from "./types";
declare const reactionsSymbol: unique symbol;
declare const watchersSymbol: unique symbol;
declare const createProxy: (obj: any, el: MxElement | null) => MxElProxy | MxProxy;
export { createProxy, reactionsSymbol, watchersSymbol };
