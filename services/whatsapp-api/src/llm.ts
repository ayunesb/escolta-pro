import OpenAI from 'openai';
import { z } from 'zod';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ---------- Schemas ----------
export const MatchItem = z.object({
  guard_id: z.string(),
  display_name: z.string(),
  rank: z.number().int().min(1).max(3),
  short_reason: z.string().max(120),
  confidence: z.number().min(0).max(1)
});
export const MatchResult = z.array(MatchItem);

export async function guardMatchPrompt(input: {
  request: {
    datetime: string;
    location: string;
    coverage: 'residential' | 'nightclub' | 'vip' | 'event';
    notes?: string;
  };
  guards: Array<{ guard_id: string; display_name: string; armed?: boolean; rating?: number; km?: number; certs?: string[] }>;
}) {
  const system = `
You are the Blindado Guard Matcher.
Given a client request and a list of guards, return the TOP 3 as JSON only:
[{guard_id, display_name, rank(1-3), short_reason(<=20 words), confidence(0..1)}].
Rank by certifications, ARMED fit, reliability, proximity, ratings. Keep reasons plain-language.
  `.trim();

  const user = JSON.stringify(input);

  const res = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  });

  const text = res.output_text?.trim() || '[]';
  const parsed = MatchResult.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error('LLM guardMatch invalid JSON');
  return parsed.data;
}

export async function bookingBotPrompt(context: {
  lang: 'es' | 'en';
  state: string;
  have: { datetime?: string; location?: string; coverage?: string; notes?: string };
  userText: string;
}) {
  const system = `
You are the Blindado Concierge Bot for WhatsApp.
Goal: collect date/time, location, coverage_type (residential|nightclub|vip|event), special_instructions; then say CONFIRMED and hand off.
Be concise, friendly, bilingual (reply in the user's language), emoji-light ✅.
Return ONLY JSON: { reply_text: string, next_state: string }.
  `.trim();

  const res = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(context) }
    ]
  });

  return JSON.parse(res.output_text || '{}') as { reply_text: string; next_state: string };
}

export async function upsellPrompt(input: {
  lang: 'es' | 'en';
  booking: { coverage: string; hours: number };
}) {
  const system = `
You are the Blindado Upgrade Advisor.
After a confirmed booking, suggest ONE premium upgrade in <=25 words from:
- Armed Guard
- VIP Escort Package
- 24/7 Coverage
Polite, optional, no pressure. Output plain text only.
  `.trim();

  const res = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(input) }
    ]
  });

  return (res.output_text || '').trim();
}

// (You can add opsReportPrompt and incidentFormatterPrompt similarly when you wire those endpoints)
