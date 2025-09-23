import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Thread from './Thread';

describe('Thread UI', () => {
  it('renders without crashing', () => {
    render(<Thread bookingId="test" />);
    expect(screen.getByText(/anónimo/i)).toBeTruthy();
  });
});
