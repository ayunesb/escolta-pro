import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Thread from './Thread';

describe('Thread UI', () => {
  it('renders without crashing', async () => {
    render(<Thread bookingId="test" />);
    // wait for the anonymous placeholder to appear (use findByText to await state updates)
    const el = await screen.findByText(/anónimo/i);
    expect(el).toBeTruthy();
  });
});
