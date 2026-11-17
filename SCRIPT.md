# The Weak Law of Large Numbers: script

Goal: after the video, a viewer understands why the sample average converges to μ.
Length: 110 seconds. The hard limit is 2 minutes.

Story: intro, motivation, simple example, formal definition, real-life applications.

| # | id | part | seconds | file |
|---|---|---|---|---|
| 1 | intro | Intro | 8 | `src/scenes/01-Intro.tsx` |
| 2 | motivation | Motivation | 15 | `src/scenes/02-Motivation.tsx` |
| 3 | coins | Simple example | 10 | `src/scenes/03-Coins.tsx` |
| 4 | spread | Simple example | 15 | `src/scenes/04-Spread.tsx` |
| 5 | definition | Formal definition | 15 | `src/scenes/05-Definition.tsx` |
| 6 | proof | Formal definition | 20 | `src/scenes/06-Proof.tsx` |
| 7 | applications | Real-life applications | 20 | `src/scenes/07-Applications.tsx` |
| 8 | outro | Closing | 7 | `src/scenes/08-Outro.tsx` |

Narration text lives in `narration/lines.json`. CI turns each line into `public/narration/<id>.wav`.

## 1. intro, 8 s
- On screen: one coin flips and lands on a random side. Then a grid of many small coins appears. A big "?" fades in.
- Title at the end: "The Weak Law of Large Numbers".

## 2. motivation, 15 s
- On screen, left: a casino chip with a "lose" mark on one bet. Then a yearly bar that is clearly positive.
- On screen, right: a poll with 1,000 dots predicting a large crowd shape.
- At the end, one centered line: "Averages of many random trials become predictable."

## 3. coins, 10 s. Built.
- The running average of 1000 seeded flips wobbles, then settles at μ = 0.5.

## 4. spread, 15 s
- Three histograms of sample averages, for n = 10, 100 and 1000. They appear one after another.
- Each gets narrower around 0.5. Label each with its n and its spread σ/√n: 0.16, 0.05, 0.016.

## 5. definition, 15 s
- The setup appears: X₁, X₂, … independent, with mean μ and variance σ².
- The statement appears: for every ε > 0, P(|X̄ₙ − μ| ≥ ε) → 0 as n → ∞.
- A small number line shows the band μ ± ε. The probability outside it shrinks.

## 6. proof, 20 s
- Line 1: E[X̄ₙ] = μ.
- Line 2: Var(X̄ₙ) = σ²/n.
- Line 3: Chebyshev. P(|X̄ₙ − μ| ≥ ε) ≤ σ²/(nε²).
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
