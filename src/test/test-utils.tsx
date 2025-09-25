import * as React from 'react'
import { render, RenderOptions } from '@testing-library/react'
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

interface SupabaseMock {
  channel: ReturnType<typeof vi.fn>
  removeChannel: ReturnType<typeof vi.fn>
  [key: string]: unknown
}

export function createMockSupabase(overrides: PartialSupabase = {}) {
  const base = baseCreateMockSupabase() as Record<string, unknown>
  const client = base as SupabaseMock
  client.channel = vi.fn(() => createMockChannel())
  client.removeChannel = vi.fn()
  Object.assign(client, overrides)
  return client as unknown
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

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  client?: unknown
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: ProviderOptions = {}
) {
  const { client, ...renderOptions } = options
  const mockClient = client ?? createMockSupabase()
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return <SupabaseProvider client={mockClient}>{children}</SupabaseProvider>
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
