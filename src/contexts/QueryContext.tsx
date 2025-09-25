import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as Record<string, unknown>).status as unknown;
          if (typeof status === 'number' && status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: 'always'
    },
    mutations: {
      retry: false
    }
  }
});

interface QueryContextProviderProps {
  children: ReactNode;
}

export const QueryContextProvider = ({ children }: QueryContextProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export { queryClient };