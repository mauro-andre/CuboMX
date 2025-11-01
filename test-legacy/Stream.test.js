import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

// Holds the instances of our mock so tests can control them
let mockEventSourceInstances = [];

// Mock of the browser's EventSource class
class MockEventSource {
    constructor(url) {
        this.url = url;
        this.listeners = {};
        this.close = vi.fn(); // Mock for the close method
        mockEventSourceInstances.push(this); // Store the instance for the test to use
    }

    addEventListener(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    // Simulates the server sending an event to the client
    _simulateServerEvent(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(cb => cb({ data }));
        }
    }

    // Getter/setter for onmessage, which is a shortcut for the 'message' event
    set onmessage(callback) {
        this.addEventListener('message', callback);
    }
}

describe('CuboMX.stream()', () => {
    let originalEventSource;

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.useFakeTimers();

        // Replace the global browser API with our mock
        originalEventSource = window.EventSource;
        window.EventSource = MockEventSource;
        mockEventSourceInstances = []; // Clear instances before each test
    });

    afterEach(() => {
        // Restore the original API to not affect other tests
        window.EventSource = originalEventSource;
        vi.restoreAllMocks();
    });

    it('should handle client-defined listeners for different named events (Client-Decide Mode)', async () => {
        // Arrange: DOM with multiple targets
        document.body.innerHTML = `
            <div mx-data="dashboard">
                <ul id="chat-list"></ul>
                <span id="notification-badge"></span>
            </div>
        `;

        // Arrange: Component using the "listeners" mode
        CuboMX.component('dashboard', {
            init() {
                CuboMX.stream({
                    url: '/test-stream',
                    listeners: [
                        {
                            event: 'chat-message',
                            strategies: [{ target: '#chat-list:beforeend' }]
                        },
                        {
                            event: 'notification-update',
                            strategies: [{ select: "this", target: '#notification-badge:innerHTML' }]
                        }
                    ]
                });
            }
        });

        CuboMX.start();

        // Assert: Ensure the connection was created
        expect(mockEventSourceInstances.length).toBe(1);
        const mockStream = mockEventSourceInstances[0];

        // Act 1: Simulate receiving a chat message
        mockStream._simulateServerEvent('chat-message', '<li>Hello</li>');
        await vi.runAllTimersAsync();

        // Assert 1: Check if the chat DOM was updated
        expect(document.querySelector('#chat-list').innerHTML).toContain('<li>Hello</li>');
        expect(document.querySelector('#notification-badge').innerHTML).toBe('');

        // Act 2: Simulate receiving a notification
        mockStream._simulateServerEvent('notification-update', '<span>3</span>');
        await vi.runAllTimersAsync();

        // Assert 2: Check if the notification DOM was updated
        expect(document.querySelector('#notification-badge').innerHTML).toContain('<span>3</span>');
    });

    it('should process server-driven events with self-contained payloads (Server-Commands Mode)', async () => {
        // Arrange: DOM with a target
        document.body.innerHTML = `<div mx-data="generic-receiver"><div id="target"></div></div>`;

        // Arrange: Component connects without listeners
        CuboMX.component('generic-receiver', {
            init() {
                CuboMX.stream({ url: '/server-driven-stream' });
            }
        });

        CuboMX.start();
        const mockStream = mockEventSourceInstances[0];

        // Act: Simulate an event with HTML and strategies in the payload
        const payload = {
            html: '<h1>Title</h1>',
            strategies: [{ select: 'this', target: '#target:innerHTML' }]
        };
        mockStream._simulateServerEvent('message', JSON.stringify(payload));
        await vi.runAllTimersAsync();

        // Assert: Check if the DOM was updated according to server instructions
        expect(document.querySelector('#target').innerHTML).toBe('<h1>Title</h1>');
    });

    it('should close the connection when the component is destroyed', async () => {
        // Arrange
        const container = document.createElement('div');
        container.innerHTML = '<div mx-data="streamer"></div>';
        document.body.appendChild(container);

        CuboMX.component('streamer', {
            stream: null,
            init() {
                this.stream = CuboMX.stream({ url: '/test' });
            },
            destroy() {
                if (this.stream) {
                    this.stream.close();
                }
            }
        });

        CuboMX.start();
        const mockStream = mockEventSourceInstances[0];
        const closeSpy = vi.spyOn(mockStream, 'close');

        // Act: Remove the element from the DOM
        container.remove();
        await vi.runAllTimersAsync();

        // Assert: The close() method of our mock instance should have been called
        expect(closeSpy).toHaveBeenCalledTimes(1);
    });
});
