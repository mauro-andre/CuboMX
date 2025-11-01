import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/cubomx";

describe("MX-Redirect Redirect", () => {
    beforeEach(() => {
        CuboMX.reset();
        // Create a complete HTML structure with head and title
        document.documentElement.innerHTML = `
            <head>
                <title>Original Title</title>
            </head>
            <body></body>
        `;
        // Clear history
        history.replaceState(null, "", "/");
    });

    it("should redirect and swap content when MX-Redirect header is present", async () => {
        document.body.innerHTML = `
            <div mx-data="testComponent">
                <div id="content">Original Content</div>
            </div>
        `;

        const testComponent = {
            async makeRequest() {
                const response = await CuboMX.request({
                    url: "/api/action",
                    method: "POST",
                    body: { data: "test" },
                });
                return response;
            },
        };

        CuboMX.component("testComponent", testComponent);
        CuboMX.start();

        // Mock fetch to return MX-Redirect header
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: {
                    get: (name: string) => {
                        if (name === "MX-Redirect") {
                            return "/dashboard";
                        }
                        return null;
                    },
                },
                url: "/api/action",
                redirected: false,
                text: async () => JSON.stringify({ type: "success" }),
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: new Headers(),
                url: "/dashboard",
                redirected: false,
                text: async () => `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Dashboard Page</title>
                    </head>
                    <body>
                        <div mx-data="dashboard">
                            <h1 id="dashboard-title">Dashboard</h1>
                            <div id="content">Dashboard Content</div>
                        </div>
                    </body>
                    </html>
                `,
            } as any);

        // Make the request
        const response = await CuboMX.testComponent.makeRequest();

        // Wait for swap to complete
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Verify response indicates redirect
        expect(response.redirected).toBe(true);

        // Verify content was swapped
        const content = document.querySelector("#content");
        expect(content).not.toBeNull();
        expect(content?.textContent).toBe("Dashboard Content");

        // Verify title was updated
        expect(document.title).toBe("Dashboard Page");

        // Verify URL was updated in history
        expect(window.location.pathname).toBe("/dashboard");
    });

    it("should handle MX-Redirect with alert response", async () => {
        document.body.innerHTML = `
            <div mx-data="alerts">
                <div id="alert-container"></div>
            </div>
            <div mx-data="form">
                <div id="content">Form Content</div>
            </div>
        `;

        const alerts = {
            alerts: [] as any[],
            showAlert(alert: any) {
                this.alerts.push(alert);
            },
        };

        const form = {
            async submit() {
                const response = await CuboMX.request({
                    url: "/api/submit",
                    method: "POST",
                    body: { name: "Test" },
                });
                return response;
            },
        };

        CuboMX.component("alerts", alerts);
        CuboMX.component("form", form);
        CuboMX.start();

        // Mock fetch
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: {
                    get: (name: string) => {
                        if (name === "MX-Redirect") {
                            return "/success";
                        }
                        return null;
                    },
                },
                url: "/api/submit",
                redirected: false,
                text: async () =>
                    JSON.stringify({
                        type: "alert",
                        title: "Success",
                        details: "Form submitted successfully",
                    }),
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: new Headers(),
                url: "/success",
                redirected: false,
                text: async () => `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Success Page</title>
                    </head>
                    <body>
                        <div mx-data="successPage">
                            <h1>Success!</h1>
                            <div id="content">Success Content</div>
                        </div>
                    </body>
                    </html>
                `,
            } as any);

        const response = await CuboMX.form.submit();

        // Wait for swap
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Verify redirect happened
        expect(response.redirected).toBe(true);

        // Verify content was swapped
        const content = document.querySelector("#content");
        expect(content?.textContent).toBe("Success Content");

        // Verify title updated
        expect(document.title).toBe("Success Page");

        // Verify URL updated
        expect(window.location.pathname).toBe("/success");
    });

    it("should not redirect when MX-Redirect header is not present", async () => {
        document.body.innerHTML = `
            <div mx-data="testComponent">
                <div id="content">Original Content</div>
            </div>
        `;

        const testComponent = {
            async makeRequest() {
                const response = await CuboMX.request({
                    url: "/api/action",
                    method: "POST",
                });
                return response;
            },
        };

        CuboMX.component("testComponent", testComponent);
        CuboMX.start();

        // Mock fetch WITHOUT MX-Redirect header
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: {
                get: (name: string) => null,
            },
            url: "/api/action",
            redirected: false,
            text: async () => JSON.stringify({ type: "success", data: "test" }),
        } as any);

        const response = await CuboMX.testComponent.makeRequest();

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Verify NO redirect happened
        expect(response.redirected).toBe(false);

        // Verify content was NOT swapped
        const content = document.querySelector("#content");
        expect(content?.textContent).toBe("Original Content");

        // Verify URL did NOT change
        expect(window.location.pathname).toBe("/");
    });

    it("should handle redirect with partial body swap", async () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <nav id="nav">Navigation</nav>
                <main id="main">Original Main Content</main>
            </div>
        `;

        const app = {
            async loadPage() {
                const response = await CuboMX.request({
                    url: "/api/load",
                    method: "GET",
                });
                return response;
            },
        };

        CuboMX.component("app", app);
        CuboMX.start();

        // Mock fetch
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: {
                    get: (name: string) => {
                        if (name === "MX-Redirect") {
                            return "/new-page";
                        }
                        return null;
                    },
                },
                url: "/api/load",
                redirected: false,
                text: async () => JSON.stringify({ status: "redirect" }),
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: new Headers(),
                url: "/new-page",
                redirected: false,
                text: async () => `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>New Page</title>
                    </head>
                    <body>
                        <div mx-data="newApp">
                            <nav id="nav">New Navigation</nav>
                            <main id="main">New Main Content</main>
                        </div>
                    </body>
                    </html>
                `,
            } as any);

        const response = await CuboMX.app.loadPage();

        // Wait for swap
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Verify redirect
        expect(response.redirected).toBe(true);

        // Since we swap the entire body, the structure should be completely replaced
        const main = document.querySelector("#main");
        expect(main?.textContent).toBe("New Main Content");

        const nav = document.querySelector("#nav");
        expect(nav?.textContent).toBe("New Navigation");
    });

    it("should preserve fetch options during redirect", async () => {
        document.body.innerHTML = `
            <div mx-data="auth">
                <div id="content">Login Form</div>
            </div>
        `;

        const auth = {
            async login() {
                const response = await CuboMX.request({
                    url: "/api/login",
                    method: "POST",
                    body: { username: "user", password: "pass" },
                    headers: {
                        "X-Custom-Header": "custom-value",
                    },
                });
                return response;
            },
        };

        CuboMX.component("auth", auth);
        CuboMX.start();

        const fetchSpy = vi.fn();

        // Mock fetch
        global.fetch = fetchSpy
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: {
                    get: (name: string) => {
                        if (name === "MX-Redirect") {
                            return "/dashboard";
                        }
                        return null;
                    },
                },
                url: "/api/login",
                redirected: false,
                text: async () => JSON.stringify({ status: "ok" }),
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: new Headers(),
                url: "/dashboard",
                redirected: false,
                text: async () => `
                    <!DOCTYPE html>
                    <html>
                    <head><title>Dashboard</title></head>
                    <body><div id="content">Dashboard</div></body>
                    </html>
                `,
            } as any);

        await CuboMX.auth.login();

        // Verify fetch was called twice
        expect(fetchSpy).toHaveBeenCalledTimes(2);

        // Verify first call (original request)
        const firstCall = fetchSpy.mock.calls[0];
        expect(firstCall[0]).toBe("/api/login");
        expect(firstCall[1].method).toBe("POST");
        expect(firstCall[1].headers["X-Custom-Header"]).toBe("custom-value");

        // Verify second call (redirect)
        const secondCall = fetchSpy.mock.calls[1];
        expect(secondCall[0]).toBe("/dashboard");
        expect(secondCall[1].method).toBe("GET");
        expect(secondCall[1].headers["X-Custom-Header"]).toBe("custom-value");
    });
});
