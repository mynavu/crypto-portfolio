import { useState } from "react";
import { parseUnits } from "viem";
import { BaseModal } from "./BaseModal";
import { Address, EthNetwork, UserAccountData } from "../shared.types";
import { LendingAdapter } from "../adapters/types";

const TOKEN_DECIMALS: Record<string, number> = {
  usdc: 6,
  usdt: 6,
  eth: 18,
  weth: 18,
  btc: 8,
  wbtc: 8,
  sol: 6,
};

// Rough USD prices for converting availableBorrowsUsd → token units
const APPROX_PRICE_USD: Record<string, number> = {
  usdc: 1,
  usdt: 1,
  eth: 3500,
  weth: 3500,
  btc: 100000,
  wbtc: 100000,
};

type BorrowModalProps = {
  token: string;
  tokenAddress: Address;
  networkKey: EthNetwork;
  adapter: LendingAdapter;
  userAddress: Address;
  borrowApy: number | null;
  accountData: UserAccountData | null;
  onClose: () => void;
  onSuccess: () => void;
};

function hfColor(hf: number | null): string {
  if (hf === null) return "text-emerald-400";
  if (hf > 3) return "text-emerald-400";
  if (hf > 1.5) return "text-yellow-400";
  if (hf > 1) return "text-orange-400";
  return "text-rose-400";
}

export function BorrowModal({
  token,
  tokenAddress,
  networkKey,
  adapter,
  userAddress,
  borrowApy,
  accountData,
  onClose,
  onSuccess,
}: BorrowModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decimals = TOKEN_DECIMALS[token] ?? 18;
  const hf = accountData?.healthFactor ?? null;
  const priceUsd = APPROX_PRICE_USD[token.toLowerCase()];
  const maxTokens =
    accountData && priceUsd
      ? (accountData.availableBorrowsUsd / priceUsd).toFixed(decimals <= 6 ? 4 : 6)
      : null;

  async function handleBorrow() {
    if (!amount) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = parseUnits(amount, decimals);
      await adapter.borrow({ tokenAddress, amount: parsed, userAddress, networkKey });
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      // Trim viem's verbose calldata from the error string
      setError(msg.length > 200 ? msg.slice(0, 200) + "…" : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BaseModal title={`Borrow ${token.toUpperCase()}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {accountData && (
          <>
            <div className="text-xs text-zinc-500 font-mono">
              Available to Borrow:{" "}
              <span className="text-zinc-300">
                ${accountData.availableBorrowsUsd.toFixed(4)}
                {maxTokens && (
                  <span className="text-zinc-500"> ≈ {maxTokens} {token.toUpperCase()}</span>
                )}
              </span>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Current Health Factor:{" "}
              <span className={`font-bold ${hfColor(hf)}`}>
                {hf === null ? "∞" : hf.toFixed(2)}
              </span>
            </div>
          </>
        )}

        {borrowApy !== null && (
          <div className="text-xs text-zinc-500 font-mono">
            Borrow APY:{" "}
            <span className="text-rose-400 font-bold">
              {(borrowApy * 100).toFixed(2)}%
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono outline-none focus:border-[#444]"
          />
          {maxTokens && (
            <button
              onClick={() => setAmount(maxTokens)}
              className="px-3 py-2 text-xs font-bold text-zinc-400 border border-[#333] rounded-lg hover:border-[#555] hover:text-zinc-200 transition-colors"
            >
              MAX
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        )}

        <button
          onClick={handleBorrow}
          disabled={loading || !amount}
          className="w-full py-2.5 rounded-lg text-sm font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Borrowing..." : "Borrow"}
        </button>
      </div>
    </BaseModal>
  );
}
