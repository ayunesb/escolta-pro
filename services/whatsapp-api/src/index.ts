import 'dotenv/config';
import express from 'express';
import { whatsappRouter } from './whatsapp.js';

const app = express();

// Twilio sends application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/health', (_req, res) => {
  const ok = !!process.env.OPENAI_API_KEY && !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;
  res.status(ok ? 200 : 500).json({
    ok,
    requires: ['OPENAI_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
  });
});

app.use('/webhooks/whatsapp', whatsappRouter);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Blindado WhatsApp API listening on :${port}`));
