import { formatUnits } from "viem";
import { SuppliedAsset, BorrowedAsset } from "../shared.types";

type PositionPanelProps = {
  supplied: SuppliedAsset[];
  borrowed: BorrowedAsset[];
  onWithdraw: (asset: SuppliedAsset) => void;
  onRepay: (asset: BorrowedAsset) => void;
  isConnected: boolean;
};

export function PositionPanel({
  supplied,
  borrowed,
  onWithdraw,
  onRepay,
  isConnected,
}: PositionPanelProps) {
  if (!isConnected) return null;

  if (supplied.length === 0 && borrowed.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-[#181818] rounded-2xl px-6 py-5">
        <p className="text-xs text-zinc-600 font-mono">No active positions</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#181818] rounded-2xl overflow-hidden">
      <div className="flex divide-x divide-[#181818]">
        {/* Supplied */}
        <div className="flex-1 p-5">
          <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-emerald-400 mb-3">
            Supplied
          </p>
          {supplied.length === 0 ? (
            <p className="text-xs text-zinc-700 font-mono">—</p>
          ) : (
            <div className="flex flex-col gap-2">
              {supplied.map((asset) => (
                <div
                  key={asset.token}
                  className="flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold font-mono text-zinc-200">
                      {asset.token.toUpperCase()}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500">
                      {Number(formatUnits(asset.balance, asset.decimals)).toFixed(6)}
                    </p>
                  </div>
                  <button
                    onClick={() => onWithdraw(asset)}
                    className="text-[10px] font-bold px-2 py-1 border border-[#333] rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-[#555] transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Borrowed */}
        <div className="flex-1 p-5">
          <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-rose-400 mb-3">
            Borrowed
          </p>
          {borrowed.length === 0 ? (
            <p className="text-xs text-zinc-700 font-mono">—</p>
          ) : (
            <div className="flex flex-col gap-2">
              {borrowed.map((asset) => (
                <div
                  key={asset.token}
                  className="flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold font-mono text-zinc-200">
                      {asset.token.toUpperCase()}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500">
                      {Number(formatUnits(asset.debt, asset.decimals)).toFixed(6)}
                    </p>
                  </div>
                  <button
                    onClick={() => onRepay(asset)}
                    className="text-[10px] font-bold px-2 py-1 border border-rose-500/30 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Repay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
