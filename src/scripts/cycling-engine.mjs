// Pure JS port of project-furnace's tools/intervalsicu/pick_workout.py.
// No I/O, no DOM — runs at build time in Node and in the browser for sliders.
// Schemas mirror the canonical Python source: workout entries carry
// `target_if`, `target_tss`, `duration_min`, `recovery_cost`, `category`, etc.

// ---- schedule ----------------------------------------------------------------

export const LIFT_SCHEDULE = {
  Mon: "lower", Tue: "upper", Wed: "rest", Thu: "rest",
  Fri: "lower", Sat: "upper", Sun: "rest",
};

export const CYCLING_SLOT = {
  Fri: "group_ride",
  Sun: "long",
  Wed: "quality",
};

// MACRO A starts Fri 2026-05-08. Anchor at UTC midnight to keep the math
// independent of the user's local timezone.
export const MACRO_START = new Date(Date.UTC(2026, 4, 8));

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- recovery thresholds (mirror pick_workout.py) ---------------------------

const THRESHOLDS = {
  hrv:                { good: 56,  red: 50 },
  sleep_hours:        { good: 6.5, red: 5.0 },
  body_battery:       { good: 60,  red: 30 },
  training_readiness: { good: 70,  red: 50 },
  rhr:                { red: 55 },
};

const METRIC_LABELS = {
  hrv: "HRV",
  sleep_hours: "Sleep",
  body_battery: "Body Battery",
  training_readiness: "Readiness",
  rhr: "RHR",
};

const METRIC_UNITS = {
  hrv: "ms",
  sleep_hours: "h",
  body_battery: "",
  training_readiness: "",
  rhr: "bpm",
};

// ---- classifiers -------------------------------------------------------------

export function classifyMetric(key, value) {
  if (value == null || Number.isNaN(value)) return "missing";
  const t = THRESHOLDS[key];
  if (!t) return "neutral";
  if (key === "rhr") return value > t.red ? "red" : "green";
  if (value < t.red) return "red";
  if (value >= t.good) return "green";
  return "amber";
}

export function classifyState(wellness) {
  const order = ["hrv", "sleep_hours", "body_battery", "training_readiness", "rhr"];
  const classifications = [];
  let red = 0, green = 0;
  for (const key of order) {
    const value = wellness?.[key];
    const cls = classifyMetric(key, value);
    classifications.push({
      key,
      label: METRIC_LABELS[key],
      unit: METRIC_UNITS[key],
      value,
      class: cls,
    });
    if (cls === "red") red += 1;
    else if (cls === "green") green += 1;
  }
  let state = "amber";
  if (red >= 1) state = "red";
  else if (green >= 3) state = "green";
  return { state, classifications, redHits: red, greenHits: green };
}

// ---- schedule context --------------------------------------------------------

export function getMacroWeek(today, start = MACRO_START) {
  const ms = today.getTime() - start.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (7 * 86400000)) + 1;
}

export function getScheduleContext(today) {
  const dayName = DAY_NAMES[today.getUTCDay()];
  const slot = CYCLING_SLOT[dayName] || null;
  const tom = new Date(today.getTime() + 86400000);
  const tomName = DAY_NAMES[tom.getUTCDay()];
  const tomLift = LIFT_SCHEDULE[tomName] || "rest";
  return {
    today,
    dayName,
    slot,
    tomName,
    tomLift,
    macroWeek: getMacroWeek(today),
  };
}

// ---- v1 pick -----------------------------------------------------------------

function pick(bank, key, slot, macroWeek, reasoning) {
  return { workoutKey: key, workout: bank[key] ?? null, slot, macroWeek, reasoning };
}

export function pickWorkoutV1(state, ctx, bank) {
  const { dayName, tomName, tomLift, slot, macroWeek } = ctx;
  const reasoning = [
    `Day: ${dayName} (tomorrow ${tomName}: ${tomLift})`,
    `MACRO A week: W${macroWeek}`,
    `Slot: ${slot ?? "no cycling scheduled"}`,
    `Recovery state: ${state.toUpperCase()}`,
  ];

  if (!slot) {
    reasoning.push("→ No cycling slot today. Rest or recovery spin only if requested.");
    return pick(bank, null, slot, macroWeek, reasoning);
  }
  if (slot === "group_ride") {
    reasoning.push("→ Friday is the group ride day — no structured workout to push.");
    return pick(bank, null, slot, macroWeek, reasoning);
  }
  if (state === "red") {
    reasoning.push("→ RED state forces recovery_45 regardless of slot.");
    return pick(bank, "recovery_45", slot, macroWeek, reasoning);
  }

  if (slot === "long") {
    if (macroWeek % 5 === 4 && state === "green") {
      reasoning.push("→ W4 + GREEN → long_push_180 (eFTP-mover). Mon DL is DELOAD this week (NO PRs).");
      return pick(bank, "long_push_180", slot, macroWeek, reasoning);
    }
    let key, note;
    if (state === "green") {
      if (macroWeek === 1) { key = "long_z2_120"; note = "W1 build — moderate distance"; }
      else if (macroWeek === 2 || macroWeek === 3) { key = "long_tempo_120"; note = "W2-3 build — tempo blend"; }
      else { key = "long_z2_120"; note = "Recovery/maintenance volume"; }
    } else {
      key = "long_z2_90"; note = "AMBER → tighter ceiling";
    }
    reasoning.push(`→ Long slot, state=${state}, W${macroWeek} → ${key} (${note})`);
    return pick(bank, key, slot, macroWeek, reasoning);
  }

  if (slot === "quality") {
    if (state === "amber") {
      reasoning.push("→ AMBER + quality slot → sweetspot_4x10 (volume, not ceiling)");
      return pick(bank, "sweetspot_4x10", slot, macroWeek, reasoning);
    }
    let key, note;
    if (tomLift === "rest") {
      const wk = ((macroWeek - 1) % 5) + 1;
      const cycle = {
        1: ["sweetspot_2x20", "W1 → bread-and-butter sweetspot, build base"],
        2: ["sweetspot_3x15", "W2 → volume sweetspot"],
        3: ["threshold_3x10", "W3 → threshold ceiling"],
        4: ["ou_3x8",         "W4 → over-unders, race-pace lactate"],
        5: ["sweetspot_2x20", "W5 → recovery week, keep it familiar"],
      };
      [key, note] = cycle[wk] ?? ["sweetspot_2x20", "default sweetspot"];
    } else if (tomLift === "upper") {
      key = "sweetspot_2x20"; note = "Tomorrow upper lift — sweetspot safe";
    } else if (tomLift === "lower") {
      key = "sweetspot_3x15"; note = "Tomorrow lower lift — avoid threshold/VO2, sweetspot only";
    } else {
      key = "sweetspot_2x20"; note = "default";
    }
    reasoning.push(`→ Quality slot, GREEN, tomorrow=${tomLift}, W${macroWeek} → ${key} (${note})`);
    return pick(bank, key, slot, macroWeek, reasoning);
  }

  if (slot === "recovery") {
    reasoning.push("→ Recovery slot → recovery_45");
    return pick(bank, "recovery_45", slot, macroWeek, reasoning);
  }

  reasoning.push(`→ Unknown slot '${slot}' — falling back to easy_z2_60`);
  return pick(bank, "easy_z2_60", slot, macroWeek, reasoning);
}

// ---- v2 overrides ------------------------------------------------------------

const HARD_CATEGORIES = new Set(["threshold", "vo2", "over_under", "sprint"]);
const QUALITY_DOWNGRADES = {
  vo2_5x4: "sweetspot_3x15",
  vo2_6x3: "sweetspot_3x15",
  threshold_4x10: "sweetspot_3x15",
  threshold_3x10: "sweetspot_2x20",
  threshold_3x8:  "sweetspot_2x20",
  threshold_2x15: "sweetspot_2x20",
  ou_4x6: "sweetspot_2x20",
  ou_3x8: "sweetspot_2x20",
};

function override(pickV1, bank, key, reasoning, warnings) {
  return {
    ...pickV1,
    workoutKey: key,
    workout: bank[key] ?? null,
    reasoning,
    warnings,
  };
}

export function applyV2Overrides(pickV1, v2, bank) {
  const reasoning = [...pickV1.reasoning];
  const warnings = [];

  if (!pickV1.workoutKey || !v2) {
    return { ...pickV1, reasoning, warnings };
  }

  // Always-on eFTP trend signal — surfaces regardless of pick.
  const { eftp_trend_status, eftp_trend_14d_delta } = v2;
  if (eftp_trend_status === "falling") {
    warnings.push(`eFTP rolling dropped ${eftp_trend_14d_delta}W in 14d. Suspect under-fueling. Review caloric intake or schedule an FTP-20 test.`);
  } else if (eftp_trend_status === "drifting_down") {
    reasoning.push(`Note: eFTP drifting down ${eftp_trend_14d_delta}W in 14d — within tolerance but worth watching.`);
  }

  const { workoutKey, slot } = pickV1;
  const spec = bank[workoutKey] ?? {};
  const { tsb, ramp_rate_category: rampCat, days_since_hard: dsh } = v2;

  // Rule 1: TSB high-risk overrides everything except already-recovery.
  if (tsb != null && tsb < -25 && workoutKey !== "recovery_45") {
    reasoning.push(`⚠ v2: TSB ${tsb} (high overreach risk) → recovery_45`);
    warnings.push(`TSB ${tsb} (HIGH RISK). Body is deeply fatigued — full recovery regardless of morning HRV.`);
    return override(pickV1, bank, "recovery_45", reasoning, warnings);
  }

  // Rule 2: TSB overreaching + quality → downgrade hard work to sweetspot.
  if (tsb != null && tsb < -15 && slot === "quality" && QUALITY_DOWNGRADES[workoutKey]) {
    const newKey = QUALITY_DOWNGRADES[workoutKey];
    reasoning.push(`⚠ v2: TSB ${tsb} (overreaching) → downgrade ${workoutKey} → ${newKey}`);
    warnings.push(`TSB ${tsb}. Managing fatigue — high-intensity downgraded to sweetspot.`);
    return override(pickV1, bank, newKey, reasoning, warnings);
  }

  // Rule 3: days_since_hard < 2 → block back-to-back hard work.
  if (dsh != null && dsh < 2 && HARD_CATEGORIES.has(spec.category)) {
    reasoning.push(`⚠ v2: hard session ${dsh}d ago → downgrade to sweetspot_2x20`);
    warnings.push(`Hard session only ${dsh} day(s) ago. CNS not recovered — sweetspot instead.`);
    return override(pickV1, bank, "sweetspot_2x20", reasoning, warnings);
  }

  // Rule 4: W4 long_push gates.
  if (workoutKey === "long_push_180") {
    if (tsb != null && tsb < -15) {
      reasoning.push(`⚠ v2: W4 push gated — TSB ${tsb} too low for 180min eFTP-mover`);
      warnings.push(`W4 long push cancelled. TSB ${tsb} requires recovery first. Doing long_z2_120 instead.`);
      return override(pickV1, bank, "long_z2_120", reasoning, warnings);
    }
    if (rampCat === "injury_risk") {
      reasoning.push("⚠ v2: W4 push gated — ramp rate already in injury zone");
      warnings.push("W4 long push cancelled. Ramp rate too aggressive — already accumulated enough stress.");
      return override(pickV1, bank, "long_tempo_120", reasoning, warnings);
    }
  }

  // Rule 5: aggressive/injury_risk ramp + high-cost quality → cap.
  if ((rampCat === "aggressive" || rampCat === "injury_risk") && slot === "quality") {
    if (spec.recovery_cost === "high" || spec.recovery_cost === "very_high") {
      reasoning.push(`⚠ v2: ramp rate ${rampCat} → downgrade high-cost workout`);
      warnings.push(`Ramp rate ${rampCat}. Holding intensity — heavy workout downgraded.`);
      return override(pickV1, bank, "sweetspot_3x15", reasoning, warnings);
    }
  }

  return { ...pickV1, reasoning, warnings };
}

// ---- convenience: v1 + v2 in one call --------------------------------------

export function pickWorkout(state, ctx, bank, v2) {
  const v1 = pickWorkoutV1(state, ctx, bank);
  return applyV2Overrides(v1, v2, bank);
}
