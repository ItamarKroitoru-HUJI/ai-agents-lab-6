import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

const MU = 0.5;
const REPEATS = 2000;
const X_MIN = 0.15;
const X_MAX = 0.85;
const PLOT = { left: 120, right: 900 };
const ROW_TOP = 130;
const ROW_GAP = 175;
const ROW_HEIGHT = 140;
const AXIS_Y = ROW_TOP + 2 * ROW_GAP + ROW_HEIGHT;

// Estimated narration times for "ten", "one hundred" and "one thousand".
const START_TEN = seconds(3.0);
const START_HUNDRED = seconds(6.5);
const START_THOUSAND = seconds(8.7);

// Seeded PRNG so every render shows the same histograms.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(404);

type Bar = { center: number; count: number };
type Histogram = {
  n: number;
  spread: string;
  binWidth: number;
  start: number;
  bars: Bar[];
  maxCount: number;
};

// binsPerUnit = 1 / bin width. Bins are centered on multiples of the width.
const simulate = (n: number, binsPerUnit: number): { bars: Bar[]; maxCount: number } => {
  const counts = new Map<number, number>();
  for (let r = 0; r < REPEATS; r++) {
    let heads = 0;
    for (let i = 0; i < n; i++) {
      heads += rand() < 0.5 ? 1 : 0;
    }
    const idx = Math.round((heads * binsPerUnit) / n);
    counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }
  const bars: Bar[] = [];
  counts.forEach((count, idx) => {
    const center = idx / binsPerUnit;
    if (center >= X_MIN && center <= X_MAX) {
      bars.push({ center, count });
    }
  });
  const maxCount = bars.reduce((m, b) => Math.max(m, b.count), 1);
  return { bars, maxCount };
};

const ROWS: { n: number; spread: string; binsPerUnit: number; start: number }[] = [
  { n: 10, spread: "0.16", binsPerUnit: 10, start: START_TEN },
  { n: 100, spread: "0.05", binsPerUnit: 100, start: START_HUNDRED },
  { n: 1000, spread: "0.016", binsPerUnit: 100, start: START_THOUSAND },
];

const HISTOGRAMS: Histogram[] = ROWS.map((row) => {
  const { bars, maxCount } = simulate(row.n, row.binsPerUnit);
  return {
    n: row.n,
    spread: row.spread,
    binWidth: 1 / row.binsPerUnit,
    start: row.start,
    bars,
    maxCount,
  };
});

const x = (v: number) => PLOT.left + ((v - X_MIN) / (X_MAX - X_MIN)) * (PLOT.right - PLOT.left);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const SPREAD_FRAMES = seconds(15);

const HistogramRow: React.FC<{ hist: Histogram; index: number; frame: number }> = ({ hist, index, frame }) => {
  const top = ROW_TOP + index * ROW_GAP;
  const bottom = top + ROW_HEIGHT;
  const grow = spring({ frame: Math.max(0, frame - hist.start), fps: FPS, config: { damping: 200 } });
  const opacity = interpolate(frame, [hist.start, hist.start + 15], [0, 1], clamp);
  const barPx = (hist.binWidth / (X_MAX - X_MIN)) * (PLOT.right - PLOT.left);

  return (
    <g>
      <line x1={PLOT.left} y1={bottom} x2={PLOT.right} y2={bottom} stroke={COLORS.axis} strokeWidth={2} />
      {hist.bars.map((bar) => {
        const h = (bar.count / hist.maxCount) * (ROW_HEIGHT - 10) * grow;
        return (
          <rect
            key={bar.center}
            x={x(bar.center) - barPx / 2 + 1}
            y={bottom - h}
            width={Math.max(1, barPx - 2)}
            height={h}
            fill={COLORS.data}
          />
        );
      })}
      <g opacity={opacity}>
        <text x={PLOT.right + 50} y={top + 60} fill={COLORS.text} fontSize={32}>
          {`n = ${hist.n}`}
        </text>
        <text x={PLOT.right + 50} y={top + 104} fill={COLORS.muted} fontSize={28}>
          {`σ/√n = ${hist.spread}`}
        </text>
      </g>
    </g>
  );
};

export const Spread: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], clamp);
  const muOpacity = interpolate(frame, [10, 40], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/spread.wav")} />
      <h1 style={{ textAlign: "center", fontSize: 48, marginTop: 36, opacity: titleOpacity }}>
        {`Averages from ${REPEATS} repeated experiments`}
      </h1>
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        {HISTOGRAMS.map((hist, i) => (
          <HistogramRow key={hist.n} hist={hist} index={i} frame={frame} />
        ))}
        <g opacity={muOpacity}>
          <line
            x1={x(MU)}
            y1={ROW_TOP - 6}
            x2={x(MU)}
            y2={AXIS_Y}
            stroke={COLORS.mu}
            strokeDasharray="10 8"
            strokeWidth={3}
          />
          <text x={x(MU)} y={AXIS_Y + 34} fill={COLORS.mu} fontSize={28} textAnchor="middle">
            μ = 0.5
          </text>
        </g>
        {[0.2, 0.3, 0.7, 0.8].map((v) => (
          <text key={v} x={x(v)} y={AXIS_Y + 34} fill={COLORS.muted} fontSize={24} textAnchor="middle" opacity={titleOpacity}>
            {v}
          </text>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
