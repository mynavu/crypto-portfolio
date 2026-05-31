import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { BaseModal } from "./BaseModal";
import { Address, EthNetwork } from "../shared.types";
import { LendingAdapter } from "../adapters/types";

type WithdrawModalProps = {
  token: string;
  tokenAddress: Address;
  networkKey: EthNetwork;
  adapter: LendingAdapter;
  userAddress: Address;
  suppliedBalance: bigint;
  decimals: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function WithdrawModal({
  token,
  tokenAddress,
  networkKey,
  adapter,
  userAddress,
  suppliedBalance,
  decimals,
  onClose,
  onSuccess,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suppliedFormatted = formatUnits(suppliedBalance, decimals);

  async function handleWithdraw() {
    if (!amount) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = parseUnits(amount, decimals);
      await adapter.withdraw({ tokenAddress, amount: parsed, userAddress, networkKey });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BaseModal title={`Withdraw ${token.toUpperCase()}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-xs text-zinc-500 font-mono">
          Supplied:{" "}
          <span className="text-zinc-300">
            {suppliedFormatted} {token.toUpperCase()}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono outline-none focus:border-[#444]"
          />
          <button
            onClick={() => setAmount(suppliedFormatted)}
            className="px-3 py-2 text-xs font-bold text-zinc-400 border border-[#333] rounded-lg hover:border-[#555] hover:text-zinc-200 transition-colors"
          >
            MAX
          </button>
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        )}

        <button
          onClick={handleWithdraw}
          disabled={loading || !amount}
          className="w-full py-2.5 rounded-lg text-sm font-bold bg-zinc-800 text-zinc-200 border border-[#333] hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Withdrawing..." : "Withdraw"}
        </button>
      </div>
    </BaseModal>
  );
}
