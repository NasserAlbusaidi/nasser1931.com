---
layout: ../../layouts/Paper.astro
title: "Becoming a Cyclist on Camera"
subtitle: "Field report from a four-year self-experiment, written for a reader."
byline: "Nasser Al Busaidi — Muscat, Oman — drafted April 2026"
description: "Four years of daily body composition, sleep, HRV, and cycling performance data, audited against a six-check guardrail. Three findings survived. Two were retracted on the page."
eyebrow: "field report"
companion:
  href: "/paper/v1"
  label: "see the receipts → /paper/v1"
---

> This is the readable layer of a longer working document. The full receipts — data dictionary, reproduction scripts, bug post-mortems, bibliography — live in a source-of-truth working file (`study-v1.md`) kept against the project's analysis code; available on request. This one is meant to be read in a sitting.

---

## Research summary

**Question.** What does four years of daily-resolution self-tracking actually let one person know about their own body?

**Subject and data.** N = 1 — me. 28-year-old male, 172 cm, Muscat, Sep 6 2022 → Apr 26 2026. Roughly 1,316 days of body composition from a Garmin watch, a bioimpedance scale, and MacroFactor food logs; 165 outdoor cycling activities since December 2024; 1,204 strength sessions across six and a half years.

**Method.** Daily measurement; six pre-specified guardrail checks applied before any candidate signal is called a finding — survival under data-gap removal, replication within phase, walk-forward replication, biological plausibility, effect-size reporting, and a full distributional plot. The epistemic position is exploratory analysis with disciplined post-hoc filters, not pre-registered confirmatory science.

**Headline structural finding.** In small-N longitudinal data, lagged predictors that look robust in the pooled view routinely decay under walk-forward replication. The §6 *morning RHR predicts long-ride speed* result (full-window detrended r = −0.35 on rides ≥50 km) is the worked case: train half r = −0.51, test half r = +0.00. This category — *regime-bound*, real inside one window and gone in the next — is, in this dataset, more common than either validated or falsified.

**Findings ledger.**

- **Validated (3).** HRV(t−1) → next-day calorie intake at +24.6 kcal per millisecond of HRV (p < 0.0028, n = 107; under active weekly walk-forward monitor as of Apr 26, 2026). Logged-intake systematic under-count of ~555 kcal/day (Bayesian triangulation against scale-weight, MacroFactor, and Garmin expenditure; robust under prior sensitivity). REM scarcity is duration-bound rather than a production failure — 65.4% of REM concentrates in the last third of the night, so short nights truncate REM disproportionately.
- **Regime-bound (1).** Morning RHR → long-ride avg speed: real Dec 2024 – Aug 2025, decayed to zero thereafter; CI [−0.53, +0.08] crosses zero on bootstrap.
- **Falsified (1).** A "protein-collapse predictor" that looked clean on a 57-day Ramadan window (AUC 0.929) collapsed to AUC 0.677 on the YTD frame — a phase artifact, not a general signal.
- **Retracted (1).** RHR(t−1) → next-day fat intake: a +0.51 correlation that flipped to −0.08 once consecutive-day pairs were enforced. Shift-across-gaps alignment bug, not a real signal.
- **Negative result (1).** Day-ahead prediction of recovery state from prior-day metrics fails on this data layer; every tested model produced out-of-sample R² < 0 at n = 55.

**What four years of self-tracking actually buys.** Calibrated personal baselines, retroactive accountability for guardrail audits, and the falsification of plausible-sounding hypotheses. *Not* day-ahead prediction. The discipline cost — running every candidate finding through six pre-specified checks before publishing it — is higher than the time cost of the logging itself.

The remainder of this document is the narrative of how that ledger emerged. §1 walks through the retraction that triggered the guardrail. §§2–3 set up the subject and the instrument chain. §§4–6 walk the body-composition, cycling, and ride-prediction analyses. §7 catalogues the findings. §8 names what self-tracking does and does not buy. §9 is the limitations stack.

---

## 1. The correlation that wasn't

On April 23, 2026, I thought I'd found a real signal.

The setup looked clean. I had thirty-five days of food logs from MacroFactor and thirty-five days of resting heart rate from a Garmin watch — the Ramadan-cut window, where every variable that mattered was moving the most. The hypothesis was about as boring as a hypothesis can be: yesterday's recovery should affect today's eating. A high overnight heart rate — sympathetic tone, poor sleep, accumulated stress — should bleed into the next morning's appetite. I wanted to see if the relationship was strong enough to use.

So I aligned the two columns — yesterday's RHR against today's fat intake — and got a correlation of r = +0.51. *p* comfortably below threshold. *n* = 35. Effect size large enough to be operative; sample size adequate by the conventions of self-tracking. By the standards I'd been using on the rest of this self-experiment, that was a finding.

I wrote it up. I drafted a paragraph for the paper. I started thinking about the mechanism. I let myself be pleased.

Then I ran one more check.

The check was banal. I rebuilt the alignment and only paired days where I had both yesterday's RHR *and* today's intake on consecutive calendar days — no gaps, no interpolation, no nearest-neighbor fill. The dataset shrunk slightly. I re-ran the correlation.

It came back at r = −0.079.

Not weaker. Not less significant. Flipped. Wrong sign, near-zero magnitude. The original +0.51 had been an artifact of how the alignment handled missing days: when RHR was missing on day *t*, the lookup had quietly grabbed the nearest available value — which on a phase boundary, or a travel gap, could be a week later, on the other side of a behavioral change. The shift across the gap was carrying the signal, not the physiology.

I deleted the paragraph.

There is a literature on this exact failure mode. Rehfeld and colleagues described it in 2011 for paleoclimate proxies; Schulz and Stattegger had documented it as far back as 1997. I hadn't read either before I made the mistake. I read them after.

That moment is where this paper actually starts.

<figure>
  <img src="/paper/figures/fig08_alignment_mechanism.png" alt="Figure 1. The alignment failure, dissected on the YTD frame. Left: scatter of all 110 nearest-fill pairs, RHR on day t−1 against logged fat on day t. Pairs where the algorithm reached across a gap of two or more days to source RHR are shown as red triangles (n = 19, sized by gap magnitude); pairs where t−1 was a literal calendar day are blue dots. Both OLS lines lie near zero on this snapshot — but on the Apr 23 snapshot, before later backfills closed the gaps, the same algorithm on a 35-day Ramadan-window subset produced r = +0.508. Right: distribution of the offset days the nearest-fill lookup actually used. Seventeen percent of pairs span ≥2 days; the long tail reaches ±7 days. The bug was in the join logic, not the data; on any future short-window pull with similar gap structure, it would re-emerge." loading="lazy" />
  <figcaption><strong>Figure 1.</strong> The alignment failure, dissected on the YTD frame. Left: scatter of all 110 nearest-fill pairs, RHR on day t−1 against logged fat on day t. Pairs where the algorithm reached across a gap of two or more days to source RHR are shown as red triangles (n = 19, sized by gap magnitude); pairs where t−1 was a literal calendar day are blue dots. Both OLS lines lie near zero on this snapshot — but on the Apr 23 snapshot, before later backfills closed the gaps, the same algorithm on a 35-day Ramadan-window subset produced r = +0.508. Right: distribution of the offset days the nearest-fill lookup actually used. Seventeen percent of pairs span ≥2 days; the long tail reaches ±7 days. The bug was in the join logic, not the data; on any future short-window pull with similar gap structure, it would re-emerge.</figcaption>
</figure>

---

Everything that follows has been forced through six checks, written down before I let any signal call itself a finding. I'll list them once now, because every claim in the rest of this document has had to clear them, and a reader is owed the bar.

A claimed lagged correlation in this paper has to:

1. Survive when data gaps are imputed or excluded — not a shift-across-gaps artifact.
2. Survive when computed inside a single phase, not only pooled across phases.
3. Replicate in a held-out window — walk-forward, not just leave-one-out.
4. Have a plausible biological mechanism, named on the page.
5. Report effect size, not just *p*-value.
6. Include the full distributional plot, not the scalar alone.

These are the price of admission. The RHR → fat-intake correlation failed check 1. A "protein-collapse predictor" I'd been excited about earlier in the season — clean at *n* = 57, AUC 0.929 — failed check 2; it was a Ramadan-phase artifact and went to AUC 0.677 on the year-to-date frame. The single most-attached-to finding in this paper, the §6 headline I had written and re-written, will fail check 3 in the next ten pages.

Three signals are going to survive. Most won't.

That's the kind of document this is. It is not a list of what worked. It is a list of what survived being checked properly. The difference is the entire point, and the rest of the document is an attempt to take it seriously.

---

## 2. What I was actually doing

The honest version of this field report is that I have been measuring myself, in some form, for four years. The pretentious version is that I am the only subject in a longitudinal natural experiment where the interventions are my own life choices. Both are true, and the distance between them is the distance between a useful document and an embarrassing one.

I am calling this a field report on purpose, not a paper. A paper implies peer review, generalizability across subjects, and a confirmatory frame around pre-registered hypotheses; this work has none of those things and is stronger when it is not asked to. What follows is one body's measurement record, audited under §1's rules, written down so a reader can decide what survived being checked. The §9 limitations name the price of the genre directly.

The case for taking N=1 seriously is straightforward and limited. With only one subject you cannot make claims about populations. You cannot say "athletes who do X gain Y kilos of muscle." What you *can* do, if the measurement chain is clean enough and the time horizon long enough, is detect signals that exist within a single individual at a resolution no cross-sectional study will ever match. A population study with 100 subjects and four observations each has 400 rows. This dataset has roughly 1,316 days of daily-resolution body composition, 165 cycling activities, 1,204 strength sessions, and night-by-night sleep architecture across almost four years. The trade is total: generalizability for resolution. I am betting that within a single body, a high-resolution longitudinal record can answer questions the population literature cannot, and I am willing for the answer in some cases to be "no, it cannot."

The subject is me. I'm 28, male, 172 cm, and I live in Muscat, Oman. I started weighing myself daily on September 6, 2022, when the bioimpedance scale and the food-logging app got linked in the same week. I have not anonymized this paper, for the same reason I have not pretended to a larger *n*: the warts-and-all framing only works if you put your name on it.

The dataset has a clear hinge.

Until late 2024 I was a strength athlete. Four-plus lifting sessions a week, training cycle by training cycle, with peak compound lifts of a 115 kg back squat and a 150 kg deadlift. The body in those years was the densest strength block of my life — 4.29 sessions per week on the rolling average — and it shows in the body-composition trace as a stable upper-70s kilogram weight built around lean mass. There was cardio, but it was instrumental: enough to keep the lifts moving, never enough to be the point.

On December 1, 2024 I did my first FTP test on a bike. It was a 135-watt ramp, terminated early, descriptive only. It was also the moment the dataset's center of gravity moved. From that day forward the operative question stopped being *how strong can I get* and started being *can I become a cyclist.* Within eighteen months I had ridden three triathlons — Al Bustan Sprint in November 2025, Athiba Olympic in January 2026, Muscat 70.3 in February — built up to 80–100 km weekend rides, and watched my back squat regress from 115 kg to 100 kg, sessions per week drop by twenty percent, and total weekly tonnage drop almost in half.

I call those two periods Act I and Act II, and the boundary between them is the cleanest natural experiment in the file. Same person, same scale, same watch, mostly the same diet patterns — but a complete reallocation of finite recovery from one modality to another. Almost every comparison in this paper that has teeth is a comparison across that boundary.

What this paper is trying to do, then, is not predict a race. It is to take the measurement record honestly and ask: across four years of one body's data, what does the daily-tracking layer actually let you know that you wouldn't already know from the gym mirror and the bathroom scale?

What it is *not* trying to do is more important. It does not aim at a race-day prediction. The original draft had Ironman Oman on December 5, 2026 as its closing data point — the test of whether a self-tracking model could project a finishing time. I removed that endpoint in April 2026, partly because it was overfitting the analysis to a single date eight months out, and partly because the more I looked at the dataset the clearer it became that the interesting thing here is the trajectory, not the terminal value. If the race goes well in December, that's a chapter; if it goes badly, that's a chapter. Neither outcome would change what's already on the page.

The paper has a subject, a measurement record, a hinge, and a question. What it does not have is a punchline waiting in the future to redeem it. Everything claimed in the rest of this document has had to clear the six checks from §1 against the data already in hand.

---

## 3. The receipts

Four instruments produced the data this paper rests on.

A Garmin watch — an older model from October 2022 through January 2023, replaced with a newer one from January 2023 onward — has been on my wrist for the full window. It records every activity (duration, distance, heart rate, cadence, GPS, splits) along with sleep architecture, overnight HRV, resting heart rate, body battery, daily training status, FTP estimate, and a race predictor generated from VO2max. The watch is the source of every number in this paper that has the word "Garmin" attached. One caveat worth flagging now: the older watch had no `strength_training` activity type, so gym sessions in late 2022 and early 2023 were logged as generic indoor cardio. The newer watch supported the type from day one, but I didn't actually start using it for lifts until December 2024 — Hevy on my phone was always the system of record for the lift itself, and the watch was there for HR and duration. Pre-December-2024 indoor-cardio volume in the Garmin record is therefore mostly mislabeled lifting, regardless of which watch was on the wrist that month. It should not be read as endurance work.

A MacroFactor food-logging account, also active since September 2022, holds 1,318 daily summaries: calories, protein, fat, carbs, expenditure, weight, and a body-fat estimate. Logging fidelity is mixed. At home I weigh food on a kitchen scale; in restaurants and at work I use the app's photo-and-voice estimation. The phrase *logged intake* in this paper means the latter category dilutes the former, and a triangulation in §7 puts the dilution at roughly 555 kcal per day on the rolling average.

A bioimpedance scale (single-frequency, consumer-grade) weighs me most mornings under the same conditions: empty stomach, post-bathroom, before water. I trust the weight number to within 0.1 kg and the body-fat number to within ±2–3 percentage points on absolute readings, ±1 pp on the within-week trend. Every claim in this paper about body fat is a *change* in body fat — never an absolute leanness number, because the device cannot support one.

A Hevy app log running from August 2019 through January 2026 stores 26,023 sets across 1,184 strength sessions — every exercise, every weight, every rep. In February 2026 I migrated lift logging to MacroFactor's workout module, which contributed 878 sets across 20 more sessions. Both halves are merged into a single 1,204-session timeline used by §5.

Three faults in the chain matter enough to name now.

First, the bioimpedance scale drifts on firmware updates and reads body fat 3–4 percentage points away from a DEXA scan taken the same day. Hence: relative comparisons only.

Second, the logged-calorie number is systematically low. The under-log shows up cleanly when you triangulate logged intake against MacroFactor's own expenditure estimate, against Garmin's daily energy out, and against the actual scale-weight trajectory. The Bayesian posterior mean is roughly 555 kcal/day; it is itself one of the validated findings in §7, but it has to be on the table before any *calories vs. outcome* sentence in the rest of the paper makes sense.

Third, between January and April 2026 a parsing bug in Garmin's typed-split data inflated the recorded distance on three rides and corrupted the FTP estimates derived from them. The bug was traced, the data recomputed, and the FTP-progression numbers in §5 use the corrected values. Anyone running an audit should start at the typed-splits post-mortem in the working document (Appendix C).

That is the chain. The rest of the paper assumes it.

---

## 4. Body composition, four years

> **Finding.** Across four years, trend weight cycled inside a 6.7 kg corridor and never broke it — there is no downward trajectory toward any race weight in the record. The single robust physiological change is not a body-composition number but a metabolic one: expenditure floor lifted by ~175 kcal/day in the cycling era (Act I weekly low 1,864 kcal/day → Act II weekly low 2,039 kcal/day). Body-fat readings are reported as within-subject change only; the bioimpedance scale's ±2–3 pp absolute error band makes leanness levels uninterpretable.

The body-composition record opens on September 6, 2022, on a kitchen scale and a freshly installed food-logging app. By April 2026 it had accumulated 1,316 daily measurements, of which 1,232 carry a scale weight and 970 carry a body-fat reading from the bioimpedance device. Three and a half years and one career-of-the-body switch later, the headline number is "+4.47 kg net" — from 73.60 kg trend in the first week to 78.07 kg in the most recent. That number is also the least interesting one in this section. The path is what matters.

The path has eight swings.

A swing here means a continuous direction in trend weight crossing two kilograms before reversing. Across the four years there were two cuts and two gains in the pre-cycling era and two of each in the cycling era. The four cuts together took 10.4 kg off; the four gains together added 15.7 kg back. Net of all eight: +5.3 kg, in line with the long-run trend. The small gap from the +4.47 kg endpoint figure above is expected — swing reversals do not fall exactly on the file's first and last weeks, so the sum of swing magnitudes and the endpoint-to-endpoint trend can disagree by a kilogram or so. In plain language, the body has been *cycling* through a corridor under seven kilograms wide — roughly 71.6 kg at its low (the week of April 17, 2023) to 78.3 kg at its high (the week of February 2, 2026, twelve days before Muscat 70.3) — for almost the entire measurement window. It has not been on a downward trajectory toward any kind of race weight. Of all the things the trajectory does not show, that is the most important.

The ladder of phases reads like cuts and rebuilds in alternation. The clearest cut in the file ran from January through April 2023 and bottomed at the dataset's all-time low. The clearest gain ran from May 2023 through January 2024 and erased it. A faster cut in spring 2024 — about four kilograms in twelve weeks, –0.34 kg/week — was the largest in the record by both magnitude and rate, faster than anything since. The Ramadan cut in February-March 2026 dropped roughly three kilograms in a month, ordinary in pace but extraordinary in everything around it: HRV never reached "balanced" status across the entire 30-day window, and sleep volume worsened week by week. That pattern is the subject of §7. For now the point is small: Ramadan was not the most aggressive cut in the file, but it was the most physiologically expensive one.

The single clearest physiological change in the four-year record is not a body-composition number at all. It is the metabolic baseline.

Before December 2024 — the 117 weeks of Act I — MacroFactor's expenditure estimate averaged 2,236 kcal per day. After December 2024 — the 72 weeks of Act II so far — the average is 2,433. That is +197 kcal per day on the mean, but the more telling number is the floor. The lowest expenditure week in Act I was 1,864 kcal per day, in January 2024: a body that had effectively stopped moving outside of the gym. The lowest expenditure week in Act II is 2,039 kcal per day. The floor lifted by roughly 175 kcal per day. From the worst Act I week to the best Act II week (2,725 kcal per day, in February 2026, a week before Muscat 70.3), the swing is about 860 kcal per day, in twenty-five months. The expenditure floor is what the cycling era bought, and that headroom is the asset the rest of the protocol gets to spend.

The body-fat trace deserves a single paragraph of caveats and can then be largely ignored.

The recorded range is 14.5 percent to 20.83 percent. The 14.5 percent reading, from February 2023, came from a bioimpedance scale during an extended cut and is almost certainly low — these devices systematically under-read body fat in lean, well-hydrated subjects. The 20.83 percent reading from January 2026, at the dataset's highest scale weight, is more plausibly close to truth, but the device's error band is still ±2–3 percentage points. The bioimpedance sensor stopped recording in early March 2026 when the smart scale was retired. Every body-fat claim in this paper, in this section and the ones that follow, is *relative* — a within-subject change, never an absolute leanness number.

The trajectory does not show a smooth descent toward any race weight. It does not show cycling driving weight loss on its own — the first cycling year ended +0.80 kg from where it began, the gains and losses inside it canceling. It does not show Ramadan as an unusually fast cut. What it *does* show, robustly, is that the metabolic baseline lifted by roughly 200 kcal per day, that body-fat coupling tightened in the cycling era so almost every kilogram regained brought a percentage point of body fat with it, and that the body's natural operating range is a corridor under seven kilograms wide that has not been broken in four years.

That corridor is the most durable fact in the body-composition record. Whether anything elsewhere in the dataset has the leverage to break it is a question the cycling sections and the phase-response work will return to.

<figure>
  <img src="/paper/figures/fig01_longitudinal_multipanel.png" alt="Figure 2. The body-composition corridor and the expenditure floor lift, Sep 2022 → Apr 2026. Black: trend weight (MF EMA), with the all-time low (71.6 kg, Apr 2023) and high (78.3 kg, Feb 2026) marked, the 70 kg target reference line, and a vertical at Dec 1, 2024 — the Act I → Act II hinge. The shaded blue band is the 6.7 kg corridor the trend has cycled inside for the entire window. Orange (right axis): MacroFactor's expenditure estimate, raw weekly values plus an 8-week rolling mean. Two horizontal references mark the floors named in §4 — Act I floor 1,864 kcal/day (Jan 2024) and Act II floor 2,039 kcal/day. The cycling era's signature in this figure is the orange line lifting, not the black line falling. Phase shading from `protocol.json`." loading="lazy" />
  <figcaption><strong>Figure 2.</strong> The body-composition corridor and the expenditure floor lift, Sep 2022 → Apr 2026. Black: trend weight (MF EMA), with the all-time low (71.6 kg, Apr 2023) and high (78.3 kg, Feb 2026) marked, the 70 kg target reference line, and a vertical at Dec 1, 2024 — the Act I → Act II hinge. The shaded blue band is the 6.7 kg corridor the trend has cycled inside for the entire window. Orange (right axis): MacroFactor's expenditure estimate, raw weekly values plus an 8-week rolling mean. Two horizontal references mark the floors named in §4 — Act I floor 1,864 kcal/day (Jan 2024) and Act II floor 2,039 kcal/day. The cycling era's signature in this figure is the orange line lifting, not the black line falling. Phase shading from `protocol.json`.</figcaption>
</figure>

---

## 5. Cycling, from zero

> **Finding.** Average ride speed climbed +5.2 kph at constant heart rate across five quarters (25.7 → 30.9 kph in 145–151 bpm corridor) before plateauing. Three race-day bike legs traced a textbook decreasing-power-with-distance curve: 200 → 186 → 163 W as distance grew 21 → 40 → 89 km, with watts-per-bpm declining 1.23 → 1.19 → 1.11 in lockstep. The cycling era cost 47% of weekly strength tonnage and a working-weight regression on every compound lift (squat 115 → 100 kg, deadlift 150 → 140 kg, bench 75×5 → 72.5×1, OHP 50 → 42.5 kg) — larger than the published concurrent-training literature predicts for cycling-mode endurance, most plausibly read as recovery reallocation rather than molecular interference.

The first FTP test is dated December 1, 2024 and lasted seventeen minutes. It terminated early, no FTP value recorded. Eighteen days later — December 19 — the same body did its first 80-kilometer outdoor ride, an 80.4-km loop through Bawshar at an average heart rate of 144. Six days after that it did 65 km on the As Seeb road. On December 29 it crashed: the activity Garmin saved is named, verbatim, *"As Seeb Road Cycling | crashed lmao"* — distance 26.7 km, max HR 171, heart-rate trace consistent with the rider picking himself up and finishing the loop. By January 6, 2025 — thirty-six days after the first FTP test — there was a 100 km outdoor ride. By January 31 there was a 120 km ride.

Those numbers are not consistent with a true cold-start cyclist. They are consistent with what was actually true: I had been riding a city bike around Muscat for almost two years before the watch was instructed to start counting. Act II opens with the moment training was instrumented, not with the moment cycling began.

Outdoor volume has accumulated to 5,959 km across 124 outdoor training rides in the sixteen months since (the 161 figure that appears elsewhere in the file is total rides including indoor TrainerRoad sessions), distributed across seven quarters. The shape is informative. 2024 Q4 has only seven rides because the era was a month old. 2025 Q1 jumped to eighteen and 2025 Q2 to twenty-two, with quarterly totals climbing from 951 to 1,187 km. Q3 2025 was the highest-volume quarter in the file at 1,542 km across twenty-nine rides. After that the curve gets bumpy.

The bumpiness is travel. Three two-to-three-week outdoor riding pauses — Qatar in late May, Southeast Asia in July, Europe in October 2025 — explain why the second half of 2025 is below the first. Indoor TrainerRoad bridged the Qatar gap; the other two were full off-bike windows. The post-gap rebuild took roughly two weeks each time and never failed to recover the prior block's volume. These gaps are the only structural breaks in the file; everything else is signal.

The single cleanest piece of evidence that the cycling era did anything to the body is the speed-at-equal-HR signal. Average ride speed climbed from 25.7 kph in 2024 Q4 to 30.9 kph in 2026 Q1 — a +5.2 kph swing across five quarters. Over the same window, average ride heart rate stayed in a narrow 145–151 bpm band. Same intensity in, more speed out. The biggest single-quarter jump (+2.5 kph) happened between Q1 and Q2 2025, the period when structured TrainerRoad workouts started showing up in the activity log. After Q2 2025 the average-speed metric plateaued in the 29.7–30.9 kph corridor and has stayed there. This does not necessarily mean fitness plateaued — it means the average-speed-by-quarter view, without controlling for terrain, weather, and group-versus-solo composition, can no longer resolve gains that probably exist.

Five FTP/ramp tests bracket the era. The first two — December 1, 2024 and April 22, 2025 — were terminated early and produced no recorded FTP. The first useful test was the June 5, 2025 TrainerRoad ramp; the first outdoor test was November 20, 2025, almost a year into structured training. Garmin's normalized-power values for the five tests, in chronological order, were 135 → 172 → 193 → 217 → 206 watts. The fifth test, in January 2026, was conducted three weeks before Muscat 70.3 and is the closest data point to a race-pacing baseline.

Three triathlons sit inside this window, and the cleanest cycling-era story this dataset tells is on the three race-day bike legs.

**Al Bustan Sprint** (November 15, 2025) was 21 km of hilly course at 200 W average and 31.5 kph, max HR 178. It was ridden all-out in a way no training session has been, on the steepest course of the three by elevation gain per kilometer. **Athiba Olympic** (January 31, 2026) was 40 km at 186 W and 34.6 kph — slower power, faster speed, because the course was flat and the format was sustained-tempo, not sprint-redline. Athiba's 34.6 kph is +3.7 kph above the 2026 Q1 training average. **Muscat 70.3** (February 14, 2026) was 89 km at 163 W and 29.9 kph, with +818 m of climbing, ridden three hours under threshold before a half-marathon. Average speed below the training corridor on a course nearly four times steeper than typical training routes.

The pacing curve across those three legs is textbook physiology. As distance grew (21 → 40 → 89 km), average power decreased monotonically (200 → 186 → 163 W), average heart rate decreased monotonically (163 → 156 → 147 bpm), and watts per beat-per-minute — a crude pacing-discipline metric — also descended (1.23 → 1.19 → 1.11). Three different formats, three different durations, three different responses, all in the direction sports physiology predicts. No outliers. There is not much else in the dataset that is this clean.

The cycling era did not come for free. Across the twelve months immediately before and after the cycling onset, strength sessions per week fell 20 percent — and total weekly tonnage fell almost half (48 percent). Sessions didn't just become rarer; they became lighter or shorter. Every primary compound regressed from its Act I peak: back squat from 115 kg to 100 kg, deadlift from 150 kg to 140 kg, overhead press from 50 kg to 42.5 kg, and bench from a 75 kg working five down to 72.5 kg for a single rep — a real working-weight collapse hidden inside an apparently flat one-rep-max number. The published concurrent-training literature — the Wilson 2012 meta-analysis, Coffey and Hawley's 2017 mechanistic review, Petré 2021 on trained populations — predicts that *cycling*-mode endurance, performed in mostly-separated sessions, produces only a small interference effect on strength. The effect observed here is larger than that prediction. The most defensible reading is that the bulk of the regression is reallocation of finite recovery and finite time onto a new outcome variable, not the molecular interference effect itself. The strength block did not disappear; it became maintenance instead of development.

Whether and how to rebuild it as the long-distance build moves into its later phases is a question the rest of the protocol owes an answer to. The dataset does not pretend to know it.

<figure>
  <img src="/paper/figures/fig06_strength_regression.png" alt="Figure 3. Strength regression across the Act I → Act II hinge. Panel A: total weekly tonnage from 296 weeks of training, Aug 2019 → Apr 2026, with a 4-week rolling mean overlaid. Act I average (last twelve months pre-hinge) is 37,303 kg/week; Act II average is 19,900 kg/week — a 47 percent drop, in line with the 48 percent figure in the prose. The vertical at Dec 1, 2024 marks the cycling-era hinge. Panel B: estimated 1RM (Epley, top working set per session, 8-session rolling mean) for the big four. Each lift's Act I peak and most-recent Act II value are in the legend. Bench press ends at Dec 2025 — that was the last logged barbell bench session in the file. One ghost session of 1.72 million kg (a Hevy unit-confusion artifact on 2023-06-25) is filtered out of Panel A by a 50,000 kg/session sanity threshold." loading="lazy" />
  <figcaption><strong>Figure 3.</strong> Strength regression across the Act I → Act II hinge. Panel A: total weekly tonnage from 296 weeks of training, Aug 2019 → Apr 2026, with a 4-week rolling mean overlaid. Act I average (last twelve months pre-hinge) is 37,303 kg/week; Act II average is 19,900 kg/week — a 47 percent drop, in line with the 48 percent figure in the prose. The vertical at Dec 1, 2024 marks the cycling-era hinge. Panel B: estimated 1RM (Epley, top working set per session, 8-session rolling mean) for the big four. Each lift's Act I peak and most-recent Act II value are in the legend. Bench press ends at Dec 2025 — that was the last logged barbell bench session in the file. One ghost session of 1.72 million kg (a Hevy unit-confusion artifact on 2023-06-25) is filtered out of Panel A by a 50,000 kg/session sanity threshold.</figcaption>
</figure>

---

## 6. What predicts a good ride

> **Finding.** Across 124 outdoor rides, no individual recovery-state, environmental, or fueling-state predictor stably explains average ride speed. The earlier-draft headline of this section — morning RHR predicting long-ride speed at full-window detrended r = −0.35 — failed walk-forward replication (train half r = −0.51, test half r = +0.00; bootstrap CI [−0.53, +0.08] crosses zero) and is downgraded to a regime-bound Act-II onboarding-window phenomenon. Effort (avg HR) and route still dominate ride speed; recovery-state metrics do not earn a forward-going coaching role on this stack.

The dataset for this section is 124 outdoor cycling days between December 2024 and April 2026, each one cross-joined with the Garmin sleep summary, overnight HRV, and resting heart rate from the night before. The dependent variable is the day's average speed. The independent variables are everything the watch knows about how the body went into the ride.

The boring finding has to come first.

Across 124 trials, **single-night sleep duration does not predict ride speed.** Neither does sleep score, deep-sleep percentage, REM percentage, average overnight HRV, or HRV stress score. The pooled correlations across the full window are all small, and every detrended 95 percent confidence interval crosses zero. This includes every variable a recreational cyclist would name first if you asked them what makes a good ride. *I slept badly, so I'll have a bad ride* is not visible in the data over 124 trials. The boring corollary is that the strongest predictor of how fast a given ride was is *how hard it was ridden* — average heart rate explains more between-ride variance in speed than every recovery-state variable combined, and effort is largely a behavioral choice, not a physiological signal. A 2.8-kph spread separates the lowest from the highest HR third on the same dataset, and recovery-state variables are essentially flat across those buckets.

Inside that boring frame, one variable looked, for almost a year, like a real exception.

Across the full 124-ride window, morning resting heart rate the day of the ride correlated negatively with average ride speed at r = −0.28. Restricted to long rides only — fifty kilometers or longer, n = 54 — the same correlation tightened to r = −0.35 after detrending, with a 95 percent confidence interval of [−0.56, −0.09] that excluded zero. Lower morning RHR going into a long ride was associated with a faster long ride. The effect size was larger than anything else in §6 by a factor of two. The mechanism was plausible: morning RHR is a recognized marker of overnight recovery state and parasympathetic tone, and is the most sensitive single number on the watch for catching accumulated training stress. I had this finding written up as the §6 headline. It cleared five of the six checks from §1 — survived data-gap removal, plausible mechanism, full distributional plot, effect size reported, sample size adequate.

Then I ran check 3.

Check 3 is walk-forward replication. You take the first half of the data chronologically, fit the relationship there, and ask whether it holds in the second half — held out, never seen. Splitting the 54 long rides into a chronological 50/50 (December 2024 → August 2025 train, August 2025 → April 2026 test), the detrended correlation came back at −0.51 on the training half and +0.00 on the test half. Not weaker. Zero. A 28-day-block bootstrap on the long-ride sample produced a confidence interval of [−0.53, +0.08] — a range that contains the train-half effect, contains no effect at all, and contains a small positive effect. The signal cannot be told apart from noise on the second half of its own dataset.

<figure>
  <img src="/paper/figures/fig02_rhr_vs_speed_long_rides.png" alt="Figure 4. Walk-forward replication of the morning-RHR → average-speed signal on long rides (≥50 km). Left: training half (Dec 2024 – Aug 2025, n = 27), detrended r = −0.51 — the negative slope an earlier draft of this paper had carried as its §6 headline. Right: test half (Aug 2025 – Apr 2026, n = 27), detrended r = +0.00 — a flat cloud. Both raw and detrended points are shown; OLS fit overlaid; full Fisher CI in the inset stats panel. This is the paper's second worked retraction: the §1 RHR → fat-intake correlation failed Check 1 (shift-across-gaps); this one fails Check 3 (walk-forward replication)." loading="lazy" />
  <figcaption><strong>Figure 4.</strong> Walk-forward replication of the morning-RHR → average-speed signal on long rides (≥50 km). Left: training half (Dec 2024 – Aug 2025, n = 27), detrended r = −0.51 — the negative slope an earlier draft of this paper had carried as its §6 headline. Right: test half (Aug 2025 – Apr 2026, n = 27), detrended r = +0.00 — a flat cloud. Both raw and detrended points are shown; OLS fit overlaid; full Fisher CI in the inset stats panel. This is the paper's second worked retraction: the §1 RHR → fat-intake correlation failed Check 1 (shift-across-gaps); this one fails Check 3 (walk-forward replication).</figcaption>
</figure>

Per-quartile correlations sharpen the picture. The first quarter of the cycling era shows the strongest negative slope; each subsequent quarter is weaker; by the fourth quarter the slope is indistinguishable from zero. The decay is monotonic in point estimate, not stochastic — though the per-quartile confidence intervals each cross zero individually, the trend line through the four quartile r-values is the signature of a regime-bound finding rather than a stable predictor obscured by noise.

The most plausible mechanism I can name is a ceiling effect — but I should be explicit that this is post-hoc. The signal died first; the explanation came after. In the onboarding period, RHR was both higher in absolute terms and more variable day-to-day, and ride speed was lower and more variable; the two co-moved. Once trained-state RHR settled into the 44–48 bpm range, day-to-day RHR variation may no longer have encoded recovery information that affected pace. That is a story consistent with the data, not a tested mechanism — the dataset cannot tell a true ceiling effect apart from any other Act-II-onboarding-only co-movement that happened to involve RHR. The honest restatement of the v1 headline is therefore: *during the first eight months of the cycling era, morning RHR predicted long-ride pace at r ≈ −0.5; that relationship had decayed to zero by August 2025 onward, and the mechanism is not established*. It is a real Act-II onboarding-window phenomenon and a worthwhile description of how a body becomes a cyclist; it is not a forward-going coaching predictor. As of this writing, RHR is removed from the list of metrics I read before a ride.

Three other predictor families were brought into the analysis hoping to rescue the §6 narrative. None did. Wind speed had the right sign and the right physical mechanism but a confidence interval that touched zero. Temperature looked positive on long rides but was confounded with route mix and time of season. Prior-day calories and macros were null on speed once the trend was removed; the only statistically clearer signal was that eating more the day before correlated negatively with average heart rate (r = −0.24, n = 120), consistent with better fueling state, but it did not translate to a faster ride. Lift-day proximity — whether a strength session was yesterday, the day before, or the same morning — was a flat null on every metric tested.

After 124 outdoor rides, no individual recovery-state, environmental, or fueling-state predictor stably explains average speed. One fueling-state correlate landed on average ride heart rate (r = −0.24, *n* = 120) but did not propagate to pace, which is the only non-null result in the section and is small. Effort and route still dominate. That is the §6 verdict, and the rest of this paper had to be honest about it before any of the surviving findings in §7 could be trusted.

---

## 7. The signal ledger

After 124 outdoor rides, four years of body-composition data, and roughly 1,300 nights of sleep architecture, the inventory of cross-domain claims that survived the §1 guardrail and the §6 walk-forward is small.

**Three things validated. One falsified. One retracted — the RHR → fat-intake correlation already on the record from §1. One genuine negative result.** That is the ledger this paper is willing to defend.

### Three that survived

**HRV and sleep predict the next day's calorie intake.** Within a Bonferroni-corrected scan of eighteen candidate one-day-lag relationships, two cleared the threshold by clear margins. Higher overnight HRV on day *t−1* predicts higher logged calories on day *t* at a coefficient of +24.6 kcal per millisecond of HRV, *p* < 0.0028, *n* = 107. Longer sleep duration on day *t−1* predicts higher calories on day *t* at roughly +130 kcal per hour. The mechanism is mundane: better recovery state, more capacity for a normal eating day; worse recovery state, depressed appetite. The effect is small per day but operationally real — it is wired into the morning briefing script that runs against this dataset, and it has held up across phase boundaries. (A weekly walk-forward audit of this signal began Apr 26, 2026; the first audit flagged the test-half slope at 0.35× of baseline, with sign preserved. A pre-specified rule downgrades the finding from VALIDATED to REGIME-BOUND if five of the next eight audits flag.)

<figure>
  <img src="/paper/figures/fig05_hrv_vs_next_day_calories.png" alt="Figure 5. HRV on the night before vs. logged calories the day after, n = 107 consecutive-day pairs. Pearson r = +0.37, OLS slope = +24.6 kcal per millisecond of overnight HRV. Bonferroni-passed at p < 0.0028 across an eighteen-test scan. The mechanism: better recovery state on day t−1 enables a more typical eating day on day t; suppressed recovery state suppresses next-day intake. The effect is small per day but compounds operationally — at a 24 ms HRV swing (which the dataset sees frequently between phases), the implied calorie shift is ~590 kcal/day." loading="lazy" />
  <figcaption><strong>Figure 5.</strong> HRV on the night before vs. logged calories the day after, <em>n</em> = 107 consecutive-day pairs. Pearson r = +0.37, OLS slope = +24.6 kcal per millisecond of overnight HRV. Bonferroni-passed at <em>p</em> < 0.0028 across an eighteen-test scan. The mechanism: better recovery state on day <em>t−1</em> enables a more typical eating day on day <em>t</em>; suppressed recovery state suppresses next-day intake. The effect is small per day but compounds operationally — at a 24 ms HRV swing (which the dataset sees frequently between phases), the implied calorie shift is ~590 kcal/day.</figcaption>
</figure>

**Logged calorie intake systematically undercounts true intake by roughly 555 kcal per day.** A triangulation against MacroFactor's own expenditure estimate, Garmin's daily energy out, and the scale-weight trajectory produces a Bayesian posterior mean of about 555 kcal per day, robust to choice of prior. The under-log is concentrated on restaurant and work days, where logging is photo-and-voice rather than weighed. This is not a methodological aside — it is itself a finding, and every "calories vs. outcome" sentence in the paper has had to be corrected for it before the calculation will close.

**REM scarcity is a duration problem, not a production problem.** A running puzzle in the data was nights with 0% REM — eight of twenty-four tracked nights at one point during the Ramadan window. The reframe came from looking at *when* in the night REM accumulates: 65.4 percent of the dataset's total REM occurs in the final third of the night. On nights truncated short, REM disappears first. The watch is not failing to detect REM; the body is not getting to it. The intervention is sleep duration, not architecture-targeted tinkering.

### One that did not survive

**The protein-collapse predictor.** A 57-day window of Ramadan-cut data showed a clean relationship between lift-day proximity and a same-day collapse in protein intake (AUC 0.929, *n* = 57). It looked operative. Re-fit on the year-to-date frame at *n* = 380 the AUC dropped to 0.677 — barely better than chance. The pattern was a Ramadan-phase artifact: fasting hours and lift-day timing co-moved during Ramadan and were independent outside it. It failed check 2 of the §1 guardrail.

The retracted RHR → fat-intake correlation from §1 is the second item on this side of the ledger. Together they bring the falsified-or-retracted count to two.

### One genuine negative result

**Day-ahead prediction of recovery state from prior-day metrics fails on this stack.** Across every tested model — gradient-boosted trees, regularized regression, simple lag features — predicting tomorrow's HRV, sleep score, RHR, or training readiness from yesterday's values plus context produced an out-of-sample R² below zero on the YTD frame at *n* = 55. Worse than predicting the dataset mean. This is a real finding, not a software failure: at one season's worth of daily-aggregate resolution, day-to-day variance dominates day-to-day signal. Hourly resolution, multi-year *n*, or external feature integration (work calendar, weather, alcohol, meal timing) would change the answer. The current data layer does not.

### What the phases added

Two phase-response patterns survive at the descriptive level without graduating to predictive findings.

In the **Ramadan cut** (Feb 18 – Mar 19, 2026), the HRV-BALANCED-day rate dropped from 93 percent pre-Ramadan to 6 percent during. Across the entire 30-day window HRV did not register "balanced" on a single morning. The body-composition outcome was on protocol for the phase-defined window (−3.1 kg, −1.8 percentage points body fat from Feb 18 to Mar 19) but the autonomic cost was the largest in the dataset. RHR, by contrast, was essentially flat across all five protocol phases — between 46.8 and 49.7 bpm — which is its own finding: RHR is not a phase-sensitive metric in this body, despite being the §6 false alarm.

In the **Home Reset** (Mar 20 – Apr 2, 2026), HRV recovered to baseline within fourteen days, *while sleep volume continued to worsen week by week*. This is the cleanest counter-example in the dataset to the assumption that sleep drives recovery. Whatever the body needed after Ramadan to reset its autonomic state, it was not a function of nightly hours in bed.

<figure>
  <img src="/paper/figures/fig07_phase_response.png" alt="Figure 6. Phase response across the V2 protocol ladder. Panel A: HRV-BALANCED-day rate by phase — pre-Ramadan training was 93 percent BALANCED days; the Ramadan cut collapsed to 6 percent; post-race recovery, Home Reset, and the active Eid Challenge are all back at 100 percent. Panel B: mean morning RHR by phase — every bar sits between 46.8 and 49.7 bpm, the empirical floor of &quot;RHR is not a phase-sensitive metric in this body.&quot; Panel C: the Home Reset window (Mar 20 – Apr 2, 2026) with daily overnight HRV (blue, left axis) climbing while daily sleep duration (red, right axis) trends down — the cleanest counter-example in the dataset to the assumption that sleep volume drives autonomic recovery." loading="lazy" />
  <figcaption><strong>Figure 6.</strong> Phase response across the V2 protocol ladder. Panel A: HRV-BALANCED-day rate by phase — pre-Ramadan training was 93 percent BALANCED days; the Ramadan cut collapsed to 6 percent; post-race recovery, Home Reset, and the active Eid Challenge are all back at 100 percent. Panel B: mean morning RHR by phase — every bar sits between 46.8 and 49.7 bpm, the empirical floor of "RHR is not a phase-sensitive metric in this body." Panel C: the Home Reset window (Mar 20 – Apr 2, 2026) with daily overnight HRV (blue, left axis) climbing while daily sleep duration (red, right axis) trends down — the cleanest counter-example in the dataset to the assumption that sleep volume drives autonomic recovery.</figcaption>
</figure>

That is the ledger. Three findings I will defend, two I am on the record as having gotten wrong, one I am on the record as having tried to make work and failed. What four years of self-tracking buys you, given that ledger, is the question §8 takes up.

---

## 8. What four years of self-tracking buys you

Given a ledger that small, the honest question is whether four years of daily measurement was worth doing at all. The answer is yes, but not for the reasons most people expect.

Self-tracking sells itself on prediction. The pitch is: aggregate enough data about your body and the model that emerges will tell you what to do tomorrow morning. The negative result in §7 is a clean falsification of that pitch on this stack. Day-ahead prediction of any of the watch's recovery metrics, fitted on YTD data with every reasonable model architecture, is worse than predicting the mean. The data layer is not dense enough — at daily resolution and one season's *n* — to support it.

What four years of self-tracking actually buys, in this dataset, is three things.

It buys *calibrated baselines.* Knowing that my HRV operates in a 56–80 ms band, that my morning RHR sits in a 44–48 bpm corridor, that my expenditure floor in a non-cycling state is 1,860 kcal and in a trained state is 2,040 kcal — none of these are predictions. They are the reference frame within which any single morning's reading becomes interpretable. A 56 ms HRV reading is a different signal in a body whose mean is 70 than in a body whose mean is 50. The watch's generic "balanced / unbalanced / low" badge is a population-grade version of this baseline; the personal version, built from years of your own data, is more discriminating. It does not predict tomorrow. It tells you whether tomorrow is normal.

It buys *retroactive accountability.* The §6 walk-forward analysis was only possible because there were 124 outdoor rides on file with the recovery state of each preceding night attached. The §7 protein-collapse falsification was only possible because the 57-day Ramadan window could be embedded in a 380-day YTD frame. The intake under-log was only triangulable because four years of food logs could be cross-checked against Garmin's expenditure trace and the actual scale-weight curve. Every check in the §1 guardrail relies on having more data than the question being asked needs. The benefit accrues backward in time, not forward.

It buys *the falsification of plausible-sounding hypotheses.* Across the analyses in this paper, the things I was most certain would predict performance — single-night sleep, single-night HRV, prior-day macros, lift-day proximity — turned out to be flat nulls. The things I was least certain about — the intake under-log, the duration-bound REM finding, the HRV-to-next-day-calories signal — turned out to be operationally real. The dataset's main job, in other words, has been to disagree with me, often — at least on the hypotheses I thought to test. The questions I never asked have not been audited by the guardrail any more than they would be in a document without one; the discipline catches what enters it, and silent positives stay silent. That caveat granted, the audit-on-entry is still the most valuable thing the data does. Without four years of receipts, the §1 retraction of the RHR → fat-intake correlation does not happen; I publish it, somebody quotes it, and a wrong fact about an N=1 body becomes one of the things I believe.

The cost of self-tracking at this depth is not the time spent logging. It is the discipline cost: every claim has to clear the §1 guardrail before it can be read as anything more than a guess. Most candidate findings do not clear it. The good ones earn their place by being what survives, not by being what was looked for.

Four years of daily measurement does not produce an oracle. It produces a baseline, an accountability record, and a falsification engine. That is not a small thing, but it is a different thing than the pitch.

---

## 9. Where this could be wrong

Nine real limitations sit on top of every claim in this paper.

The most obvious is that *n* = 1. Population-grade claims are not in scope and were never the goal. What is in scope is whether the within-subject signals reported here would replicate inside a different individual's longitudinal record, and the honest answer is *probably some of them, probably not others, and this dataset cannot tell you which.* A second self-tracking subject would clarify it. There is no second self-tracking subject.

The logged calorie record under-counts true intake by roughly 555 kcal per day. This was reframed in §7 as a finding rather than as a flaw, because the magnitude was triangulable — but it is also a constraint on every "calories vs. outcome" calculation in the paper. Outcomes that depend on knowing absolute intake are degraded by a quantity at least equal to the size of the effects most studies in this space report.

The bioimpedance scale's body-fat reading drifts ±2–3 percentage points from a DEXA scan on the same day. Every body-fat number in this paper is therefore a *change*, not a level — and the smaller the change, the less reliable the trend. The smart scale was retired in March 2026; after that the body-fat trace effectively stops.

Selection bias on what gets logged is real and unevenly distributed. Food logging fails on no-effort days — the protein-collapse predictor of §7 was a real signal precisely *because* logging fails differently in Ramadan than out of it. The same is true at smaller scales for sleep tracking on overnight travel, ride logging when the watch dies mid-ride, and strength logging during app migration.

Motivated reasoning is documented but not eliminated. There is a recorded incident on April 16, 2026 in which I came to the data with a hypothesis I wanted to be true, ran the check, and the data contradicted me. The check ran because the §1 guardrail required it. Other incidents are presumably present in the dataset and were not caught because the guardrail did not fire on them. The discipline reduces this bias; it does not zero it.

None of the findings in this document were pre-registered, and the framing in §8 implies more discipline than I had. Hypotheses were generated, tested, and filtered through the §1 guardrail in the same passes — this is hypothesis-after-results-known with honest post-hoc filters bolted on, not pre-registered confirmatory work. The HRV → next-day-calories result, the strongest validated finding in §7, came out of an eighteen-test scan on which Bonferroni was applied; Bonferroni controls family-wise error within a chosen test family, but the choice of which eighteen tests to run was itself made after looking at the data. The §1 guardrail catches alignment artifacts (Check 1), regime-bound signals (Check 3), and unbacked claims (Checks 4 and 5); it does not catch the deeper move of choosing which questions to ask after seeing the data. The cleanest way to describe the epistemic position of this document is *exploratory analysis with disciplined post-hoc filters*, not confirmatory science. The findings are real to the degree that those filters are tight; they are not real to the degree that pre-registration would have made them.

The instrument chain has drifted. The Garmin watch was replaced in January 2023 — the older model recorded no overnight HRV at all, which is why the §1 figure's HRV trace begins in March 2023. Garmin's sleep-stage detection algorithm has been updated by firmware at least twice in the measurement window. MacroFactor's expenditure-EMA algorithm has been silently revised. The bioimpedance scale's body-fat curve was reweighted by a firmware push in 2024. Every cross-era comparison in this paper rides on top of these shifts and cannot fully separate "the body changed" from "the instrument re-scored the same body."

Software bugs in the analysis pipeline have already corrupted findings once on the record, and almost certainly more times silently. The shift-across-gaps bug behind the §1 retraction was caught only because I had a guardrail that fired on it. The typed-splits bug (documented in the working document's Appendix C) silently triple-counted ClimbPro overlap layers and inflated FTP estimates on three rides for an undetermined window before it was found by manual audit. Both bugs lived in code I had read and trusted. There is no reason to think they were the only two.

The protocol record has survivor bias built into it. The phases that appear in `protocol.json` and produced the §7 ledger are the ones that were committed to and tracked through. Pre-2022 weight-loss attempts, structured run training that lapsed inside a month, multiple high-protein routines that fell apart inside a week, and at least one earlier cycling onboarding attempt that did not stick — none of these were logged. The four-year record is what survived being logged, and what survived being logged is biased toward what survived being done. A complete view of "what works for this body" would require the failed protocols too, and they are gone.

A future analyst reading this paper should weight any single claim by which of these limitations applies hardest to it.

---

## 10. Where the receipts live

This document is the readable layer. The verifiable layer is a longer working document — `study-v1.md` — kept alongside the project's pipeline code and per-section reproduction scripts. It is currently available on request; the intent is that any number on this page can be traced back to the script that produced it.

The working document carries everything this one deliberately does not. Appendix A is the full data dictionary for the eight CSV inputs. Appendix B is the phase-by-phase and year-by-year summary tables. Appendix C is the typed-splits-bug post-mortem with the three layers of overlap diagrammed. Appendix D is the worked example of the §1 guardrail catching the RHR → fat-intake retraction. Appendix E is the bibliography of the cited literature — concurrent training, HRV in endurance, BIA accuracy, sleep architecture, irregular time-series correlation, motivated reasoning, Ramadan in trained athletes — mapped to the sections that cite each entry. Appendix F is the three-layer code architecture with the test surface and the data-flow diagram.

If a claim on this page looks load-bearing and you want to check it: ask, and the source script will travel with the answer. Every number that survived to this document has cleared that bar.
