import { useState } from "react";
import { formatUnits } from "viem";
import { UserAccountData, SuppliedAsset, BorrowedAsset } from "../shared.types";

// Stablecoin USD prices — non-stablecoins return null (show "N/A")
const STABLECOIN_PRICE: Record<string, number> = { usdc: 1, usdt: 1 };

// Standard AAVE V3 LTV values per token (used for per-asset borrow power estimate)
const AAVE_LTV: Record<string, number> = {
  usdc: 0.77,
  usdt: 0.70,
  eth: 0.80,
  weth: 0.80,
  btc: 0.73,
  wbtc: 0.73,
};

function fmtTokenAmount(balance: bigint, decimals: number): string {
  const val = parseFloat(formatUnits(balance, decimals));
  if (val >= 1) return val.toFixed(4);
  if (val >= 0.0001) return val.toFixed(6);
  return val.toFixed(8);
}

function fmtUsd(n: number): string {
  if (n === 0) return "0.00";
  if (n >= 0.01) return n.toFixed(2);
  if (n >= 0.0001) return n.toFixed(4);
  return n.toFixed(6);
}

function estimateUsdValue(token: string, balance: bigint, decimals: number): number | null {
  const price = STABLECOIN_PRICE[token.toLowerCase()];
  if (price == null) return null;
  return parseFloat(formatUnits(balance, decimals)) * price;
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

type Section = "supplied" | "borrowed" | "hf" | "available" | null;

type PortfolioSummaryProps = {
  accountData: UserAccountData | null;
  isLoading: boolean;
  supplied: SuppliedAsset[];
  borrowed: BorrowedAsset[];
  onWithdraw: (asset: SuppliedAsset) => void;
  onRepay: (asset: BorrowedAsset) => void;
};

export function PortfolioSummary({
  accountData,
  isLoading,
  supplied,
  borrowed,
  onWithdraw,
  onRepay,
}: PortfolioSummaryProps) {
  const [open, setOpen] = useState<Section>(null);
  const hf = accountData?.healthFactor ?? null;

  function toggle(s: Section) {
    setOpen((prev) => (prev === s ? null : s));
  }

  const statBtn = "text-left w-full group cursor-pointer";
  const chevron = (s: Section) =>
    `inline-block ml-1 text-[9px] text-zinc-600 transition-transform ${open === s ? "rotate-180" : ""}`;

  return (
    <div className="bg-[#0a0a0a] border border-[#181818] rounded-2xl px-6 py-5">
      <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-600 mb-4">
        Portfolio
      </p>

      {/* ── Stat row ── */}
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
            {/* Supplied */}
            <button className={statBtn} onClick={() => toggle("supplied")}>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Supplied <span className={chevron("supplied")}>▼</span>
              </p>
              <p className="text-sm font-black font-mono text-emerald-400">
                ${fmtUsd(accountData?.totalCollateralUsd ?? 0)}
              </p>
            </button>

            {/* Borrowed */}
            <button className={statBtn} onClick={() => toggle("borrowed")}>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Borrowed <span className={chevron("borrowed")}>▼</span>
              </p>
              <p className="text-sm font-black font-mono text-rose-400">
                ${fmtUsd(accountData?.totalDebtUsd ?? 0)}
              </p>
            </button>

            {/* Health Factor */}
            <button className={statBtn} onClick={() => toggle("hf")}>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Health Factor <span className={chevron("hf")}>▼</span>
              </p>
              <p className={`text-sm font-black font-mono ${hfColor(hf)}`}>
                {hf === null ? "∞" : hf.toFixed(2)}
              </p>
            </button>

            {/* Available */}
            <button className={statBtn} onClick={() => toggle("available")}>
              <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase tracking-wider">
                Available Borrow <span className={chevron("available")}>▼</span>
              </p>
              <p className="text-sm font-black font-mono text-zinc-200">
                ${fmtUsd(accountData?.availableBorrowsUsd ?? 0)}
              </p>
            </button>
          </>
        )}
      </div>

      {/* ── Expanded: Supplied assets ── */}
      {open === "supplied" && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 mb-3">
            Supplied Assets
          </p>
          {supplied.length === 0 ? (
            <p className="text-xs text-zinc-600">No supplied assets on this network.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {supplied.map((asset) => {
                const amount = fmtTokenAmount(asset.balance, asset.decimals);
                const usd = estimateUsdValue(asset.token, asset.balance, asset.decimals);
                const ltv = AAVE_LTV[asset.token.toLowerCase()];
                const borrowPower = usd != null && ltv != null ? usd * ltv : null;
                return (
                  <div
                    key={asset.token}
                    className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-white/[0.02]"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-zinc-200 uppercase">
                        {asset.token}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">{amount}</span>
                      {usd != null && (
                        <span className="text-[10px] text-zinc-600">
                          Value: ${fmtUsd(usd)}
                          {ltv != null && (
                            <>
                              {" · "}LTV: {(ltv * 100).toFixed(0)}%
                              {borrowPower != null && (
                                <> · Borrow Power: ${fmtUsd(borrowPower)}</>
                              )}
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onWithdraw(asset)}
                      className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-zinc-600/30 text-zinc-400 hover:text-zinc-200 hover:border-zinc-400/40 transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Expanded: Borrowed assets ── */}
      {open === "borrowed" && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 mb-3">
            Borrowed Assets
          </p>
          {borrowed.length === 0 ? (
            <p className="text-xs text-zinc-600">No active borrows on this network.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {borrowed.map((asset) => {
                const amount = fmtTokenAmount(asset.debt, asset.decimals);
                const usd = estimateUsdValue(asset.token, asset.debt, asset.decimals);
                return (
                  <div
                    key={asset.token}
                    className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-white/[0.02]"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-zinc-200 uppercase">
                        {asset.token}
                      </span>
                      <span className="text-[11px] font-mono text-rose-400">{amount}</span>
                      {usd != null && (
                        <span className="text-[10px] text-zinc-600">Value: ${fmtUsd(usd)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => onRepay(asset)}
                      className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Repay
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Expanded: Health Factor formula ── */}
      {open === "hf" && accountData && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 mb-3">
            Health Factor Calculation
          </p>
          <p className="text-[11px] font-mono text-zinc-500 mb-2">
            (Collateral × Liquidation Threshold) ÷ Debt
          </p>
          <p className="text-[11px] font-mono text-zinc-400">
            (${fmtUsd(accountData.totalCollateralUsd)} ×{" "}
            {accountData.currentLiquidationThreshold.toFixed(2)}%) ÷{" "}
            {accountData.totalDebtUsd === 0 ? (
              <span className="text-zinc-600">no debt</span>
            ) : (
              `$${fmtUsd(accountData.totalDebtUsd)}`
            )}{" "}
            ={" "}
            <span className={hfColor(hf)}>
              {hf === null ? "∞" : hf.toFixed(4)}
            </span>
          </p>
          <p className="text-[10px] text-zinc-700 mt-2">
            Liquidation occurs below 1.0. Keep above 1.5 for safety.
          </p>
        </div>
      )}

      {/* ── Expanded: Available borrow formula ── */}
      {open === "available" && accountData && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 mb-3">
            Available Borrow Calculation
          </p>
          <p className="text-[11px] font-mono text-zinc-500 mb-2">
            (Collateral × Max LTV) − Current Debt
          </p>
          <p className="text-[11px] font-mono text-zinc-400">
            (${fmtUsd(accountData.totalCollateralUsd)} ×{" "}
            {accountData.ltv.toFixed(2)}%) − $
            {fmtUsd(accountData.totalDebtUsd)} ={" "}
            <span className="text-zinc-200">
              ${fmtUsd(accountData.availableBorrowsUsd)}
            </span>
          </p>
          <p className="text-[10px] text-zinc-700 mt-2">
            Max LTV is a weighted average across all supplied collateral.
          </p>
        </div>
      )}
    </div>
  );
}
