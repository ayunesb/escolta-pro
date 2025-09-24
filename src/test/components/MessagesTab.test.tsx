import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, createMockSupabase } from '@/test/test-utils'
import { MessagesTab } from '@/components/messaging/MessagesTab';

// supabase integration not needed for this test; hooks are mocked instead
vi.mock('@/hooks/useChatThread', () => ({
  useChatThread: () => ({ messages: [
    { id: '1', type: 'text', body: 'Hello', created_at: new Date().toISOString() },
    { id: '2', type: 'text', body: 'World', created_at: new Date().toISOString() }
  ] })
}));
vi.mock('@/utils/sendChatMessage', () => ({
  sendChatMessage: vi.fn().mockResolvedValue(undefined),
  getOrCreateBookingThread: vi.fn().mockResolvedValue('thread-1')
}));
vi.mock('@/utils/getOrCreateBookingThread', () => ({
  getOrCreateBookingThread: vi.fn().mockResolvedValue('thread-1')
}));

describe('MessagesTab', () => {
  it('renders messages and sends a new message', async () => {
  renderWithProviders(<MessagesTab bookingId="booking-1" />, { client: createMockSupabase() });
  await screen.findByText('Hello');
  await screen.findByText('World');

    fireEvent.change(screen.getByPlaceholderText('Type a message...'), { target: { value: 'Test message' } });
    fireEvent.click(await screen.findByText('Send'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue('');
    });
  });
});
