import { UserAccountData } from "../shared.types";

function fmtUsd(n: number): string {
  if (n === 0) return "0.00";
  if (n >= 0.01) return n.toFixed(2);
  if (n >= 0.0001) return n.toFixed(4);
  return n.toFixed(6);
}

function hfColor(hf: number | null): string {
  if (hf === null) return "text-emerald-400";
  if (hf > 3) return "text-emerald-400";
  if (hf > 1.5) return "text-yellow-400";
  if (hf > 1) return "text-orange-400";
  return "text-rose-400";
}

function ShimmerStat() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
      <div className="h-5 w-20 bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

type PortfolioSummaryProps = {
  accountData: UserAccountData | null;
  isLoading: boolean;
};

export function PortfolioSummary({
  accountData,
  isLoading,
}: PortfolioSummaryProps) {
  const hf = accountData?.healthFactor ?? null;

  return (
    <div className="bg-[#0a0a0a] border border-[#181818] rounded-2xl px-6 py-5">
      <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-600 mb-4">
        Portfolio
      </p>
      <div className="grid grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <ShimmerStat />
            <ShimmerStat />
            <ShimmerStat />
            <ShimmerStat />
          </>
        ) : (
          <>
            <div>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Supplied
              </p>
              <p className="text-sm font-black font-mono text-emerald-400">
                ${fmtUsd(accountData?.totalCollateralUsd ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Borrowed
              </p>
              <p className="text-sm font-black font-mono text-rose-400">
                ${fmtUsd(accountData?.totalDebtUsd ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Health Factor
              </p>
              <p className={`text-sm font-black font-mono ${hfColor(hf)}`}>
                {hf === null ? "∞" : hf.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Available Borrow
              </p>
              <p className="text-sm font-black font-mono text-zinc-200">
                ${fmtUsd(accountData?.availableBorrowsUsd ?? 0)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
