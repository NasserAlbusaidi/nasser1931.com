import { classifyState, getScheduleContext, pickWorkout, pickWorkoutV1 } from '../scripts/cycling-engine.mjs';

const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

// Build-time boundary: never spread engine output. Reasoning and warnings can
// contain personal metrics, so only these public recommendation fields leave.
export function buildPublicForecast(snapshot, bank) {
  const stamp = snapshot?._today;
  if (typeof stamp !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return [];
  const start = new Date(`${stamp}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== stamp) return [];
  const state = classifyState(snapshot.wellness ?? {}).state;
  return [0, 1, 2, 3].map(offset => {
    const date = new Date(start.getTime() + offset * 86400000);
    const context = getScheduleContext(date);
    const pick = offset === 0
      ? pickWorkout(state, context, bank, snapshot.computed ?? {})
      : pickWorkoutV1('amber', context, bank);
    const kind = pick.workoutKey ? (pick.workout ? 'structured' : 'unavailable') : context.slot === 'group_ride' ? 'group' : 'rest';
    const workout = kind === 'structured' ? pick.workout : null;
    return {
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
      projected: offset > 0,
      kind,
      title: kind === 'rest' ? 'Rest day' : kind === 'group' ? 'Group ride' : kind === 'unavailable' ? 'Recommendation unavailable' : workout.name,
      description: kind === 'rest'
        ? 'No cycling workout scheduled. A pause between sessions is part of the plan.'
        : kind === 'group'
          ? 'An unstructured ride with the group. There is no prescribed workout for this session.'
          : kind === 'unavailable' ? 'The selected session is missing from this snapshot.'
            : 'A structured session selected from my workout library.',
      duration: positive(workout?.duration_min),
      targetIf: positive(workout?.target_if),
      targetTss: positive(workout?.target_tss),
    };
  });
}
