import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockUseChatThread, mockSendChatMessage, mockGetOrCreateBookingThread, ChatMessage } from '@/test/utils/mocks'

// Use renderWithProviders to supply a mock supabase client when tests need it
import { renderWithProviders, createMockSupabase } from '@/test/test-utils'

// Base mock for useChatThread; tests will override with helpers
vi.mock('@/hooks/useChatThread', () => ({
  useChatThread: () => ({ messages: [] })
}))

vi.mock('@/utils/sendChatMessage', () => ({
  sendChatMessage: vi.fn()
}))

vi.mock('@/utils/getOrCreateBookingThread', () => ({
  getOrCreateBookingThread: vi.fn().mockResolvedValue('thread-1')
}))

import { MessagesTab } from '@/components/messaging/MessagesTab'

describe('MessagesTab edge cases', () => {
  it('renders a media message with image', async () => {
    mockGetOrCreateBookingThread('thread-1')
    const messages: ChatMessage[] = [
      { id: 'm1', type: 'text', body: 'Hi', created_at: new Date().toISOString() },
      { id: 'm2', type: 'media', body: 'Image below', media_path: 'https://example.com/img.png', created_at: new Date().toISOString() }
    ]
    mockUseChatThread(messages)

  renderWithProviders(<MessagesTab bookingId="b1" />, { client: createMockSupabase() })

    await screen.findByText('Hi')
    const img = await screen.findByAltText('media')
    expect(img).toHaveAttribute('src', 'https://example.com/img.png')
  })

  it('renders a system message', async () => {
    mockGetOrCreateBookingThread('thread-2')
    const messages: ChatMessage[] = [
      { id: 's1', type: 'system', body: 'System notice', created_at: new Date().toISOString() }
    ]
    mockUseChatThread(messages)

    renderWithProviders(<MessagesTab bookingId="b2" />, { client: createMockSupabase() })

  await screen.findByText('System notice')
  expect(await screen.findByText('System')).toBeInTheDocument()
  })

  it('handles send error gracefully', async () => {
  mockGetOrCreateBookingThread('thread-3')
  mockSendChatMessage(undefined, new Error('Network'))

  // Provide an initial thread and messages
  const messages: ChatMessage[] = [ { id: 'm1', type: 'text', body: 'Hello', created_at: new Date().toISOString() } ]
  mockUseChatThread(messages)

  const { getByPlaceholderText } = renderWithProviders(<MessagesTab bookingId="b3" />, { client: createMockSupabase() })

  await screen.findByText('Hello')

  const input = getByPlaceholderText('Type a message...') as HTMLInputElement
  await userEvent.type(input, 'Fail message')
  await userEvent.click(await screen.findByText('Send'))

  // After failed send, input should still contain the message
  expect(input).toHaveValue('Fail message')
  })
})
