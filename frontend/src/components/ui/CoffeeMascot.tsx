import { useEffect, useState } from "react";

type Beverage = "coffee" | "tea";

interface MascotProps {
  beverage: Beverage;
  focusField: "email" | "password" | null;
  loading: boolean;
}

type Phase = "idle" | "cupFront" | "pouring" | "served";

const COFFEE_FLAVORS = ["Latte", "Cappuccino", "Espresso"] as const;
const TEA_FLAVORS = ["Assam", "Darjeeling", "Light"] as const;

/**
 * Coffee/tea vending machine with a flavor menu (first flavor selected by
 * default). The cup sits INSIDE the dispensing alcove, like a real machine.
 */
export function CoffeeMascot({ beverage, focusField, loading }: MascotProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [flying, setFlying] = useState(false);
  // First flavor selected by default
  const [flavorIdx, setFlavorIdx] = useState(0);

  useEffect(() => {
    if (loading) {
      setPhase("pouring");
      const t1 = setTimeout(() => setPhase("served"), 1400);
      const t2 = setTimeout(() => setFlying(true), 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    setFlying(false);
    if (focusField === "email") setPhase("cupFront");
    else if (focusField === "password") setPhase("pouring");
    else setPhase("idle");
  }, [focusField, loading]);

  const isCoffee = beverage === "coffee";
  const flavors = isCoffee ? COFFEE_FLAVORS : TEA_FLAVORS;
  const flavor = flavors[flavorIdx] ?? "Latte";
  // Real drink colors: coffee = rich espresso brown, tea = light amber-brown
  const liquidColor = isCoffee ? "bg-[#4A2C17]" : "bg-[#C18B3D]";
  const accentText = isCoffee ? "text-[#B07851]" : "text-[#A87742]";
  // Liquid surface highlight
  const surfaceColor = isCoffee ? "via-[#6B4426]" : "via-[#D9A45C]";
  const cupInAlcove = phase === "cupFront" || phase === "pouring" || phase === "served";
  const hasLiquid = phase === "pouring" || phase === "served";

  const statusText = phase === "idle"
    ? "READY"
    : phase === "cupFront"
      ? "CUP SET"
      : phase === "pouring"
        ? `POURING ${flavor.toUpperCase()}`
        : `${flavor.toUpperCase()} READY`;

  return (
    <div className="relative flex h-80 w-80 items-end justify-center">
      {/* ───── Flying cup overlay ───── */}
      {flying && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#0a0a1a]/40 backdrop-blur-sm">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <div className="absolute inset-0 animate-rotate-slow rounded-full border-4 border-white/10 border-t-white/80" />
            <div className="relative flex h-16 w-16 flex-col overflow-hidden rounded-b-[1.2rem] rounded-t-md bg-gradient-to-b from-white via-white to-gray-200 shadow-2xl ring-1 ring-black/10">
              <div className="absolute bottom-1 left-1/2 w-12 -translate-x-1/2 rounded-b-xl rounded-t-sm" style={{ height: "65%" }}>
                <div className={`h-full w-full rounded-b-xl rounded-t-sm ${liquidColor}`} />
              </div>
              <div className="absolute -right-2 top-3 h-6 w-4 rounded-full border-2 border-gray-300 bg-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* ───── MACHINE ───── */}
      <div className="relative flex h-72 w-52 flex-col rounded-[1.5rem] border-2 border-gray-700/60 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 shadow-2xl">
        {/* Top brand bar */}
        <div className="flex h-9 items-center justify-center rounded-t-[1.4rem] border-b-2 border-gray-500/60 bg-gradient-to-b from-gray-100 to-gray-300">
          <span className="text-[11px] font-extrabold tracking-[0.3em] text-gray-700 drop-shadow-sm">
            {isCoffee ? "COFFEE" : "TEA"}
          </span>
        </div>

        {/* LCD status display */}
        <div className="relative mx-3 mt-3 flex h-7 items-center justify-between rounded-md border border-gray-500/60 bg-black/80 px-2.5 shadow-inner">
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${phase === "pouring" ? "bg-red-500 animate-pulse-glow" : "bg-green-500"}`} />
            <span className="font-mono text-[9px] font-bold tracking-wider text-green-300 drop-shadow">
              {statusText}
            </span>
          </div>
          <span className="font-mono text-[9px] text-amber-400/80">{flavor.toUpperCase().slice(0, 4)}</span>
        </div>

        {/* Flavor menu — three options, first selected by default */}
        <div className="mx-3 mt-2 flex flex-col gap-1.5">
          {flavors.map((f, i) => {
            const selected = i === flavorIdx;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFlavorIdx(i)}
                className={`flex h-7 items-center justify-between rounded-md border px-2.5 text-[11px] font-semibold transition-all ${
                  selected
                    ? isCoffee
                      ? "border-[#6B4426]/60 bg-gradient-to-r from-[#6B4426]/30 to-[#4A2C17]/20 text-[#3a1c0a] shadow-inner ring-1 ring-[#B07851]/50"
                      : "border-[#A87742]/60 bg-gradient-to-r from-[#A87742]/30 to-[#7A4F20]/20 text-[#3a1c0a] shadow-inner ring-1 ring-[#D9A45C]/50"
                    : "border-gray-500/40 bg-white/60 text-gray-600 hover:bg-white/80"
                }`}
              >
                <span className="flex items-center gap-2">
                  {/* Selection indicator */}
                  <span
                    className={`flex h-3 w-3 items-center justify-center rounded-full border transition-all ${
                      selected
                        ? isCoffee
                      ? "border-[#6B4426] bg-[#6B4426]"
                      : "border-[#A87742] bg-[#A87742]"
                        : "border-gray-400 bg-white"
                    }`}
                  >
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  {f}
                </span>
                <span className={`font-mono text-[8px] tracking-wider ${selected ? "opacity-70" : "opacity-40"}`}>
                  {isCoffee ? "C" : "T"}{i + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dispensing alcove */}
        <div className="relative mx-3 mt-3 mb-2 h-24 rounded-xl border-2 border-gray-600/60 bg-gradient-to-b from-gray-900 to-black shadow-inner overflow-hidden">
          {/* Alcove top shadow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/70 to-transparent" />

          {/* Chrome spout poking out from the top of the alcove */}
          <div className="absolute left-1/2 top-1.5 z-20 flex -translate-x-1/2 flex-col items-center">
            <div className="h-2.5 w-7 rounded-t-md bg-gradient-to-b from-gray-300 to-gray-500 ring-1 ring-gray-600" />
            <div className="h-2 w-3 rounded-b-md bg-gradient-to-b from-gray-400 to-gray-700 shadow-md" />
            <div className="h-0.5 w-1.5 rounded-full bg-black" />
          </div>

          {/* Pour stream */}
          {phase === "pouring" && (
            <div className={`absolute left-1/2 top-[1.4rem] z-10 h-12 w-1.5 origin-top -translate-x-1/2 animate-pour-down rounded-full ${liquidColor} shadow-[0_0_6px_currentColor]`} />
          )}

          {/* The cup — always in the alcove once placed, no re-mounting */}
          {cupInAlcove && !flying && (
            <div className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2">
              <div className="relative flex h-14 w-12 flex-col overflow-hidden rounded-b-[1.2rem] rounded-t-md bg-gradient-to-br from-white via-white to-gray-200 shadow-2xl ring-1 ring-gray-300/60">
                {/* Rim */}
                <div className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1 rounded-full bg-gray-400/50" />
                {/* Empty tint fades out when liquid arrives */}
                {!hasLiquid && (
                  <div className="absolute inset-1 rounded-b-[1.1rem] rounded-t-sm bg-gray-100/70" />
                )}
                {/* Liquid — fills while pouring, stays when served */}
                {hasLiquid && (
                  <div className="absolute bottom-0.5 left-1/2 w-9 -translate-x-1/2 animate-cup-fill overflow-hidden rounded-b-[1.1rem] rounded-t-sm">
                    <div className={`relative h-full w-full ${liquidColor}`}>
                      <div className="absolute top-0 inset-x-0 h-1 rounded-full bg-white/20" />
                    </div>
                  </div>
                )}
                {/* Handle */}
                <div className="absolute -right-2.5 top-3 h-5 w-3.5 rounded-full border-[2.5px] border-gray-200 bg-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* Base / drip tray */}
        <div className="mx-3 mb-3 flex h-3 items-center justify-center rounded-md border border-gray-500/40 bg-gradient-to-b from-gray-300 to-gray-500 shadow">
          <div className="h-1 w-32 rounded-full bg-gradient-to-r from-transparent via-gray-700/40 to-transparent" />
        </div>
      </div>

      {/* Caption */}
      <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-medium ${accentText}`}>
        {phase === "cupFront"
          ? "Cup placed in alcove"
          : phase === "pouring"
            ? `Pouring ${flavor}…`
            : phase === "served"
              ? `${flavor} ready!`
              : `Select your ${isCoffee ? "coffee" : "tea"}`}
      </span>
    </div>
  );
}
