"use client";

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, sepolia } from '@reown/appkit/networks'
import GardenProviderWrapper from "./GardenProviderWrapper";
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import React from "react";

const queryClient = new QueryClient();

if (!projectId) {
  throw new Error('Project ID is not defined')
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, sepolia],
  defaultNetwork: mainnet,
  features: {
    analytics: true
  }
})

export default function Providers({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
          <GardenProviderWrapper>{children}</GardenProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
