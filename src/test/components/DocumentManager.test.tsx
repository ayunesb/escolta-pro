import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      hasRole: vi.fn().mockReturnValue(false),
      session: null,
      userRoles: [],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    })
  })

  it('renders upload section', () => {
    render(<DocumentManager />)
    
    expect(screen.getByText('Upload Document')).toBeInTheDocument()
    expect(screen.getByLabelText('Select File')).toBeInTheDocument()
    expect(screen.getByLabelText('Document Type')).toBeInTheDocument()
  })

  it('renders documents list section', () => {
    render(<DocumentManager />)
    
    expect(screen.getByText(/Documents \(0\)/)).toBeInTheDocument()
  })

  it('shows file validation message', () => {
    render(<DocumentManager />)
    
    expect(screen.getByText('Max size: 10.0MB')).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    render(<DocumentManager />)
    
    const fileInput = screen.getByLabelText('Select File')
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
  })

  it('shows upload button when file is selected', async () => {
    render(<DocumentManager />)
    
    const fileInput = screen.getByLabelText('Select File')
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    })
  })

  it('validates file size', async () => {
    render(<DocumentManager maxSizeBytes={1024} />)
    
    const fileInput = screen.getByLabelText('Select File')
    const largeFile = new File(['x'.repeat(2048)], 'large.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } })
    
    // Should not show the file since it's too large
    await waitFor(() => {
      expect(screen.queryByText('large.pdf')).not.toBeInTheDocument()
    })
  })

  it('changes document type', () => {
    render(<DocumentManager />)
    
    const select = screen.getByLabelText('Document Type')
    fireEvent.change(select, { target: { value: 'license' } })
    
    expect(select).toHaveValue('license')
  })
})