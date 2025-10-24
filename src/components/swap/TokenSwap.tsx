"use client";

import React, { useState, useEffect } from "react";
import { useDisconnect, useAccount } from "wagmi";
import { useGarden } from "@gardenfi/react-hooks";
import { SwapInput as InputField } from "./InputField";
import { swapStore } from "../../store/swapStore";
import { Errors, getApiEndpoint, IOType } from "@/constants/constants";
import { LogoutIcon, ExchangeIcon } from "@gardenfi/garden-book";
import BigNumber from "bignumber.js";
import { OrderWithStatus } from "@gardenfi/core";
import { assetInfoStore } from "@/store/assetInfoStore";
import transactionHistoryStore from "@/store/transactionHistoryStore";
import { getTrimmedAddress } from "@/utils/utils";

const TokenSwap: React.FC = () => {
  const [orderDetails, setOrderDetails] = useState<OrderWithStatus>();

  // Accessing global swap state using Zustand store
  const {
    inputAsset,
    outputAsset,
    inputAmount,
    outputAmount,
    btcAddress,
    error,
    isSwapping,
    currentNetwork,
    setAsset,
    setAmount,
    setBtcAddress,
    setError,
    setIsSwapping,
    swapAssets,
  } = swapStore();

  // Wallet connection handlers
  const { disconnect } = useDisconnect();
  const { isConnected, address: evmAddress } = useAccount();
  const { getQuote, swap, garden } = useGarden();

  const { allAssets, fetchAssets } = assetInfoStore();
  const { clearTransactions } = transactionHistoryStore();

  // Set output asset to WBTC on Ethereum Sepolia after assets are loaded
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (allAssets.length > 0) {
      const wbtcAsset = allAssets.find(
        asset => asset.symbol === 'WBTC' && asset.chain === 'ethereum_sepolia'
      );
      if (wbtcAsset && !outputAsset) {
        setAsset(IOType.output, wbtcAsset);
      }
    }
  }, [allAssets, outputAsset, setAsset]);

  // Clear transactions and order details when wallet is disconnected
  useEffect(() => {
    if (!isConnected) {
      clearTransactions();
      setOrderDetails(undefined);
    }
  }, [isConnected, clearTransactions]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const W3MButton = "w3m-button" as any;

  // Input validation to ensure valid swap amounts
  const validateInput = (value: string) => {
    const numericValue = parseFloat(value);
    if (numericValue === 0)
      return Errors.none;
    if (numericValue < 0.0005) return Errors.minError("0.0005", inputAsset?.symbol!);
    else if (numericValue > 0.01) return Errors.maxError("0.01", inputAsset?.symbol!);
    return Errors.none;
  };

  // Handle input changes and fetch quote if valid
  const handleInputChange = async (value: string) => {
    if (!getQuote || !inputAsset || !outputAsset) {
      console.error("getQuote, inputAsset, or outputAsset is undefined.");
      return;
    }

    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(IOType.input, value);
      const validationError = validateInput(value);
      setError({ inputError: validationError });

      if (validationError === Errors.none && value) {
        await fetchQuote(value);
      } else if (value === "") {
        setAmount(IOType.output, "0");
      }
    }
  };

  // Fetch a swap quote based on user input
  const fetchQuote = async (amount: string) => {
    if (!garden?.quote || !inputAsset || !outputAsset) return;

    try {
      const amountInDecimals = new BigNumber(amount).multipliedBy(
        10 ** inputAsset.decimals
      );

      const quote = await garden.quote.getQuote(
        inputAsset,
        outputAsset,
        amountInDecimals.toNumber(),
        false,
      );

      if (quote?.val) {
        const receiveAmount = quote.val[0].destination.display;
        setAmount(IOType.output, receiveAmount);
      } else {
        setAmount(IOType.output, "0");
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      setAmount(IOType.output, "0");
    }
  };

  // Fetch the swap strategy before initiating a swap
  const fetchSwapQuote = async () => {
    if (!garden?.quote || !inputAsset || !outputAsset) {
      throw new Error("Required assets or quote service not available.");
    }

    const sendAmount = Number(inputAmount) * 10 ** inputAsset.decimals;

    const quote = await garden.quote.getQuote(
      inputAsset,
      outputAsset,
      sendAmount,
      false
    );

    if (!quote?.val) throw new Error(quote?.error || "Error fetching quote.");

    const receiveAmount = quote.val[0].destination.amount;

    return receiveAmount;
  };

  // Perform the swap using swapAndInitiate method from useGarden hook
  const performSwap = async (receiveAmount: string) => {
    if (!swap || !inputAsset || !outputAsset) {
      throw new Error("Swap service or assets unavailable.");
    }

    const sendAmount = (
      Number(inputAmount) * 10 ** inputAsset.decimals
    ).toString();

    const res = await swap({
      fromAsset: inputAsset,
      toAsset: outputAsset,
      sendAmount: sendAmount,
      receiveAmount,
      addresses: {
        bitcoin: btcAddress
      }
    });

    if (res?.error) throw new Error(res.error);

    return res;
  };

  // Main swap function to handle swap click
  const handleSwap = async () => {
    if (!getQuote || !swap) {
      console.error("Required services are unavailable.");
      return;
    }

    if (!evmAddress || !btcAddress || Number(inputAmount) <= 0) {
      alert("Please fill in all fields correctly.");
      return;
    }

    setIsSwapping(true);

    try {
      const receiveAmount = await fetchSwapQuote();
      if (!receiveAmount) return;
      const swapResult = await performSwap(receiveAmount);

      alert("Order Created successfully!");
      if (!swapResult) { console.log("order not found", swapResult) }

      const orderDetails = await garden?.getOrder(
        typeof swapResult?.val === 'object' && swapResult?.val?.order_id
          ? swapResult.val.order_id
          : swapResult?.val as string
      );

      if (!orderDetails?.ok) {
        console.error("error getting order details:", orderDetails?.error)
      }

      setOrderDetails(orderDetails?.val);
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="flex flex-col justify-center p-8 bg-gray-800 h-full min-h-[inherit] rounded-2xl text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Swap Assets</h1>
        <div className="flex space-x-2">
          {isConnected ? (
            <>
              <div className="bg-gray-700 rounded-full p-2 cursor-pointer hover:bg-gray-900">
                <span
                  onClick={() =>
                    navigator.clipboard.writeText(evmAddress!)
                  }
                >
                  {getTrimmedAddress(evmAddress!)}
                </span>
              </div>
              <div
                className="flex items-center bg-gray-700 rounded-full p-3 cursor-pointer hover:bg-gray-900"
                onClick={() => {
                  disconnect();
                  clearTransactions();
                  setOrderDetails(undefined);
                }}
              >
                <LogoutIcon className="w-5 h-4 cursor-pointer fill-white" />
              </div>
            </>
          ) : (
            <W3MButton />
          )}
        </div>
      </div>
      <div className="relative space-y-5">
        <InputField
          type={IOType.input}
          amount={inputAmount}
          onChange={handleInputChange}
          asset={inputAsset}
          label={inputAsset ? `Send ${inputAsset.symbol}` : "Send BTC"}
          error={error.inputError}
        />
        <div
          className="absolute bg-gray-700 border border-gray-900 rounded-full left-1/2 -translate-x-1/2 -translate-y-8/10 hover:scale-[1.1] p-1.5 cursor-pointer"
          onClick={() => {
            swapAssets();
            setOrderDetails(undefined);
          }}
        >
          <ExchangeIcon className="fill-white" />
        </div>
        <InputField
          type={IOType.output}
          amount={outputAmount}
          onChange={() => { }}
          asset={outputAsset}
          label={outputAsset ? `Receive ${outputAsset.symbol}` : "Receive WBTC"}
          error={error.outputError}
        />
        <div className="flex flex-col gap-2 rounded-2xl bg-gray-700 p-4 text-white">
          <div className="flex justify-between">
            <span className="text-lg font-medium text-white">Receive Address</span>
          </div>
          <input
            type="text"
            placeholder="Your Bitcoin Address"
            value={btcAddress}
            onChange={(e) => setBtcAddress(e.target.value)}
            className="w-full bg-transparent py-1 text-start font-inherit outline-none text-lg text-white placeholder-gray-400"
          />
        </div>

        {orderDetails && (
          <div className="p-4 bg-gray-700 space-y-2 rounded-2xl text-white">
            {(inputAsset?.symbol === 'BTC' || inputAsset?.name === 'Bitcoin') && (
              <div className="flex justify-between items-center">
                Deposit Address:{" "}
                <span
                  className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      orderDetails?.source_swap.swap_id || ""
                    )
                  }
                >
                  {getTrimmedAddress(orderDetails?.source_swap.swap_id)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              Order ID:
              <span
                onClick={() =>
                  window.open(
                    `${getApiEndpoint(currentNetwork).explorer}/order/${orderDetails?.order_id}`,
                    "_blank"
                  )
                }
                className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
              >
                {getTrimmedAddress(orderDetails?.order_id)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleSwap}
          className={`w-full p-2 cursor-pointer text-white rounded-xl ${isSwapping
            ? "bg-gray-700 cursor-not-allowed"
            : "bg-gray-900 hover:bg-gray-700"
            }`}
          disabled={isSwapping}
        >
          {isSwapping ? "Processing..." : "Swap"}
        </button>
      </div>
    </div>
  );
};

export default TokenSwap;
