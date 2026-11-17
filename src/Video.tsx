import { Series } from "remotion";
import { Intro, INTRO_FRAMES } from "./scenes/01-Intro";
import { Motivation, MOTIVATION_FRAMES } from "./scenes/02-Motivation";
import { Coins, COINS_FRAMES } from "./scenes/03-Coins";
import { Spread, SPREAD_FRAMES } from "./scenes/04-Spread";
import { Definition, DEFINITION_FRAMES } from "./scenes/05-Definition";
import { Proof, PROOF_FRAMES } from "./scenes/06-Proof";
import { Applications, APPLICATIONS_FRAMES } from "./scenes/07-Applications";
import { Outro, OUTRO_FRAMES } from "./scenes/08-Outro";

const SCENES = [
  { Component: Intro, frames: INTRO_FRAMES },
  { Component: Motivation, frames: MOTIVATION_FRAMES },
  { Component: Coins, frames: COINS_FRAMES },
  { Component: Spread, frames: SPREAD_FRAMES },
  { Component: Definition, frames: DEFINITION_FRAMES },
  { Component: Proof, frames: PROOF_FRAMES },
  { Component: Applications, frames: APPLICATIONS_FRAMES },
  { Component: Outro, frames: OUTRO_FRAMES },
];

export const VIDEO_FRAMES = SCENES.reduce((sum, s) => sum + s.frames, 0);

export const Video: React.FC = () => (
  <Series>
    {SCENES.map(({ Component, frames }, i) => (
      <Series.Sequence key={i} durationInFrames={frames}>
        <Component />
      </Series.Sequence>
    ))}
  </Series>
);
