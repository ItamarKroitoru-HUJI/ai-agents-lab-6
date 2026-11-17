# The Weak Law of Large Numbers: script

Goal: after the video, a viewer understands why the sample average converges to μ.
Length: about 115 seconds, with 0.6-second cross-fades between scenes. The hard limit is 2 minutes.

Story: intro, motivation, simple example, formal definition, real-life applications.

| # | id | part | seconds | file |
|---|---|---|---|---|
| 1 | intro | Intro | 8 | `src/scenes/01-Intro.tsx` |
| 2 | motivation | Motivation | 20 | `src/scenes/02-Motivation.tsx` |
| 3 | coins | Simple example | 14 | `src/scenes/03-Coins.tsx` |
| 4 | spread | Simple example | 15 | `src/scenes/04-Spread.tsx` |
| 5 | definition | Formal definition | 15 | `src/scenes/05-Definition.tsx` |
| 6 | proof | Formal definition | 20 | `src/scenes/06-Proof.tsx` |
| 7 | applications | Real-life applications | 20 | `src/scenes/07-Applications.tsx` |
| 8 | outro | Closing | 7 | `src/scenes/08-Outro.tsx` |

Narration text lives in `narration/lines.json`. CI turns each line into `public/narration/<id>.wav`.

## 1. intro, 8 s
- On screen: one coin flips and lands on a random side. Then a grid of many small coins appears. A big "?" fades in.
- Title at the end: "The Weak Law of Large Numbers".

## 2. motivation, 20 s
- Basketball: balls arc toward a hoop at a 90% make rate. Three misses come early.
- A season FT% scoreboard jumps around, then settles near 90%.
- Race track: a car laps an oval. Each lap time varies, but the running average barely moves.
- Ends on a big "Why?".

## 3. coins, 14 s
- The running average of seeded flips on a log x-axis, from n = 1 to n = 10⁶.
- At "infinity", n becomes ∞ and the line locks onto μ = 0.5.

## 4. spread, 15 s
- Three histograms of sample averages, for n = 10, 100 and 1000. They appear one after another.
- Each gets narrower around 0.5. Label each with its n and its spread σ/√n: 0.16, 0.05, 0.016.

## 5. definition, 15 s
- The setup appears: X₁, X₂, … independent, with mean μ and variance σ².
- The statement appears: for every ε > 0, P(|X̄ₙ − μ| > ε) → 0 as n → ∞.
- A small number line shows the band μ ± ε. The probability outside it shrinks.

## 6. proof, 20 s
- Line 1: E[X̄ₙ] = μ.
- Line 2: Var(X̄ₙ) = σ²/n.
- Line 3: Chebyshev. P(|X̄ₙ − μ| > ε) ≤ σ²/(nε²).
- Line 4: the bound → 0 as n → ∞. A small plot of 1/n falling to 0.

## 7. applications, 20 s
Four cards appear one by one, each with a simple drawn icon:
- Casinos: a small house edge wins over millions of bets.
- Insurance: premiums come from average claims.
- Polling: a sample estimates the whole population.
- Monte Carlo: random points in a square estimate π.

## 8. outro, 7 s
- "One flip is chaos. Many flips follow a law."
- The final formula: X̄ₙ → μ.
