import { ClassList, MxProxy, MxElProxy } from "./types";
declare const createClassListProxy: (classes: string[], parentProxy: MxProxy | MxElProxy, propName: string) => ClassList;
export { createClassListProxy };
