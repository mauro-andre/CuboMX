const request = async ({ url, method = "GET", body = null, headers = {}, }) => {
    const upperMethod = method.toUpperCase();
    const fetchOptions = {
        method: upperMethod,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            ...headers,
        },
        credentials: "include",
    };
    // GET: convert body to query string
    if (upperMethod === "GET" && body && !(body instanceof FormData)) {
        const params = new URLSearchParams(body);
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}${params.toString()}`;
    }
    // POST/PUT/PATCH/DELETE: set body
    else if (body) {
        if (body instanceof FormData) {
            fetchOptions.body = body;
            // Don't set Content-Type for FormData - browser will set it with boundary
        }
        else {
            fetchOptions.body = JSON.stringify(body);
            if (!headers["Content-Type"]) {
                fetchOptions.headers = {
                    ...fetchOptions.headers,
                    "Content-Type": "application/json",
                };
            }
        }
    }
    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    let json = null;
    try {
        json = JSON.parse(text);
    }
    catch {
        // Not JSON, that's fine
    }
    return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.url,
        redirected: response.redirected,
        text,
        json,
    };
};
export { request };
