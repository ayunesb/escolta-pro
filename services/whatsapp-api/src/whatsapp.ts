import { Router } from 'express';
import { getDraft, updateDraft, resetDraft } from './state.supabase.js';
import { verifyTwilioSignature } from './util/twilioVerify.js';
import { guardMatchPrompt, bookingBotPrompt, upsellPrompt } from './llm.js';

export const whatsappRouter = Router();

function twilioBaseUrl(req: any) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

whatsappRouter.post('/', async (req, res) => {
  try {
    const signature = req.headers['x-twilio-signature'] as string | undefined;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const url = twilioBaseUrl(req) + req.originalUrl;

    // Twilio sends form-encoded keys; use req.body as flat record
    const params = Object.fromEntries(
      Object.entries(req.body || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])
    );

    if (!verifyTwilioSignature({ authToken, url, params, signature })) {
      return res.status(403).send('bad signature');
    }

    const from = (params.From || params.FromNumber || '').toString();
    const text = (params.Body || '').toString().trim();
    const lang: 'es' | 'en' = /[áéíóúñ¿¡]/i.test(text) || /[a-z]/i.test(text) ? 'es' : 'en'; // naïve; tweak later

    const draft = await getDraft(from);

    // If we already have all fields, allow direct confirmation keywords
    if (draft.state === 'CONFIRM' && /^(\b(yes|si|sí|confirm(ar)?|ok)\b)$/i.test(text)) {
      await updateDraft(from, { state: 'DONE' });
      const upsell = await upsellPrompt({ lang, booking: { coverage: draft.coverage!, hours: 4 } });
      await resetDraft(from);
      return twiml(res, `✅ Booking confirmed.\n${upsell}`);
    }

    // Ask LLM concierge what to do next (keeps tone natural)
    const bot = await bookingBotPrompt({
      lang,
      state: draft.state,
      have: { datetime: draft.datetime, location: draft.location, coverage: draft.coverage, notes: draft.notes },
      userText: text
    });

    // Heuristic: try to capture values by simple rules first
    if (draft.state === 'ASK_DATETIME' && /\d/.test(text)) await updateDraft(from, { datetime: text, state: 'ASK_LOCATION' });
    else if (draft.state === 'ASK_LOCATION' && text.length > 3) await updateDraft(from, { location: text, state: 'ASK_COVERAGE' });
    else if (draft.state === 'ASK_COVERAGE' && /(residential|nightclub|vip|event)/i.test(text)) {
      const cov = text.toLowerCase().match(/residential|nightclub|vip|event/)![0] as any;
      await updateDraft(from, { coverage: cov, state: 'ASK_NOTES' });
    } else if (draft.state === 'ASK_NOTES') {
      await updateDraft(from, { notes: text, state: 'MATCHING' });
    }

    // If we reached MATCHING → call matcher and propose options
    const fresh = await getDraft(from);
    if (fresh.state === 'MATCHING' && fresh.datetime && fresh.location && fresh.coverage) {
      const { fetchCandidateGuards } = await import('./guards.js');
      const guards = await fetchCandidateGuards();

      const recs = await guardMatchPrompt({
        request: { datetime: fresh.datetime, location: fresh.location, coverage: fresh.coverage },
        guards
      });

      await updateDraft(from, { state: 'CONFIRM' });

      const lines = recs
        .sort((a, b) => a.rank - b.rank)
        .map(r => `${r.rank}. ${r.display_name} — ${r.short_reason}`);
      return twiml(
        res,
        `Propuestas de guardias:\n${lines.join('\n')}\n\nResponde con 1, 2 o 3 para confirmar.`
      );
    }

    // Otherwise use bot text
    const reply = bot?.reply_text || 'Ok, dime la fecha y hora por favor.';
    return twiml(res, reply);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send('internal error');
  }
});

function twiml(res: any, message: string) {
  res.type('text/xml').send(`<Response><Message>${escapeXml(message)}</Message></Response>`);
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}
