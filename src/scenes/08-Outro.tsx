import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, seconds } from "../theme";

export const OUTRO_FRAMES = seconds(7);

// Reveal times. Each one matches the narration.
const LINE1_START = 0;
const LINE2_START = seconds(1.6);
const FORMULA_START = seconds(3.4);
const FADE_START = OUTRO_FRAMES - 25;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const fadeIn = (frame: number, start: number) => interpolate(frame, [start, start + 15], [0, 1], clamp);

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const formulaScale = spring({ frame: Math.max(0, frame - FORMULA_START), fps: FPS, config: { damping: 200 } });
  const formulaVisible = frame >= FORMULA_START ? 1 : 0;
  const fadeOut = interpolate(frame, [FADE_START, OUTRO_FRAMES - 1], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>
      <Audio src={staticFile("narration/outro.wav")} />
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div style={{ fontSize: 56, color: COLORS.muted, opacity: fadeIn(frame, LINE1_START) }}>One flip is chaos.</div>
        <div style={{ fontSize: 56, opacity: fadeIn(frame, LINE2_START) }}>Many flips follow a law.</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 420,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          fontSize: 110,
          opacity: formulaScale * formulaVisible,
          transform: `scale(${0.8 + 0.2 * formulaScale})`,
        }}
      >
        <span style={{ color: COLORS.data, textDecoration: "overline" }}>X</span>
        <span style={{ color: COLORS.data, fontSize: 56, position: "relative", top: 20 }}>n</span>
        <span style={{ margin: "0 36px", color: COLORS.text }}>→</span>
        <span style={{ color: COLORS.mu }}>μ</span>
      </div>
      {/* Fade to the background color at the end. */}
      <AbsoluteFill style={{ backgroundColor: COLORS.bg, opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
