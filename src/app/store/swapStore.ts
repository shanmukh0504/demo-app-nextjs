import { create } from "zustand";
import { SupportedAssets } from "@gardenfi/orderbook";

interface SwapState {
  swapParams: {
    inputToken: any;
    outputToken: any;
    inputAmount: number;
    outputAmount: number;
  };
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

export const useSwapStore = create<SwapState>((set) => ({
  swapParams: {
    inputToken: SupportedAssets.testnet.ethereum_sepolia_WBTC,
    outputToken: SupportedAssets.testnet.bitcoin_testnet_BTC,
    inputAmount: 0,
    outputAmount: 0,
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
        inputToken: state.isBtcToWbtc
          ? SupportedAssets.testnet.ethereum_sepolia_WBTC
          : SupportedAssets.testnet.bitcoin_testnet_BTC,
        outputToken: state.isBtcToWbtc
          ? SupportedAssets.testnet.bitcoin_testnet_BTC
          : SupportedAssets.testnet.ethereum_sepolia_WBTC,
        inputAmount: 0,
        outputAmount: 0,
      },
    })),
}));
