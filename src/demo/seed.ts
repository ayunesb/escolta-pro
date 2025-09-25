import { seedDemoData } from './shims';

export function ensureDemoSeed() {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    seedDemoData();
  }
}

ensureDemoSeed();
