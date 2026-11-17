import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const COINS_FRAMES = seconds(14);

const MU = 0.5;
const N_MAX = 1000000;
const DECADES = 6;
const SAMPLE_COUNT = 600;

// Plot geometry. The log axis runs from LEFT (n = 1) to X_MILLION (n = 10^6).
// The strip from X_MILLION to X_INF is the "infinity" zone for the finale.
const LEFT = 150;
const X_MILLION = 1010;
const X_INF = 1150;
const TOP = 160;
const BOTTOM = 530;

// Estimated narration cues. The coins line runs about 12 seconds.
const T_DRAW = seconds(3.8); // "Watch the running average as n grows."
const T_TEN = seconds(5.8); // "Ten flips."
const T_THOUSAND = seconds(7.1); // "A thousand."
const T_MILLION = seconds(8.3); // "A million."
const T_EXTEND = seconds(9.2); // "As n goes to infinity"
const T_INFINITY = seconds(9.9); // the word "infinity"
const T_LOCK = seconds(10.8); // "it locks onto one half."
const FADE = 10;

// Seeded PRNG so every render shows the same flips.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Seed choice: at n = 10^6 the average has std 0.5 / 1000 = 0.0005.
// A miss of 0.002 is 4 std, so almost any seed (205 included) lands within it.
// The design does not rely on that: the infinity finale blends the line onto mu exactly.
const rand = mulberry32(205);

// Log-spaced sample points from 1 to 10^6, deduplicated for small n.
const SAMPLE_N: number[] = [];
for (let k = 0; k < SAMPLE_COUNT; k++) {
  const n = Math.round(Math.pow(10, (DECADES * k) / (SAMPLE_COUNT - 1)));
  if (SAMPLE_N.length === 0 || SAMPLE_N[SAMPLE_N.length - 1] !== n) {
    SAMPLE_N.push(n);
  }
}

// Simulate all 10^6 flips once, storing the running average at sample points only.
const SAMPLE_AVG: number[] = [];
{
  let heads = 0;
  let next = 0;
  for (let i = 1; i <= N_MAX && next < SAMPLE_N.length; i++) {
    heads += rand() < 0.5 ? 1 : 0;
    if (i === SAMPLE_N[next]) {
      SAMPLE_AVG.push(heads / i);
      next++;
    }
  }
}

const LAST_AVG: number = SAMPLE_AVG[SAMPLE_AVG.length - 1];

const xOfLog = (logN: number): number => LEFT + (logN / DECADES) * (X_MILLION - LEFT);
const xOfN = (n: number): number => xOfLog(Math.log10(n));
const y = (avg: number): number => BOTTOM - avg * (BOTTOM - TOP);

const TICKS: { n: number; label: string }[] = [
  { n: 1, label: "1" },
  { n: 10, label: "10" },
  { n: 100, label: "100" },
  { n: 1000, label: "1k" },
  { n: 10000, label: "10k" },
  { n: 100000, label: "100k" },
  { n: 1000000, label: "1M" },
];

const withCommas = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Points of the finale segment: from (10^6, LAST_AVG) to the right edge, easing onto mu.
const EXTENSION_STEPS = 40;
const extensionPoint = (s: number): [number, number] => {
  const blend = (1 - s) * (1 - s);
  return [X_MILLION + s * (X_INF - X_MILLION), y(MU + (LAST_AVG - MU) * blend)];
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Coins: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene fade in and out for the transitions.
  const sceneOpacity = Math.min(
    interpolate(frame, [0, FADE], [0, 1], clamp),
    interpolate(frame, [COINS_FRAMES - FADE, COINS_FRAMES], [1, 0], clamp),
  );

  // log10(n) over time, timed to the spoken cues.
  const logN = interpolate(frame, [T_DRAW, T_TEN, T_THOUSAND, T_MILLION], [0, 1, 3, DECADES], clamp);
  const nNow = Math.pow(10, logN);
  let count = 1;
  while (count < SAMPLE_N.length && SAMPLE_N[count] <= nNow * (1 + 1e-9)) {
    count++;
  }
  const headN: number = SAMPLE_N[count - 1];
  const headAvg: number = SAMPLE_AVG[count - 1];

  const pointList: string[] = [];
  for (let i = 0; i < count; i++) {
    pointList.push(`${xOfN(SAMPLE_N[i])},${y(SAMPLE_AVG[i])}`);
  }

  // Finale: extend the line to the right edge, flattening onto mu.
  const extend = interpolate(frame, [T_EXTEND, T_LOCK], [0, 1], clamp);
  let headX = xOfN(headN);
  let headY = y(headAvg);
  if (extend > 0) {
    const steps = Math.max(1, Math.round(extend * EXTENSION_STEPS));
    for (let j = 1; j <= steps; j++) {
      const [px, py] = extensionPoint((j / EXTENSION_STEPS) * (extend * EXTENSION_STEPS / steps));
      pointList.push(`${px},${py}`);
      headX = px;
      headY = py;
    }
  }
  const points = pointList.join(" ");

  // Counter: n turns into infinity with a spring.
  const infSpring = spring({ frame: Math.max(0, frame - T_INFINITY), fps: FPS, config: { damping: 10, stiffness: 120 } });
  const numberOpacity = interpolate(frame, [T_INFINITY, T_INFINITY + 6], [1, 0], clamp);
  const infOpacity = interpolate(frame, [T_INFINITY, T_INFINITY + 6], [0, 1], clamp);

  // Readout: "= 0.4998" becomes "→ 0.5".
  const avgOpacity = interpolate(frame, [T_LOCK, T_LOCK + 8], [1, 0], clamp);
  const limitOpacity = interpolate(frame, [T_LOCK, T_LOCK + 8], [0, 1], clamp);

  // Glow pulse on mu when the line locks on.
  const glow = interpolate(frame, [T_LOCK, T_LOCK + 8, T_LOCK + 24, T_LOCK + 40], [0, 0.9, 0.5, 0], clamp);
  const muLabelScale = 1 + 0.15 * glow;
  const infTickOpacity = interpolate(frame, [T_EXTEND, T_EXTEND + 12], [0, 1], clamp);
  const subtitleOpacity = interpolate(frame, [seconds(1.6), seconds(2.2)], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT, opacity: sceneOpacity }}>
      <Audio src={staticFile("narration/coins.wav")} />
      <div style={{ position: "absolute", top: 28, width: "100%", textAlign: "center", fontSize: 48, fontWeight: 700 }}>
        Running average of fair coin flips
      </div>
      <div
        style={{
          position: "absolute",
          top: 92,
          width: "100%",
          textAlign: "center",
          fontSize: 28,
          color: COLORS.muted,
          opacity: subtitleOpacity,
        }}
      >
        heads = 1, tails = 0
      </div>

      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <filter id="mu-glow" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation={6} />
          </filter>
        </defs>

        {/* Axes */}
        <line x1={LEFT} y1={BOTTOM} x2={X_MILLION} y2={BOTTOM} stroke={COLORS.axis} strokeWidth={2} />
        <line
          x1={X_MILLION}
          y1={BOTTOM}
          x2={X_INF}
          y2={BOTTOM}
          stroke={COLORS.axis}
          strokeWidth={2}
          strokeDasharray="4 6"
        />
        <line x1={LEFT} y1={TOP} x2={LEFT} y2={BOTTOM} stroke={COLORS.axis} strokeWidth={2} />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={LEFT - 16} y={y(v) + 8} fill={COLORS.muted} fontSize={24} textAnchor="end">
            {v}
          </text>
        ))}
        {TICKS.map((t) => (
          <g key={t.label}>
            <line x1={xOfN(t.n)} y1={BOTTOM} x2={xOfN(t.n)} y2={BOTTOM + 10} stroke={COLORS.axis} strokeWidth={2} />
            <text x={xOfN(t.n)} y={BOTTOM + 38} fill={COLORS.muted} fontSize={24} textAnchor="middle">
              {t.label}
            </text>
          </g>
        ))}
        <g opacity={infTickOpacity}>
          <line x1={X_INF} y1={BOTTOM} x2={X_INF} y2={BOTTOM + 10} stroke={COLORS.axis} strokeWidth={2} />
          <text x={X_INF} y={BOTTOM + 40} fill={COLORS.muted} fontSize={30} textAnchor="middle">
            ∞
          </text>
        </g>
        <text x={(LEFT + X_MILLION) / 2} y={BOTTOM + 78} fill={COLORS.muted} fontSize={24} textAnchor="middle">
          n (log scale)
        </text>

        {/* mu line with a glow pulse */}
        <line
          x1={LEFT}
          y1={y(MU)}
          x2={X_INF}
          y2={y(MU)}
          stroke={COLORS.mu}
          strokeWidth={14}
          opacity={glow}
          filter="url(#mu-glow)"
        />
        <line x1={LEFT} y1={y(MU)} x2={X_INF} y2={y(MU)} stroke={COLORS.mu} strokeDasharray="10 8" strokeWidth={3} />
        <text
          x={X_INF}
          y={y(MU) - 20}
          fill={COLORS.mu}
          fontSize={30}
          textAnchor="end"
          style={{ transformBox: "fill-box", transformOrigin: "right bottom", transform: `scale(${muLabelScale})` }}
        >
          μ = 0.5
        </text>

        {/* Running average */}
        <polyline points={points} fill="none" stroke={COLORS.data} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={headX} cy={headY} r={8} fill={COLORS.data} />
      </svg>

      {/* Counter */}
      <div
        style={{
          position: "absolute",
          top: 640,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 34,
          color: COLORS.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>n =&nbsp;</span>
        <span style={{ position: "relative", display: "inline-block", width: 190, height: 44 }}>
          <span style={{ position: "absolute", left: 0, top: 0, opacity: numberOpacity }}>{withCommas(headN)}</span>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: -6,
              fontSize: 44,
              color: COLORS.mu,
              opacity: infOpacity,
              transform: `scale(${infSpring})`,
              transformOrigin: "left center",
            }}
          >
            ∞
          </span>
        </span>
        <span style={{ marginLeft: 40 }}>average&nbsp;</span>
        <span style={{ position: "relative", display: "inline-block", width: 150, height: 44 }}>
          <span style={{ position: "absolute", left: 0, top: 0, opacity: avgOpacity }}>= {headAvg.toFixed(4)}</span>
          <span style={{ position: "absolute", left: 0, top: 0, opacity: limitOpacity, color: COLORS.mu }}>→ 0.5</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
