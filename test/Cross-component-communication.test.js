import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/cubomx";
describe("Cross-Component Communication", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });
    it("should allow calling methods between components", () => {
        const methodSpy = vi.fn();
        // CompA exposes a method
        CuboMX.component("compA", {
            receivedValues: [],
            receiveValue(value) {
                this.receivedValues.push(value);
                methodSpy(value);
            },
        });
        // CompB calls CompA's method
        CuboMX.component("compB", {
            value: 0,
            sendToCompA() {
                CuboMX.compA.receiveValue(this.value);
            },
        });
        document.body.innerHTML = `
            <div mx-data="compA"></div>
            <div mx-data="compB"></div>
        `;
        CuboMX.start();
        // Call method from compB
        CuboMX.compB.value = 42;
        CuboMX.compB.sendToCompA();
        expect(methodSpy).toHaveBeenCalledWith(42);
        expect(CuboMX.compA.receivedValues).toEqual([42]);
    });
    it("should allow watching and calling methods between components", () => {
        const methodSpy = vi.fn();
        CuboMX.component("compA", {
            notifications: [],
            addNotification(message) {
                this.notifications.push(message);
                methodSpy(message);
            },
        });
        CuboMX.component("compB", {
            value: 0,
            init() {
                this.$watch("value", (newVal, oldVal) => {
                    CuboMX.compA.addNotification(`Value changed from ${oldVal} to ${newVal}`);
                });
            },
        });
        document.body.innerHTML = `
            <div mx-data="compA"></div>
            <div mx-data="compB"></div>
        `;
        CuboMX.start();
        // Change value triggers watch which calls compA method
        CuboMX.compB.value = 10;
        expect(methodSpy).toHaveBeenCalledWith("Value changed from 0 to 10");
        expect(CuboMX.compA.notifications).toEqual([
            "Value changed from 0 to 10",
        ]);
    });
    it("should work with stores as intermediaries", () => {
        const callbackSpy = vi.fn();
        // Store as event bus
        CuboMX.store("bridge", {
            value: 0,
        });
        // CompB updates store
        CuboMX.component("compB", {
            localValue: 0,
            init() {
                this.$watch("localValue", (newVal) => {
                    CuboMX.bridge.value = newVal;
                });
            },
        });
        // CompA watches store
        CuboMX.component("compA", {
            init() {
                CuboMX.bridge.$watch("value", (newVal) => {
                    callbackSpy(newVal);
                });
            },
        });
        document.body.innerHTML = `
            <div mx-data="compA"></div>
            <div mx-data="compB"></div>
        `;
        CuboMX.start();
        // Change in compB propagates through store to compA
        CuboMX.compB.localValue = 99;
        expect(callbackSpy).toHaveBeenCalledWith(99);
        expect(CuboMX.bridge.value).toBe(99);
    });
    it("should allow factory components to communicate", () => {
        const methodSpy = vi.fn();
        CuboMX.component("logger", {
            logs: [],
            log(message) {
                this.logs.push(message);
                methodSpy(message);
            },
        });
        CuboMX.component("counter", function () {
            return {
                count: 0,
                increment() {
                    this.count++;
                    CuboMX.logger.log(`Counter incremented to ${this.count}`);
                },
            };
        });
        document.body.innerHTML = `
            <div mx-data="logger"></div>
            <div mx-data="counter()" mx-ref="counter1"></div>
            <div mx-data="counter()" mx-ref="counter2"></div>
        `;
        CuboMX.start();
        CuboMX.counter1.increment();
        CuboMX.counter2.increment();
        CuboMX.counter2.increment();
        expect(methodSpy).toHaveBeenCalledTimes(3);
        expect(CuboMX.logger.logs).toEqual([
            "Counter incremented to 1",
            "Counter incremented to 1",
            "Counter incremented to 2",
        ]);
    });
    it("should allow accessing component via mx-ref", () => {
        CuboMX.component("receiver", {
            messages: [],
            receive(msg) {
                this.messages.push(msg);
            },
        });
        CuboMX.component("sender", {
            send() {
                CuboMX.myReceiver.receive("Hello from sender!");
            },
        });
        document.body.innerHTML = `
            <div mx-data="receiver" mx-ref="myReceiver"></div>
            <div mx-data="sender"></div>
        `;
        CuboMX.start();
        CuboMX.sender.send();
        expect(CuboMX.myReceiver.messages).toEqual([
            "Hello from sender!",
        ]);
    });
    it("should work with stores that never get destroyed", () => {
        const watchSpy = vi.fn();
        CuboMX.store("globalState", {
            counter: 0,
            init() {
                this.$watch("counter", watchSpy);
            },
        });
        CuboMX.component("incrementer", {
            increment() {
                CuboMX.globalState.counter++;
            },
        });
        document.body.innerHTML = `<div mx-data="incrementer"></div>`;
        CuboMX.start();
        CuboMX.incrementer.increment();
        CuboMX.incrementer.increment();
        expect(watchSpy).toHaveBeenCalledTimes(2);
        expect(CuboMX.globalState.counter).toBe(2);
    });
    it("should allow component to call methods on multiple other components", () => {
        CuboMX.component("compA", {
            value: 0,
            setValue(val) {
                this.value = val;
            },
        });
        CuboMX.component("compB", {
            value: 0,
            setValue(val) {
                this.value = val;
            },
        });
        CuboMX.component("broadcaster", {
            broadcast(val) {
                CuboMX.compA.setValue(val);
                CuboMX.compB.setValue(val);
            },
        });
        document.body.innerHTML = `
            <div mx-data="compA"></div>
            <div mx-data="compB"></div>
            <div mx-data="broadcaster"></div>
        `;
        CuboMX.start();
        CuboMX.broadcaster.broadcast(777);
        expect(CuboMX.compA.value).toBe(777);
        expect(CuboMX.compB.value).toBe(777);
    });
});
