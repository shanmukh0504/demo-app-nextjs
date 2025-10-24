import { create } from 'zustand';
import {
  IOType,
  ErrorFormat,
  Errors,
  DEFAULT_NETWORK,
} from '../constants/constants';
import { Chains } from '@gardenfi/orderbook';
import { Network } from '@gardenfi/utils';
import { ParsedAsset } from '../types/types';


export type SwapErrors = {
  inputError?: ErrorFormat;
  outputError?: ErrorFormat;
  liquidityError?: ErrorFormat;
  insufficientBalanceError?: ErrorFormat;
};

type SwapState = {
  inputAsset?: ParsedAsset;
  outputAsset?: ParsedAsset;
  inputAmount: string;
  outputAmount: string;
  btcAddress: string;
  isSwapping: boolean;
  error: SwapErrors;
  currentNetwork: Network;
  setAsset: (ioType: IOType, asset: ParsedAsset | undefined) => void;
  setAmount: (ioType: IOType, amount: string) => void;
  setBtcAddress: (btcAddress: string) => void;
  swapAssets: () => void;
  setError: (error: SwapErrors) => void;
  setIsSwapping: (isSwapping: boolean) => void;
};

export const BTC = {
  name: 'Bitcoin',
  decimals: 8,
  symbol: 'BTC',
  logo: 'https://garden.imgix.net/token-images/bitcoin.svg',
  tokenAddress: 'primary',
  atomicSwapAddress: 'primary',
  chain:
    DEFAULT_NETWORK === Network.TESTNET
      ? Chains.bitcoin_testnet
      : Chains.bitcoin,
  price: 115767.9,
  min_amount: '50000',
  max_amount: '10000000000',
};

export const swapStore = create<SwapState>((set) => ({
  inputAsset: BTC,
  inputAmount: '',
  outputAmount: '',
  btcAddress: '',
  isSwapping: false,
  error: {
    inputError: Errors.none,
    outputError: Errors.none,
    liquidityError: Errors.none,
    insufficientBalanceError: Errors.none,
  },
  currentNetwork: DEFAULT_NETWORK,
  setAsset: (ioType, asset) => {
    set((state) => ({
      ...state,
      [ioType === IOType.input ? 'inputAsset' : 'outputAsset']: asset,
    }));
  },
  setAmount: (ioType, amount) => {
    set((state) => ({
      ...state,
      [ioType === IOType.input ? 'inputAmount' : 'outputAmount']: amount,
    }));
  },
  setBtcAddress: (btcAddress) => {
    set((state) => ({
      ...state,
      btcAddress,
    }));
  },
  swapAssets: () => {
    set((state) => {
      const newInputAmount =
        !state.outputAmount || state.outputAmount === '0'
          ? ''
          : state.outputAmount;

      const newOutputAmount =
        !state.inputAmount || state.inputAmount === '0'
          ? ''
          : state.outputAmount;
      return {
        ...state,
        inputAsset: state.outputAsset,
        outputAsset: state.inputAsset,
        inputAmount: newInputAmount,
        outputAmount: newOutputAmount,
        error: {
          ...state.error,
          inputError: Errors.none,
          outputError: Errors.none,
          liquidityError: Errors.none,
          insufficientBalanceError: Errors.none,
        },
      };
    });
  },
  setIsSwapping: (isSwapping) => {
    set({ isSwapping });
  },
  setError: (error) => {
    set((state) => ({ error: { ...state.error, ...error } }));
  },
}));
