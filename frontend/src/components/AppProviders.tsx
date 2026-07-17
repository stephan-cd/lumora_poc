'use client';

import React, { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeContextProvider } from './ThemeContextProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale time
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeContextProvider>{children}</ThemeContextProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};
export default AppProviders;
