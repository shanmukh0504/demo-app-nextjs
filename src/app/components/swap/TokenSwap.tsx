"use client";

import React, { useState } from "react";
import { useDisconnect, useAccount } from "wagmi";
import { useGarden } from "@gardenfi/react-hooks";
import InputField from "./InputField";
import { useSwapStore } from "../../store/swapStore";
import { LogoutIcon, ExchangeIcon } from "@gardenfi/garden-book";
import {
  fetchSwapQuote,
  getTrimmedVal,
  handleInputChange,
  performSwap,
} from "../../utils/helpers";
import { MatchedOrder } from "@gardenfi/orderbook";

const TokenSwap: React.FC = () => {
  const {
    swapParams,
    inputAmount,
    btcAddress,
    errorMessage,
    loading,
    isBtcToWbtc,
    setSwapParams,
    setInputAmount,
    setBtcAddress,
    setErrorMessage,
    setLoading,
    toggleSwapDirection,
  } = useSwapStore();

  const [orderDetails, setOrderDetails] = useState<MatchedOrder>();

  const { disconnect } = useDisconnect();
  const { getQuote, swapAndInitiate } = useGarden();
  const { address: evmAddress } = useAccount();

  const handleInputChangeWrapper = async (value: string) => {
    if (!getQuote) {
      console.error("getQuote is undefined.");
      return;
    }
  
    await handleInputChange(
      value,
      getQuote,
      swapParams,
      setInputAmount,
      setErrorMessage,
      setSwapParams
    );
  };
  
  const handleSwap = async () => {
    if (!getQuote) {
      console.error("getQuote is undefined.");
      return;
    }
    
    if (!swapAndInitiate) {
      console.error("swapAndInitiate is undefined.");
      return;
    }
  
    const sendAmount =
      Number(swapParams.sendAmount) * 10 ** swapParams.fromAsset.decimals;
  
    if (!evmAddress || !btcAddress || Number(swapParams.sendAmount) <= 0) {
      alert("Please fill in all fields correctly.");
      return;
    }
  
    setLoading(true);
  
    try {
      const { strategyId, receiveAmount } = await fetchSwapQuote(
        getQuote,
        swapParams,
        sendAmount
      );
  
      const swapResult = await performSwap(
        swapAndInitiate,
        swapParams,
        sendAmount.toString(),
        receiveAmount,
        btcAddress,
        strategyId
      );
  
      alert("Order Created successfully!");
      setOrderDetails(swapResult.val);
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8 min-w-[600px] bg-gray-800 rounded-2xl text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Token Swap</h1>
        <div className="flex space-x-2">
          <div className="bg-gray-700 rounded-full p-2 cursor-pointer hover:bg-gray-900">
            {getTrimmedVal(evmAddress || "....", 6, 4)}
          </div>
          <div
            className="flex items-center bg-gray-700 rounded-full p-3 cursor-pointer transition-colors hover:bg-gray-900"
            onClick={() => disconnect()}
          >
            <LogoutIcon className="w-5 h-4 cursor-pointer fill-white" />
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <InputField
          id={isBtcToWbtc ? "btc" : "wbtc"}
          label={isBtcToWbtc ? "Send BTC" : "Send WBTC"}
          placeholder="0.0"
          onChange={handleInputChangeWrapper}
          value={inputAmount}
          error={errorMessage}
        />
        <div
          className="absolute bg-gray-700 border border-gray-900 rounded-full -translate-x-1/2 -translate-y-8/10 left-1/2 transition-transform hover:scale-[1.1] p-1.5 cursor-pointer"
          onClick={toggleSwapDirection}
        >
          <ExchangeIcon className="fill-white" />
        </div>
        <InputField
          id={isBtcToWbtc ? "wbtc" : "btc"}
          label={isBtcToWbtc ? "Receive WBTC" : "Receive BTC"}
          placeholder="0.0"
          value={swapParams.receiveAmount.toString()}
          readOnly
        />
        <InputField
          id="receive-address"
          label="Receive Address"
          placeholder="Your Bitcoin Address"
          value={btcAddress}
          onChange={setBtcAddress}
        />

        {orderDetails && (
          <div className="p-4 bg-gray-700 space-y-2 rounded-2xl text-white">
            {isBtcToWbtc && (
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
                  {getTrimmedVal(orderDetails?.source_swap.swap_id)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              Order ID:{" "}
              <a
                href={`https://gardenexplorer.hashira.io/order/${orderDetails?.create_order.create_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                {getTrimmedVal(orderDetails?.create_order.create_id)}
              </a>
            </div>
          </div>
        )}

        <button
          onClick={handleSwap}
          className={`w-full p-2 cursor-pointer text-white rounded-xl ${
            loading
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gray-900 hover:bg-gray-700"
          }`}
          disabled={loading}
        >
          {loading ? "Processing..." : "Swap"}
        </button>
      </div>
    </div>
  );
};

export default TokenSwap;
