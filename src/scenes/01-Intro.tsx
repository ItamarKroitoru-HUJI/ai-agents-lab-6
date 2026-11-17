import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const INTRO_FRAMES = seconds(9.5);

// Seeded PRNG so every render shows the same flips.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(101);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Single coin. It starts on heads. An even number of half-turns lands on heads.
const LANDS_HEADS = rand() < 0.5;
const HALF_TURNS = LANDS_HEADS ? 10 : 11;
const COIN = { x: 640, y: 330, r: 90 };

// Grid of 1000 small coins.
const COLS = 40;
const ROWS = 25;
const GAP = 16;
const DOT_R = 6;
const GRID = { left: 140, top: 110 };
const GRID_CENTER_X = GRID.left + ((COLS - 1) * GAP) / 2;
const GRID_BOTTOM = GRID.top + (ROWS - 1) * GAP;
const GRID_COINS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
  heads: rand() < 0.5,
}));
const HEADS_PCT = ((100 * GRID_COINS.filter((c) => c.heads).length) / GRID_COINS.length).toFixed(1);

// Timeline in frames, matched to the narration.
const T = {
  flipStart: 5,
  flipEnd: 55,
  resultIn: 58,
  coinOut: 72,
  gridStart: 86,
  gridSpread: 50,
  gridLabel: 140,
  question: 165,
  title: 190,
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  // Single coin flip.
  const spin = spring({
    frame: Math.max(0, frame - T.flipStart),
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: T.flipEnd - T.flipStart,
  });
  const theta = spin * HALF_TURNS * Math.PI;
  const squash = Math.max(0.03, Math.abs(Math.cos(theta)));
  const showsHeads = Math.floor((theta + Math.PI / 2) / Math.PI) % 2 === 0;
  const tossT = interpolate(frame, [T.flipStart, T.flipEnd], [0, 1], clamp);
  const lift = -Math.sin(tossT * Math.PI) * 160;
  const resultOpacity = interpolate(frame, [T.resultIn, T.resultIn + 12], [0, 1], clamp);
  const coinOpacity = interpolate(frame, [T.coinOut, T.coinOut + 14], [1, 0], clamp);

  // Grid, "?" and title.
  const gridLabelOpacity = interpolate(frame, [T.gridLabel, T.gridLabel + 20], [0, 1], clamp);
  const questionScale = spring({
    frame: Math.max(0, frame - T.question),
    fps: FPS,
    config: { damping: 12 },
  });
  const questionOpacity = interpolate(frame, [T.question, T.question + 15], [0, 1], clamp);
  const titleOpacity = interpolate(frame, [T.title, T.title + 22], [0, 1], clamp);
  const titleRise = interpolate(frame, [T.title, T.title + 22], [30, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/intro.wav")} />
      {/* Name the topic out loud as the title appears. */}
      <Sequence from={T.title} layout="none">
        <Audio src={staticFile("narration/intro-title.wav")} />
      </Sequence>
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Phase 1: one coin flips and lands. */}
        <g opacity={coinOpacity}>
          <g transform={`translate(${COIN.x} ${COIN.y + lift}) scale(1 ${squash})`}>
            <circle r={COIN.r} fill={showsHeads ? COLORS.data : COLORS.mu} stroke={COLORS.text} strokeWidth={6} />
            <circle r={COIN.r - 16} fill="none" stroke={COLORS.bg} strokeOpacity={0.4} strokeWidth={4} />
            <text fill={COLORS.bg} fontSize={84} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
              {showsHeads ? "H" : "T"}
            </text>
          </g>
          <text x={COIN.x} y={490} fill={COLORS.text} fontSize={44} textAnchor="middle" opacity={resultOpacity}>
            {`1 coin: ${LANDS_HEADS ? "Heads" : "Tails"}`}
          </text>
        </g>

        {/* Phase 2: a grid of 1000 coins. */}
        {GRID_COINS.map((c, i) => {
          const delay = T.gridStart + ((c.col + c.row) / (COLS + ROWS - 2)) * T.gridSpread;
          const r = interpolate(frame, [delay, delay + 8], [0, DOT_R], clamp);
          if (r <= 0) return null;
          return (
            <circle
              key={i}
              cx={GRID.left + c.col * GAP}
              cy={GRID.top + c.row * GAP}
              r={r}
              fill={c.heads ? COLORS.data : COLORS.mu}
            />
          );
        })}
        <text
          x={GRID_CENTER_X}
          y={GRID_BOTTOM + 60}
          fill={COLORS.muted}
          fontSize={36}
          textAnchor="middle"
          opacity={gridLabelOpacity}
        >
          {`1,000 coins: ${HEADS_PCT}% heads`}
        </text>

        {/* Big question mark, right of the grid. */}
        <g transform={`translate(1010 310) scale(${questionScale})`} opacity={questionOpacity}>
          <text fill={COLORS.mu} fontSize={280} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
            ?
          </text>
        </g>

        {/* Title. */}
        <text
          x={640}
          y={660 + titleRise}
          fill={COLORS.text}
          fontSize={56}
          fontWeight="bold"
          textAnchor="middle"
          opacity={titleOpacity}
        >
          The Weak Law of Large Numbers
        </text>
      </svg>
    </AbsoluteFill>
  );
};
