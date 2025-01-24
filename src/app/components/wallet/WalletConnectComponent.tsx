"use client";

import React, { useState } from "react";
import { useConnect } from "wagmi";

const WalletConnectComponent: React.FC = () => {
  const { connect, connectors } = useConnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (connector: any) => {
    console.log("Connecting with:", connector.name);
    setIsConnecting(true);
    try {
      connect({ connector });
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
      
    }
  };

  return (
    <div className="p-12 bg-gray-800 rounded-xl min-w-[400px] mx-auto text-white">
      <h1 className="text-xl font-bold mb-4">Connect Your Wallet</h1>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => handleConnect(connector)}
          disabled={isConnecting}
          className="block w-full p-2 cursor-pointer mb-2 text-white bg-gray-900 rounded-xl hover:bg-gray-700 disabled:bg-gray-600"
        >
          {isConnecting ? "Connecting..." : connector.name}
        </button>
      ))}
    </div>
  );
};

export default WalletConnectComponent;
