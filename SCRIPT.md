# The Weak Law of Large Numbers in One Minute

## Goal

After one minute, the viewer understands why the sample average converges to μ.

- The average is always centered at μ.
- Its standard deviation shrinks to 0 as n grows.
- Chebyshev's inequality turns that shrinking spread into a probability bound.

## Running example

- We flip a fair coin.
- X equals 1 for heads and 0 for tails.
- The mean is μ = 0.5.
- The standard deviation is σ = 0.5.

## Timing rules

- The TTS engine reads about 2.5 words per second.
- Each scene stays under duration × 2.3 words.
- Total runtime is 60 seconds.

| id | duration | words | word limit |
|---|---|---|---|
| scene1 | 10 s | 22 | 23 |
| scene2 | 10 s | 22 | 23 |
| scene3 | 10 s | 21 | 23 |
| scene4 | 10 s | 22 | 23 |
| scene5 | 12 s | 23 | 27.6 |
| scene6 | 8 s | 18 | 18.4 |

---

## scene1

**Duration:** 10 seconds

**On screen:**

- A line chart fills the frame.
- The x-axis shows the flip count n from 1 to 500.
- The y-axis shows the running average from 0 to 1.
- A dashed horizontal line marks μ = 0.5.
- A polyline draws itself from left to right.
- The line swings wildly over the first few flips.
- The swings shrink as n grows.
- The line settles onto the dashed line by the end.
- A small counter in the corner shows the current n.

**Narration:**

> Flip a fair coin again and again. Track the average of the flips. It wiggles at first. Then it settles at one half.

---

## scene2

**Duration:** 10 seconds

**On screen:**

- A horizontal number line runs from 0 to 1.
- A tick and label mark μ = 0.5 in the center.
- A single coin icon appears above the line. It is drawn as an SVG circle with an "H".
- An arrow points from the coin to the 0.5 tick.
- The formula E[X̄ₙ] = μ fades in below the line.
- A soft vertical glow highlights the 0.5 tick.

**Narration:**

> Each flip has mean one half. The expected value of the average is also mu. So the average is centered at mu.

---

## scene3

**Duration:** 10 seconds

**On screen:**

- The number line from scene2 stays in place.
- A wide bell curve grows upward, centered at 0.5.
- Two arrows mark one standard deviation on each side of the center.
- A label between the arrows reads "spread".
- The formula SD(X̄ₙ) = σ/√n fades in above the curve.

**Narration:**

> Centering alone is not enough. We also need the spread. The standard deviation of the average is sigma over root n.

---

## scene4

**Duration:** 10 seconds

**On screen:**

- Three bell curves stack vertically on a shared axis from 0 to 1.
- All three curves are centered at 0.5.
- The top curve is labeled n = 10 and σ/√n ≈ 0.16.
- The middle curve is labeled n = 100 and σ/√n = 0.05.
- The bottom curve is labeled n = 1000 and σ/√n ≈ 0.016.
- Each curve appears in turn.
- Each new curve is narrower and taller than the last.
- A downward arrow on the right shows the spread shrinking toward 0.

**Narration:**

> For our coin, sigma is one half. One hundred flips give a spread of five hundredths. More flips shrink it toward zero.

---

## scene5

**Duration:** 12 seconds

**On screen:**

- One bell curve sits centered at 0.5.
- Two vertical lines mark 0.5 − ε and 0.5 + ε.
- The tails outside these lines are shaded red.
- The region between the lines is shaded green.
- A label on the tails reads "miss by ε or more".
- The inequality P(|X̄ₙ − μ| ≥ ε) ≤ σ²/(nε²) writes itself across the top.
- The red tail area pulses once as the bound appears.

**Narration:**

> The average might miss mu by at least epsilon. Chebyshev bounds that chance. It is at most sigma squared over n epsilon squared.

---

## scene6

**Duration:** 8 seconds

**On screen:**

- A new chart shows the bound σ²/(nε²) on the y-axis.
- The x-axis shows n.
- The chart uses ε = 0.05 for the coin.
- A curve drops steeply and flattens onto the x-axis.
- The final caption X̄ₙ → μ fades in at the center.
- The caption "Weak Law of Large Numbers" appears below it.

**Narration:**

> That bound goes to zero as n grows. So the average converges to mu. That is the weak law.

---

## Narration lines

scene1: Flip a fair coin again and again. Track the average of the flips. It wiggles at first. Then it settles at one half.
scene2: Each flip has mean one half. The expected value of the average is also mu. So the average is centered at mu.
scene3: Centering alone is not enough. We also need the spread. The standard deviation of the average is sigma over root n.
scene4: For our coin, sigma is one half. One hundred flips give a spread of five hundredths. More flips shrink it toward zero.
scene5: The average might miss mu by at least epsilon. Chebyshev bounds that chance. It is at most sigma squared over n epsilon squared.
scene6: That bound goes to zero as n grows. So the average converges to mu. That is the weak law.
