// Central observability types (analytics, monitoring, security, system metrics)
// Keeping this small & generic to avoid circular deps.
export type Metadata = Record<string, unknown>;

export interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  success: boolean;
  error?: string;
  metadata?: Metadata;
}
