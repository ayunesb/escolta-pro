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
const IntersectionObserverMock = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []
  
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
  takeRecords() {
    return []
  }
} as any;

// Assign mock directly to global. Don't reference native IntersectionObserver.prototype
;(global as any).IntersectionObserver = IntersectionObserverMock;

// Mock ResizeObserver used by some UI libs (radix, etc.)
const ResizeObserverMock = class ResizeObserver {
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}
;(global as any).ResizeObserver = ResizeObserverMock;

// Tests should use createMockSupabase() from test utils; no global mock exported anymore.