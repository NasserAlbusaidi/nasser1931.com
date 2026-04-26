---
layout: ../../layouts/Paper.astro
title: "Becoming a Cyclist on Camera"
subtitle: "Field report from a four-year self-experiment, written for a reader."
byline: "Nasser Al Busaidi — Muscat, Oman — drafted April 2026"
description: "Four years of daily body composition, sleep, HRV, and cycling performance data, audited against a six-check guardrail. Three findings survived. Two were retracted on the page."
eyebrow: "field report"
ogType: "article"
image: "/paper/figures/fig01_longitudinal_multipanel.png"
---

> This is the readable layer of a longer working document. The full receipts (data dictionary, reproduction scripts, bug post-mortems, bibliography) live in the data-doc, kept against the project's analysis code, available on request. This one is meant to be read in a sitting.

---

## Research summary

**Question.** What does four years of daily-resolution self-tracking actually let one person know about their own body?

**Subject and data.** N = 1, me. 28-year-old male, 172 cm, Muscat, Sep 6 2022 → Apr 26 2026. Roughly 1,316 days of body-composition data from a Garmin watch, a bioimpedance scale, and MacroFactor food logs. 165 outdoor cycling activities since December 2024. 1,204 strength sessions across six and a half years.

**Method.** Daily measurement, plus six pre-specified guardrail checks any candidate signal has to clear before I'm allowed to call it a finding: survival under data-gap removal, replication within phase, walk-forward replication, biological plausibility, effect-size reporting, full distributional plot. Exploration with strict filters bolted on, not pre-registered confirmatory work.

**The big structural finding.** In small-N longitudinal data, lagged predictors that look bulletproof in the pooled view tend to fall apart once you replicate them on a held-out window. The §6 result, *morning RHR predicts long-ride speed*, full-window detrended r = −0.35 on rides ≥50 km, is the worked example. Train half r = −0.51, test half r = +0.00. I'm calling this category *regime-bound*: real inside one window, gone in the next. It accounts for as much of the surviving ledger as the validated category does, and twice the falsified count outright.

**Findings ledger.**

- **Validated (2).** Logged-intake systematic under-count of ~555 kcal/day (Bayesian triangulation against scale-weight, MacroFactor, and Garmin expenditure; robust under prior sensitivity). REM scarcity is duration-bound rather than a production failure: 65.4% of REM concentrates in the last third of the night, so short nights truncate REM disproportionately.
- **Regime-bound (2).** Morning RHR → long-ride avg speed: real Dec 2024 – Aug 2025, decayed to zero after that; CI [−0.53, +0.08] crosses zero on bootstrap. HRV(t−1) → next-day calorie intake: held at +24.6 kcal per millisecond of HRV inside the YTD-2026 frame (n = 107) but collapsed to +7.1 kcal/ms (n = 1,113) when I extended back to Mar 2023, and to +0.4 kcal/ms (n = 349) inside the cycling era 2025 (Dec '24 – Nov 19, '25) alone. The variance is concentrated inside calendar 2026. Even within the Iron 70.3 prep phase, the Nov 20 – Dec 31, 2025 portion shows slope −2.7 (n = 42) while the Jan 1 – Feb 13, 2026 portion shows +26.7 (n = 45): same training block, opposite signs across the year boundary. It's not a personal physiology constant. Downgraded from VALIDATED on Apr 26, 2026, the second worked retraction in this paper after the §6 RHR result.
- **Falsified (1).** A "protein-collapse predictor" that looked clean on a 57-day Ramadan window (AUC 0.929) collapsed to AUC 0.677 on the YTD frame. A phase artifact, not a general signal.
- **Retracted (1).** RHR(t−1) → next-day fat intake: a +0.51 correlation that flipped to −0.08 once I forced consecutive-day pairs. Shift-across-gaps alignment bug, not a real signal.
- **Negative result (1).** Day-ahead prediction of recovery state from prior-day metrics fails on this data layer. Every model I tested produced out-of-sample R² < 0 at n = 55.

**What four years of self-tracking actually buys.** Calibrated personal baselines, retroactive accountability for guardrail audits, and the falsification of plausible-sounding hypotheses. Not day-ahead prediction. The discipline cost (running every candidate finding through six pre-specified checks before publishing it) is higher than the time cost of the logging itself.

The rest of this document is the story of how that ledger emerged. §1 walks through the retraction that triggered the guardrail. §§2–3 set up the subject and the instrument chain. §§4–6 walk the body-composition, cycling, and ride-prediction analyses. §7 catalogues the findings. §8 names what self-tracking does and does not buy. §9 is the limitations stack.

---

## 1. The correlation that wasn't

On April 23, 2026, I thought I'd found a real signal.

The setup looked clean. Thirty-five days of MacroFactor food logs, thirty-five days of resting heart rate from a Garmin watch, the Ramadan-cut window, when every variable that mattered was moving the most. The hypothesis was about as boring as a hypothesis gets: yesterday's recovery should affect today's eating. A high overnight heart rate (sympathetic tone, poor sleep, accumulated stress) should bleed into the next morning's appetite. I wanted to see if the relationship was strong enough to act on.

So I aligned the two columns, yesterday's RHR against today's fat intake, and got r = +0.51. *p* comfortably below threshold. *n* = 35. Effect size big enough to be operative, sample size adequate by the conventions of self-tracking. By the standards I'd been using on the rest of this self-experiment, that was a finding.

I wrote it up. Drafted a paragraph for the paper. Started thinking about the mechanism. I let myself be pleased.

My mind went straight to *I CRACKED THE CODE.* I thought I could finally understand how my body works and optimize it. Maybe even biohack my metabolism: burn fat more efficiently, eat whatever I want without gaining weight.

Then I ran one more check.

The check was banal. I rebuilt the alignment and only paired days where I had both yesterday's RHR *and* today's intake on consecutive calendar days, no gaps, no interpolation, no nearest-neighbor fill. The dataset shrank slightly. I re-ran the correlation.

It came back at r = −0.079. Wrong sign, near zero. The original +0.51 had been an artifact of how the alignment handled missing days: when RHR was missing on day *t*, the lookup quietly grabbed the nearest available value, which on a phase boundary or a travel gap could be a week later, on the other side of a behavioral change. The shift across the gap was carrying the signal, not the physiology.

I deleted the paragraph.

There's a literature on this exact failure mode. Rehfeld and colleagues described it in 2011 for paleoclimate proxies. Schulz and Stattegger had documented it as far back as 1997. I hadn't read either before I made the mistake. I read them after.

<figure>
  <img src="/paper/figures/fig08_alignment_mechanism.png" alt="Figure 1. The alignment failure, dissected on the YTD frame. Left: scatter of all 110 nearest-fill pairs, RHR on day t−1 against logged fat on day t. Pairs where the algorithm reached across a gap of two or more days to source RHR are shown as red triangles (n = 19, sized by gap magnitude); pairs where t−1 was a literal calendar day are blue dots. Both OLS lines lie near zero on this snapshot. But on the Apr 23 snapshot, before later backfills closed the gaps, the same algorithm on a 35-day Ramadan-window subset produced r = +0.508. Right: distribution of the offset days the nearest-fill lookup actually used. Seventeen percent of pairs span ≥2 days; the long tail reaches ±7 days. The bug was in the join logic, not the data. On any future short-window pull with similar gap structure, it would re-emerge." loading="lazy" />
  <figcaption><strong>Figure 1.</strong> The alignment failure, dissected on the YTD frame. Left: scatter of all 110 nearest-fill pairs, RHR on day t−1 against logged fat on day t. Pairs where the algorithm reached across a gap of two or more days to source RHR are shown as red triangles (n = 19, sized by gap magnitude); pairs where t−1 was a literal calendar day are blue dots. Both OLS lines lie near zero on this snapshot. But on the Apr 23 snapshot, before later backfills closed the gaps, the same algorithm on a 35-day Ramadan-window subset produced r = +0.508. Right: distribution of the offset days the nearest-fill lookup actually used. Seventeen percent of pairs span ≥2 days; the long tail reaches ±7 days. The bug was in the join logic, not the data. On any future short-window pull with similar gap structure, it would re-emerge.</figcaption>
</figure>

---

Everything that follows has been forced through six checks, written down before I let any signal call itself a finding. I'll list them once now, because every claim in the rest of this document has had to clear them, and a reader is owed the bar.

A claimed lagged correlation in this paper has to:

1. Survive when data gaps are imputed or excluded, not be a shift-across-gaps artifact.
2. Survive when computed inside a single phase, not only pooled across phases.
3. Replicate in a held-out window. Walk-forward, not just leave-one-out.
4. Have a plausible biological mechanism, named on the page.
5. Report effect size, not just *p*-value.
6. Include the full distributional plot, not the scalar alone.

The RHR → fat-intake correlation failed check 1. A "protein-collapse predictor" I'd been excited about earlier in the season (clean at *n* = 57, AUC 0.929) failed check 2; it was a Ramadan-phase artifact and went to AUC 0.677 on the year-to-date frame. The single most-attached-to finding in this paper, the §6 headline I had written and re-written, will fail check 3 in the next ten pages.

Three signals are going to survive. Most won't. This is a list of what survived being checked properly, not a list of what worked.

---

## 2. What I was actually doing

I've been measuring myself, in some form, for four years. The slightly more pretentious framing is that I'm the only subject in a longitudinal natural experiment where the interventions are my own life choices. Both are true.

I'm calling this a field report on purpose, not a paper. A paper implies peer review, generalizability across subjects, and a confirmatory frame around pre-registered hypotheses. This work has none of those things and is stronger when it isn't asked to. What follows is one body's measurement record, audited under §1's rules, written down so a reader can decide what survived being checked. The §9 limitations name the cost of the genre directly.

The case for taking N=1 seriously is straightforward and limited. With only one subject you can't make claims about populations. You can't say "athletes who do X gain Y kilos of muscle." What you *can* do, if the measurement chain is clean enough and the time horizon long enough, is detect signals that exist within a single individual at a resolution no cross-sectional study will ever match. A population study with 100 subjects and four observations each has 400 rows. This dataset has roughly 1,316 days of daily-resolution body composition, 165 cycling activities, 1,204 strength sessions, and night-by-night sleep architecture across almost four years. You give up generalizability and you get resolution. I'm betting that within a single body, a high-resolution longitudinal record can answer questions the population literature can't, and I'm willing for the answer in some cases to be "no, it can't."

The subject is me. I'm 28, male, 172 cm, and I live in Muscat, Oman. I started weighing myself daily on September 6, 2022, when the bioimpedance scale and the food-logging app got linked in the same week. I haven't anonymized this paper, for the same reason I haven't pretended to a larger *n*: the warts-and-all framing only works if you put your name on it.

The dataset has a clear hinge.

Until late 2024 I was a strength athlete. Four-plus lifting sessions a week, training cycle by training cycle, with peak compound lifts of a 115 kg back squat and a 150 kg deadlift. The body in those years was the densest strength block of my life, 4.29 sessions per week on the rolling average, and it shows in the body-composition trace as a stable upper-70s kilogram weight built around lean mass. There was cardio, but it was instrumental: enough to keep the lifts moving, never enough to be the point.

On December 1, 2024 I did my first FTP test on a bike. 135-watt ramp, terminated early, descriptive only. It was also the moment the dataset's center of gravity moved.

I had just bought my indoor trainer and, since I was still using a city bike, I figured why not do an FTP test on it. The test was only twenty minutes. The result was less than impressive: 135 watts. About 20 watts below what a beginner cyclist should be able to produce. But it was a start.

That's not to say I didn't enjoy it. I've always been a numbers guy, and the data from the test was fascinating. New challenge, new metric to chase. So I decided to get a *real* bike. A road bike. That meant a few changes to my life. The main one: drop lifting weights.

From that day on the operative question stopped being *how strong can I get* and started being *can I become a cyclist.* Within eighteen months I'd ridden three triathlons (Al Bustan Sprint in November 2025, Athiba Olympic in January 2026, Muscat 70.3 in February), built up to 80–100 km weekend rides, and watched my back squat regress from 115 kg to 100 kg, sessions per week drop by twenty percent, and total weekly tonnage drop almost in half.

I call those two periods Act I and Act II. The boundary between them is the cleanest natural experiment in the file. Same person, same scale, same watch, mostly the same diet patterns, but a complete reallocation of finite recovery from one modality to another. Almost every comparison in this paper that has teeth is a comparison across that boundary.

What this paper is trying to do, then, isn't predict a race. It's to take the measurement record and ask: across four years of one body's data, what does the daily-tracking layer actually let you know that you wouldn't already know from the gym mirror and the bathroom scale?

What it isn't trying to do matters more. It doesn't aim at a race-day prediction. The original draft had Ironman Oman on December 5, 2026 as its closing data point, the test of whether a self-tracking model could project a finishing time. I removed that endpoint in April 2026. Partly because it was overfitting the analysis to a single date eight months out, and partly because the more I looked at the dataset the clearer it became that the trajectory is the interesting thing, not the terminal value. If the race goes well in December, that's a chapter. If it goes badly, that's also a chapter. Neither outcome would change what's already on the page.

The paper has a subject, a measurement record, a hinge, and a question. It doesn't have a punchline waiting in the future to redeem it. Everything claimed in the rest of this document has had to clear the six checks from §1 against the data already in hand.

---

## 3. The receipts

Garmin watch. MacroFactor. A bioimpedance scale. Hevy.

The Garmin has been on my wrist the whole window. An older model from October 2022 through January 2023, then a newer one from January 2023 onward. It records every activity (duration, distance, heart rate, cadence, GPS, splits) plus sleep architecture, overnight HRV, resting heart rate, body battery, daily training status, FTP estimate, and a VO2max-derived race predictor. Anywhere this paper says "Garmin," that's the source. One caveat. The older watch had no `strength_training` activity type, so gym sessions in late 2022 and early 2023 got logged as generic indoor cardio. The newer watch supported the type from day one but I didn't actually start using it for lifts until December 2024. Hevy on my phone was always the system of record for the lift itself; the watch was there for HR and duration. So pre-December-2024 indoor-cardio volume in the Garmin record is mostly mislabeled lifting, regardless of which watch was on the wrist that month. Don't read it as endurance work.

MacroFactor has been running since September 2022 and holds 1,318 daily summaries: calories, protein, fat, carbs, expenditure, weight, body-fat estimate. Logging fidelity is mixed. At home I weigh food on a kitchen scale. At restaurants and at work I use the app's photo-and-voice estimation. So *logged intake* is a blend, with the photo-estimated half diluting the weighed half. §7 puts the dilution at roughly 555 kcal per day on the rolling average and treats it as a finding in its own right.

The bioimpedance scale (single-frequency, consumer-grade) weighs me most mornings under the same conditions: empty stomach, post-bathroom, before water. I trust the weight reading to within 0.1 kg. The body-fat number is good to ±2–3 percentage points on absolute readings, ±1 pp on the within-week trend. Every body-fat claim in this paper is a *change*, never an absolute leanness number. The device can't support one.

The Hevy log runs from August 2019 through January 2026 and stores 26,023 sets across 1,184 strength sessions. Every exercise, every weight, every rep. In February 2026 I migrated lift logging to MacroFactor's workout module. That added 878 sets across 20 more sessions. Both halves are merged into a single 1,204-session timeline used in §5.

Three things on the chain are worth flagging.

The bioimpedance scale drifts on firmware updates and reads body fat 3–4 percentage points away from a same-day DEXA. Relative comparisons only. The scale itself was retired in early March 2026, so the body-fat trace stops there.

The logged-calorie number is systematically low. It shows up cleanly when you triangulate logged intake against MacroFactor's expenditure estimate, against Garmin's daily energy out, and against the actual scale-weight trajectory. Bayesian posterior mean is roughly 555 kcal/day. §7 treats it as a finding in its own right, but it has to be on the table before any *calories vs. outcome* sentence in the rest of the paper makes sense.

Between January and April 2026 a parsing bug in Garmin's typed-split data inflated the recorded distance on three rides and corrupted the FTP estimates derived from them. Traced, recomputed, fixed. The FTP-progression numbers in §5 use the corrected values. Anyone running an audit should start with the typed-splits post-mortem in the working document (Appendix C).

That's the chain.

---

## 4. Body composition, four years

> **Finding.** Across four years, trend weight cycled inside a 6.7 kg corridor and never broke it — no downward trajectory toward any race weight in the record. The single robust physiological change isn't a body-composition number but a metabolic one: expenditure floor lifted by ~175 kcal/day in the cycling era (Act I weekly low 1,864 kcal/day → Act II weekly low 2,039 kcal/day). Body-fat readings are reported as within-subject change only; the bioimpedance scale's ±2–3 pp absolute error band makes leanness levels uninterpretable.

The body-composition record opens on September 6, 2022, on a kitchen scale and a freshly installed food-logging app. By April 2026 it had piled up 1,316 daily measurements, 1,232 of them with a scale weight and 970 with a body-fat reading from the bioimpedance device. Three and a half years and one career-of-the-body switch later, the headline is "+4.47 kg net" — 73.60 kg trend in the first week, 78.07 kg in the most recent. That number is also the least interesting one in this section. How it got there is more interesting.

The path has eight swings. A swing here means a continuous direction in trend weight that crosses two kilograms before reversing. Two cuts and two gains in the pre-cycling era, two of each in the cycling era. The four cuts together took 10.4 kg off. The four gains together added 15.7 kg back. Net of all eight: +5.3 kg, in line with the long-run trend. The small gap from the +4.47 kg endpoint figure is expected, because swing reversals don't fall exactly on the file's first and last weeks, so the sum of swing magnitudes and the endpoint-to-endpoint trend can disagree by a kilogram or so.

In plain language: the body has been *cycling* through a corridor under seven kilograms wide. Roughly 71.6 kg at its low (week of April 17, 2023) to 78.3 kg at its high (week of February 2, 2026, twelve days before Muscat 70.3). For almost the entire measurement window. No downward trajectory toward any kind of race weight.

The phase ladder reads as cuts and rebuilds in alternation. The clearest cut in the file ran from January through April 2023 and bottomed at the all-time low. The clearest gain ran May 2023 through January 2024 and erased it. A faster cut in spring 2024 (about four kilograms in twelve weeks, –0.34 kg/week) was the largest in the record by both magnitude and rate, faster than anything since. The Ramadan cut in February-March 2026 dropped roughly three kilograms in a month. Ordinary in pace. Extraordinary in everything around it: HRV never reached "balanced" status across the entire 30-day window, and sleep volume worsened week by week. §7 picks that up. For now the point is small. Ramadan wasn't the most aggressive cut in the file, but it was the most physiologically expensive one.

The single clearest physiological change in the four-year record isn't a body-composition number at all. It's the metabolic baseline.

Before December 2024, in the 117 weeks of Act I, MacroFactor's expenditure estimate averaged 2,236 kcal per day. After December 2024, in the 72 weeks of Act II so far, the average is 2,433. That's +197 kcal per day on the mean, but the more telling number is the floor. The lowest expenditure week in Act I was 1,864 kcal per day, in January 2024. A body that had effectively stopped moving outside of the gym. The lowest expenditure week in Act II is 2,039 kcal per day. The floor lifted by roughly 175 kcal per day. From the worst Act I week to the best Act II week (2,725 kcal per day, in February 2026, the week before Muscat 70.3), the swing is about 860 kcal per day across twenty-five months.

The body-fat trace deserves a paragraph of caveats and can then be largely ignored. The recorded range is 14.5 percent to 20.83 percent. The 14.5 percent reading from February 2023 came from a bioimpedance scale during an extended cut and is almost certainly low. These devices systematically under-read body fat in lean, well-hydrated subjects. The 20.83 percent reading from January 2026, at the dataset's highest scale weight, is more plausibly close to truth, but the device's error band is still ±2–3 percentage points. The bioimpedance sensor stopped recording in early March 2026 when the smart scale was retired. Every body-fat claim in this paper is *relative*. A within-subject change. Never an absolute leanness number.

A few things the trajectory doesn't show. It doesn't show a smooth descent toward any race weight. It doesn't show cycling driving weight loss on its own: the pre-prep cycling era (Dec 2024 → Nov 17, 2025) ended −0.50 kg from where it began across 51 weeks, with the gains and losses inside it netting to roughly zero. It doesn't show Ramadan as an unusually fast cut. What it does show, robustly, is that the metabolic baseline lifted by roughly 200 kcal per day, that body-fat coupling tightened in the cycling era so almost every kilogram regained brought a percentage point of body fat with it, and that the body's natural operating range is a corridor under seven kilograms wide that hasn't been broken in four years.

Whether anything else in the dataset has the leverage to break that corridor is what the cycling sections and the phase-response work go after.

<figure>
  <img src="/paper/figures/fig01_longitudinal_multipanel.png" alt="Figure 2. The body-composition corridor and the expenditure floor lift, Sep 2022 → Apr 2026. Black: trend weight (MF EMA), with the all-time low (71.6 kg, Apr 2023) and high (78.3 kg, Feb 2026) marked, the 70 kg target reference line, and a vertical at Dec 1, 2024 (the Act I → Act II hinge). The shaded blue band is the 6.7 kg corridor the trend has cycled inside for the entire window. Orange (right axis): MacroFactor's expenditure estimate, raw weekly values plus an 8-week rolling mean. Two horizontal references mark the floors named in §4: Act I floor 1,864 kcal/day (Jan 2024) and Act II floor 2,039 kcal/day. What moved across the hinge is the orange line, not the black one. Phase shading from the phase manifest." loading="lazy" />
  <figcaption><strong>Figure 2.</strong> The body-composition corridor and the expenditure floor lift, Sep 2022 → Apr 2026. Black: trend weight (MF EMA), with the all-time low (71.6 kg, Apr 2023) and high (78.3 kg, Feb 2026) marked, the 70 kg target reference line, and a vertical at Dec 1, 2024 (the Act I → Act II hinge). The shaded blue band is the 6.7 kg corridor the trend has cycled inside for the entire window. Orange (right axis): MacroFactor's expenditure estimate, raw weekly values plus an 8-week rolling mean. Two horizontal references mark the floors named in §4: Act I floor 1,864 kcal/day (Jan 2024) and Act II floor 2,039 kcal/day. What moved across the hinge is the orange line, not the black one. Phase shading from the phase manifest.</figcaption>
</figure>

---

## 5. Cycling, from zero

> **Finding.** Average ride speed climbed +5.2 kph at constant heart rate across five quarters (25.7 → 30.9 kph in 145–151 bpm corridor) before plateauing. Three race-day bike legs traced a textbook decreasing-power-with-distance curve: 200 → 186 → 163 W as distance grew 21 → 40 → 89 km, with watts-per-bpm declining 1.23 → 1.19 → 1.11 in lockstep. The cycling era cost 47% of weekly strength tonnage and a working-weight regression on every compound lift (squat 115 → 100 kg, deadlift 150 → 140 kg, bench 75×5 → 72.5×1, OHP 50 → 42.5 kg), larger than the published concurrent-training literature predicts for cycling-mode endurance. Most of that is probably reallocation of recovery, not molecular interference.

The first FTP test is dated December 1, 2024. Seventeen minutes, terminated early, no FTP value produced. Eighteen days later, December 19, the same body knocked out an 80.4 km loop through Bawshar at 144 bpm average. Six days after that, 65 km on the As Seeb road. On December 29 it crashed. The activity Garmin saved is named, verbatim, *"As Seeb Road Cycling | crashed lmao"* — 26.7 km, max HR 171, the heart-rate trace consistent with picking yourself up and finishing the loop.

This was my road bike's first crash, but it wouldn't be my last. I tried to avoid a speed bump, veered off-road and crashed onto the pavement. Nothing broken, but the bike had a new scratch. Call it a rite of passage.

By January 6, 2025, thirty-six days after that aborted FTP test, there was a 100 km ride. By January 31, 120 km.

Those numbers don't add up for a true cold-start cyclist. They add up for what was actually true: I'd been riding a city bike around Muscat for almost two years before I told the watch to start counting. Act II opens with the moment training got logged, not the moment cycling began.

Outdoor volume since: 5,959 km across 124 outdoor training rides over sixteen months (the 161 figure that appears elsewhere in the file is total rides including indoor TrainerRoad), spread across seven quarters. The shape is informative. 2024 Q4 only has seven rides because the era was a month old. Q1 2025 jumped to eighteen rides, Q2 to twenty-two, with quarterly totals climbing 951 → 1,187 km. Q3 2025 was the highest-volume quarter in the file: 1,542 km across twenty-nine rides. After that the curve gets choppy.

Three travel gaps explain the choppiness. Qatar in late May, Southeast Asia in July, Europe in October 2025. TrainerRoad bridged the Qatar window. The other two were full off-bike, two-and-a-half weeks each. The post-gap rebuild took about two weeks each time and never failed to recover the prior block's volume. Those gaps are the only structural breaks in the file.

The cleanest piece of evidence that the cycling era did anything to the body is the speed-at-equal-HR signal. Average ride speed climbed from 25.7 kph in 2024 Q4 to 30.9 kph in 2026 Q1, a +5.2 kph swing across five quarters. Average ride heart rate over the same window stayed in a tight 145–151 bpm corridor. The biggest single-quarter jump (+2.5 kph) happened between Q1 and Q2 2025, right when structured TrainerRoad workouts started showing up in the activity log. After Q2 2025 the average plateaued in the 29.7–30.9 kph corridor and has stayed there. That probably doesn't mean fitness plateaued. It means looking at average-speed-by-quarter without controlling for terrain, weather, and group-versus-solo can't resolve the gains anymore.

Five FTP/ramp tests bracket the era. The first two (December 1, 2024 and April 22, 2025) terminated early and produced no recorded FTP. The first useful test was the June 5, 2025 TrainerRoad ramp. The first outdoor test was November 20, 2025, almost a year into structured training. Garmin's normalized-power values for the five tests, in chronological order: 135 → 172 → 193 → 217 → 206 watts. The fifth test, in January 2026, was three weeks before Muscat 70.3 — the closest thing to a race-pacing baseline.

Three triathlons sit inside this window, and the cleanest cycling-era story this dataset tells is on the three race-day bike legs.

**Al Bustan Sprint** (November 15, 2025) was 21 km of hilly course at 200 W average and 31.5 kph, max HR 178. Ridden all-out in a way no training session has been, on the steepest course of the three by elevation gain per kilometer. **Athiba Olympic** (January 31, 2026) was 40 km at 186 W and 34.6 kph. Lower power, faster ride, because the course was flat and the format was sustained-tempo rather than sprint-redline. Athiba's 34.6 kph is +3.7 kph above the 2026 Q1 training average. **Muscat 70.3** (February 14, 2026) was 89 km at 163 W and 29.9 kph, with +818 m of climbing, ridden three hours under threshold before a half-marathon. Average speed below the training corridor on a course nearly four times steeper than typical training routes.

The pacing curve across those three legs is textbook physiology. Distance grew 21 → 40 → 89 km. Average power went 200 → 186 → 163 W. Average heart rate went 163 → 156 → 147 bpm. Watts-per-bpm, a crude pacing-discipline metric, descended right alongside at 1.23 → 1.19 → 1.11. No outliers, no surprises, just the body doing what longer formats demand.

The cycling era didn't come for free. Across the twelve months immediately before and after the cycling onset, strength sessions per week dropped 20 percent. Total weekly tonnage dropped almost half, 48 percent. Sessions didn't just get rarer; they got lighter and shorter. Every primary compound regressed from its Act I peak: back squat 115 → 100 kg, deadlift 150 → 140 kg, overhead press 50 → 42.5 kg, and bench from a 75 kg working five down to 72.5 kg for a single rep — a real working-weight collapse hidden inside an apparently flat one-rep-max.

I remember one day I was trying to deadlift 140 kg for 3 reps and I could barely do it. My grip was failing. I was using a double overhand and couldn't hold the bar. I switched to mixed grip to complete the lift and still failed the last rep. That was the moment I realized I had to pick my poison: cycling or weightlifting.

The published concurrent-training literature (Wilson 2012, Coffey and Hawley 2017, Petré 2021 on trained populations) says cycling-mode endurance, in mostly-separated sessions, should produce only a small interference effect. What I'm seeing is bigger than that. The most defensible read is that most of the regression is reallocation of finite recovery and finite time onto a new outcome variable, not the molecular interference effect itself. Strength didn't disappear, it became maintenance.

Whether and how to rebuild it as the long-distance build moves into its later phases is a question the rest of the protocol owes an answer to. The dataset doesn't pretend to know.

<figure>
  <img src="/paper/figures/fig06_strength_regression.png" alt="Figure 3. Strength regression across the Act I → Act II hinge. Panel A: total weekly tonnage from 296 weeks of training, Aug 2019 → Apr 2026, with a 4-week rolling mean overlaid. Act I average (last twelve months pre-hinge) is 37,303 kg/week; Act II average is 19,900 kg/week, a 47 percent drop, in line with the 48 percent figure in the prose. The vertical at Dec 1, 2024 marks the cycling-era hinge. Panel B: estimated 1RM (Epley, top working set per session, 8-session rolling mean) for the big four. Each lift's Act I peak and most-recent Act II value are in the legend. Bench press ends at Dec 2025 — that was the last logged barbell bench session in the file. One ghost session of 1.72 million kg (a Hevy unit-confusion artifact on 2023-06-25) is filtered out of Panel A by a 50,000 kg/session sanity threshold." loading="lazy" />
  <figcaption><strong>Figure 3.</strong> Strength regression across the Act I → Act II hinge. Panel A: total weekly tonnage from 296 weeks of training, Aug 2019 → Apr 2026, with a 4-week rolling mean overlaid. Act I average (last twelve months pre-hinge) is 37,303 kg/week; Act II average is 19,900 kg/week, a 47 percent drop, in line with the 48 percent figure in the prose. The vertical at Dec 1, 2024 marks the cycling-era hinge. Panel B: estimated 1RM (Epley, top working set per session, 8-session rolling mean) for the big four. Each lift's Act I peak and most-recent Act II value are in the legend. Bench press ends at Dec 2025 — that was the last logged barbell bench session in the file. One ghost session of 1.72 million kg (a Hevy unit-confusion artifact on 2023-06-25) is filtered out of Panel A by a 50,000 kg/session sanity threshold.</figcaption>
</figure>

---

## 6. What predicts a good ride

> **Finding.** Across 124 outdoor rides, no individual recovery-state, environmental, or fueling-state predictor stably explains average ride speed. The earlier-draft headline of this section — morning RHR predicting long-ride speed at full-window detrended r = −0.35 — failed walk-forward replication (train half r = −0.51, test half r = +0.00; bootstrap CI [−0.53, +0.08] crosses zero) and is downgraded to a regime-bound Act-II onboarding-window phenomenon. Effort (avg HR) and route still dominate ride speed. Recovery-state metrics do not earn a forward-going coaching role on this stack.

The dataset is 124 outdoor cycling days between December 2024 and April 2026. Each day is cross-joined with the Garmin sleep summary, overnight HRV, and resting heart rate from the night before. The dependent variable is the day's average speed. The independent variables are everything the watch knows about how the body went into the ride.

The boring finding has to come first.

Across 124 trials, single-night sleep duration does not predict ride speed. Neither does sleep score, deep-sleep percentage, REM percentage, average overnight HRV, or HRV stress score. The pooled correlations across the full window are all small, and every detrended 95 percent confidence interval crosses zero. That includes every variable a recreational cyclist would name first if you asked them what makes a good ride. *I slept badly, so I'll have a bad ride* is not visible in the data over 124 trials. The boring corollary is that the strongest predictor of how fast a given ride was is how hard it was ridden — average heart rate explains more between-ride variance in speed than every recovery-state variable combined, and effort is mostly a choice, not physiology. There's a 2.8 kph spread between the lowest and highest HR third on the same dataset, and recovery-state variables are essentially flat across those buckets.

Inside that boring frame, one variable looked, for almost a year, like a real exception.

Across the full 124-ride window, morning RHR on the day of the ride correlated negatively with average ride speed at r = −0.28. Restricted to long rides only (fifty kilometers or more, n = 54), the same correlation tightened to r = −0.35 after detrending, with a 95 percent confidence interval of [−0.56, −0.09] that excluded zero. Lower morning RHR going into a long ride, faster long ride. The effect size was larger than anything else in §6 by a factor of two. The mechanism was plausible: morning RHR is a recognized marker of overnight recovery state and parasympathetic tone, and is the most sensitive single number on the watch for catching accumulated training stress. I had this finding written up as the §6 headline.

Then I ran check 3.

Check 3 is walk-forward replication. You take the first half of the data chronologically, fit the relationship there, and ask whether it holds in the second half — held out, never seen. Splitting the 54 long rides into a chronological 50/50 (December 2024 → August 2025 train, August 2025 → April 2026 test), the detrended correlation came back at −0.51 on the training half and +0.00 on the test half. Not weaker. Zero. A 28-day-block bootstrap on the long-ride sample produced a confidence interval of [−0.53, +0.08], a range that contains the train-half effect, contains no effect at all, and contains a small positive effect. Walk-forward replication failed.

<figure>
  <img src="/paper/figures/fig02_rhr_vs_speed_long_rides.png" alt="Figure 4. Walk-forward replication of the morning-RHR → average-speed signal on long rides (≥50 km). Left: training half (Dec 2024 – Aug 2025, n = 27), detrended r = −0.51 — the negative slope an earlier draft of this paper had carried as its §6 headline. Right: test half (Aug 2025 – Apr 2026, n = 27), detrended r = +0.00 — a flat cloud. Both raw and detrended points are shown; OLS fit overlaid; full Fisher CI in the inset stats panel. This is the paper's second worked retraction: the §1 RHR → fat-intake correlation failed Check 1 (shift-across-gaps); this one fails Check 3 (walk-forward replication)." loading="lazy" />
  <figcaption><strong>Figure 4.</strong> Walk-forward replication of the morning-RHR → average-speed signal on long rides (≥50 km). Left: training half (Dec 2024 – Aug 2025, n = 27), detrended r = −0.51 — the negative slope an earlier draft of this paper had carried as its §6 headline. Right: test half (Aug 2025 – Apr 2026, n = 27), detrended r = +0.00 — a flat cloud. Both raw and detrended points are shown; OLS fit overlaid; full Fisher CI in the inset stats panel. This is the paper's second worked retraction: the §1 RHR → fat-intake correlation failed Check 1 (shift-across-gaps); this one fails Check 3 (walk-forward replication).</figcaption>
</figure>

Per-quartile correlations sharpen the picture. The first quarter of the cycling era shows the strongest negative slope. Each subsequent quarter is weaker. By the fourth quarter the slope is indistinguishable from zero. The decay is monotonic in point estimate, not stochastic. The per-quartile confidence intervals each cross zero individually, but the trend line through the four quartile r-values is the signature of a regime-bound finding, not a stable predictor obscured by noise.

The mechanism I can name is a ceiling effect, but I have to be explicit that this is post-hoc. The signal died first; the explanation came after. In the onboarding period, RHR was both higher in absolute terms and more variable day-to-day, ride speed was lower and more variable, and the two moved together. Once trained-state RHR settled into the 44–48 bpm range, day-to-day RHR variation may no longer have encoded recovery information that affected pace. That's a story consistent with the data, not a tested mechanism. The dataset can't tell a true ceiling effect apart from any other Act-II-onboarding-only co-movement that happened to involve RHR. So the restated v1 headline reads: during the first eight months of the cycling era, morning RHR predicted long-ride pace at r ≈ −0.5; that relationship had decayed to zero by August 2025 onward, and the mechanism is not established. It's a real Act-II onboarding-window phenomenon and a worthwhile description of how a body becomes a cyclist. It isn't a forward-going coaching predictor. RHR is off the list of metrics I read before a ride.

Three other predictor families were brought into the analysis hoping to rescue the §6 narrative. None did. Wind speed had the right sign and the right physical mechanism, but a confidence interval that touched zero. Temperature looked positive on long rides but was confounded with route mix and time of season. Prior-day calories and macros were null on speed once the trend was removed. The only statistically clearer signal was that eating more the day before correlated negatively with average heart rate (r = −0.24, n = 120), consistent with better fueling state, but it didn't translate to a faster ride. Lift-day proximity (whether a strength session was yesterday, the day before, or the same morning) was a flat null on every metric tested.

So after 124 outdoor rides, no individual recovery-state, environmental, or fueling-state predictor stably explains average speed. One fueling-state correlate landed on average ride heart rate (r = −0.24, *n* = 120) but didn't propagate to pace, and that's the only non-null result in the section. Effort and route still dominate. That's the §6 verdict, and the rest of this paper had to be honest about it before any of the surviving findings in §7 could be trusted.

---

## 7. The signal ledger

After 124 outdoor rides, four years of body-composition data, and roughly 1,300 nights of sleep architecture, here is the inventory of cross-domain claims that survived the §1 guardrail and the §6 walk-forward. It is not a long list.

**Two things validated. Two regime-bound, one of which is the headline finding this section was originally written around. One falsified. One retracted (the RHR → fat-intake correlation already on the record from §1). One genuine negative result.** That is the ledger this paper is willing to defend, after one more on-the-record retraction in the section that follows.

### Two that survived

**Logged calorie intake systematically undercounts true intake by roughly 555 kcal per day.** Triangulate MacroFactor's expenditure estimate against Garmin's daily energy out and the scale-weight trajectory, and the Bayesian posterior mean lands at about 555 kcal per day, robust under prior sensitivity. The under-log concentrates on restaurant and work days, where logging is photo-and-voice rather than weighed. This is not a methodological aside. It is a finding. Every "calories vs. outcome" sentence in the paper has had to be corrected for it before the math will close.

**REM scarcity is a duration problem, not a production problem.** The running puzzle was nights with 0% REM: eight of twenty-four tracked nights at one point during the Ramadan window. The reframe came from looking at *when* in the night REM accumulates. 65.4% of the dataset's total REM occurs in the final third of the night. On nights that get truncated short, REM disappears first. The watch is not failing to detect it. The body is not getting to it. The intervention is sleep duration, not architecture-targeted tinkering.

### Two that did not generalize (regime-bound)

**Morning RHR → long-ride average speed.** Already covered in §6. The v1 headline of *r* = −0.35 across 54 long rides ≥50 km collapsed to a flat cloud on the test half (Aug 2025 – Apr 2026), with a 28-day-block bootstrap CI of [−0.53, +0.08] that crosses zero. Real inside the Dec 2024 – Aug 2025 onboarding window. Gone in the next.

**HRV on the night before predicts the day's calorie intake, inside 2026 only.** This is the second worked retraction in the paper, and it earns its own paragraph because the original framing was the strongest-looking validated finding in the screen.

The original result was clean. Inside a 114-day YTD-2026 window (Jan 1 – Apr 24, 2026), I ran eighteen one-day-lag tests with the Bonferroni correction applied. HRV(t−1) → calories(t) came back at *r* = +0.374, *n* = 107, *p* < 0.0028. The OLS slope was +24.6 kcal per millisecond of overnight HRV. The within-window partial *r* controlling for phase was near zero away from the marginal *r*, which I read at the time as evidence the signal was not a phase confound. It got wired into the daily briefing script.

On April 26, 2026, the day this paragraph is being written, I bulk-pulled daily Garmin overnight HRV back to its earliest reliable date (Mar 1, 2023) and joined it to the daily MacroFactor calorie record from the same window. The result is 1,113 consecutive-day HRV(t−1) → calories(t) pairs spanning Mar 2023 → Apr 2026. The YTD-2026 frame is a 9.7% slice of that table. On the full table, the slope is +7.1 kcal per millisecond of HRV with *r* = +0.14. Inside the cycling era 2025 alone (n = 349 days, Dec 2024 – Nov 19, 2025) the slope is +0.4 kcal/ms with *r* = +0.01, near zero. The +24.6 slope lives inside calendar 2026, full stop.

Look inside the Iron 70.3 prep phase itself, which began Nov 20, 2025 and ran through race day Feb 14, 2026. Same training block, same race build. The Nov 20 – Dec 31, 2025 portion (n = 42) shows slope −2.7 / *r* = −0.04. The Jan 1 – Feb 13, 2026 portion (n = 45) shows slope +26.7 / *r* = +0.31. The phase isn't what flips the sign. The calendar is. The other 2026 phases confirm the pattern: Ramadan cut (n = 29, slope +11.5, *r* = +0.21) and Eid Challenge (n = 18, slope +9.7, *r* = +0.18) are positive within 2026, with the elevation concentrated in stress phases. The full prep era pooled (Nov '25 – Feb '26) is +9.2 kcal/ms (n = 87, *r* = +0.13); the late-2025 portion drags the average down. It is not a property of this body's autonomic chemistry. It is a property of being in calendar 2026, on this body, in this year. Useful conditional fact, entirely different claim from the one this section was originally going to make.

The within-window partial-*r* check that earlier read as "robust to confound" turns out to have been a coarser failure than it looked. The binding regime is the screening window itself, and a partial-*r* control that never sees data outside that window cannot detect that. Phase-stratified replication is a necessary check; it is not sufficient when the screening window is itself a regime. The §1 guardrail was specified to catch this exact failure mode. Check 3, walk-forward over leave-one-out, with the held-out frame being a different period rather than a different fold inside the same period. This finding cleared every check on the YTD-2026 frame and failed Check 3 on the held-out historical record. Same failure mode as §6. Second instance of the same lesson: every signal that survives a within-window screen earns a held-out historical replication before it becomes a claim, not after.

<figure>
  <img src="/paper/figures/fig05_hrv_vs_next_day_calories.png" alt="Figure 5. HRV(t−1) → calories(t), Mar 2023 → Apr 2026, n = 1,113 consecutive-day pairs. Panel A: pooled scatter, era-coloured. Black OLS line is the pooled slope of +7.1 kcal per millisecond of HRV with r = +0.14, near zero. The red dashed line is the calendar-2026 OLS overlay shown for comparison. Panel B: calendar 2026 inset (Jan 1 – Apr 24, 2026), the cluster on which the §7 +24.6 kcal/ms / n = 107 claim was first made; the panel header reports the same cluster as currently constituted (n = 108, slope +27.0 kcal/ms, r = +0.41), one extra day added since the original Apr 24 freeze, the operative numbers in §7 are the originals. Panel C: per-era OLS slope bars after the Apr 26, 2026 prep-phase boundary correction (Iron 70.3 prep widened from Jan 1 → Nov 20, 2025 start). Pre-cycling (n = 614, Mar '23 – Nov '24) +5.3, Cycling era 2025 (n = 349, Dec '24 – Nov 19, '25) +0.4, Iron 70.3 prep pooled (n = 87, Nov '25 – Feb '26) +9.2, Ramadan (n = 29) +11.5, Eid Challenge (n = 18) +9.7. The Iron 70.3 prep slope splits cleanly by calendar year: Nov 20 – Dec 31, 2025 portion (n = 42) is −2.7, the Jan 1 – Feb 13, 2026 portion (n = 45) is +26.7, same training phase, opposite signs across the year boundary. The &quot;personal physiology constant&quot; framing collapses on contact with the historical record; the slope lives in calendar 2026's stress phases, not in this body's autonomic chemistry generally." loading="lazy" />
  <figcaption><strong>Figure 5.</strong> HRV(t−1) → calories(t), Mar 2023 → Apr 2026, <em>n</em> = 1,113 consecutive-day pairs. Panel A: pooled scatter, era-coloured. Black OLS line is the pooled slope of +7.1 kcal per millisecond of HRV with <em>r</em> = +0.14, near zero. The red dashed line is the calendar-2026 OLS overlay shown for comparison. Panel B: calendar 2026 inset (Jan 1 – Apr 24, 2026), the cluster on which the §7 +24.6 kcal/ms / <em>n</em> = 107 claim was first made; the panel header reports the same cluster as currently constituted (<em>n</em> = 108, slope +27.0 kcal/ms, <em>r</em> = +0.41), one extra day added since the original Apr 24 freeze, the operative numbers in §7 are the originals. Panel C: per-era OLS slope bars after the Apr 26, 2026 prep-phase boundary correction (Iron 70.3 prep widened from Jan 1 → Nov 20, 2025 start). Pre-cycling (n = 614, Mar '23 – Nov '24) +5.3, Cycling era 2025 (n = 349, Dec '24 – Nov 19, '25) +0.4, Iron 70.3 prep pooled (n = 87, Nov '25 – Feb '26) +9.2, Ramadan (n = 29) +11.5, Eid Challenge (n = 18) +9.7. The Iron 70.3 prep slope splits cleanly by calendar year: Nov 20 – Dec 31, 2025 portion (n = 42) is −2.7, the Jan 1 – Feb 13, 2026 portion (n = 45) is +26.7, same training phase, opposite signs across the year boundary. The "personal physiology constant" framing collapses on contact with the historical record; the slope lives in calendar 2026's stress phases, not in this body's autonomic chemistry generally.</figcaption>
</figure>

A note on the operational consequence. The morning briefing script (`scripts/briefing.py`) carries the +24.6 kcal/ms slope as a daily fueling forecast. Inside the active Eid Challenge phase that forecast is still calibrated; outside high-stress phases it is over-reactive. The forecast stays in place through the end of the active phase and is regenerated against a phase-current frame whenever the protocol exits a stress phase. It is not carried forward as a personal constant.

### One that did not survive

**The protein-collapse predictor.** A 57-day window of Ramadan-cut data showed a clean relationship between lift-day proximity and a same-day collapse in protein intake (AUC 0.929, *n* = 57). It looked operative. Re-fit on the year-to-date frame at *n* = 380, the AUC dropped to 0.677, barely better than chance. The pattern was a Ramadan-phase artifact: fasting hours and lift-day timing co-moved during Ramadan and were independent outside it. It failed Check 2 of the §1 guardrail.

The retracted RHR → fat-intake correlation from §1 is the second item on this side of the ledger. Together they bring the falsified-or-retracted count to two.

### One genuine negative result

**Day-ahead prediction of recovery state from prior-day metrics fails on this stack.** Across every tested model (gradient-boosted trees, regularized regression, simple lag features), predicting tomorrow's HRV, sleep score, RHR, or training readiness from yesterday's values plus context produced an out-of-sample R² below zero on the YTD frame at *n* = 55. Worse than predicting the dataset mean. This is a real finding, not a software failure. At one season's worth of daily-aggregate resolution, day-to-day variance dominates day-to-day signal. Hourly resolution, multi-year *n*, or external feature integration (work calendar, weather, alcohol, meal timing) would change the answer. The current data layer doesn't.

### What the phases added

Two phase-response patterns survive at the descriptive level without graduating to predictive findings.

In the **Ramadan cut** (Feb 18 – Mar 19, 2026), the HRV-BALANCED-day rate dropped from 93% pre-Ramadan to 6% during. Across the entire 30-day window HRV did not register "balanced" on a single morning. The body-composition outcome was on protocol for the phase-defined window (−3.1 kg, −1.8 percentage points body fat from Feb 18 to Mar 19) but the autonomic cost was the largest in the dataset. RHR, by contrast, was flat across all five protocol phases, between 46.8 and 49.7 bpm, which is its own finding: RHR is not a phase-sensitive metric in this body, despite being the §6 false alarm.

In the **Home Reset** (Mar 20 – Apr 2, 2026), HRV recovered to baseline within fourteen days, *while sleep volume continued to worsen week by week*. This is the cleanest counter-example in the dataset to the assumption that sleep drives recovery. Whatever the body needed after Ramadan to reset its autonomic state, it was not a function of nightly hours in bed.

<figure>
  <img src="/paper/figures/fig07_phase_response.png" alt="Figure 6. Phase response across the V2 protocol ladder. Panel A: HRV-BALANCED-day rate by phase. Pre-Ramadan training was 93% BALANCED days; the Ramadan cut collapsed to 6%; post-race recovery, Home Reset, and the active Eid Challenge are all back at 100%. Panel B: mean morning RHR by phase. Every bar sits between 46.8 and 49.7 bpm, the empirical floor of &quot;RHR is not a phase-sensitive metric in this body.&quot; Panel C: the Home Reset window (Mar 20 – Apr 2, 2026) with daily overnight HRV (blue, left axis) climbing while daily sleep duration (red, right axis) trends down, the cleanest counter-example in the dataset to the assumption that sleep volume drives autonomic recovery." loading="lazy" />
  <figcaption><strong>Figure 6.</strong> Phase response across the V2 protocol ladder. Panel A: HRV-BALANCED-day rate by phase. Pre-Ramadan training was 93% BALANCED days; the Ramadan cut collapsed to 6%; post-race recovery, Home Reset, and the active Eid Challenge are all back at 100%. Panel B: mean morning RHR by phase. Every bar sits between 46.8 and 49.7 bpm, the empirical floor of "RHR is not a phase-sensitive metric in this body." Panel C: the Home Reset window (Mar 20 – Apr 2, 2026) with daily overnight HRV (blue, left axis) climbing while daily sleep duration (red, right axis) trends down, the cleanest counter-example in the dataset to the assumption that sleep volume drives autonomic recovery.</figcaption>
</figure>

That is the ledger. Three findings I'll defend, two I'm on the record as having gotten wrong, one I'm on the record as having tried to make work and failed. What four years of self-tracking buys you, given that ledger, is the question §8 takes up.

---

## 8. What four years of self-tracking buys you

Given a ledger that small, the honest question is whether four years of daily measurement was worth doing at all. The answer is yes, but not for the reasons most people expect.

Self-tracking sells itself on prediction. The pitch: aggregate enough data about your body and the model that emerges will tell you what to do tomorrow morning. The negative result in §7 is a clean falsification of that pitch on this stack. Day-ahead prediction of any of the watch's recovery metrics, fitted on YTD data with every reasonable model architecture, is worse than predicting the mean. The data layer is not dense enough, at daily resolution and one season's *n*, to support it.

What four years of self-tracking actually buys is three things.

The first is calibrated baselines. Knowing my HRV operates in a 56–80 ms band, that my morning RHR sits in a 44–48 bpm corridor, that my expenditure floor in a non-cycling state is 1,860 kcal and in a trained state is 2,040 kcal: none of these are predictions. They are the reference frame within which any single morning's reading becomes interpretable. A 56 ms HRV reading is a different signal in a body whose mean is 70 than in a body whose mean is 50. The watch's generic "balanced / unbalanced / low" badge is a population-grade version of this baseline. The personal version, built from years of your own data, is more discriminating. It does not predict tomorrow. It tells you whether tomorrow is normal.

The second is retroactive accountability. The §6 walk-forward analysis was only possible because there were 124 outdoor rides on file with the recovery state of each preceding night attached. The §7 protein-collapse falsification was only possible because the 57-day Ramadan window could be embedded in a 380-day YTD frame. The intake under-log was only triangulable because four years of food logs could be cross-checked against Garmin's expenditure trace and the actual scale-weight curve. Every check in the §1 guardrail relies on having more data than the question being asked needs. The benefit accrues backward in time, not forward.

The third one is the most useful, and the one I expected least when I started.

Across the analyses in this paper, the things I was most certain would predict performance (single-night sleep, single-night HRV, prior-day macros, lift-day proximity) turned out to be flat nulls. The things I was least certain about (the intake under-log and the duration-bound REM finding) turned out to be operationally real. The HRV-to-next-day-calories signal looked like the third such case for several months; the held-out historical record showed it was a 2026-stress-phase phenomenon and not a personal physiology constant, which is itself a useful conditional fact and a different claim from the one I expected to make. The dataset's main job has been to disagree with me, often. Without four years of receipts, neither the §1 retraction of the RHR → fat-intake correlation nor the §7 retraction of the HRV → next-day-calories slope happens. I publish them, somebody quotes them, and a wrong fact about an N=1 body becomes one of the things I believe.

The caveat that goes with this is that the questions I never asked have not been audited any more than they would be in a document without a guardrail. The discipline catches what enters it. Silent positives stay silent. Granted, the audit-on-entry is still the most valuable thing the data does.

The cost of self-tracking at this depth is not the time spent logging. It is the discipline cost. Every claim has to clear the §1 guardrail before it can be read as anything more than a guess. Most candidate findings do not clear it. The good ones earn their place by being what survives, not by being what was looked for.

Four years of daily measurement does not produce an oracle. What it produces is a baseline, an accountability record, and a falsifier of the things I was most sure of. None of those are the pitch. The pitch is dead.

---

## 9. Where this could be wrong

Nine real limitations sit on top of every claim in this paper.

The most obvious is that *n* = 1. Population-grade claims are not in scope and were never the goal. What is in scope is whether the within-subject signals reported here would replicate inside a different individual's longitudinal record, and the answer is *probably some of them, probably not others, and this dataset cannot tell you which.* A second self-tracking subject would clarify it. There is no second self-tracking subject.

Logged calorie intake under-counts true intake by roughly 555 kcal per day. §7 reframes this as a finding rather than a flaw, because the magnitude was triangulable. It is also a constraint on every "calories vs. outcome" calculation in the paper. Outcomes that depend on knowing absolute intake are degraded by a quantity at least equal to the size of the effects most studies in this space report.

Bioimpedance error. The scale's body-fat reading drifts ±2–3 percentage points from a DEXA scan on the same day. Every body-fat number in this paper is therefore a *change*, not a level, and the smaller the change, the less reliable the trend. The smart scale was retired in March 2026; after that the body-fat trace effectively stops.

Selection bias on what gets logged is real and unevenly distributed. Food logging fails on no-effort days. The protein-collapse predictor of §7 was a real signal precisely *because* logging fails differently in Ramadan than out of it. The same is true at smaller scales for sleep tracking on overnight travel, ride logging when the watch dies mid-ride, and strength logging during app migration.

Then there is motivated reasoning, documented but not eliminated. On April 16, 2026 I came to the data wanting my strength regression to be a recovery problem, the kind that resolves with better structural training and sleep. The numbers said the drop was bigger than the concurrent-training literature predicts for cycling-mode endurance, and my weight hadn't moved all week, so the cut wasn't carrying it either. Recovery alone wasn't the explanation. The §1 guardrail required the check. I ran it with dread. Other incidents are presumably in the dataset and weren't caught because the guardrail didn't fire on them. The discipline reduces this bias. It doesn't zero it.

None of the findings in this document were pre-registered, and the framing in §8 implies more discipline than I had. Hypotheses were generated, tested, and filtered through the §1 guardrail in the same passes. This is hypothesis-after-results-known with post-hoc filters bolted on, not pre-registered confirmatory work. The HRV → next-day-calories result that §7 originally carried as the strongest validated finding came out of an eighteen-test scan on which Bonferroni was applied; Bonferroni controls family-wise error within a chosen test family, but the choice of which eighteen tests to run was itself made after looking at the data, and the choice of YTD-2026 as the screening window was itself the regime that turned out to be doing the work. The §1 guardrail catches alignment artifacts (Check 1), regime-bound signals (Check 3), and unbacked claims (Checks 4 and 5); it does not catch the deeper move of choosing which questions to ask, or which window to ask them on, after seeing the data. The cleanest description of what kind of paper this is: *exploratory analysis with disciplined post-hoc filters*, not confirmatory science. The findings are real to the degree that those filters are tight; they are not real to the degree that pre-registration would have made them.

The instrument chain has drifted. The Garmin watch was replaced in January 2023; the older model recorded no overnight HRV at all, which is why the §1 figure's HRV trace begins in March 2023. Garmin's sleep-stage detection algorithm has been updated by firmware at least twice in the measurement window. MacroFactor's expenditure-EMA algorithm has been silently revised. The bioimpedance scale's body-fat curve was reweighted by a firmware push in 2024. Every cross-era comparison in this paper rides on top of these shifts and cannot fully separate "the body changed" from "the instrument re-scored the same body."

Software bugs in the analysis pipeline have already corrupted findings once on the record, and almost certainly more times silently. The shift-across-gaps bug behind the §1 retraction was caught only because I had a guardrail that fired on it. The typed-splits bug (documented in the working document's Appendix C) silently triple-counted ClimbPro overlap layers and inflated FTP estimates on three rides for an undetermined window before manual audit found it. Both bugs lived in code I had read and trusted. There is no reason to think they were the only two.

Finally, the protocol record has survivor bias built into it. The phases that appear in the phase manifest and produced the §7 ledger are the ones that were committed to and tracked through. Pre-2022 weight-loss attempts, structured run training that lapsed inside a month, multiple high-protein routines that fell apart inside a week, and at least one earlier cycling onboarding attempt that did not stick: none of these were logged. The four-year record is what survived being logged, and what survived being logged is biased toward what survived being done. A complete view of "what works for this body" would require the failed protocols too, and they're gone.

Read every claim above against whichever limitation here applies hardest.

---

## 10. Where the receipts live

This document is the readable layer. The verifiable layer is a longer working document, the data-doc, kept alongside the project's pipeline code and per-section reproduction scripts. The intent is that any number on this page can be traced back to the script that produced it. The working document carries everything this one deliberately doesn't. Appendix A is the full data dictionary for the eight CSV inputs. Appendix B is the phase-by-phase and year-by-year summary tables. Appendix C is the typed-splits-bug post-mortem with the three layers of overlap diagrammed. Appendix D is the worked example of the §1 guardrail catching the RHR → fat-intake retraction. Appendix E is the bibliography of the cited literature (concurrent training, HRV in endurance, BIA accuracy, sleep architecture, irregular time-series correlation, motivated reasoning, Ramadan in trained athletes), mapped to the sections that cite each entry. Appendix F is the three-layer code architecture with the test surface and the data-flow diagram.

If a claim on this page looks load-bearing and you want to check it, my DMs are open. The source script will travel with the answer. Every number that survived to this document has cleared that bar.
