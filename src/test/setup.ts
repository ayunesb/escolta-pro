import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'
import { createMockSupabase } from '../lib/storage'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock IntersectionObserver
const IntersectionObserverMock: typeof IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
  observe() { /* no-op */ }
  disconnect() { /* no-op */ }
  unobserve() { /* no-op */ }
  takeRecords() { return [] as IntersectionObserverEntry[] }
};

(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver = IntersectionObserverMock;

// Mock ResizeObserver used by some UI libs (radix, etc.)
const ResizeObserverMock: typeof ResizeObserver = class ResizeObserver {
  observe() { /* no-op */ }
  unobserve() { /* no-op */ }
  disconnect() { /* no-op */ }
};
(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserverMock;

// Tests should use createMockSupabase() from test utils; no global mock exported anymore.