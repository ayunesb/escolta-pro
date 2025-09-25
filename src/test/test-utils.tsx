import React from 'react'
import { render } from '@testing-library/react'
import { SupabaseProvider } from '../contexts/SupabaseContext'
import { createMockSupabase as baseCreateMockSupabase } from '../lib/storage'
import { vi } from 'vitest'

type PartialSupabase = Partial<Record<string, unknown>>

export function createMockChannel() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
    unsubscribe: vi.fn().mockResolvedValue({}),
    send: vi.fn(),
  }
  return channel
}

export function createMockSupabase(overrides: PartialSupabase = {}) {
  const client = baseCreateMockSupabase()
  // attach channel helpers
  client.channel = vi.fn(() => createMockChannel())
  client.removeChannel = vi.fn()
  // apply overrides shallowly
  Object.assign(client, overrides)
  return client
}

export function withAuth(user: Record<string, unknown> = {}) {
  const me = { id: 'u_test', email: 'test@example.com', ...user }
  const client = createMockSupabase({
    auth: { getUser: async () => ({ data: { user: me } }) }
  })
  return { supabase: client, user: me }
}

export function mockFrom<T>(rows: T[]) {
  const fn = vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: rows, error: null }),
    insert: vi.fn().mockResolvedValue({ data: rows, error: null }),
    update: vi.fn().mockResolvedValue({ data: rows, error: null }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })
  return fn
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: { client?: unknown } & Record<string, unknown>
) {
  const mockClient = options?.client ?? createMockSupabase()
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return <SupabaseProvider client={mockClient as any}>{children}</SupabaseProvider>
  }
  const { client, ...renderOptions } = options ?? {}
  return render(ui, { wrapper: Wrapper as any, ...(renderOptions as any) })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
