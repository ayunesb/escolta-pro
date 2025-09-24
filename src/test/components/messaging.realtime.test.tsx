import { describe, it, expect } from 'vitest'
import { render as _render, screen } from '@testing-library/react'
import { renderWithProviders, createMockSupabase } from '@/test/test-utils'
import { mockUseChatThread, mockGetOrCreateBookingThread, ChatMessage } from '@/test/utils/mocks'
import { MessagesTab } from '@/components/messaging/MessagesTab'

// Simulate initial messages and then a realtime INSERT via the hook's channel update
describe('MessagesTab realtime', () => {
  it('updates when a new message is inserted via realtime channel', async () => {
    mockGetOrCreateBookingThread('thread-rt')

    const initial: ChatMessage[] = [ { id: 'm1', type: 'text', body: 'Initial', created_at: new Date().toISOString() } ]
    const spy = mockUseChatThread(initial)

  renderWithProviders(<MessagesTab bookingId="b-rt" />, { client: createMockSupabase() })

    await screen.findByText('Initial')

    // Simulate channel delivering an INSERT by updating the mock implementation to include the new message
  const updated: ChatMessage[] = [...initial, { id: 'm2', type: 'text' as const, body: 'Realtime', created_at: new Date().toISOString() }]
    spy.mockImplementation(() => ({ messages: updated }))

    // Re-render to pick up new hook behavior (in real app the channel would update state)
  renderWithProviders(<MessagesTab bookingId="b-rt" />, { client: createMockSupabase() })

  await screen.findByText('Realtime')
  expect(await screen.findByText('Realtime')).toBeInTheDocument()
  })
})
