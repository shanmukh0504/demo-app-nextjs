import BigNumber from "bignumber.js";
import { QuoteResponse } from "./types";

export const getTrimmedVal = (address: string | undefined, start = 15, end = 10) => {
  if (!address) return "....";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const validateInput = (value: string): string | null => {
  const numericValue = parseFloat(value);
  if (numericValue <= 0)
    return "Invalid amount. Please enter a number greater than 0.";
  if (numericValue < 0.01) return "Amount must be at least 0.01.";
  return null;
};

export const handleInputChange = async (
  value: string,
  getQuote: Function | undefined,
  swapParams: any,
  setInputAmount: Function,
  setErrorMessage: Function,
  setSwapParams: Function
): Promise<void> => {
  if (/^[0-9]*\.?[0-9]*$/.test(value)) {
    setInputAmount(value);
    const validationError = validateInput(value);
    setErrorMessage(validationError);

    if (!validationError && value) {
      await fetchQuote(
        getQuote,
        value,
        swapParams.inputToken,
        swapParams.outputToken,
        false,
        setSwapParams
      );
    } else if (value === "") {
      setSwapParams({ outputAmount: 0 });
    }
  }
};

export const fetchQuote = async (
  getQuote: Function | undefined,
  amount: string,
  fromAsset: any,
  toAsset: any,
  isExactOut: boolean,
  setSwapParams: Function
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
  })) as QuoteResponse;

  if (quote?.val?.quotes) {
    const [strategy, quoteAmount] = Object.entries(quote.val.quotes)[0] as [
      string,
      string
    ];
    const quoteAmountInDecimals = new BigNumber(quoteAmount).div(
      10 ** toAsset.decimals
    );

    setSwapParams({
      inputAmount: Number(amount),
      outputAmount: Number(
        quoteAmountInDecimals.toFixed(8, BigNumber.ROUND_DOWN)
      ),
      additionalData: { strategy: strategy }
    });
  } else {
    setSwapParams({ outputAmount: 0 });
  }
};

export const fetchSwapQuote = async (
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

export const performSwap = async (
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

  return res;
};
