import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Thread from './Thread';
import { renderWithProviders, createMockSupabase } from '../../test/test-utils';

const mockSupabase = createMockSupabase();

describe('Thread UI', () => {
  it('renders without crashing', async () => {
  renderWithProviders(<Thread bookingId="test" />, { client: mockSupabase });
    // wait for the anonymous placeholder to appear (use findByText to await state updates)
    const el = await screen.findByText(/anónimo/i);
    expect(el).toBeTruthy();
  });
});
