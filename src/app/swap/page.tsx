"use client";

import React, { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

import TokenSwap from "../components/swap/TokenSwap";
import Transactions from "../components/transactions/Transactions";

const Swap = () => {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-600 gap-6 p-4">
      <TokenSwap />
      <Transactions />
    </div>
  );
};

export default Swap;
