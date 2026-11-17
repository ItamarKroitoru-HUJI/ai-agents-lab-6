import { Series } from "remotion";
import { Scene1RunningAverage, SCENE1_FRAMES } from "./scenes/Scene1RunningAverage";

export const VIDEO_FRAMES = SCENE1_FRAMES;

export const Video: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={SCENE1_FRAMES}>
      <Scene1RunningAverage />
    </Series.Sequence>
  </Series>
);
