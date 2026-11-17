import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const MOTIVATION_FRAMES = seconds(20);

// Seeded PRNG so every render shows the same shots and laps.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(202);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Snappy broadcast spring. Starts at 0 and settles at 1.
const pop = (f: number, damping = 11): number =>
  spring({ frame: Math.max(0, f), fps: FPS, config: { damping, stiffness: 190, mass: 0.6 } });

const ACCENT = {
  ball: "#f97316",
  seam: "#7c2d12",
  panel: "#0b1224",
  edge: "#1e3a5f",
  live: "#dc2626",
  asphalt: "#334155",
  grass: "#10301f",
  car: "#ef4444",
};

// Timeline in frames, matched to the narration.
const T = {
  p1Out: 262,
  p2In: 270,
  lapsStart: 288,
  p2Out: 510,
  why: seconds(17.5),
};

// ---------- Part 1: free throws ----------

// First shot goes in, then three misses in a row, then a hot streak.
// After that, blocks of 10 with exactly one random miss: a 90% shooter.
const OUTCOMES: boolean[] = [true, false, false, false];
for (let i = 0; i < 16; i++) OUTCOMES.push(true);
for (let b = 0; b < 20; b++) {
  const missAt = Math.floor(rand() * 10);
  for (let j = 0; j < 10; j++) OUTCOMES.push(j !== missAt);
}
const N_SHOTS = OUTCOMES.length;

// Shots start slow, then speed up so the season fills in fast.
const LAUNCH: number[] = [10, 36, 60, 84, 110];
let gap = 18;
while (LAUNCH.length < N_SHOTS) {
  LAUNCH.push(LAUNCH[LAUNCH.length - 1] + gap);
  gap = Math.max(0.25, gap * 0.72);
}
const DUR: number[] = LAUNCH.map((_, i) => (i < 5 ? 26 : Math.max(14, 26 - (i - 4) * 0.25)));
const LAND: number[] = LAUNCH.map((l, i) => l + DUR[i]);
const SEASON_DONE = LAND[N_SHOTS - 1];

const MADE_CUM: number[] = [0];
const PCT_HISTORY: number[] = [];
OUTCOMES.forEach((made, i) => {
  MADE_CUM.push(MADE_CUM[i] + (made ? 1 : 0));
  PCT_HISTORY.push((100 * MADE_CUM[i + 1]) / (i + 1));
});

type Shot = { made: boolean; x0: number; arc: number; front: boolean };
const SHOTS: Shot[] = OUTCOMES.map((made) => ({
  made,
  x0: 110 + rand() * 50,
  arc: 220 + rand() * 50,
  front: rand() < 0.5,
}));

const RIM = { cx: 640, y: 300, r: 42 };
const BOARD = { x: 690, top: 170, bottom: 330 };
const FLOOR_Y = 606;
const LAUNCH_Y = 590;
const BALL_R = 15;
const AFTER = 12;

const ballState = (i: number, frame: number): { x: number; y: number; o: number } | null => {
  const s = SHOTS[i];
  const t = frame - LAUNCH[i];
  const dur = DUR[i];
  if (t < 0) return null;
  const end = s.made
    ? { x: RIM.cx, y: RIM.y - 8 }
    : s.front
      ? { x: RIM.cx - RIM.r + 4, y: RIM.y - 10 }
      : { x: BOARD.x - BALL_R, y: RIM.y - 40 };
  if (t <= dur) {
    const p = t / dur;
    return {
      x: s.x0 + (end.x - s.x0) * p,
      y: LAUNCH_Y + (end.y - LAUNCH_Y) * p - s.arc * 4 * p * (1 - p),
      o: 1,
    };
  }
  const a = t - dur;
  if (a > AFTER) return null;
  const o = 1 - a / AFTER;
  if (s.made) return { x: end.x, y: end.y + a * 9, o };
  if (s.front) return { x: end.x - 5 * a, y: end.y - 5 * a + 0.6 * a * a, o };
  return { x: end.x - 4 * a, y: end.y - 7 * a + 0.7 * a * a, o };
};

// ---------- Part 2: race track ----------

const TRACK = { cx: 430, cy: 368, rx: 330, ry: 190, w: 58 };
const LAP_TIMES: number[] = [91.8, 89.4, 93.1];
const LAP_FRAMES: number[] = [36, 36, 36, 26, 20, 16, 13, 11, 10];
while (LAP_FRAMES.length < 20) LAP_FRAMES.push(9);
while (LAP_TIMES.length < LAP_FRAMES.length) {
  LAP_TIMES.push(Math.round((87.5 + rand() * 6.5) * 10) / 10);
}
const LAP_START: number[] = [];
let lapCursor = T.lapsStart;
for (const f of LAP_FRAMES) {
  LAP_START.push(lapCursor);
  lapCursor += f;
}
const LAP_END: number[] = LAP_START.map((s, i) => s + LAP_FRAMES[i]);
const FAST_LAPS_FROM = LAP_END[2];
const AVG_CUM: number[] = [];
let lapSum = 0;
LAP_TIMES.forEach((t, i) => {
  lapSum += t;
  AVG_CUM.push(lapSum / (i + 1));
});

const lapProgress = (f: number): number => {
  if (f <= LAP_START[0]) return 0;
  for (let i = 0; i < LAP_FRAMES.length; i++) {
    if (f < LAP_END[i]) return i + (f - LAP_START[i]) / LAP_FRAMES[i];
  }
  return LAP_FRAMES.length;
};

const trackPoint = (laps: number): { x: number; y: number; angle: number } => {
  const th = Math.PI / 2 + 2 * Math.PI * laps;
  return {
    x: TRACK.cx + TRACK.rx * Math.cos(th),
    y: TRACK.cy + TRACK.ry * Math.sin(th),
    angle: (Math.atan2(TRACK.ry * Math.cos(th), -TRACK.rx * Math.sin(th)) * 180) / Math.PI,
  };
};

// Format seconds as m:ss.s
const fmtLap = (t: number, digits: number): string => {
  const scale = Math.pow(10, digits);
  const total = Math.round(t * scale) / scale;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toFixed(digits).padStart(digits + 3, "0")}`;
};

// ---------- Shared broadcast pieces ----------

const CAPTIONS: { from: number; text: string }[] = [
  { from: 0, text: "Can a 90% shooter miss 3 in a row?" },
  { from: 120, text: "Sure. One shot is luck." },
  { from: 165, text: "Over a season: close to 90%" },
  { from: 280, text: "One lap fast, the next one slow" },
  { from: 390, text: "Yet the average barely moves" },
];

const PANEL = { left: 860, top: 110, width: 380 };

const panelStyle: React.CSSProperties = {
  position: "absolute",
  left: PANEL.left,
  top: PANEL.top,
  width: PANEL.width,
  backgroundColor: ACCENT.panel,
  border: `3px solid ${ACCENT.edge}`,
  borderRadius: 14,
  overflow: "hidden",
  fontVariantNumeric: "tabular-nums",
};

const headerStyle: React.CSSProperties = {
  height: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 18px",
  backgroundColor: ACCENT.live,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: 1,
};

const TitleTag: React.FC<{ text: string; enter: number }> = ({ text, enter }) => (
  <div
    style={{
      position: "absolute",
      left: 40,
      top: 30,
      height: 48,
      display: "flex",
      alignItems: "center",
      transform: `translateX(${(1 - enter) * -360}px)`,
    }}
  >
    <div style={{ width: 10, height: 48, backgroundColor: COLORS.mu }} />
    <div
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        backgroundColor: "#ffffff",
        color: COLORS.bg,
        fontSize: 30,
        fontWeight: 900,
        letterSpacing: 2,
      }}
    >
      {text}
    </div>
  </div>
);

const FastForward: React.FC<{ frame: number; from: number; to: number }> = ({ frame, from, to }) => {
  const enter = pop(frame - from);
  const opacity = interpolate(frame, [from, from + 4, to - 6, to], [0, 1, 1, 0], clamp);
  const blink = 0.55 + 0.45 * Math.abs(Math.sin(frame / 4));
  return (
    <div
      style={{
        position: "absolute",
        left: 520,
        top: 30,
        height: 48,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 16px",
        borderRadius: 8,
        border: `3px solid ${COLORS.mu}`,
        color: COLORS.mu,
        fontSize: 28,
        fontWeight: 800,
        opacity,
        transform: `scale(${0.6 + 0.4 * enter})`,
      }}
    >
      <svg width={34} height={22} style={{ opacity: blink }}>
        <polygon points="0,0 16,11 0,22" fill={COLORS.mu} />
        <polygon points="17,0 33,11 17,22" fill={COLORS.mu} />
      </svg>
      FAST FORWARD
    </div>
  );
};

const Ticker: React.FC<{ frame: number; opacity: number }> = ({ frame, opacity }) => {
  let idx = 0;
  CAPTIONS.forEach((c, i) => {
    if (frame >= c.from) idx = i;
  });
  const cap = CAPTIONS[idx];
  const enter = pop(frame - cap.from, 13);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 640,
        width: 1280,
        height: 60,
        display: "flex",
        alignItems: "center",
        backgroundColor: "#020617",
        borderTop: `3px solid ${COLORS.mu}`,
        opacity,
      }}
    >
      <div
        style={{
          marginLeft: 40,
          padding: "4px 14px",
          backgroundColor: ACCENT.live,
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: 2,
        }}
      >
        LIVE
      </div>
      <div style={{ marginLeft: 24, height: 60, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
            transform: `translateY(${(1 - enter) * 40}px)`,
            opacity: enter,
          }}
        >
          {cap.text}
        </div>
      </div>
    </div>
  );
};

// ---------- Part 1 drawing ----------

const Ball: React.FC<{ x: number; y: number; opacity: number; spin: number }> = ({ x, y, opacity, spin }) => (
  <g transform={`translate(${x} ${y}) rotate(${spin})`} opacity={opacity}>
    <circle r={BALL_R} fill={ACCENT.ball} stroke={ACCENT.seam} strokeWidth={2} />
    <line x1={-BALL_R} y1={0} x2={BALL_R} y2={0} stroke={ACCENT.seam} strokeWidth={2} />
    <path d={`M 0 ${-BALL_R} Q 8 0 0 ${BALL_R}`} fill="none" stroke={ACCENT.seam} strokeWidth={2} />
  </g>
);

const FreeThrows: React.FC<{ frame: number }> = ({ frame }) => {
  let landed = 0;
  let lastMakeLand = -1000;
  for (let i = 0; i < N_SHOTS; i++) {
    if (LAND[i] <= frame) {
      landed = i + 1;
      if (OUTCOMES[i]) lastMakeLand = LAND[i];
    }
  }
  const made = MADE_CUM[landed];
  let streak = 0;
  for (let i = landed - 1; i >= 0 && !OUTCOMES[i]; i--) streak++;

  // Net stretches when a ball drops through.
  const stretch = interpolate(frame - lastMakeLand, [0, 4, 12], [0, 14, 0], clamp);
  const netTop: number[] = [0, 1, 2, 3, 4].map((k) => RIM.cx - RIM.r + k * ((2 * RIM.r) / 4));
  const netBottom: number[] = [0, 1, 2, 3, 4].map((k) => RIM.cx - 28 + k * 14);
  const netY = RIM.y + 58 + stretch;

  const balls: { x: number; y: number; o: number; i: number }[] = [];
  for (let i = 0; i < N_SHOTS; i++) {
    const b = ballState(i, frame);
    if (b) balls.push({ ...b, i });
  }

  // Early shots get a big SWISH or MISS call.
  let callIdx = -1;
  for (let i = 0; i < 5; i++) {
    if (frame >= LAND[i] && frame < LAND[i] + 22) callIdx = i;
  }
  const callPop = callIdx >= 0 ? pop(frame - LAND[callIdx], 8) : 0;

  const streakPop = streak > 0 ? pop(frame - LAND[landed - 1], 8) : 0;

  const panelEnter = pop(frame - 4, 14);
  const lastLand = landed > 0 ? LAND[landed - 1] : -1000;
  const pulseAmp = landed <= 8 ? 0.14 : 0.03;
  const pulse = 1 + pulseAmp * interpolate(frame - lastLand, [0, 3, 10], [0, 1, 0], clamp);
  const pctText = landed === 0 ? "--.-%" : `${((100 * made) / landed).toFixed(1)}%`;
  const done = frame >= SEASON_DONE;
  const donePop = pop(frame - SEASON_DONE, 9);

  const SPARK = { w: 340, h: 140, pad: 12, lo: 20, hi: 100 };
  const sx = (k: number) => SPARK.pad + ((k - 1) / (N_SHOTS - 1)) * (SPARK.w - 2 * SPARK.pad);
  const sy = (pct: number) =>
    SPARK.h - SPARK.pad - ((Math.max(SPARK.lo, pct) - SPARK.lo) / (SPARK.hi - SPARK.lo)) * (SPARK.h - 2 * SPARK.pad);
  const sparkPts = PCT_HISTORY.slice(0, landed)
    .map((p, k) => `${sx(k + 1)},${sy(p)}`)
    .join(" ");

  return (
    <AbsoluteFill>
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Floor */}
        <rect x={0} y={FLOOR_Y} width={820} height={26} fill="#2a1d12" />
        <line x1={0} y1={FLOOR_Y} x2={820} y2={FLOOR_Y} stroke={COLORS.axis} strokeWidth={3} />
        {/* Pole and support */}
        <rect x={752} y={240} width={12} height={FLOOR_Y - 240} fill={COLORS.axis} />
        <rect x={BOARD.x + 10} y={236} width={60} height={10} fill={COLORS.axis} />
        {/* Backboard */}
        <rect
          x={BOARD.x}
          y={BOARD.top}
          width={12}
          height={BOARD.bottom - BOARD.top}
          fill="#e2e8f0"
          stroke="#ffffff"
          strokeWidth={2}
        />
        <rect x={BOARD.x - 2} y={RIM.y - 46} width={4} height={40} fill={ACCENT.live} />
        {/* Net */}
        {netTop.map((tx, k) => (
          <line key={`n${k}`} x1={tx} y1={RIM.y} x2={netBottom[k]} y2={netY} stroke="#cbd5e1" strokeWidth={2} />
        ))}
        {netTop.slice(0, 4).map((tx, k) => (
          <line key={`d${k}`} x1={tx} y1={RIM.y} x2={netBottom[k + 1]} y2={netY} stroke="#cbd5e1" strokeWidth={1.5} opacity={0.7} />
        ))}
        {netTop.slice(1).map((tx, k) => (
          <line key={`e${k}`} x1={tx} y1={RIM.y} x2={netBottom[k]} y2={netY} stroke="#cbd5e1" strokeWidth={1.5} opacity={0.7} />
        ))}
        {/* Balls */}
        {balls.map((b) => (
          <Ball key={b.i} x={b.x} y={b.y} opacity={b.o} spin={(frame - LAUNCH[b.i]) * 25} />
        ))}
        {/* Rim, drawn over the balls */}
        <ellipse cx={RIM.cx} cy={RIM.y} rx={RIM.r} ry={7} fill="none" stroke={ACCENT.ball} strokeWidth={6} />
        <line x1={RIM.cx + RIM.r} y1={RIM.y} x2={BOARD.x} y2={RIM.y} stroke={ACCENT.ball} strokeWidth={6} />
        {/* Shot call */}
        {callIdx >= 0 ? (
          <text
            x={560}
            y={146}
            textAnchor="middle"
            fontSize={44}
            fontWeight={900}
            fill={OUTCOMES[callIdx] ? COLORS.good : COLORS.danger}
            transform={`translate(560 132) scale(${callPop}) translate(-560 -132)`}
          >
            {OUTCOMES[callIdx] ? "SWISH!" : "MISS!"}
          </text>
        ) : null}
      </svg>

      {/* Miss streak badge */}
      {streak > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 96,
            padding: "4px 16px",
            borderRadius: 8,
            backgroundColor: COLORS.danger,
            color: COLORS.bg,
            fontSize: 30,
            fontWeight: 900,
            transform: `scale(${0.7 + 0.3 * streakPop})`,
            transformOrigin: "left center",
          }}
        >
          {`MISSES IN A ROW: ${streak}`}
        </div>
      ) : null}

      {/* Scoreboard */}
      <div style={{ ...panelStyle, height: 450, transform: `translateX(${(1 - panelEnter) * 440}px)` }}>
        <div style={headerStyle}>
          <span>SEASON FT%</span>
          {done ? (
            <span style={{ color: COLORS.mu, fontSize: 28, transform: `scale(${donePop})` }}>FINAL</span>
          ) : null}
        </div>
        <div
          style={{
            height: 120,
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 96,
            fontWeight: 900,
            color: done ? COLORS.good : COLORS.text,
            transform: `scale(${pulse})`,
          }}
        >
          {pctText}
        </div>
        <div style={{ height: 40, textAlign: "center", fontSize: 32, fontWeight: 700, color: COLORS.muted }}>
          {`MADE ${made} / ${landed}`}
        </div>
        <svg width={SPARK.w} height={SPARK.h} style={{ display: "block", margin: "14px auto 0" }}>
          <rect x={0} y={0} width={SPARK.w} height={SPARK.h} rx={8} fill="#020617" />
          <line
            x1={SPARK.pad}
            y1={sy(90)}
            x2={SPARK.w - SPARK.pad}
            y2={sy(90)}
            stroke={COLORS.mu}
            strokeWidth={3}
            strokeDasharray="10 8"
          />
          <polyline points={sparkPts} fill="none" stroke={COLORS.data} strokeWidth={4} strokeLinejoin="round" />
          {landed > 0 ? <circle cx={sx(landed)} cy={sy(PCT_HISTORY[landed - 1])} r={6} fill={COLORS.data} /> : null}
        </svg>
        <div style={{ height: 40, marginTop: 10, textAlign: "center", fontSize: 28, fontWeight: 800, color: COLORS.mu }}>
          TRUE SKILL: 90%
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Part 2 drawing ----------

const WHEELS: number[][] = [
  [-17, -15],
  [-17, 9],
  [9, -15],
  [9, 9],
];

const Car: React.FC<{ x: number; y: number; angle: number }> = ({ x, y, angle }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    {WHEELS.map(([wx, wy]) => (
      <rect key={`${wx}_${wy}`} x={wx} y={wy} width={12} height={6} rx={2} fill="#0b0f19" />
    ))}
    <rect x={-27} y={-13} width={6} height={26} rx={2} fill="#1f2937" />
    <rect x={-22} y={-7} width={42} height={14} rx={5} fill={ACCENT.car} />
    <polygon points="20,-5 30,0 20,5" fill={ACCENT.car} />
    <rect x={26} y={-12} width={4} height={24} rx={1} fill="#1f2937" />
    <rect x={-22} y={-1.5} width={48} height={3} fill="#ffffff" />
    <ellipse cx={-3} cy={0} rx={7} ry={4.5} fill="#0b0f19" />
    <circle cx={-3} cy={0} r={3} fill={COLORS.mu} />
  </g>
);

const RaceTrack: React.FC<{ frame: number }> = ({ frame }) => {
  let done = 0;
  for (let i = 0; i < LAP_END.length; i++) if (LAP_END[i] <= frame) done = i + 1;
  const laps = lapProgress(frame);
  const car = trackPoint(laps);
  const moving = frame > LAP_START[0];
  const trail: { x: number; y: number; o: number }[] = [];
  if (moving) {
    for (let k = 1; k <= 7; k++) {
      const p = trackPoint(lapProgress(frame - k * 0.8));
      trail.push({ x: p.x, y: p.y, o: 0.4 * (1 - k / 8) });
    }
  }

  const current = Math.min(done, LAP_FRAMES.length - 1);
  const elapsed = moving
    ? interpolate(frame, [LAP_START[current], LAP_END[current]], [0, LAP_TIMES[current]], clamp)
    : 0;

  const avg = done > 0 ? AVG_CUM[done - 1] : 0;
  const delta = done > 1 ? AVG_CUM[done - 1] - AVG_CUM[done - 2] : 0;
  const lastEnd = done > 0 ? LAP_END[done - 1] : -1000;
  const rowEnter = pop(frame - lastEnd, 12);
  const avgFlash = interpolate(frame - lastEnd, [0, 3, 12], [0, 1, 0], clamp);

  const rows: number[] = [];
  for (let i = done - 1; i >= Math.max(0, done - 5); i--) rows.push(i);
  const ROW_H = 44;

  const trackEnter = pop(frame - T.p2In, 14);
  const panelEnter = pop(frame - T.p2In - 6, 14);

  const CHART = { w: 340, h: 90, pad: 10, lo: 86, hi: 95 };
  const cx = (k: number) => CHART.pad + (k / (LAP_FRAMES.length - 1)) * (CHART.w - 2 * CHART.pad);
  const cy = (t: number) =>
    CHART.h - CHART.pad - ((Math.min(CHART.hi, Math.max(CHART.lo, t)) - CHART.lo) / (CHART.hi - CHART.lo)) * (CHART.h - 2 * CHART.pad);
  const avgPts = AVG_CUM.slice(0, done)
    .map((a, k) => `${cx(k)},${cy(a)}`)
    .join(" ");

  const checker: { x: number; y: number; dark: boolean }[] = [];
  const sfY = TRACK.cy + TRACK.ry - TRACK.w / 2;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 2; c++) {
      checker.push({ x: TRACK.cx - 7 + c * 7, y: sfY + r * (TRACK.w / 8), dark: (r + c) % 2 === 0 });
    }
  }

  return (
    <AbsoluteFill>
      <svg
        width={1280}
        height={720}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${0.9 + 0.1 * trackEnter})`,
          transformOrigin: `${TRACK.cx}px ${TRACK.cy}px`,
        }}
      >
        {/* Infield grass */}
        <ellipse cx={TRACK.cx} cy={TRACK.cy} rx={TRACK.rx - TRACK.w / 2} ry={TRACK.ry - TRACK.w / 2} fill={ACCENT.grass} />
        {/* Asphalt */}
        <ellipse cx={TRACK.cx} cy={TRACK.cy} rx={TRACK.rx} ry={TRACK.ry} fill="none" stroke={ACCENT.asphalt} strokeWidth={TRACK.w} />
        {/* Kerbs */}
        {[TRACK.w / 2, -TRACK.w / 2].map((off) => (
          <g key={off}>
            <ellipse cx={TRACK.cx} cy={TRACK.cy} rx={TRACK.rx + off} ry={TRACK.ry + off} fill="none" stroke="#ffffff" strokeWidth={6} />
            <ellipse
              cx={TRACK.cx}
              cy={TRACK.cy}
              rx={TRACK.rx + off}
              ry={TRACK.ry + off}
              fill="none"
              stroke={ACCENT.live}
              strokeWidth={6}
              strokeDasharray="18 18"
            />
          </g>
        ))}
        {/* Center line */}
        <ellipse
          cx={TRACK.cx}
          cy={TRACK.cy}
          rx={TRACK.rx}
          ry={TRACK.ry}
          fill="none"
          stroke={COLORS.muted}
          strokeWidth={2}
          strokeDasharray="14 16"
          opacity={0.5}
        />
        {/* Start / finish */}
        {checker.map((q, k) => (
          <rect key={k} x={q.x} y={q.y} width={7} height={TRACK.w / 8} fill={q.dark ? "#0b0f19" : "#ffffff"} />
        ))}
        {/* Trail and car */}
        {trail.map((p, k) => (
          <circle key={k} cx={p.x} cy={p.y} r={9} fill={ACCENT.car} opacity={p.o} />
        ))}
        <Car x={car.x} y={car.y} angle={car.angle} />
      </svg>

      {/* Infield live clock */}
      <div
        style={{
          position: "absolute",
          left: TRACK.cx - 200,
          top: TRACK.cy - 70,
          width: 400,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
          opacity: trackEnter,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.muted, letterSpacing: 2 }}>
          {`LAP ${current + 1}`}
        </div>
        <div style={{ fontSize: 64, fontWeight: 900 }}>{fmtLap(elapsed, 1)}</div>
      </div>

      {/* Lap timing tower */}
      <div style={{ ...panelStyle, height: 492, transform: `translateX(${(1 - panelEnter) * 440}px)` }}>
        <div style={headerStyle}>
          <span>LAP TIMES</span>
        </div>
        <div style={{ position: "relative", height: 4 * ROW_H, marginTop: 10, overflow: "hidden" }}>
          {rows.map((lap, r) => {
            const yPos = (r - 1 + rowEnter) * ROW_H;
            const fast = LAP_TIMES[lap] <= avg;
            return (
              <div
                key={lap}
                style={{
                  position: "absolute",
                  left: 0,
                  top: yPos,
                  width: PANEL.width - 6,
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 18px",
                  boxSizing: "border-box",
                  fontSize: 32,
                  fontWeight: 800,
                  opacity: r === 0 ? rowEnter : 1,
                  transform: r === 0 ? `translateX(${(1 - rowEnter) * 80}px)` : undefined,
                }}
              >
                <span style={{ color: COLORS.muted }}>{`LAP ${lap + 1}`}</span>
                <span style={{ color: fast ? COLORS.good : COLORS.danger }}>{fmtLap(LAP_TIMES[lap], 1)}</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            height: 36,
            marginTop: 12,
            padding: "0 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          <span style={{ color: COLORS.mu }}>AVERAGE LAP</span>
          <span style={{ color: COLORS.muted }}>
            {done > 1 ? `${delta >= 0 ? "+" : "-"}${Math.abs(delta).toFixed(2)}` : ""}
          </span>
        </div>
        <div
          style={{
            height: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            fontWeight: 900,
            color: COLORS.mu,
            transform: `scale(${1 + 0.06 * avgFlash})`,
          }}
        >
          {done > 0 ? fmtLap(avg, 2) : "-:--.--"}
        </div>
        <svg width={CHART.w} height={CHART.h} style={{ display: "block", margin: "8px auto 0" }}>
          <rect x={0} y={0} width={CHART.w} height={CHART.h} rx={8} fill="#020617" />
          {LAP_TIMES.slice(0, done).map((t, k) => (
            <circle key={k} cx={cx(k)} cy={cy(t)} r={5} fill={t <= avg ? COLORS.good : COLORS.danger} />
          ))}
          <polyline points={avgPts} fill="none" stroke={COLORS.mu} strokeWidth={4} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Finale ----------

const Why: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame - T.why;
  if (f < 0) return null;
  const s = spring({ frame: f, fps: FPS, config: { damping: 8, stiffness: 170, mass: 0.8 } });
  const breathe = 1 + 0.025 * Math.sin(f / 5) * interpolate(f, [15, 30], [0, 1], clamp);
  const rayGrow = interpolate(f, [0, 30], [0, 1], clamp);
  const rayOpacity = interpolate(f, [0, 5, 40], [0, 0.7, 0.15], clamp);
  const flash = interpolate(f, [0, 3, 14], [0, 0.35, 0], clamp);
  const rays: number[] = Array.from({ length: 18 }, (_, k) => (k / 18) * 2 * Math.PI);
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        {rays.map((a, k) => {
          const r1 = 170 + 260 * rayGrow;
          const r2 = r1 + 140;
          return (
            <line
              key={k}
              x1={640 + r1 * Math.cos(a)}
              y1={360 + r1 * Math.sin(a)}
              x2={640 + r2 * Math.cos(a)}
              y2={360 + r2 * Math.sin(a)}
              stroke={COLORS.mu}
              strokeWidth={10}
              strokeLinecap="round"
              opacity={rayOpacity}
            />
          );
        })}
      </svg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize: 220,
            fontWeight: 900,
            color: COLORS.mu,
            textShadow: `0 0 40px ${COLORS.mu}`,
            transform: `scale(${s * breathe}) rotate(${(1 - s) * -14}deg)`,
          }}
        >
          Why?
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flash }} />
    </AbsoluteFill>
  );
};

export const Motivation: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10, MOTIVATION_FRAMES - 10, MOTIVATION_FRAMES], [0, 1, 1, 0], clamp);
  const p1 = interpolate(frame, [T.p1Out, T.p1Out + 14], [1, 0], clamp);
  const p2 = interpolate(frame, [T.p2In, T.p2In + 14, T.p2Out, T.p2Out + 16], [0, 1, 1, 0], clamp);
  const chrome = interpolate(frame, [T.p2Out, T.p2Out + 16], [1, 0], clamp);
  const titleIn = frame < T.p2In ? pop(frame - 2, 14) : pop(frame - T.p2In, 14);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/motivation.wav")} />
      <AbsoluteFill style={{ opacity: fade }}>
        {p1 > 0 ? (
          <AbsoluteFill style={{ opacity: p1 }}>
            <FreeThrows frame={frame} />
            <FastForward frame={frame} from={150} to={SEASON_DONE} />
          </AbsoluteFill>
        ) : null}
        {p2 > 0 ? (
          <AbsoluteFill style={{ opacity: p2 }}>
            <RaceTrack frame={frame} />
            <FastForward frame={frame} from={FAST_LAPS_FROM} to={T.p2Out} />
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={{ opacity: chrome }}>
          <TitleTag text={frame < T.p2In ? "FREE THROWS" : "GRAND PRIX"} enter={titleIn} />
          <Ticker frame={frame} opacity={1} />
        </AbsoluteFill>
        <Why frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
