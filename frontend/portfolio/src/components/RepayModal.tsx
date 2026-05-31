import { useState } from "react";
import { useReadContract } from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { BaseModal } from "./BaseModal";
import { Address, EthNetwork } from "../shared.types";
import { LendingAdapter } from "../adapters/types";

type RepayModalProps = {
  token: string;
  tokenAddress: Address;
  networkKey: EthNetwork;
  adapter: LendingAdapter;
  userAddress: Address;
  debt: bigint;
  decimals: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function RepayModal({
  token,
  tokenAddress,
  networkKey,
  adapter,
  userAddress,
  debt,
  decimals,
  onClose,
  onSuccess,
}: RepayModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: walletBalance } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "balanceOf",
    args: [userAddress],
    query: { enabled: !!userAddress },
  });

  const debtFormatted = formatUnits(debt, decimals);
  const walletFormatted = walletBalance ? formatUnits(walletBalance, decimals) : "0";

  function fillMax() {
    const walletBal = walletBalance ?? 0n;
    const maxBigInt = walletBal < debt ? walletBal : debt;
    setAmount(formatUnits(maxBigInt, decimals));
  }

  async function handleRepay() {
    if (!amount) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = parseUnits(amount, decimals);
      await adapter.repay({ tokenAddress, amount: parsed, userAddress, networkKey });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BaseModal title={`Repay ${token.toUpperCase()}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-xs text-zinc-500 font-mono">
          Debt:{" "}
          <span className="text-rose-400">
            {debtFormatted} {token.toUpperCase()}
          </span>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          Wallet Balance:{" "}
          <span className="text-zinc-300">
            {walletFormatted} {token.toUpperCase()}
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
            onClick={fillMax}
            className="px-3 py-2 text-xs font-bold text-zinc-400 border border-[#333] rounded-lg hover:border-[#555] hover:text-zinc-200 transition-colors"
          >
            MAX
          </button>
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        )}

        <button
          onClick={handleRepay}
          disabled={loading || !amount}
          className="w-full py-2.5 rounded-lg text-sm font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Repaying..." : "Repay"}
        </button>
      </div>
    </BaseModal>
  );
}
