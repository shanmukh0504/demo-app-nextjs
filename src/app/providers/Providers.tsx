"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import GardenProviderWrapper from "./GardenProviderWrapper";
import { wagmiConfig } from "../utils/wagmiConfig";
import React, { useEffect, useState } from "react";
import { BTCWalletProvider } from "@gardenfi/wallet-connectors";
import { Environment, Network } from "@gardenfi/utils";
export const network: Environment | Network = Environment.TESTNET;

function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const [store, setStore] = useState<Storage | null>(null);

  useEffect(() => {
    setStore(localStorage);
  }, []);

  if (!store) return null;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BTCWalletProvider network={network as Network} store={localStorage}>
          <GardenProviderWrapper>{children}</GardenProviderWrapper>
        </BTCWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default Providers;
