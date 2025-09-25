import { useEffect, useState, useRef } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

type Message = {
  id: string;
  booking_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
};

// Minimal supabase-like shape used locally to avoid widespread `any` casts.
type SupabaseLike = {
  from?: (...args: unknown[]) => unknown;
  channel?: (...args: unknown[]) => unknown;
  auth?: { getUser?: () => Promise<unknown> } | unknown;
  removeChannel?: (c: unknown) => void;
};

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function _getNestedUserId(user: unknown): string | null {
  if (!isRecord(user)) return null;
  const data = user.data;
  if (!isRecord(data)) return null;
  const u = data.user;
  if (!isRecord(u)) return null;
  return typeof u.id === 'string' ? u.id : null;
}

export function useChat(bookingId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const subRef = useRef<unknown | null>(null);
  const supabase = useSupabase();

  useEffect(() => {
    if (!bookingId) return;

    let mounted = true;

    if (supabase && typeof supabase === 'object' && typeof (supabase as SupabaseLike).from === 'function') {
      const s = supabase as SupabaseLike;
      const promise = s.from!('messages');

      // promise may be a Postgrest-style response or a Promise resolving to it
      Promise.resolve(promise).then((res: unknown) => {
        if (!mounted) return;
        const data = isRecord(res) && 'data' in res ? (res as Record<string, unknown>).data : undefined;
        setMessages(Array.isArray(data) ? (data as Message[]) : []);
      });
    }

    if (supabase && typeof supabase === 'object' && typeof (supabase as SupabaseLike).channel === 'function') {
      const s = supabase as SupabaseLike;
      // channel API shape is dynamic; guard method calls without `any`
      const maybeChannel = typeof s.channel === 'function' ? s.channel!(`public:messages:booking:${bookingId}`) : null;
      const ch = maybeChannel as unknown as Record<string, unknown> | null;
      if (ch && typeof ch.on === 'function') {
        try {
          ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` }, (payload: unknown) => {
            if (isRecord(payload) && 'new' in payload) {
              const p = (payload as Record<string, unknown>).new;
              if (isRecord(p)) setMessages((prev) => [...prev, p as Message]);
            }
          });
          if (typeof ch.subscribe === 'function') ch.subscribe();
        } catch (e) {
          // ignore realtime setup failures
        }
      }

  subRef.current = ch;
    }

    return () => {
      mounted = false;
      try {
        if (subRef.current && supabase && typeof (supabase as SupabaseLike).removeChannel === 'function') {
          const s = supabase as SupabaseLike;
          s.removeChannel!(subRef.current);
        }
      } catch (e) {
        // swallow cleanup errors to avoid breaking unmount
      }
    };
  }, [bookingId, supabase]);

  const send = async (body: string) => {
    if (!bookingId || !body) return null;
    const s = supabase as SupabaseLike;
    let user: unknown = null;
    if (s?.auth && typeof (s.auth as Record<string, unknown>).getUser === 'function') {
      // getUser returns platform-specific object; keep unknown and extract id via helper
      // call via unknown and guard result
      // @ts-ignore runtime boundary
      user = await (s.auth as Record<string, unknown>).getUser();
    }
  const res = await sendMessage(supabase, bookingId, body);
    if (res) setMessages((prev) => [...prev, res]);
    return res;
  };

  const updateMessage = async (id: string, newBody: string) => {
    // optimistic update
    const prev = messages;
    setMessages((m) => m.map((it) => (it.id === id ? { ...it, body: newBody } : it)));
    let error: unknown = null
    if (supabase && typeof supabase === 'object' && typeof (supabase as SupabaseLike).from === 'function') {
      const s = supabase as unknown as Record<string, unknown>;
      const fromFn = s.from as unknown;
      if (typeof fromFn === 'function') {
        // call table mutator and guard result shape
  // dynamic PostgREST client - keep local any to invoke chainable API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (fromFn as any)('messages').update({ body: newBody }).eq('id', id);
        error = isRecord(r) && 'error' in r ? (r as Record<string, unknown>).error : null;
      }
    }
    if (error) {
      // revert
      setMessages(prev);
      throw error;
    }
    return true;
  };

  return { messages, send, updateMessage };
}

export async function sendMessage(client: unknown, bookingId: string, body: string) {
  // client is the supabase client; use runtime guards instead of `any` where possible
  if (!client || typeof client !== 'object') throw new Error('invalid client');
  const c = client as SupabaseLike;
  const auth = c.auth as Record<string, unknown> | undefined;
  const maybeUser = auth && typeof auth.getUser === 'function' ? await (auth.getUser as unknown as () => Promise<unknown>)() : null;
  const sender_id = isRecord(maybeUser) && isRecord(maybeUser['data']) && isRecord(maybeUser['data']['user']) && typeof (maybeUser['data']['user'] as Record<string, unknown>)['id'] === 'string'
    ? ((maybeUser['data'] as Record<string, unknown>)['user'] as Record<string, unknown>)['id'] as string
    : null;
  if (!c.from || typeof c.from !== 'function') throw new Error('invalid client');
  const fromFn = c.from as unknown as (...args: unknown[]) => unknown;
  const fromFnFn = fromFn as (...args: unknown[]) => unknown;
  const insertCall = fromFnFn('messages');
  // call insert/select dynamically and guard result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promise = (insertCall as any).insert({ booking_id: bookingId, sender_id, body }).select()?.single?.() ?? (insertCall as any).insert({ booking_id: bookingId, sender_id, body }).select();
  const res = await Promise.resolve(promise);
  return isRecord(res) && 'data' in res ? (res.data as Message) : null;
}
