import BigNumber from "bignumber.js";
import { Asset, MatchedOrder } from "@gardenfi/orderbook";
import { QuoteParams } from "@gardenfi/react-hooks";
import { AsyncResult, Result } from "@catalogfi/utils";
import { QuoteResponse, SwapParams } from "@gardenfi/core";

export const getTrimmedVal = (address: string | undefined, start = 15, end = 10) => {
  if (!address) return "....";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const validateInput = (value: string): string | null => {
  const numericValue = parseFloat(value);
  if (numericValue <= 0)
    return "Invalid amount. Please enter a number greater than 0.";
  if (numericValue < 0.005) return "Amount must be at least 0.005.";
  return null;
};

export const handleInputChange = async (
  value: string,
  getQuote: (params: QuoteParams) => Promise<Result<QuoteResponse, string>>,
  swapParams: SwapParams,
  setInputAmount: (value: string) => void,
  setErrorMessage: (value: string | null) => void,
  setSwapParams: (params: SwapParams) => void
): Promise<void> => {
  if (/^[0-9]*\.?[0-9]*$/.test(value)) {
    setInputAmount(value);
    const validationError = validateInput(value);
    setErrorMessage(validationError);

    if (!validationError && value) {
      await fetchQuote(
        getQuote,
        swapParams,
        value,
        swapParams.fromAsset,
        swapParams.toAsset,
        false,
        setSwapParams
      );
    } else if (value === "") {
      setSwapParams({ ...swapParams, receiveAmount: "0" });
    }
  }
};

export const fetchQuote = async (
  getQuote: (params: QuoteParams) => Promise<Result<QuoteResponse, string>>,
  swapParams: SwapParams,
  amount: string,
  fromAsset: Asset,
  toAsset: Asset,
  isExactOut: boolean,
  setSwapParams: (params: SwapParams) => void
): Promise<void> => {

  if (!getQuote) return;

  const amountInDecimals = new BigNumber(amount).multipliedBy(
    10 ** fromAsset.decimals
  );

  const quote = (await getQuote({
    fromAsset,
    toAsset,
    amount: amountInDecimals.toNumber(),
    isExactOut,
  }));

  if (quote?.val?.quotes) {
    const [strategy, quoteAmount] = Object.entries(quote.val.quotes)[0] as [
      string,
      string
    ];
    const quoteAmountInDecimals = new BigNumber(quoteAmount).div(
      10 ** toAsset.decimals
    );

    setSwapParams({
      ...swapParams,
      sendAmount: amount,
      receiveAmount: 
        quoteAmountInDecimals.toFixed(8, BigNumber.ROUND_DOWN)
      ,
      additionalData: { strategyId: strategy }
    });
  } else {
    setSwapParams({ ...swapParams, receiveAmount: "0" });
  }
};

export const fetchSwapQuote = async (
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

  const [strategyId, receiveAmount] = Object.entries(quote.val?.quotes)[0] as [
    string,
    string
  ];

  return { strategyId, receiveAmount };
};

export const performSwap = async (
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
    sendAmount: sendAmount,
    receiveAmount: receiveAmount,
    additionalData: {
      btcAddress,
      strategyId,
    },
  });

  if (res?.error) throw new Error(res.error);

  return res;
};
