import { MxElement } from "./types";
import { PublicAPI } from "./types";
declare const resolveMXBind: (el: MxElement, publicAPI: PublicAPI) => void;
declare const resolveMXItem: (el: MxElement, publicAPI: PublicAPI) => void;
export { resolveMXBind, resolveMXItem };
