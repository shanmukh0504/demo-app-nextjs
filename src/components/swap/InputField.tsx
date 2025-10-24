import React from 'react';
import { FC, useRef, ChangeEvent } from 'react';
import { ErrorFormat, IOType } from '@/constants/constants';
import { Asset } from '@gardenfi/orderbook';

type SwapInputProps = {
  type: IOType;
  amount: string;
  onChange: (amount: string) => void;
  asset?: Asset;
  error?: ErrorFormat;
  balance?: number;
  label: string;
};

export const SwapInput: FC<SwapInputProps> = ({
  type,
  amount,
  asset,
  onChange,
  error,
  balance,
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    if (!/^[0-9]*\.?[0-9]*$/.test(input)) {
      return;
    }

    if (input.startsWith('.')) {
      input = '0' + input;
    }

    const parts = input.split('.');
    if (input === '-') return;

    if (parts.length > 2) {
      return;
    }

    const decimals = (parts[1] || '').length;
    if (asset && decimals > asset.decimals && parts[1]) {
      onChange(parts[0] + '.' + parts[1].slice(0, asset.decimals));
    } else {
      onChange(input);
    }
  };

  const handleBalanceClick = () => {
    if (type === IOType.input && balance && asset) {
      const balanceStr = balance.toString();
      onChange(balanceStr);
    }
  };


  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-gray-700 p-4 text-white">
      <div className="flex justify-between">
        <div className="flex gap-3">
          <span className="text-lg font-medium text-white cursor-pointer" onClick={() => inputRef.current?.focus()}>
            {label}
          </span>
        </div>
        {type === IOType.input && balance !== undefined && !Number.isNaN(balance) && (
          <div
            className="flex cursor-pointer items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            onClick={handleBalanceClick}
          >
            <span>Balance: {balance}</span>
          </div>
        )}
        {error && (
          <span className="text-sm text-red-400">
            {error}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center">
        <div className="relative w-[150px] max-w-[150px] md:w-[200px] md:max-w-[200px]">
          <div
            className="relative flex w-full items-center cursor-text"
            onClick={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <input
              ref={inputRef}
              className="w-full bg-transparent py-1 text-start font-inherit outline-none text-lg text-white placeholder-gray-400"
              style={{ fontKerning: 'none' }}
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.0"
            />
          </div>
        </div>
        <div className="bg-gray-900 py-2 px-3 rounded-full flex items-center gap-2">
          {asset && (
            <div className="flex items-center gap-2 ">
              <img
                src={asset.logo}
                alt={asset.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-lg font-medium text-white">
                {asset.symbol}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
