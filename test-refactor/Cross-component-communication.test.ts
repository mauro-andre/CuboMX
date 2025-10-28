import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src-refactor/cubomx";

describe("Cross-Component Communication", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should allow calling methods between components", () => {
        const methodSpy = vi.fn();

        // CompA exposes a method
        CuboMX.component("compA", {
            receivedValues: [] as number[],
            receiveValue(this: any, value: number) {
                this.receivedValues.push(value);
                methodSpy(value);
            },
        });

        // CompB calls CompA's method
        CuboMX.component("compB", {
            value: 0,
            sendToCompA(this: any) {
                (CuboMX as any).compA.receiveValue(this.value);
            },
        });

        document.body.innerHTML = `
            <div mx-data="compA"></div>
            <div mx-data="compB"></div>
        `;
        CuboMX.start();

        // Call method from compB
        (CuboMX as any).compB.value = 42;
        (CuboMX as any).compB.sendToCompA();

        expect(methodSpy).toHaveBeenCalledWith(42);
        expect((CuboMX as any).compA.receivedValues).toEqual([42]);
    });

    it("should allow watching and calling methods between components", () => {
        const methodSpy = vi.fn();

        CuboMX.component("compA", {
            notifications: [] as string[],
            addNotification(this: any, message: string) {
                this.notifications.push(message);
                methodSpy(message);
            },
        });

        CuboMX.component("compB", {
            value: 0,
            init(this: any) {
                this.$watch("value", (newVal: number, oldVal: number) => {
                    (CuboMX as any).compA.addNotification(
                        `Value changed from ${oldVal} to ${newVal}`
                    );
                });
            },
        });

        document.body.innerHTML = `
            <div mx-data="compA"></div>
            <div mx-data="compB"></div>
        `;
        CuboMX.start();

        // Change value triggers watch which calls compA method
        (CuboMX as any).compB.value = 10;

        expect(methodSpy).toHaveBeenCalledWith("Value changed from 0 to 10");
        expect((CuboMX as any).compA.notifications).toEqual([
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
            init(this: any) {
                this.$watch("localValue", (newVal: number) => {
                    (CuboMX as any).bridge.value = newVal;
                });
            },
        });

        // CompA watches store
        CuboMX.component("compA", {
            init(this: any) {
                (CuboMX as any).bridge.$watch("value", (newVal: number) => {
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
        (CuboMX as any).compB.localValue = 99;

        expect(callbackSpy).toHaveBeenCalledWith(99);
        expect((CuboMX as any).bridge.value).toBe(99);
    });

    it("should allow factory components to communicate", () => {
        const methodSpy = vi.fn();

        CuboMX.component("logger", {
            logs: [] as string[],
            log(this: any, message: string) {
                this.logs.push(message);
                methodSpy(message);
            },
        });

        CuboMX.component("counter", function () {
            return {
                count: 0,
                increment(this: any) {
                    this.count++;
                    (CuboMX as any).logger.log(
                        `Counter incremented to ${this.count}`
                    );
                },
            };
        });

        document.body.innerHTML = `
            <div mx-data="logger"></div>
            <div mx-data="counter()" mx-ref="counter1"></div>
            <div mx-data="counter()" mx-ref="counter2"></div>
        `;
        CuboMX.start();

        (CuboMX as any).counter1.increment();
        (CuboMX as any).counter2.increment();
        (CuboMX as any).counter2.increment();

        expect(methodSpy).toHaveBeenCalledTimes(3);
        expect((CuboMX as any).logger.logs).toEqual([
            "Counter incremented to 1",
            "Counter incremented to 1",
            "Counter incremented to 2",
        ]);
    });

    it("should allow accessing component via mx-ref", () => {
        CuboMX.component("receiver", {
            messages: [] as string[],
            receive(this: any, msg: string) {
                this.messages.push(msg);
            },
        });

        CuboMX.component("sender", {
            send(this: any) {
                (CuboMX as any).myReceiver.receive("Hello from sender!");
            },
        });

        document.body.innerHTML = `
            <div mx-data="receiver" mx-ref="myReceiver"></div>
            <div mx-data="sender"></div>
        `;
        CuboMX.start();

        (CuboMX as any).sender.send();

        expect((CuboMX as any).myReceiver.messages).toEqual([
            "Hello from sender!",
        ]);
    });

    it("should work with stores that never get destroyed", () => {
        const watchSpy = vi.fn();

        CuboMX.store("globalState", {
            counter: 0,
            init(this: any) {
                this.$watch("counter", watchSpy);
            },
        });

        CuboMX.component("incrementer", {
            increment(this: any) {
                (CuboMX as any).globalState.counter++;
            },
        });

        document.body.innerHTML = `<div mx-data="incrementer"></div>`;
        CuboMX.start();

        (CuboMX as any).incrementer.increment();
        (CuboMX as any).incrementer.increment();

        expect(watchSpy).toHaveBeenCalledTimes(2);
        expect((CuboMX as any).globalState.counter).toBe(2);
    });

    it("should allow component to call methods on multiple other components", () => {
        CuboMX.component("compA", {
            value: 0,
            setValue(this: any, val: number) {
                this.value = val;
            },
        });

        CuboMX.component("compB", {
            value: 0,
            setValue(this: any, val: number) {
                this.value = val;
            },
        });

        CuboMX.component("broadcaster", {
            broadcast(this: any, val: number) {
                (CuboMX as any).compA.setValue(val);
                (CuboMX as any).compB.setValue(val);
            },
        });

        document.body.innerHTML = `
            <div mx-data="compA"></div>
            <div mx-data="compB"></div>
            <div mx-data="broadcaster"></div>
        `;
        CuboMX.start();

        (CuboMX as any).broadcaster.broadcast(777);

        expect((CuboMX as any).compA.value).toBe(777);
        expect((CuboMX as any).compB.value).toBe(777);
    });
});
