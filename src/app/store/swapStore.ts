import { create } from "zustand";
import { SupportedAssets } from "@gardenfi/orderbook";
import { SwapParams } from "@gardenfi/core";

interface SwapState {
  swapParams: SwapParams;
  inputAmount: string;
  btcAddress: string;
  errorMessage: string | null;
  loading: boolean;
  isBtcToWbtc: boolean;
  setSwapParams: (params: Partial<SwapState["swapParams"]>) => void;
  setInputAmount: (amount: string) => void;
  setBtcAddress: (address: string) => void;
  setErrorMessage: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
  toggleSwapDirection: () => void;
}

export const swapStore = create<SwapState>((set) => ({
  swapParams: {
    fromAsset: SupportedAssets.testnet.ethereum_sepolia_WBTC,
    toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
    sendAmount: "0",
    receiveAmount: "0",
    additionalData: { strategyId: ""},
  },
  inputAmount: "",
  btcAddress: "",
  errorMessage: null,
  loading: false,
  isBtcToWbtc: false,
  setSwapParams: (params) =>
    set((state) => ({
      swapParams: { ...state.swapParams, ...params },
    })),
  setInputAmount: (amount) => set({ inputAmount: amount }),
  setBtcAddress: (address) => set({ btcAddress: address }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setLoading: (loading) => set({ loading }),
  toggleSwapDirection: () =>
    set((state) => ({
      isBtcToWbtc: !state.isBtcToWbtc,
      inputAmount: "",
      btcAddress: "",
      swapParams: {
        fromAsset: state.isBtcToWbtc
          ? SupportedAssets.testnet.ethereum_sepolia_WBTC
          : SupportedAssets.testnet.bitcoin_testnet_BTC,
          toAsset: state.isBtcToWbtc
          ? SupportedAssets.testnet.bitcoin_testnet_BTC
          : SupportedAssets.testnet.ethereum_sepolia_WBTC,
          sendAmount: "0",
          receiveAmount: "0",
          additionalData: {strategyId: ""},
      },
    })),
}));
