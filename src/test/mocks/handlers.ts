import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Supabase API endpoints
  http.get('https://isnezquuwepqcjkaupjh.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: [] })
  }),

  // Mock Supabase Auth endpoints
  http.post('https://isnezquuwepqcjkaupjh.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        email: 'test@example.com'
      }
    })
  }),

  // Mock Edge Functions
  http.post('https://isnezquuwepqcjkaupjh.supabase.co/functions/v1/*', () => {
    return HttpResponse.json({ success: true })
  }),
]