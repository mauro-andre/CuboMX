import { RequestResponse } from "./types";
import { swap } from "./swap";

interface RequestConfig {
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: Record<string, any> | FormData | null;
    headers?: Record<string, string>;
}

const request = async ({
    url,
    method = "GET",
    body = null,
    headers = {},
}: RequestConfig): Promise<RequestResponse> => {
    const upperMethod = method.toUpperCase();

    let fetchOptions: RequestInit = {
        method: upperMethod,
        headers: {
            "MX-Request": "true",
            ...headers,
        },
        credentials: "include",
    };

    // GET: convert body to query string
    if (upperMethod === "GET" && body && !(body instanceof FormData)) {
        const params = new URLSearchParams(body as Record<string, string>);
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}${params.toString()}`;
    }
    // POST/PUT/PATCH/DELETE: set body
    else if (body) {
        if (body instanceof FormData) {
            fetchOptions.body = body;
            // Don't set Content-Type for FormData - browser will set it with boundary
        } else {
            fetchOptions.body = JSON.stringify(body);
            if (!headers["Content-Type"]) {
                fetchOptions.headers = {
                    ...fetchOptions.headers,
                    "Content-Type": "application/json",
                };
            }
        }
    }

    let response = await fetch(url, fetchOptions);

    const mxLocation =
        response.headers && typeof response.headers.get === "function"
            ? response.headers.get("MX-Location")
            : null;

    const mxRedirect =
        response.headers && typeof response.headers.get === "function"
            ? response.headers.get("MX-Redirect")
            : null;

    if (mxLocation) {
        window.location.href = mxLocation;
        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            url: response.url,
            redirected: true,
            text: "",
            json: null,
        };
    }

    let text: string | null = null;
    let wasRedirected = false;

    if (mxRedirect) {
        fetchOptions = {
            method: "GET",
            headers: {
                "MX-Request": "true",
                ...headers,
            },
            credentials: "include",
        };
        response = await fetch(mxRedirect, fetchOptions);
        text = await response.text();
        await swap(
            text,
            [
                { select: "body", target: "body" },
                { select: "title:innerHTML", target: "title:innerHTML" },
            ],
            { pushUrl: mxRedirect }
        );
        wasRedirected = true;
    }

    text = text ?? (await response.text());

    let json = null;
    try {
        json = JSON.parse(text);
    } catch {
        // Not JSON, that's fine
    }

    return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.url,
        redirected: wasRedirected || response.redirected,
        text,
        json,
    };
};

export { request };
