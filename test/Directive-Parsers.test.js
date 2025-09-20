import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Parsers (:number, :currency)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it('should parse strings into numbers using :number', () => {
        CuboMX.component('calc', { valA: null, valB: null });
        document.body.innerHTML = `
            <div mx-data="calc">
                <span id="valA" ::text:number="valA">1,234</span>
                <span id="valB" ::text:number="valB">5.67</span>
            </div>
        `;
        CuboMX.start();

        expect(CuboMX.calc.valA).toBe(1234);
        expect(CuboMX.calc.valB).toBe(5.67);
    });

    it('should parse and format currency using global config (case-insensitive)', () => {
        CuboMX.component('cart', { price: null });
        document.body.innerHTML = `
            <div mx-data="cart">
                <span id="price" ::text:currency="price">R$ 1.999,99</span>
            </div>
        `;

        // Use lowercase and different region format to test normalization
        CuboMX.start({ locale: 'pt-br', currency: 'brl' });

        const priceEl = document.getElementById('price');

        // 1. Test initial parsing
        expect(CuboMX.cart.price).toBe(1999.99);

        // 2. Test reactive formatting
        CuboMX.cart.price = 2500.5;
        expect(priceEl.textContent).toBe('R$ 2.500,50');
    });

    it('should allow local override of currency formatting', () => {
        CuboMX.component('cart', { price: null });
        document.body.innerHTML = `
            <div mx-data="cart">
                <span id="price" ::text:currency="price" data-locale="en-US" data-currency="USD">$1,999.99</span>
            </div>
        `;

        // Global config is BR, but local attributes should win
        CuboMX.start({ locale: 'pt-BR', currency: 'BRL' });

        const priceEl = document.getElementById('price');

        // 1. Test initial parsing
        expect(CuboMX.cart.price).toBe(1999.99);

        // 2. Test reactive formatting (should use en-US)
        CuboMX.cart.price = 3500.75;
        expect(priceEl.textContent).toBe('$3,500.75');
    });

    it('should default to en-US/USD if no config is provided', () => {
        CuboMX.component('cart', { price: null });
        document.body.innerHTML = `
            <div mx-data="cart">
                <span id="price" ::text:currency="price">1234.56</span>
            </div>
        `;

        // No config passed to start()
        CuboMX.start();

        const priceEl = document.getElementById('price');

        // 1. Test initial parsing
        expect(CuboMX.cart.price).toBe(1234.56);

        // 2. Test reactive formatting (should default to USD)
        CuboMX.cart.price = 5000;
        expect(priceEl.textContent).toBe('$5,000.00');
    });
});
