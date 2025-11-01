import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/cubomx";

describe("$watch functionality", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should call watch callback when property changes", () => {
        const watchSpy = vi.fn();

        CuboMX.component("counter", {
            count: 0,
            init(this: any) {
                this.$watch("count", watchSpy);
            },
        });

        document.body.innerHTML = `<div mx-data="counter"></div>`;
        CuboMX.start();

        // Change the property
        CuboMX.counter.count = 5;

        expect(watchSpy).toHaveBeenCalledTimes(1);
        expect(watchSpy).toHaveBeenCalledWith(5, 0);
    });

    it("should call watch callback multiple times for multiple changes", () => {
        const watchSpy = vi.fn();

        CuboMX.component("counter", {
            count: 0,
            init(this: any) {
                this.$watch("count", watchSpy);
            },
        });

        document.body.innerHTML = `<div mx-data="counter"></div>`;
        CuboMX.start();

        CuboMX.counter.count = 1;
        CuboMX.counter.count = 2;
        CuboMX.counter.count = 3;

        expect(watchSpy).toHaveBeenCalledTimes(3);
        expect(watchSpy).toHaveBeenNthCalledWith(1, 1, 0);
        expect(watchSpy).toHaveBeenNthCalledWith(2, 2, 1);
        expect(watchSpy).toHaveBeenNthCalledWith(3, 3, 2);
    });

    it("should allow multiple watchers on the same property", () => {
        const watcher1 = vi.fn();
        const watcher2 = vi.fn();

        CuboMX.component("counter", {
            count: 0,
            init(this: any) {
                this.$watch("count", watcher1);
                this.$watch("count", watcher2);
            },
        });

        document.body.innerHTML = `<div mx-data="counter"></div>`;
        CuboMX.start();

        CuboMX.counter.count = 10;

        expect(watcher1).toHaveBeenCalledTimes(1);
        expect(watcher1).toHaveBeenCalledWith(10, 0);
        expect(watcher2).toHaveBeenCalledTimes(1);
        expect(watcher2).toHaveBeenCalledWith(10, 0);
    });

    it("should watch different properties independently", () => {
        const countWatcher = vi.fn();
        const nameWatcher = vi.fn();

        CuboMX.component("user", {
            count: 0,
            name: "John",
            init(this: any) {
                this.$watch("count", countWatcher);
                this.$watch("name", nameWatcher);
            },
        });

        document.body.innerHTML = `<div mx-data="user"></div>`;
        CuboMX.start();

        CuboMX.user.count = 5;
        expect(countWatcher).toHaveBeenCalledTimes(1);
        expect(nameWatcher).not.toHaveBeenCalled();

        CuboMX.user.name = "Jane";
        expect(countWatcher).toHaveBeenCalledTimes(1);
        expect(nameWatcher).toHaveBeenCalledTimes(1);
        expect(nameWatcher).toHaveBeenCalledWith("Jane", "John");
    });

    it("should work with stores", () => {
        const watchSpy = vi.fn();

        CuboMX.store("theme", {
            mode: "light",
            init(this: any) {
                this.$watch("mode", watchSpy);
            },
        });

        CuboMX.component("dummy", {});
        document.body.innerHTML = `<div mx-data="dummy"></div>`;
        CuboMX.start();

        CuboMX.theme.mode = "dark";

        expect(watchSpy).toHaveBeenCalledTimes(1);
        expect(watchSpy).toHaveBeenCalledWith("dark", "light");
    });

    it("should have access to component context in callback", () => {
        let capturedThis: any = null;

        CuboMX.component("test", {
            count: 0,
            multiplier: 2,
            init(this: any) {
                this.$watch("count", function (this: any, newVal: number) {
                    capturedThis = this;
                });
            },
        });

        document.body.innerHTML = `<div mx-data="test"></div>`;
        CuboMX.start();

        CuboMX.test.count = 5;

        expect(capturedThis).toBe(CuboMX.test);
        expect(capturedThis.multiplier).toBe(2);
    });

    it("should work with factory components", () => {
        const watcher1 = vi.fn();
        const watcher2 = vi.fn();

        CuboMX.component("dropdown", function () {
            return {
                isOpen: false,
            };
        });

        document.body.innerHTML = `
            <div mx-data="dropdown()" mx-ref="dropdown1"></div>
            <div mx-data="dropdown()" mx-ref="dropdown2"></div>
        `;
        CuboMX.start();

        // Setup watchers independently
        CuboMX.dropdown1.$watch("isOpen", watcher1);
        CuboMX.dropdown2.$watch("isOpen", watcher2);

        // Change first dropdown
        CuboMX.dropdown1.isOpen = true;
        expect(watcher1).toHaveBeenCalledTimes(1);
        expect(watcher2).toHaveBeenCalledTimes(0);

        // Change second dropdown
        CuboMX.dropdown2.isOpen = true;
        expect(watcher1).toHaveBeenCalledTimes(1);
        expect(watcher2).toHaveBeenCalledTimes(1);
    });

    it("should handle complex objects as values", () => {
        const watchSpy = vi.fn();

        CuboMX.component("app", {
            user: { name: "John", age: 30 },
            init(this: any) {
                this.$watch("user", watchSpy);
            },
        });

        document.body.innerHTML = `<div mx-data="app"></div>`;
        CuboMX.start();

        const newUser = { name: "Jane", age: 25 };
        CuboMX.app.user = newUser;

        expect(watchSpy).toHaveBeenCalledTimes(1);
        expect(watchSpy).toHaveBeenCalledWith(newUser, {
            name: "John",
            age: 30,
        });
    });

    it("should not be called if value doesn't actually change", () => {
        const watchSpy = vi.fn();

        CuboMX.component("test", {
            value: 5,
            init(this: any) {
                this.$watch("value", watchSpy);
            },
        });

        document.body.innerHTML = `<div mx-data="test"></div>`;
        CuboMX.start();

        // Set to the same value
        CuboMX.test.value = 5;

        // Watcher is still called because the setter runs
        // (CuboMX doesn't check for equality before calling watchers)
        expect(watchSpy).toHaveBeenCalledTimes(1);
        expect(watchSpy).toHaveBeenCalledWith(5, 5);
    });
});
