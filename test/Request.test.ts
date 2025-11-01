import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CuboMX } from "../src/cubomx";

describe("CuboMX.request()", () => {
    let fetchMock: any;

    beforeEach(() => {
        CuboMX.reset();
        // Create a mock for the global fetch
        fetchMock = vi.fn();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should make a GET request with default settings", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users",
            redirected: false,
            text: async () => '{"name":"John"}',
        };

        fetchMock.mockResolvedValue(mockResponse);

        const response = await CuboMX.request({
            url: "https://example.com/api/users",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users",
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.json).toEqual({ name: "John" });
    });

    it("should convert body to query string for GET requests", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users?page=2&limit=10",
            redirected: false,
            text: async () => "[]",
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/users",
            method: "GET",
            body: { page: "2", limit: "10" },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users?page=2&limit=10",
            expect.any(Object)
        );
    });

    it("should append query string to existing query params", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users?existing=true&page=2",
            redirected: false,
            text: async () => "[]",
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/users?existing=true",
            method: "GET",
            body: { page: "2" },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users?existing=true&page=2",
            expect.any(Object)
        );
    });

    it("should send JSON body for POST requests", async () => {
        const mockResponse = {
            ok: true,
            status: 201,
            statusText: "Created",
            headers: new Headers(),
            url: "https://example.com/api/users",
            redirected: false,
            text: async () => '{"id":1,"name":"John"}',
        };

        fetchMock.mockResolvedValue(mockResponse);

        const response = await CuboMX.request({
            url: "https://example.com/api/users",
            method: "POST",
            body: { name: "John", email: "john@example.com" },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    name: "John",
                    email: "john@example.com",
                }),
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            })
        );

        expect(response.status).toBe(201);
        expect(response.json).toEqual({ id: 1, name: "John" });
    });

    it("should handle FormData body without setting Content-Type", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/upload",
            redirected: false,
            text: async () => '{"success":true}',
        };

        fetchMock.mockResolvedValue(mockResponse);

        const formData = new FormData();
        formData.append("file", "fake-file-content");

        await CuboMX.request({
            url: "https://example.com/api/upload",
            method: "POST",
            body: formData,
        });

        const callArgs = fetchMock.mock.calls[0][1];
        expect(callArgs.body).toBe(formData);
        // Content-Type should NOT be set for FormData
        expect(callArgs.headers["Content-Type"]).toBeUndefined();
    });

    it("should include custom headers", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users",
            redirected: false,
            text: async () => "[]",
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/users",
            headers: {
                Authorization: "Bearer token123",
                "X-Custom-Header": "custom-value",
            },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer token123",
                    "X-Custom-Header": "custom-value",
                    "MX-Request": "true",
                }),
            })
        );
    });

    it("should handle non-JSON responses", async () => {
        const htmlContent = "<div>Hello World</div>";
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/page",
            redirected: false,
            text: async () => htmlContent,
        };

        fetchMock.mockResolvedValue(mockResponse);

        const response = await CuboMX.request({
            url: "https://example.com/page",
        });

        expect(response.text).toBe(htmlContent);
        expect(response.json).toBeNull();
    });

    it("should handle failed requests", async () => {
        const mockResponse = {
            ok: false,
            status: 404,
            statusText: "Not Found",
            headers: new Headers(),
            url: "https://example.com/api/not-found",
            redirected: false,
            text: async () => '{"error":"Not found"}',
        };

        fetchMock.mockResolvedValue(mockResponse);

        const response = await CuboMX.request({
            url: "https://example.com/api/not-found",
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(404);
        expect(response.json).toEqual({ error: "Not found" });
    });

    it("should handle redirected responses", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/redirected-url",
            redirected: true,
            text: async () => '{"redirected":true}',
        };

        fetchMock.mockResolvedValue(mockResponse);

        const response = await CuboMX.request({
            url: "https://example.com/original-url",
        });

        expect(response.redirected).toBe(true);
        expect(response.url).toBe("https://example.com/redirected-url");
    });

    it("should send PUT requests correctly", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users/1",
            redirected: false,
            text: async () => '{"id":1,"name":"Updated"}',
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/users/1",
            method: "PUT",
            body: { name: "Updated" },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users/1",
            expect.objectContaining({
                method: "PUT",
                body: JSON.stringify({ name: "Updated" }),
            })
        );
    });

    it("should send DELETE requests correctly", async () => {
        const mockResponse = {
            ok: true,
            status: 204,
            statusText: "No Content",
            headers: new Headers(),
            url: "https://example.com/api/users/1",
            redirected: false,
            text: async () => "",
        };

        fetchMock.mockResolvedValue(mockResponse);

        const response = await CuboMX.request({
            url: "https://example.com/api/users/1",
            method: "DELETE",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users/1",
            expect.objectContaining({
                method: "DELETE",
            })
        );

        expect(response.status).toBe(204);
        expect(response.text).toBe("");
        expect(response.json).toBeNull();
    });

    it("should send PATCH requests correctly", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users/1",
            redirected: false,
            text: async () => '{"id":1,"status":"active"}',
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/users/1",
            method: "PATCH",
            body: { status: "active" },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users/1",
            expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ status: "active" }),
            })
        );
    });

    it("should include credentials for cross-origin requests", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users",
            redirected: false,
            text: async () => "[]",
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/users",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users",
            expect.objectContaining({
                credentials: "include",
            })
        );
    });

    it("should always include MX-Request header", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/users",
            redirected: false,
            text: async () => "[]",
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/users",
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/users",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "MX-Request": "true",
                }),
            })
        );
    });

    it("should allow custom Content-Type to override default for JSON", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "https://example.com/api/custom",
            redirected: false,
            text: async () => "OK",
        };

        fetchMock.mockResolvedValue(mockResponse);

        await CuboMX.request({
            url: "https://example.com/api/custom",
            method: "POST",
            body: { data: "value" },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/api/custom",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Content-Type": "application/x-www-form-urlencoded",
                }),
            })
        );
    });
});
