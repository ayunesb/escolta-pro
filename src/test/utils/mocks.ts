import { vi } from 'vitest'
import * as chatHook from '@/hooks/useChatThread'
import * as sendChat from '@/utils/sendChatMessage'
import * as getThread from '@/utils/getOrCreateBookingThread'

// Module interfaces for typed spies
interface ChatHookModule {
  useChatThread: (supabase: unknown, threadId: string) => { messages: ChatMessage[] }
}

interface SendChatModule {
  sendChatMessage: (supabase: unknown, threadId: string, body: string) => Promise<unknown>
}

interface GetThreadModule {
  getOrCreateBookingThread: (supabase: unknown, bookingId: string) => Promise<string>
}

export type ChatMessage = {
  id: string
  type: 'text' | 'system' | 'media'
  body: string
  media_path?: string
  created_at: string
}

export function mockUseChatThread(messages: ChatMessage[]) {
  // useChatThread(supabase, threadId) => { messages }
  return vi.spyOn(chatHook as ChatHookModule, 'useChatThread')
    .mockImplementation(() => ({ messages }))
}

export function mockSendChatMessage(resolves?: unknown, rejects?: unknown) {
  const spy = vi.spyOn(sendChat as SendChatModule, 'sendChatMessage')
  if (rejects !== undefined) spy.mockRejectedValue(rejects)
  else spy.mockResolvedValue(resolves)
  return spy
}

export function mockGetOrCreateBookingThread(threadId = 'thread-1') {
  return vi.spyOn(getThread as GetThreadModule, 'getOrCreateBookingThread')
    .mockResolvedValue(threadId)
}
