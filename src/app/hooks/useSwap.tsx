import { useCallback, useState } from "react";
import { useGarden } from "@gardenfi/react-hooks";
import BigNumber from "bignumber.js";
import debounce from "lodash.debounce";

export const useSwap = () => {
  const { getQuote, swapAndInitiate } = useGarden();
  const [swapParams, setSwapParams] = useState({
    inputToken: null,
    outputToken: null,
    inputAmount: 0.0,
    outputAmount: 0.0,
  });

  const fetchQuote = useCallback(
    debounce(
      async (
        amount: string,
        fromAsset: any,
        toAsset: any,
        isExactOut: boolean
      ) => {
        const amountInDecimals = new BigNumber(amount).multipliedBy(
          10 ** fromAsset.decimals
        );
        if (!getQuote) return;

        const quote = await getQuote({
          fromAsset,
          toAsset,
          amount: amountInDecimals.toNumber(),
          isExactOut,
        });

        if (quote.error) {
          setSwapParams((prevParams) => ({
            ...prevParams,
            outputAmount: 0,
          }));
          return;
        }

        const [_strategy, quoteAmount] = Object.entries(quote.val.quotes)[0];
        const quoteAmountInDecimals = new BigNumber(quoteAmount).div(
          10 ** toAsset.decimals
        );

        setSwapParams((prevParams) => ({
          ...prevParams,
          inputAmount: Number(amount),
          outputAmount: Number(
            quoteAmountInDecimals.toFixed(8, BigNumber.ROUND_DOWN)
          ),
        }));
      },
      500
    ),
    [getQuote]
  );

  const performSwap = async (
    swapAndInitiate: Function | undefined,
    swapParams: any,
    sendAmount: string,
    receiveAmount: string,
    btcAddress: string,
    strategyId: string
  ) => {
    if (!swapAndInitiate) throw new Error("Swap service unavailable.");

    const res = await swapAndInitiate({
      fromAsset: swapParams.inputToken,
      toAsset: swapParams.outputToken,
      sendAmount,
      receiveAmount,
      additionalData: {
        btcAddress,
        strategyId,
      },
    });

    if (res?.error) throw new Error(res.error);

    return res.val;
  };

  const fetchSwapQuote = async (
    getQuote: Function | undefined,
    swapParams: any,
    sendAmount: number
  ): Promise<{ strategyId: string; receiveAmount: string }> => {
    if (!getQuote) throw new Error("Quote service unavailable.");

    const quote = await getQuote({
      fromAsset: swapParams.inputToken,
      toAsset: swapParams.outputToken,
      amount: sendAmount,
    });

    if (!quote?.val) throw new Error(quote?.error || "Error fetching quote.");

    const [strategyId, receiveAmount] = Object.entries(quote.val.quotes)[0] as [
      string,
      string
    ];

    return { strategyId, receiveAmount };
  };

  return {
    swapParams,
    setSwapParams,
    fetchQuote,
    performSwap,
    fetchSwapQuote,
  };
};
