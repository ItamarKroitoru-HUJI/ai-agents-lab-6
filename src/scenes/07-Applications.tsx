import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const APPLICATIONS_FRAMES = seconds(20);

// Card reveal times. Each one matches the moment the narration names it.
const START = {
  casino: seconds(2.4),
  insurance: seconds(6.6),
  polling: seconds(9.4),
  monteCarlo: seconds(11.8),
};

// 2x2 grid below the title.
const CARD_W = 560;
const CARD_H = 260;
const GRID = { left: 60, top: 140, gapX: 40, gapY: 30 };
const ICON = 200;

// Seeded PRNG so every render shows the same dots.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Dot = { x: number; y: number; inside: boolean };
const DOT_COUNT = 800;
const rand = mulberry32(954);
const DOTS: Dot[] = [];
for (let i = 0; i < DOT_COUNT; i++) {
  const x = rand();
  const y = rand();
  DOTS.push({ x, y, inside: x * x + y * y <= 1 });
}
// INSIDE_SO_FAR[k] = dots inside the quarter circle among the first k.
const INSIDE_SO_FAR: number[] = [0];
for (let i = 0; i < DOT_COUNT; i++) {
  INSIDE_SO_FAR.push(INSIDE_SO_FAR[i] + (DOTS[i].inside ? 1 : 0));
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const CasinoIcon: React.FC = () => {
  const notches = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <g>
      <circle cx={100} cy={100} r={80} fill={COLORS.danger} />
      {notches.map((a) => (
        <rect
          key={a}
          x={92}
          y={22}
          width={16}
          height={26}
          fill={COLORS.text}
          transform={`rotate(${(a * 180) / Math.PI} 100 100)`}
        />
      ))}
      <circle cx={100} cy={100} r={50} fill="none" stroke={COLORS.text} strokeWidth={4} strokeDasharray="8 6" />
      <text x={100} y={112} fill={COLORS.text} fontSize={34} fontWeight="bold" textAnchor="middle">
        +1%
      </text>
    </g>
  );
};

const InsuranceIcon: React.FC = () => (
  <g>
    <path
      d="M100 20 L170 48 L170 100 C170 145 140 172 100 185 C60 172 30 145 30 100 L30 48 Z"
      fill="none"
      stroke={COLORS.good}
      strokeWidth={8}
      strokeLinejoin="round"
    />
    <path d="M68 102 L92 128 L136 78" fill="none" stroke={COLORS.good} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const PollingIcon: React.FC = () => {
  // A crowd of grey dots. A few highlighted dots form the sample.
  const cells: { cx: number; cy: number; sampled: boolean }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      cells.push({ cx: 28 + c * 24, cy: 28 + r * 24, sampled: (r * 7 + c) % 5 === 2 });
    }
  }
  return (
    <g>
      {cells.map((d) => (
        <circle key={`${d.cx}-${d.cy}`} cx={d.cx} cy={d.cy} r={8} fill={d.sampled ? COLORS.mu : COLORS.axis} />
      ))}
    </g>
  );
};

const MonteCarloIcon: React.FC<{ shown: number }> = ({ shown }) => (
  <g>
    <rect x={0} y={0} width={ICON} height={ICON} fill="none" stroke={COLORS.axis} strokeWidth={3} />
    {/* Quarter circle centered at the bottom-left corner. */}
    <path d={`M0 0 A${ICON} ${ICON} 0 0 1 ${ICON} ${ICON}`} fill="none" stroke={COLORS.mu} strokeWidth={3} />
    {DOTS.slice(0, shown).map((d, i) => (
      <circle key={i} cx={d.x * ICON} cy={ICON - d.y * ICON} r={2.5} fill={d.inside ? COLORS.data : COLORS.danger} />
    ))}
  </g>
);

type CardProps = {
  index: number;
  start: number;
  title: string;
  caption: string;
  icon: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ index, start, title, caption, icon }) => {
  const frame = useCurrentFrame();
  const enter = spring({ frame: Math.max(0, frame - start), fps: FPS, config: { damping: 200 } });
  const visible = frame >= start ? 1 : 0;
  const col = index % 2;
  const row = Math.floor(index / 2);
  const left = GRID.left + col * (CARD_W + GRID.gapX);
  const top = GRID.top + row * (CARD_H + GRID.gapY);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: CARD_W,
        height: CARD_H,
        boxSizing: "border-box",
        padding: 30,
        display: "flex",
        alignItems: "center",
        gap: 30,
        borderRadius: 20,
        backgroundColor: "#1e293b",
        border: `2px solid ${COLORS.axis}`,
        opacity: enter * visible,
        transform: `translateY(${(1 - enter) * 40}px)`,
      }}
    >
      <svg width={ICON} height={ICON} viewBox={`0 0 ${ICON} ${ICON}`} style={{ flexShrink: 0 }}>
        {icon}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: CARD_W - 60 - ICON - 30 }}>
        <div style={{ fontSize: 36, fontWeight: "bold", color: COLORS.text }}>{title}</div>
        <div style={{ fontSize: 26, lineHeight: 1.3, color: COLORS.muted, whiteSpace: "pre-line" }}>{caption}</div>
      </div>
    </div>
  );
};

export const Applications: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], clamp);

  // Monte Carlo dots stream in after the card appears.
  const shown = Math.round(
    interpolate(frame, [START.monteCarlo + 10, APPLICATIONS_FRAMES - 30], [1, DOT_COUNT], clamp),
  );
  const piEstimate = (4 * INSIDE_SO_FAR[shown]) / shown;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/applications.wav")} />
      <h1 style={{ textAlign: "center", fontSize: 52, marginTop: 40, marginBottom: 0, opacity: titleOpacity }}>
        The law in the real world
      </h1>
      <Card index={0} start={START.casino} title="Casinos" caption={"Small house edge,\nmillions of bets"} icon={<CasinoIcon />} />
      <Card index={1} start={START.insurance} title="Insurance" caption={"Premiums from\naverage claims"} icon={<InsuranceIcon />} />
      <Card index={2} start={START.polling} title="Polling" caption={"A sample estimates\nthe population"} icon={<PollingIcon />} />
      <Card
        index={3}
        start={START.monteCarlo}
        title="Monte Carlo"
        caption={`Random points\nestimate π\nn = ${shown}\nπ ≈ ${piEstimate.toFixed(3)}`}
        icon={<MonteCarloIcon shown={shown} />}
      />
    </AbsoluteFill>
  );
};
