import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";

const N = 1000;
const MU = 0.5;
const PLOT = { left: 120, right: 1180, top: 160, bottom: 600 };

// Seeded PRNG so every render shows the same flips.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(205);
const AVERAGES: number[] = [];
let heads = 0;
for (let i = 1; i <= N; i++) {
  heads += rand() < 0.5 ? 1 : 0;
  AVERAGES.push(heads / i);
}

const x = (n: number) => PLOT.left + ((n - 1) / (N - 1)) * (PLOT.right - PLOT.left);
const y = (avg: number) => PLOT.bottom - avg * (PLOT.bottom - PLOT.top);

export const COINS_FRAMES = 300;

export const Coins: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = Math.max(1, Math.round(interpolate(frame, [20, 240], [1, N], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })));
  const points = AVERAGES.slice(0, shown).map((avg, i) => `${x(i + 1)},${y(avg)}`).join(" ");
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const muOpacity = interpolate(frame, [230, 260], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", color: "white", fontFamily: "sans-serif" }}>
      <Audio src={staticFile("narration/coins.wav")} />
      <h1 style={{ textAlign: "center", fontSize: 52, marginTop: 40, opacity: titleOpacity }}>
        Average of n coin flips
      </h1>
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} stroke="#64748b" strokeWidth={2} />
        <line x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} stroke="#64748b" strokeWidth={2} />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={PLOT.left - 16} y={y(v) + 8} fill="#94a3b8" fontSize={24} textAnchor="end">{v}</text>
        ))}
        <line x1={PLOT.left} y1={y(MU)} x2={PLOT.right} y2={y(MU)} stroke="#f59e0b" strokeDasharray="10 8" strokeWidth={3} />
        <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth={4} strokeLinejoin="round" />
        <circle cx={x(shown)} cy={y(AVERAGES[shown - 1])} r={8} fill="#38bdf8" />
        <text x={PLOT.right} y={y(MU) - 16} fill="#f59e0b" fontSize={32} textAnchor="end" opacity={muOpacity}>μ = 0.5</text>
        <text x={PLOT.right} y={PLOT.bottom + 48} fill="#e2e8f0" fontSize={28} textAnchor="end" style={{ whiteSpace: "pre" }}>
          {`n = ${shown}    average = ${AVERAGES[shown - 1].toFixed(3)}`}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
