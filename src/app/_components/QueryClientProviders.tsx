"use client";

import { queryClient, trpcClient } from "@/client";
import { trpc } from "@/client/trpc";
import { QueryClientProvider } from "@tanstack/react-query";

export function QueryProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  );
}

/* di layout.tsx tinggal buat seperti ini
   <html lang="en">
     <body
       className={`${geistSans.variable} ${geistMono.variable} antialiased`}
     >
      <Providers>
         {children}
      </Providers>
     </body>
   </html>
*/