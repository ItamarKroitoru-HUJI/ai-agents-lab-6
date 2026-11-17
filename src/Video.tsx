import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Fragment } from "react";
import { Intro, INTRO_FRAMES } from "./scenes/01-Intro";
import { Motivation, MOTIVATION_FRAMES } from "./scenes/02-Motivation";
import { Coins, COINS_FRAMES } from "./scenes/03-Coins";
import { Spread, SPREAD_FRAMES } from "./scenes/04-Spread";
import { Definition, DEFINITION_FRAMES } from "./scenes/05-Definition";
import { Proof, PROOF_FRAMES } from "./scenes/06-Proof";
import { Applications, APPLICATIONS_FRAMES } from "./scenes/07-Applications";
import { Outro, OUTRO_FRAMES } from "./scenes/08-Outro";
import { seconds } from "./theme";

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

// Each cross-fade overlaps two scenes, so it shortens the video.
const TRANSITION_FRAMES = seconds(0.6);

export const VIDEO_FRAMES =
  SCENES.reduce((sum, s) => sum + s.frames, 0) - (SCENES.length - 1) * TRANSITION_FRAMES;

export const Video: React.FC = () => (
  <TransitionSeries>
    {SCENES.map(({ Component, frames }, i) => (
      <Fragment key={i}>
        {i > 0 && (
          <TransitionSeries.Transition
            presentation={fade()}
            timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          />
        )}
        <TransitionSeries.Sequence durationInFrames={frames}>
          <Component />
        </TransitionSeries.Sequence>
      </Fragment>
    ))}
  </TransitionSeries>
);
