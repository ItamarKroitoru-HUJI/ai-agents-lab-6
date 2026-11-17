import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const PROOF_FRAMES = seconds(20);

const MATH = "Georgia, 'Times New Roman', serif";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Base formula size. Fractions render at 0.8em, so 46px keeps them above 36px.
const MATH_SIZE = 46;

// Cue points, matched to the narration in narration/lines.json.
const T_MEAN = seconds(1.5); // "The average has expected value mu."
const T_VAR = seconds(3.8); // "Its variance is sigma squared over n."
const T_CHEB_LABEL = seconds(6.4); // "Chebyshev says"
const T_SEG_P = seconds(6.9); // "the chance of missing by epsilon"
const T_SEG_VAR = seconds(8.8); // "is at most"
const T_SEG_SUB = seconds(9.8); // "sigma squared over n"
const T_SEG_BOUND = seconds(11.2); // "epsilon squared"
const T_SEG_ZERO = seconds(13.2); // "As n grows, that bound goes to zero."
const T_PLOT_END = seconds(17.5);

// Plot of 1/n for n = 1..N_MAX.
const N_MAX = 40;
const PLOT = { left: 400, right: 1000, top: 510, bottom: 655 };
const px = (n: number) => PLOT.left + ((n - 1) / (N_MAX - 1)) * (PLOT.right - PLOT.left);
const py = (v: number) => PLOT.bottom - v * (PLOT.bottom - PLOT.top);

const fadeIn = (frame: number, start: number) => interpolate(frame, [start, start + 15], [0, 1], CLAMP);
const pop = (frame: number, start: number) =>
  spring({ frame: Math.max(0, frame - start), fps: FPS, config: { damping: 200 } });

const slideIn = (frame: number, start: number): React.CSSProperties => ({
  opacity: fadeIn(frame, start),
  transform: `translateX(${(1 - pop(frame, start)) * -24}px)`,
});
const riseIn = (frame: number, start: number): React.CSSProperties => ({
  opacity: fadeIn(frame, start),
  transform: `translateY(${(1 - pop(frame, start)) * 18}px)`,
});

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

// Stacked fraction: numerator over a bar over a denominator.
const Frac: React.FC<{ num: React.ReactNode; den: React.ReactNode }> = ({ num, den }) => (
  <span
    style={{
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      verticalAlign: "middle",
      fontSize: "0.8em",
      lineHeight: 1.1,
      margin: "0 0.12em",
    }}
  >
    <span style={{ padding: "0 0.15em", whiteSpace: "nowrap" }}>{num}</span>
    <span style={{ alignSelf: "stretch", height: 2, backgroundColor: "currentColor" }} />
    <span style={{ padding: "0 0.15em", whiteSpace: "nowrap" }}>{den}</span>
  </span>
);

const Row: React.FC<{ label: string; style: React.CSSProperties; children: React.ReactNode }> = ({
  label,
  style,
  children,
}) => (
  <div style={{ display: "flex", alignItems: "center", height: 90, ...style }}>
    <div style={{ width: 220, fontSize: 28, color: COLORS.muted, fontFamily: FONT }}>{label}</div>
    <div style={{ fontSize: MATH_SIZE, fontFamily: MATH, whiteSpace: "nowrap" }}>{children}</div>
  </div>
);

// One revealed piece of the Chebyshev chain.
const Seg: React.FC<{ style: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", ...style }}>{children}</span>
);

const Op: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ margin: "0 0.3em" }}>{children}</span>
);

export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = fadeIn(frame, 0);
  const plotOpacity = fadeIn(frame, T_SEG_ZERO);
  const shown = Math.max(1, Math.round(interpolate(frame, [T_SEG_ZERO, T_PLOT_END], [1, N_MAX], CLAMP)));
  const points = Array.from({ length: shown }, (_, i) => `${px(i + 1)},${py(1 / (i + 1))}`).join(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/proof.wav")} />
      <h1
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          right: 0,
          margin: 0,
          textAlign: "center",
          fontSize: 52,
          opacity: titleOpacity,
        }}
      >
        Why is it true?
      </h1>

      {/* Setup: mean and variance of the average. */}
      <div style={{ position: "absolute", top: 118, left: 200, display: "flex", flexDirection: "column", gap: 6 }}>
        <Row label="Mean" style={slideIn(frame, T_MEAN)}>
          E[<XBar />] = <Mu />
        </Row>
        <Row label="Variance" style={slideIn(frame, T_VAR)}>
          Var(<XBar />) = <Frac num="σ²" den="n" />
        </Row>
      </div>

      {/* Chebyshev chain, revealed one segment at a time. */}
      <div
        style={{
          position: "absolute",
          top: 322,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 28,
          color: COLORS.muted,
          opacity: fadeIn(frame, T_CHEB_LABEL),
        }}
      >
        Chebyshev
      </div>
      <div
        style={{
          position: "absolute",
          top: 365,
          left: 0,
          right: 0,
          height: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: MATH_SIZE,
          fontFamily: MATH,
        }}
      >
        <Seg style={riseIn(frame, T_SEG_P)}>
          P(|<XBar /> − <Mu />| &gt; ε)
        </Seg>
        <Seg style={riseIn(frame, T_SEG_VAR)}>
          <Op>≤</Op>
          <Frac
            num={
              <>
                Var(<XBar />)
              </>
            }
            den="ε²"
          />
        </Seg>
        <Seg style={riseIn(frame, T_SEG_SUB)}>
          <Op>=</Op>
          <Frac num="σ²/n" den="ε²" />
        </Seg>
        <Seg style={riseIn(frame, T_SEG_BOUND)}>
          <Op>=</Op>
          <Frac num="σ²" den="nε²" />
        </Seg>
        <Seg style={{ ...riseIn(frame, T_SEG_ZERO), color: COLORS.good }}>
          <Op>→</Op>0
        </Seg>
      </div>

      {/* The bound shrinks like 1/n. */}
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0, opacity: plotOpacity }}>
        <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} stroke={COLORS.axis} strokeWidth={2} />
        <line x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} stroke={COLORS.axis} strokeWidth={2} />
        <text x={PLOT.left - 14} y={PLOT.top + 10} fill={COLORS.muted} fontSize={26} fontFamily={MATH} textAnchor="end">
          1/n
        </text>
        <text x={PLOT.left - 14} y={PLOT.bottom + 9} fill={COLORS.muted} fontSize={26} fontFamily={MATH} textAnchor="end">
          0
        </text>
        <text x={PLOT.right + 18} y={PLOT.bottom + 9} fill={COLORS.muted} fontSize={26} fontFamily={MATH}>
          n
        </text>
        <polyline points={points} fill="none" stroke={COLORS.data} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={px(shown)} cy={py(1 / shown)} r={7} fill={COLORS.data} />
      </svg>
    </AbsoluteFill>
  );
};
