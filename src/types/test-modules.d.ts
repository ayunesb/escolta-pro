// Helper typings used by tests to avoid 'as any' in mocks

export type ChatMessage = {
  id: string
  type: 'text' | 'system' | 'media'
  body: string
  media_path?: string
  created_at: string
}

declare module '@/hooks/useChatThread' {
  import { ChatMessage } from '@/types/test-modules'
  export function useChatThread(supabase: unknown, threadId: string): { messages: ChatMessage[] }
}

declare module '@/utils/sendChatMessage' {
  export function sendChatMessage(supabase: unknown, threadId: string, body: string): Promise<unknown>
}

declare module '@/utils/getOrCreateBookingThread' {
  export function getOrCreateBookingThread(supabase: unknown, bookingId: string): Promise<string>
}
