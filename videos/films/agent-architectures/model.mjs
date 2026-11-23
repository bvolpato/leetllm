import {
  BUS_ROUTE,
  LATER_BUS_ROUTE,
  REPLAN_ANSWER_PROGRESS,
  REPLAN_QUESTION_PROGRESS,
  VISIT_HOURS,
} from './fixtures.mjs';
import { clock, progress } from './arithmetic.mjs';
export function nextAction(observations) {
  if (!observations.length) return 'check-hours';
  if (observations.at(-1).status === 'closed') return 'find-alternative';
  if (!observations.some((o) => o.kind === 'journey')) return 'check-journey';
  return 'recommend';
}
export function ready(state) {
  return (
    state.hours?.status === 'open' &&
    state.journey?.feasible === true &&
    state.journey.venue === state.hours.venue &&
    state.journey.day === state.hours.day
  );
}
export function planSnapshot(beat, p) {
  const hours =
      (beat > 0 && p >= 0.14) || beat > 1
        ? {
            venue: 'History',
            status: 'open',
          }
        : null,
    journey =
      beat > 1 && p >= 0.12
        ? {
            venue: 'History',
            feasible: true,
          }
        : null;
  return {
    hours,
    journey,
    complete: ready({
      hours,
      journey,
    }),
  };
}
export function replanSnapshot(beat, p, cues) {
  const cue = cues?.['replan-b2-1'],
    travelStarted = beat === 1 && (cue ? cue.phase !== 'before' : p >= 0.42),
    travelDone = beat === 1 && (cue ? cue.progress >= 1 : p >= 0.55);
  const venue = beat === 0 ? 'Art' : 'History',
    cancelled = beat === 2 && p >= 0.22 && p < 0.7,
    journey = beat === 0 ? 'Art' : beat === 1 && !travelDone ? 'Art' : 'History',
    predictionAsked = beat === 2 && p >= REPLAN_QUESTION_PROGRESS,
    answerRevealed = beat !== 2 || p >= REPLAN_ANSWER_PROGRESS,
    journeyValid = venue === journey && !cancelled;
  return {
    venue,
    journey,
    travelStarted,
    travelPending: travelStarted && !travelDone,
    hoursOpen: beat > 0,
    journeyValid,
    cancelled,
    predictionAsked,
    answerRevealed,
    decisionLabel: cancelled
      ? answerRevealed
        ? 'Travel invalid: refresh'
        : 'Decision pending'
      : journey !== venue
        ? 'Venue mismatch: reject old travel'
        : journeyValid && beat > 0
          ? 'New route checked'
          : 'Closed branch: unused travel',
    decisionText: cancelled
      ? answerRevealed
        ? 'Preserve History hours; invalidate only the train journey'
        : predictionAsked
          ? 'Which receipt remains useful?'
          : 'Cancellation observed; dependency decision pending'
      : journey !== venue
        ? 'Hours venue History ≠ journey venue Art'
        : 'Resource identity follows each dependency receipt',
    footer:
      beat === 2 && !answerRevealed
        ? predictionAsked
          ? 'Predict which dependency the cancellation invalidates'
          : 'Check each result against its resource identity'
        : beat === 2 && cancelled
          ? 'Venue hours remain valid while the cancelled journey needs fresh evidence'
          : beat === 2
            ? 'The replacement journey uses current History evidence'
            : 'Check each result against its resource identity',
  };
}
export function visitSchedule(
  hours = VISIT_HOURS,
  route = BUS_ROUTE,
  visitMinutes = 90,
  deadline = 1020,
) {
  const arrival = route.depart + route.minutes,
    finish = arrival + visitMinutes;
  return {
    arrival,
    finish,
    deadline,
    visitMinutes,
    feasible:
      hours.venue === route.venue &&
      hours.day === route.day &&
      arrival >= hours.opens &&
      finish <= hours.closes &&
      finish <= deadline,
  };
}
export function recommendationState(beat, p, hours = VISIT_HOURS, route = BUS_ROUTE) {
  const schedule = visitSchedule(hours, route),
    evaluated = beat >= 2 || (beat === 1 && p >= 0.4),
    ready = evaluated && schedule.feasible;
  return {
    ...schedule,
    hours,
    route,
    journeyProgress: beat === 0 ? 0 : beat > 1 ? 1 : progress(p, 0.02, 0.2),
    visitProgress: beat === 0 ? 0 : beat > 1 ? 1 : progress(p, 0.25, 0.4),
    evaluated,
    ready,
    status: ready
      ? 'Finish ' + clock(schedule.finish) + ' · fits deadline and closing'
      : evaluated
        ? 'Finish ' + clock(schedule.finish) + ' · task constraints fail'
        : 'Building the visit schedule',
    recommendation: ready
      ? 'Take the ' +
        clock(route.depart) +
        ' bus to the ' +
        hours.venue +
        ' Museum. Plan to leave at ' +
        clock(schedule.finish) +
        '.'
      : 'This visit needs another journey or a revised plan.',
  };
}
export function reactTrace(beat, p) {
  const v = beat > 0 ? 1 : p,
    observations =
      v >= 0.76
        ? [
            {
              kind: 'hours',
              status: 'closed',
              callId: 'hours-17',
            },
          ]
        : [];
  return {
    edges: [
      progress(v, 0, 0.25),
      progress(v, 0.25, 0.43),
      progress(v, 0.43, 0.76),
      progress(v, 0.76, 0.81),
    ],
    returned: v >= 0.43,
    observations,
    action: v >= 0.81 ? nextAction(observations) : 'check-hours',
  };
}
export function changedItinerary(visit = 90) {
  return visitSchedule(VISIT_HOURS, LATER_BUS_ROUTE, visit);
}
