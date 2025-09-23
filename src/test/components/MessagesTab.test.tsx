import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessagesTab } from '@/components/messaging/MessagesTab';

vi.mock('@/integrations/supabase/client');
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
    render(<MessagesTab bookingId="booking-1" />);
  await screen.findByText('Hello');
  await screen.findByText('World');

    fireEvent.change(screen.getByPlaceholderText('Type a message...'), { target: { value: 'Test message' } });
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue('');
    });
  });
});
