// Temporary module shims for server-side only code paths not bundled in client build.
// Provide minimal types to unblock typechecking until dedicated server tsconfig is introduced.
declare module '@vercel/node' {
  export interface VercelRequest {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
  }
  export interface VercelResponse {
    status: (code: number) => VercelResponse;
    send: (body: unknown) => void;
    json: (body: unknown) => void;
  }
}

// Stripe server SDK types are provided by the package; this shim only exists if resolution fails in bundler mode.
declare module 'stripe' {
  import StripeNamespace from 'stripe';
  export default StripeNamespace;
}