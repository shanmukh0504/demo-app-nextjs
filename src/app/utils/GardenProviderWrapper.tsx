"use client";

import { GardenProvider } from "@gardenfi/react-hooks";
import { Environment } from "@gardenfi/utils";
import { useWalletClient } from "wagmi";

function GardenProviderWrapper({ children }: { children: React.ReactNode }) {
  const { data: walletClient } = useWalletClient();

  return (
    <GardenProvider
      config={{
        store: localStorage,
        environment: Environment.TESTNET,
        walletClient: walletClient,
      }}
    >
      {children}
    </GardenProvider>
  );
}

export default GardenProviderWrapper;
