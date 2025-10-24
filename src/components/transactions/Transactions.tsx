"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { assetInfoStore } from '@/store/assetInfoStore';
import transactionHistoryStore from '@/store/transactionHistoryStore';
import { useGarden } from '@gardenfi/react-hooks';
import { BlockchainType } from '@gardenfi/orderbook';
import { TransactionRow } from './TransactionRow';

const Transactions = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<
    Record<BlockchainType, string>
  >({
    bitcoin: '',
    evm: '',
    starknet: '',
    solana: '',
    sui: '',
  });

  const { transactions, isLoading, loadMore, totalItems } = transactionHistoryStore();
  const { fetchAssets } = assetInfoStore();
  const { garden } = useGarden();

  const showLoadMore = useMemo(
    () => transactions.length < totalItems,
    [transactions.length, totalItems]
  );

  // Handle load more functionality
  const handleLoadMore = async () => {
    if (!garden) return;
    setIsLoadingMore(true);
    try {
      await loadMore(garden, connectedWallets);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Initialize assets and wallets on component mount
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (!garden) return;

    const wallets: Record<BlockchainType, string> = {
      bitcoin: garden?.htlcs?.bitcoin?.htlcActorAddress || '',
      evm: garden?.htlcs.evm?.htlcActorAddress || '',
      starknet: garden?.htlcs?.starknet?.htlcActorAddress || '',
      solana: garden?.htlcs?.solana?.htlcActorAddress || '',
      sui: garden?.htlcs?.sui?.htlcActorAddress || '',
    };

    setConnectedWallets(wallets);
  }, [garden]);

  return (
    <div className="flex flex-col justify-center gap-5 overflow-hidden h-full min-h-[inherit] max-h-[75vh] p-8 bg-gray-800 rounded-2xl text-white">
      <h1 className="text-xl font-bold">Transaction History</h1>
      <div className="flex flex-col overflow-y-auto h-full max-h-[inherit] scrollbar-hide bg-gray-700 rounded-2xl">
        {isLoading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center">No transactions found.</div>
        ) : (
          transactions.map((order, index) => {
            return (
              <div key={order.order_id || index} className="w-full">
                <TransactionRow
                  order={order}
                  status={order.status}
                  isLast={index === transactions.length - 1}
                  isFirst={index === 0}
                />
                {index !== transactions.length - 1 ? (
                  <div className="bg-gray-900 w-full h-px"></div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      {showLoadMore && (
        <button
          onClick={handleLoadMore}
          className={`w-full p-2 cursor-pointer text-white rounded-lg ${isLoadingMore
            ? "bg-gray-700 cursor-not-allowed"
            : "bg-gray-900 hover:bg-gray-700"
            }`}
        >
          {isLoadingMore ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default Transactions;
