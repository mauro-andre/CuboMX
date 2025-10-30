import { ArrayItems } from "./types";
declare const createArrayProxy: <T = any>(arr: Array<any>) => ArrayItems<T>;
export { createArrayProxy };
