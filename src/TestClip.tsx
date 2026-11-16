import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";

// Running average of a fixed coin-flip sequence, drifting toward 0.5.
const FLIPS = Array.from({ length: 150 }, (_, i) => ((i * 7919) % 13 < 6.5 ? 1 : 0));
const AVERAGES = FLIPS.map((_, i) => FLIPS.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1));

export const TestClip: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const points = AVERAGES.slice(0, frame + 1)
    .map((avg, i) => `${100 + i * 7},${560 - avg * 400}`)
    .join(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", color: "white", fontFamily: "sans-serif" }}>
      <Audio src={staticFile("test-narration.wav")} />
      <h1 style={{ textAlign: "center", fontSize: 56, marginTop: 40, opacity: titleOpacity }}>
        The Weak Law of Large Numbers
      </h1>
      <svg width={1280} height={720} style={{ position: "absolute", top: 0, left: 0 }}>
        <line x1={100} y1={360} x2={1180} y2={360} stroke="#f59e0b" strokeDasharray="8 8" strokeWidth={3} />
        <text x={1190} y={368} fill="#f59e0b" fontSize={28}>μ</text>
        <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth={4} />
      </svg>
    </AbsoluteFill>
  );
};
