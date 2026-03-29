"use client";

import React from "react";

type SliderProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
};

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100000,
  step = 100,
  suffix = "",
}: SliderProps) {
  const id = React.useId();
  const [dragging, setDragging] = React.useState(false);
  const percent = Math.max(
    0,
    Math.min(100, ((value - min) / (max - min)) * 100)
  );

  React.useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="w-full sm:w-56 md:w-72 shrink-0">
        <label htmlFor={id} className="text-sm font-medium block">
          {label}
        </label>
        <div className="mt-1 text-xs sm:text-sm text-muted-foreground tabular-nums truncate">
          {value.toLocaleString()} {suffix}
        </div>
      </div>
      <div className="relative flex-1">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setDragging(true)}
          onTouchStart={() => setDragging(true)}
          onPointerDown={() => setDragging(true)}
          className="w-full accent-primary"
          aria-label={label}
          aria-valuetext={`${value.toLocaleString()} ${suffix}`}
        />
        {dragging && (
          <div
            className="pointer-events-none absolute -top-9 left-0 -translate-x-1/2"
            style={{ left: `${percent}%` }}
          >
            <div className="rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background tabular-nums shadow whitespace-nowrap">
              {value.toLocaleString()} {suffix}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PricingCalculator() {
  // 1 credit = $0.0001 — rates in credits per operation
  const WALLET_CREATE_CREDITS = 1;       // 1 credit per wallet creation
  const STABLECOIN_TRANSFER_CREDITS = 5; // 5 credits per stablecoin transfer
  const CREDIT_COST_USD = 0.0001;        // $0.0001 per credit
  const MINIMUM_SPEND = 10;             // $10 minimum monthly spend

  const [walletCreations, setWalletCreations] = React.useState<number>(5000);
  const [stablecoinTransfers, setStablecoinTransfers] = React.useState<number>(2000);

  const walletCost = walletCreations * WALLET_CREATE_CREDITS * CREDIT_COST_USD;
  const transferCost = stablecoinTransfers * STABLECOIN_TRANSFER_CREDITS * CREDIT_COST_USD;
  const subtotal = walletCost + transferCost;
  const totalDue = Math.max(subtotal, MINIMUM_SPEND);

  return (
    <div className="rounded-[18px] bg-primary/20 p-1">
      <div className="rounded-[14px] bg-primary/20 p-0.5 shadow-sm">
        <div className="bg-background rounded-xl p-5 pb-10">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-sm uppercase tracking-wider text-primary">
                Pricing Calculator
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Drag the sliders to estimate your monthly cost.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Slider
                label="Wallet creations / month"
                value={walletCreations}
                onChange={setWalletCreations}
                min={0}
                max={500000}
                step={100}
                suffix="wallets"
              />
              <Slider
                label="Stablecoin transfers / month"
                value={stablecoinTransfers}
                onChange={setStablecoinTransfers}
                min={0}
                max={200000}
                step={100}
                suffix="transfers"
              />
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="rounded-lg border border-primary/30 p-4">
                <div className="text-xs text-muted-foreground">Wallet creations</div>
                <div className="text-lg font-medium">${walletCost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  {WALLET_CREATE_CREDITS} credit each
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 p-4">
                <div className="text-xs text-muted-foreground">Stablecoin transfers</div>
                <div className="text-lg font-medium">${transferCost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  {STABLECOIN_TRANSFER_CREDITS} credits each
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 p-4 bg-primary/10">
                <div className="text-xs text-muted-foreground">Estimated Total</div>
                <div className="text-3xl text-primary font-semibold">
                  ${totalDue.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {subtotal < MINIMUM_SPEND
                    ? "Minimum $10 applies"
                    : "before taxes"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingCalculator;