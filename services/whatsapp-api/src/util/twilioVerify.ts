import crypto from 'crypto';

export function verifyTwilioSignature({
  authToken,
  url,
  params,
  signature
}: {
  authToken: string;
  url: string;            // full URL Twilio hit (https://.../webhooks/whatsapp)
  params: Record<string, string>;
  signature?: string;
}) {
  if (!signature) return false;

  // Twilio signature = base64(HMAC_SHA1(authToken, url + paramKVsSorted))
  const sortedKeys = Object.keys(params).sort();
  const data = url + sortedKeys.map(k => k + params[k]).join('');
  const hmac = crypto.createHmac('sha1', authToken).update(data).digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}
