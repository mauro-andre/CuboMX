import { MxElProxy, MxElement } from "./types";
declare const resolveMXData: (el: MxElement, registeredComponents: Record<string, object | Function>) => MxElProxy | undefined;
export { resolveMXData };
