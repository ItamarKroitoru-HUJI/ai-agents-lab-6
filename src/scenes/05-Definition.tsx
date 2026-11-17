import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const DEFINITION_FRAMES = seconds(15);

const MATH = "Georgia, 'Times New Roman', serif";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Cue points, matched to the narration in narration/lines.json.
const T_SETUP = seconds(1.8); // "Take independent samples with mean mu."
const T_FOR_EVERY = seconds(4.6); // "For any small epsilon,"
const T_STATEMENT = seconds(5.8); // "the chance that the average misses mu..."
const T_LINE = seconds(8.5); // number line appears
const T_SHRINK_START = seconds(9.5);
const T_SHRINK_END = seconds(14);

// Number line: values 0..1 mapped onto the canvas. Coin flips, so sigma = 0.5.
const MU = 0.5;
const EPS = 0.15;
const SIGMA = 0.5;
const AX = { left: 240, right: 1040, base: 590, peak: 150 };
const px = (v: number) => AX.left + v * (AX.right - AX.left);

// Abramowitz-Stegun 7.1.26 approximation of erf.
const erf = (z: number) => {
  const s = z < 0 ? -1 : 1;
  const a = Math.abs(z);
  const t = 1 / (1 + 0.3275911 * a);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return s * (1 - poly * Math.exp(-a * a));
};
const outsideProb = (sd: number) => 1 - erf(EPS / sd / Math.SQRT2);

// Filled area under a bell curve, peak normalised to AX.peak pixels.
const areaPath = (sd: number, from: number, to: number) => {
  const steps = 60;
  let d = `M ${px(from)} ${AX.base}`;
  for (let i = 0; i <= steps; i++) {
    const v = from + ((to - from) * i) / steps;
    const h = Math.exp(-0.5 * ((v - MU) / sd) ** 2) * AX.peak;
    d += ` L ${px(v)} ${AX.base - h}`;
  }
  return `${d} L ${px(to)} ${AX.base} Z`;
};

const reveal = (frame: number, start: number): React.CSSProperties => {
  const opacity = interpolate(frame, [start, start + 15], [0, 1], CLAMP);
  const pop = spring({ frame: Math.max(0, frame - start), fps: FPS, config: { damping: 200 } });
  return { opacity, transform: `translateY(${(1 - pop) * 20}px)` };
};

const Mu: React.FC = () => <span style={{ color: COLORS.mu }}>μ</span>;

// X with an overline and a subscript n.
const XBar: React.FC = () => (
  <span style={{ display: "inline-block", fontStyle: "italic" }}>
    <span style={{ position: "relative", display: "inline-block" }}>
      X
      <span
        style={{
          position: "absolute",
          left: "0.14em",
          right: "-0.04em",
          top: "0.1em",
          height: "0.06em",
          backgroundColor: "currentColor",
        }}
      />
    </span>
    <span style={{ fontSize: "0.6em", verticalAlign: "-0.3em", marginLeft: "0.04em" }}>n</span>
  </span>
);

const centered: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
};

export const Definition: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], CLAMP);
  const lineOpacity = interpolate(frame, [T_LINE, T_LINE + 20], [0, 1], CLAMP);

  // n grows on a log scale from 4 to 400.
  const t = interpolate(frame, [T_SHRINK_START, T_SHRINK_END], [0, 1], CLAMP);
  const n = Math.round(4 * Math.pow(100, t));
  const sd = SIGMA / Math.sqrt(n);
  const pOut = outsideProb(sd);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/definition.wav")} />
      <h1 style={{ ...centered, top: 30, margin: 0, fontSize: 52, opacity: titleOpacity }}>
        The Weak Law of Large Numbers
      </h1>

      <div style={{ ...centered, top: 125, fontSize: 40, fontFamily: MATH, ...reveal(frame, T_SETUP) }}>
        X₁, X₂, … independent, with mean <Mu /> and variance σ²
      </div>

      <div style={{ ...centered, top: 196, fontSize: 36, color: COLORS.muted, ...reveal(frame, T_FOR_EVERY) }}>
        For every <span style={{ fontFamily: MATH }}>ε &gt; 0</span>,
      </div>

      <div style={{ ...centered, top: 250, fontSize: 48, fontFamily: MATH, ...reveal(frame, T_STATEMENT) }}>
        P(|<XBar /> − <Mu />| &gt; ε) → 0 as n → ∞
      </div>

      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0, opacity: lineOpacity }}>
        <text
          x={640}
          y={380}
          fill={COLORS.text}
          fontSize={36}
          fontFamily={MATH}
          textAnchor="middle"
          style={{ whiteSpace: "pre" }}
        >
          {`n = ${n}     P(outside band) ≈ `}
          <tspan fill={COLORS.danger}>{pOut.toFixed(3)}</tspan>
        </text>

        <rect
          x={px(MU - EPS)}
          y={AX.base - AX.peak - 10}
          width={px(MU + EPS) - px(MU - EPS)}
          height={AX.peak + 10}
          fill={COLORS.mu}
          opacity={0.12}
        />
        <path d={areaPath(sd, 0, MU - EPS)} fill={COLORS.danger} opacity={0.85} />
        <path d={areaPath(sd, MU + EPS, 1)} fill={COLORS.danger} opacity={0.85} />
        <path d={areaPath(sd, MU - EPS, MU + EPS)} fill={COLORS.data} opacity={0.85} />

        <line x1={AX.left} y1={AX.base} x2={AX.right} y2={AX.base} stroke={COLORS.axis} strokeWidth={3} />
        {[MU - EPS, MU + EPS].map((v) => (
          <line
            key={v}
            x1={px(v)}
            y1={AX.base - AX.peak - 10}
            x2={px(v)}
            y2={AX.base + 10}
            stroke={COLORS.mu}
            strokeWidth={2}
            strokeDasharray="8 6"
          />
        ))}
        <line x1={px(MU)} y1={AX.base - 8} x2={px(MU)} y2={AX.base + 10} stroke={COLORS.mu} strokeWidth={3} />

        <text x={px(MU - EPS)} y={AX.base + 46} fill={COLORS.muted} fontSize={36} fontFamily={MATH} textAnchor="middle">
          <tspan fill={COLORS.mu}>μ</tspan> − ε
        </text>
        <text x={px(MU)} y={AX.base + 46} fill={COLORS.mu} fontSize={36} fontFamily={MATH} textAnchor="middle">
          μ
        </text>
        <text x={px(MU + EPS)} y={AX.base + 46} fill={COLORS.muted} fontSize={36} fontFamily={MATH} textAnchor="middle">
          <tspan fill={COLORS.mu}>μ</tspan> + ε
        </text>
      </svg>
    </AbsoluteFill>
  );
};
