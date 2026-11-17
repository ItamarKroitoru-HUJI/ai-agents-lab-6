# The Weak Law of Large Numbers: a 2-minute explainer

Lab 6 of AICODE. The video explains why a sample average converges to the true mean μ.
The script is in `SCRIPT.md`.

## Stack

- **Agent:** Claude Code with Opus 5.5.
- **Animation:** Remotion 4.0.290. The video is written in React, one file per scene in `src/scenes/`.
- **Narration:** Kokoro text to speech, through `kokoro-onnx`. The text is in `narration/lines.json`.
- **Muxing:** Remotion renders the MP4 with the narration underneath. ffmpeg compresses it for upload.

## How a render runs

Renders run in GitHub Actions, not on the laptop. Every push triggers `.github/workflows/render.yml`. The workflow:

1. Generates each narration line as a WAV with Kokoro, using `tools/tts.py`.
2. Type-checks the code with `tsc --noEmit`.
3. Renders the `Video` composition.
4. Uploads it as `render-<run number>.mp4`, so no render overwrites another.

Each render was downloaded into `out/`, which git ignores. A render takes about 1 to 2 minutes.

## How it was built

1. **Before the lab, on 16/11.** Commit 1 set up the stack and a 5-second narrated test clip, `src/TestClip.tsx`. The next commit is from the lab day, so the gap between them is not lab time.
2. **Phase 1.** Two jobs ran in parallel.
   - One agent rendered a first scene, the coin running average, to test the pipeline.
   - A second agent wrote the first `SCRIPT.md`.
3. **Story and shared pieces.** The story was set as intro, motivation, simple example, formal definition, applications, under 2 minutes. Before any parallel work, the main agent wrote the shared files:
   - `SCRIPT.md`: the story.
   - `narration/lines.json`: the narration.
   - `src/theme.ts`: colors and timing.
   - `src/Video.tsx`: the scene order.
4. **Parallel scenes.** Four agents built 7 scenes at once, each in its own files.
   - Agent A built the intro and motivation.
   - Agent B built the spread histograms.
   - Agent C built the definition and the Chebyshev proof.
   - Agent D built the applications and the outro.

   Only the main agent committed. It landed their work as one integration commit, `Build the full 110-second story`. So that commit is large, but each scene was a separate small task.
5. **Review rounds.** Each round ran as: render, extract frames with ffmpeg, check them, fix, then render again. These rounds fixed:
   - An average that ended at 0.445 instead of 0.5.
   - A type error caught by CI.
   - A Monte Carlo seed that showed π ≈ 2.97.
   - Inconsistent ≥ and > symbols.
   - Narration that ran 3 seconds ahead of its visuals.
6. **Feedback round.** Two agents worked in parallel.
   - One rebuilt the motivation as free throws and race laps.
   - One pushed the coin example to n → ∞ on a log axis.

   Meanwhile the main agent added cross-fades between scenes.
