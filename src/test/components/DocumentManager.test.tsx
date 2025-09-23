import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentManager } from '@/components/documents/DocumentManager'
import { useAuth } from '@/contexts/AuthContext'

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.pdf' }, error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { signed_url: 'https://example.com/signed' } })
    }
  }
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}))

describe('DocumentManager', () => {
  const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2023-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      hasRole: vi.fn().mockReturnValue(false),
      session: null,
      userRoles: [],
      activeRole: null,
      setRole: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })
  })

  it('renders upload section', async () => {
    await act(async () => {
      render(<DocumentManager />)
      // allow any pending promises in effects to resolve
      await Promise.resolve()
    })

    expect(screen.getByText('Upload Document')).toBeInTheDocument()
    expect(screen.getByLabelText('Select File')).toBeInTheDocument()
    expect(screen.getByLabelText('Document Type')).toBeInTheDocument()
  })

  it('renders documents list section', async () => {
    await act(async () => {
      render(<DocumentManager />)
      await Promise.resolve()
    })

    expect(screen.getByText(/Documents \(0\)/)).toBeInTheDocument()
  })

  it('shows file validation message', async () => {
    await act(async () => {
      render(<DocumentManager />)
      await Promise.resolve()
    })

    expect(screen.getByText('Max size: 10.0MB')).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<DocumentManager />)
    })

    const fileInput = screen.getByLabelText('Select File')
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    await act(async () => {
      await user.upload(fileInput, file)
    })

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
  })

  it('shows upload button when file is selected', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<DocumentManager />)
    })

    const fileInput = screen.getByLabelText('Select File')
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    await act(async () => {
      await user.upload(fileInput, file)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    })
  })

  it('validates file size', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<DocumentManager maxSizeBytes={1024} />)
    })

    const fileInput = screen.getByLabelText('Select File')
    const largeFile = new File(['x'.repeat(2048)], 'large.pdf', { type: 'application/pdf' })

    await act(async () => {
      await user.upload(fileInput, largeFile)
    })

    // Should not show the file since it's too large
    await waitFor(() => {
      expect(screen.queryByText('large.pdf')).not.toBeInTheDocument()
    })
  })

  it('changes document type', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<DocumentManager />)
    })

    const select = screen.getByLabelText('Document Type')
    await act(async () => {
      await user.selectOptions(select, 'license')
    })

    expect(select).toHaveValue('license')
  })
})