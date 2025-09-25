import * as Sentry from '@sentry/node';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const envLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const envIndex = LEVELS.indexOf(envLevel);

function shouldLog(level: LogLevel) {
  return LEVELS.indexOf(level) >= envIndex;
}

function serialize(meta: unknown): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  if (typeof meta === 'object') return meta as Record<string, unknown>;
  return { value: meta };
}

let sentryInited = false;
function initSentry() {
  if (sentryInited) return;
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
    sentryInited = true;
  }
}

export function log(level: LogLevel, event: string, meta?: unknown) {
  if (!shouldLog(level)) return;
  if (level === 'error') initSentry();
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...serialize(meta),
  };
  const line = JSON.stringify(entry);
  switch (level) {
    case 'error':
      console.error(line); // eslint-disable-line no-console
      if (sentryInited) Sentry.captureMessage(event, { level: 'error', extra: serialize(meta) });
      break;
    case 'warn':
      console.warn(line); // eslint-disable-line no-console
      break;
    case 'info':
      console.log(line); // eslint-disable-line no-console
      break;
    default:
      console.debug(line); // eslint-disable-line no-console
  }
}

export const logger = {
  debug: (event: string, meta?: unknown) => log('debug', event, meta),
  info: (event: string, meta?: unknown) => log('info', event, meta),
  warn: (event: string, meta?: unknown) => log('warn', event, meta),
  error: (event: string, meta?: unknown) => log('error', event, meta),
};

export type { LogLevel };