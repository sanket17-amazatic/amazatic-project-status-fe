import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client. Per-query polling intervals (1-5 min short
 * polling, CLAUDE.md) are set on individual `useQuery` calls, not here.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
