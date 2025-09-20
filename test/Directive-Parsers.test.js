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
        expect(priceEl.textContent).toBe('R$\u00A02.500,50');
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

    it('should handle Euro formatting with a different locale (de-DE)', () => {
        CuboMX.component('cart', { price: null });
        document.body.innerHTML = `
            <div mx-data="cart">
                <span id="price" ::text:currency="price" data-locale="de-DE" data-currency="EUR">1.234,56 €</span>
            </div>
        `;

        // No global config, should rely on local attributes
        CuboMX.start();

        const priceEl = document.getElementById('price');

        // 1. Test initial parsing (1.234,56 -> 1234.56)
        expect(CuboMX.cart.price).toBe(1234.56);

        // 2. Test reactive formatting (should use de-DE)
        CuboMX.cart.price = 5432.1;
        // Intl for de-DE formats it with a non-breaking space
        expect(priceEl.textContent).toBe('5.432,10\u00A0€');
    });

    it('should allow adding and using a custom parser', () => {
        // 1. Define a custom parser
        const lowercaseParser = {
            parse(value) {
                return typeof value === 'string' ? value.toLowerCase() : value;
            },
            format(value) {
                return typeof value === 'string' ? value.toLowerCase() : value;
            }
        };

        // 2. Register the custom parser before start()
        CuboMX.addParser('lowercase', lowercaseParser);

        CuboMX.component('myComp', { myText: null });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span id="textEl" ::text:lowercase="myText">UPPERCASE</span>
            </div>
        `;

        CuboMX.start();
        const textEl = document.getElementById('textEl');

        // 3. Test initial parsing
        expect(CuboMX.myComp.myText).toBe('uppercase');

        // 4. Test reactive formatting
        CuboMX.myComp.myText = 'Some MixedCase';
        expect(textEl.textContent).toBe('some mixedcase');
    });
});
