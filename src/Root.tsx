import { Composition } from "remotion";
import { TestClip } from "./TestClip";
import { Video, VIDEO_FRAMES } from "./Video";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Video" component={Video} durationInFrames={VIDEO_FRAMES} fps={30} width={1280} height={720} />
    <Composition id="TestClip" component={TestClip} durationInFrames={150} fps={30} width={1280} height={720} />
  </>
);
