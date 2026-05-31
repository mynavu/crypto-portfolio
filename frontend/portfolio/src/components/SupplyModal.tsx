import { useState } from "react";
import { useReadContract } from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { BaseModal } from "./BaseModal";
import { Address, EthNetwork } from "../shared.types";
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

type SupplyModalProps = {
  token: string;
  tokenAddress: Address;
  networkKey: EthNetwork;
  adapter: LendingAdapter;
  userAddress: Address;
  supplyApy: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function SupplyModal({
  token,
  tokenAddress,
  networkKey,
  adapter,
  userAddress,
  supplyApy,
  onClose,
  onSuccess,
}: SupplyModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decimals = TOKEN_DECIMALS[token] ?? 18;

  const { data: balance } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "balanceOf",
    args: [userAddress],
    query: { enabled: !!userAddress },
  });

  const balanceFormatted = balance ? formatUnits(balance, decimals) : "0";

  async function handleSupply() {
    if (!amount) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = parseUnits(amount, decimals);
      await adapter.supply({ tokenAddress, amount: parsed, userAddress, networkKey });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BaseModal title={`Supply ${token.toUpperCase()}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-xs text-zinc-500 font-mono">
          Wallet Balance:{" "}
          <span className="text-zinc-300">{balanceFormatted} {token.toUpperCase()}</span>
        </div>

        {supplyApy !== null && (
          <div className="text-xs text-zinc-500 font-mono">
            Supply APY:{" "}
            <span className="text-emerald-400 font-bold">
              {(supplyApy * 100).toFixed(2)}%
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
          <button
            onClick={() => setAmount(balanceFormatted)}
            className="px-3 py-2 text-xs font-bold text-zinc-400 border border-[#333] rounded-lg hover:border-[#555] hover:text-zinc-200 transition-colors"
          >
            MAX
          </button>
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        )}

        <button
          onClick={handleSupply}
          disabled={loading || !amount}
          className="w-full py-2.5 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Supplying..." : "Supply"}
        </button>
      </div>
    </BaseModal>
  );
}
