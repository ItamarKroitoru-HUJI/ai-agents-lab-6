import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const MOTIVATION_FRAMES = seconds(15);

// Seeded PRNG so every render shows the same dots.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(202);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Left panel: casino.
const CHIP = { x: 190, y: 260, r: 75 };
const BAR = { x: 100, y: 450, maxW: 460, h: 56 };

// Right panel: poll of 1000 people.
const TRUE_SHARE = 0.52;
const POLL_COLS = 40;
const POLL_ROWS = 25;
const POLL_GAP = 6;
const POLL = { left: 690, top: 190 };
const POLL_CENTER_X = POLL.left + ((POLL_COLS - 1) * POLL_GAP) / 2;
const POLL_DOTS = Array.from({ length: POLL_COLS * POLL_ROWS }, (_, i) => ({
  col: i % POLL_COLS,
  row: Math.floor(i / POLL_COLS),
  blue: rand() < TRUE_SHARE,
}));
const POLL_PCT = Math.round((100 * POLL_DOTS.filter((d) => d.blue).length) / POLL_DOTS.length);
const CROWD = { x: 1130, y: 262, r: 100 };
const CROWD_DOTS = Array.from({ length: 700 }, () => {
  const radius = CROWD.r * Math.sqrt(rand());
  const angle = rand() * 2 * Math.PI;
  return {
    x: CROWD.x + radius * Math.cos(angle),
    y: CROWD.y + radius * Math.sin(angle),
    blue: rand() < TRUE_SHARE,
  };
});

// Timeline in frames, matched to the narration.
const T = {
  titles: 0,
  chip: 10,
  lose: 50,
  bar: 85,
  barEnd: 125,
  pollDots: 125,
  pollLabel: 150,
  arrow: 175,
  crowd: 188,
  pollResult: 215,
  dim: 285,
  finalLine: 300,
};

export const Motivation: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [T.titles, T.titles + 15], [0, 1], clamp);
  const chipScale = spring({ frame: Math.max(0, frame - T.chip), fps: FPS, config: { damping: 12 } });
  const loseOpacity = interpolate(frame, [T.lose, T.lose + 15], [0, 1], clamp);
  const loseScale = spring({ frame: Math.max(0, frame - T.lose), fps: FPS, config: { damping: 10 } });
  const barLabelOpacity = interpolate(frame, [T.bar - 10, T.bar + 5], [0, 1], clamp);
  const barW = interpolate(frame, [T.bar, T.barEnd], [0, BAR.maxW], clamp);
  const barTextOpacity = interpolate(frame, [T.barEnd - 10, T.barEnd + 5], [0, 1], clamp);

  const pollLabelOpacity = interpolate(frame, [T.pollLabel, T.pollLabel + 15], [0, 1], clamp);
  const arrowLen = interpolate(frame, [T.arrow, T.arrow + 15], [0, 1], clamp);
  const crowdOpacity = interpolate(frame, [T.crowd, T.crowd + 25], [0, 0.85], clamp);
  const crowdLabelOpacity = interpolate(frame, [T.crowd + 10, T.crowd + 25], [0, 1], clamp);
  const resultOpacity = interpolate(frame, [T.pollResult, T.pollResult + 20], [0, 1], clamp);

  const panelOpacity = interpolate(frame, [T.dim, T.dim + 25], [1, 0.4], clamp);
  const finalOpacity = interpolate(frame, [T.finalLine, T.finalLine + 25], [0, 1], clamp);
  const finalRise = interpolate(frame, [T.finalLine, T.finalLine + 25], [24, 0], clamp);

  const arrowX1 = 945;
  const arrowX2 = arrowX1 + 60 * arrowLen;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/motivation.wav")} />
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        <g opacity={panelOpacity}>
          {/* Panel titles and divider. */}
          <g opacity={titleOpacity}>
            <text x={330} y={100} fill={COLORS.text} fontSize={40} fontWeight="bold" textAnchor="middle">
              Casino
            </text>
            <text x={950} y={100} fill={COLORS.text} fontSize={40} fontWeight="bold" textAnchor="middle">
              Poll
            </text>
            <line x1={640} y1={70} x2={640} y2={560} stroke={COLORS.axis} strokeWidth={2} />
          </g>

          {/* Left: one chip, one lost bet. */}
          <g transform={`translate(${CHIP.x} ${CHIP.y}) scale(${chipScale})`}>
            <circle r={CHIP.r} fill={COLORS.data} />
            <circle r={CHIP.r - 6} fill="none" stroke={COLORS.text} strokeWidth={10} strokeDasharray="18 14" />
            <circle r={CHIP.r - 24} fill="none" stroke={COLORS.text} strokeWidth={3} />
            <text fill={COLORS.text} fontSize={52} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
              $
            </text>
          </g>
          <g opacity={loseOpacity}>
            <g transform={`translate(${CHIP.x} ${CHIP.y}) scale(${loseScale})`}>
              <line x1={-60} y1={-60} x2={60} y2={60} stroke={COLORS.danger} strokeWidth={12} strokeLinecap="round" />
              <line x1={60} y1={-60} x2={-60} y2={60} stroke={COLORS.danger} strokeWidth={12} strokeLinecap="round" />
            </g>
            <text x={300} y={245} fill={COLORS.muted} fontSize={34}>
              One bet
            </text>
            <text x={300} y={300} fill={COLORS.danger} fontSize={44} fontWeight="bold">
              LOSE
            </text>
          </g>

          {/* Left: the yearly total is clearly positive. */}
          <text x={BAR.x} y={BAR.y - 22} fill={COLORS.muted} fontSize={32} opacity={barLabelOpacity}>
            Over a year
          </text>
          <rect x={BAR.x} y={BAR.y} width={barW} height={BAR.h} rx={8} fill={COLORS.good} />
          <line
            x1={BAR.x}
            y1={BAR.y - 10}
            x2={BAR.x}
            y2={BAR.y + BAR.h + 10}
            stroke={COLORS.axis}
            strokeWidth={3}
            opacity={barLabelOpacity}
          />
          <text
            x={BAR.x + 20}
            y={BAR.y + BAR.h / 2}
            fill={COLORS.bg}
            fontSize={32}
            fontWeight="bold"
            dominantBaseline="central"
            opacity={barTextOpacity}
          >
            + PROFIT
          </text>

          {/* Right: 1000 polled people. */}
          {POLL_DOTS.map((d, i) => {
            const delay = T.pollDots + (i / POLL_DOTS.length) * 30;
            const r = interpolate(frame, [delay, delay + 6], [0, 2.4], clamp);
            if (r <= 0) return null;
            return (
              <circle
                key={i}
                cx={POLL.left + d.col * POLL_GAP}
                cy={POLL.top + d.row * POLL_GAP}
                r={r}
                fill={d.blue ? COLORS.data : COLORS.mu}
              />
            );
          })}
          <text x={POLL_CENTER_X} y={400} fill={COLORS.muted} fontSize={32} textAnchor="middle" opacity={pollLabelOpacity}>
            1,000 people
          </text>

          {/* Arrow from sample to crowd. */}
          {arrowLen > 0 && (
            <g>
              <line x1={arrowX1} y1={CROWD.y} x2={arrowX2} y2={CROWD.y} stroke={COLORS.text} strokeWidth={4} />
              <polygon
                points={`${arrowX2 + 14},${CROWD.y} ${arrowX2},${CROWD.y - 10} ${arrowX2},${CROWD.y + 10}`}
                fill={COLORS.text}
              />
            </g>
          )}

          {/* Right: the large crowd. */}
          <g opacity={crowdOpacity}>
            {CROWD_DOTS.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={2.6} fill={d.blue ? COLORS.data : COLORS.mu} />
            ))}
          </g>
          <text x={CROWD.x} y={400} fill={COLORS.muted} fontSize={32} textAnchor="middle" opacity={crowdLabelOpacity}>
            Millions
          </text>

          {/* Right: the poll predicts the result. */}
          <text
            x={950}
            y={490}
            fill={COLORS.text}
            fontSize={34}
            textAnchor="middle"
            opacity={resultOpacity}
            style={{ whiteSpace: "pre" }}
          >
            {`Poll ${POLL_PCT}%   Vote ${Math.round(TRUE_SHARE * 100)}%`}
          </text>
        </g>

        {/* The one idea. */}
        <text
          x={640}
          y={650 + finalRise}
          fill={COLORS.mu}
          fontSize={40}
          fontWeight="bold"
          textAnchor="middle"
          opacity={finalOpacity}
        >
          Averages of many random trials become predictable.
        </text>
      </svg>
    </AbsoluteFill>
  );
};
