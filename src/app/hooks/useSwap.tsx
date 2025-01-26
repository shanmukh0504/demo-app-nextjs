import { useCallback, useState, useMemo } from "react";
import { QuoteParams, useGarden } from "@gardenfi/react-hooks";
import BigNumber from "bignumber.js";
import debounce from "lodash.debounce";
import { Asset, MatchedOrder } from "@gardenfi/orderbook";
import { AsyncResult, Result } from "@catalogfi/utils";
import { QuoteResponse, SwapParams } from "@gardenfi/core";

export const useSwap = () => {
  const { getQuote } = useGarden();
  const [swapParams, setSwapParams] = useState({
    fromAsset: null,
    toAsset: null,
    sendAmount: 0.0,
    receiveAmount: 0.0,
  });

  const debouncedFetchQuote = useMemo(
    () =>
      debounce(
        async (
          amount: string,
          fromAsset: Asset,
          toAsset: Asset,
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
              receiveAmount: 0,
            }));
            return;
          }

          const [ , quoteAmount ] = Object.entries(quote.val.quotes)[0];
          const quoteAmountInDecimals = new BigNumber(quoteAmount).div(
            10 ** toAsset.decimals
          );

          setSwapParams((prevParams) => ({
            ...prevParams,
            sendAmount: Number(amount),
            receiveAmount: Number(
              quoteAmountInDecimals.toFixed(8, BigNumber.ROUND_DOWN)
            ),
          }));
        },
        500
      ),
    [getQuote]
  );

  const fetchQuote = useCallback(
    async (
      amount: string,
      fromAsset: Asset,
      toAsset: Asset,
      isExactOut: boolean
    ) => {
      await debouncedFetchQuote(amount, fromAsset, toAsset, isExactOut);
    },
    [debouncedFetchQuote]
  );

  const performSwap = async (
    swapAndInitiate: (params: SwapParams) => AsyncResult<MatchedOrder, string>,
    swapParams: SwapParams,
    sendAmount: string,
    receiveAmount: string,
    btcAddress: string,
    strategyId: string
  ) => {
    if (!swapAndInitiate) throw new Error("Swap service unavailable.");

    const res = await swapAndInitiate({
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
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
    getQuote: (params: QuoteParams) => Promise<Result<QuoteResponse, string>>,
    swapParams: SwapParams,
    sendAmount: number
  ): Promise<{ strategyId: string; receiveAmount: string }> => {
    if (!getQuote) throw new Error("Quote service unavailable.");

    const quote = await getQuote({
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
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
