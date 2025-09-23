# Blindado WhatsApp API

A minimal, production-ready WhatsApp concierge for Blindado.

## Features
- Twilio WhatsApp webhook with signature verification
- Tiny booking state machine
- OpenAI wrapper with 5 Blindado system prompts (matching, concierge, ops report, incident formatter, upsell)
- Health route and ready scripts
- Easily deployable (Railway, Fly, Render, Vercel Functions)
- Works locally with ngrok

## File Tree
```
whatsapp-api/
  package.json
  tsconfig.json
  .env.example
  src/
    index.ts
    whatsapp.ts
    state.ts
    llm.ts
    util/
      twilioVerify.ts
```

## Setup & Run Locally
1. Copy `.env.example` to `.env` and fill in your secrets.
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Start the dev server:
   ```sh
   pnpm dev
   ```
4. Simulate a WhatsApp webhook:
   ```sh
   curl -X POST http://localhost:3000/webhooks/whatsapp \
     -H "Content-Type: application/x-www-form-urlencoded" \
     --data 'From=whatsapp:+521111111111&Body=Necesito guardia el sábado 7pm en Tulum'
   ```
5. Expose locally with ngrok:
   ```sh
   ngrok http 3000
   ```
   Paste the ngrok URL into Twilio WhatsApp Sandbox "When a message comes in".

## Environment Variables
See `.env.example` for required variables:
- `PORT`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `ADMIN_WHATSAPP_TO`
- `PUBLIC_BASE_URL`

## Notes
- Real Twilio signature verification
- In-memory booking FSM (swap for Supabase later)
- Mocked guard list for matching
- Clean separation for future DB integration
