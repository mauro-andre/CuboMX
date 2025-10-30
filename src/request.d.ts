import { RequestResponse } from "./types";
interface RequestConfig {
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: Record<string, any> | FormData | null;
    headers?: Record<string, string>;
}
declare const request: ({ url, method, body, headers, }: RequestConfig) => Promise<RequestResponse>;
export { request };
