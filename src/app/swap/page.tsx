"use client";

import React, { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import TokenSwap from "../components/swap/TokenSwap";

const Swap = () => {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-600 space-y-4">
      <TokenSwap />
    </div>
  );
};

export default Swap;
