import { BUS_ROUTE, LATER_BUS_ROUTE, VISIT_HOURS } from '../fixtures.mjs';
import { clock } from '../arithmetic.mjs';
import { visitSchedule } from '../model.mjs';
import { cueAmount, cueDone } from '../defaults.mjs';
import {
  clockLimits,
  clockX,
  durationBar,
  markTime,
  timetableY,
  timeStrip,
} from '../visit-clock.mjs';

export function drawFreshItinerary(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const change = beat ? 1 : cueAmount(state, 'fresh-bus');
  const old = visitSchedule();
  const original = visitSchedule(VISIT_HOURS, LATER_BUS_ROUTE);
  const shortened = cueDone(state, 'fresh-short');
  const active = shortened ? visitSchedule(VISIT_HOURS, LATER_BUS_ROUTE, 70) : original;
  const ride = beat > 1 ? 1 : cueAmount(state, 'fresh-arrival');
  const knownLate = beat > 1 || cueDone(state, 'fresh-finish');
  const knownRepair = cueDone(state, 'fresh-repaired');
  const finishKnown = shortened ? knownRepair : knownLate;
  const lateVerdict = beat > 1 || cueDone(state, 'fresh-failed');
  const verdict = shortened ? cueDone(state, 'fresh-repair-pass') : lateVerdict;

  api.focus.target('clock', () => {
    api.text(ctx, 'History Museum  /  today', 150, 253, 35, C.ink);
    api.text(
      ctx,
      VISIT_HOURS.id + '   /   ' + clock(VISIT_HOURS.opens) + ' to ' + clock(VISIT_HOURS.closes),
      1760,
      253,
      30,
      C.muted,
      'right',
    );
    const referenceY = timetableY - 280 * change;
    if (change === 1) {
      api.text(ctx, 'Previous bus', 145, referenceY - 9, 29, C.muted);
      api.text(ctx, clock(BUS_ROUTE.depart), 145, referenceY + 37, 34, C.muted);
    }
    durationBar(
      ctx,
      api,
      BUS_ROUTE.depart,
      BUS_ROUTE.minutes,
      referenceY,
      change ? C.muted : C.cyan,
      44 - 30 * change,
    );
    durationBar(
      ctx,
      api,
      old.arrival,
      old.visitMinutes,
      referenceY,
      change ? C.muted : C.yellow,
      44 - 30 * change,
    );
    markTime(ctx, api, old.finish, referenceY, 'finish ' + clock(old.finish), C.muted, true);
    clockLimits(ctx, api, active, 630);
    timeStrip(ctx, api, timetableY);
    if (change === 1) {
      api.text(ctx, 'Next bus', 145, 683, 30, C.cyan);
      api.text(ctx, LATER_BUS_ROUTE.id, 145, 735, 27, C.muted);
      markTime(ctx, api, LATER_BUS_ROUTE.depart, timetableY, clock(LATER_BUS_ROUTE.depart), C.cyan);
      api.text(
        ctx,
        clock(LATER_BUS_ROUTE.depart) +
          '  +  ' +
          LATER_BUS_ROUTE.minutes +
          ' min ride  +  ' +
          active.visitMinutes +
          ' min inside',
        150,
        575,
        33,
        C.ink,
      );
    }
    if (ride > 0)
      durationBar(
        ctx,
        api,
        LATER_BUS_ROUTE.depart,
        LATER_BUS_ROUTE.minutes * ride,
        timetableY,
        C.cyan,
      );
    if (ride === 1) {
      markTime(ctx, api, active.arrival, timetableY, clock(active.arrival), C.ink, true);
      let minutes = knownLate
        ? original.visitMinutes
        : Math.max(0.4, original.visitMinutes * cueAmount(state, 'fresh-finish'));
      if (shortened) {
        const trim = knownRepair
          ? 1
          : cueAmount(state, 'fresh-trim') * 0.7 + cueAmount(state, 'fresh-repaired') * 0.3;
        minutes = original.visitMinutes - (original.visitMinutes - active.visitMinutes) * trim;
        api.line(ctx, clockX(active.arrival), 772, clockX(original.finish), 772, C.muted, 3);
        api.line(ctx, clockX(original.finish), 765, clockX(original.finish), 781, C.muted, 3);
      }
      const color = verdict ? (active.feasible ? C.green : C.pink) : C.yellow;
      durationBar(ctx, api, active.arrival, minutes, timetableY, color);
      if (finishKnown)
        markTime(ctx, api, active.finish, timetableY, 'finish ' + clock(active.finish), color);
      if (shortened && verdict && cueDone(state, 'fresh-margin')) {
        const finish = clockX(active.finish);
        const deadline = clockX(active.deadline);
        api.line(ctx, finish, 850, deadline, 850, C.green, 3);
        for (const x of [finish, deadline]) api.line(ctx, x, 839, x, 861, C.green, 3);
        api.text(
          ctx,
          active.deadline - active.finish + ' min to spare',
          finish - 18,
          860,
          32,
          C.green,
          'right',
        );
      }
    }
  });
  api.focus.target('decision', () => {
    let line = '';
    if (cueAmount(state, 'fresh-question') > 0 || beat > 0)
      line = 'When would you finish? Does that meet your deadline?';
    if (finishKnown) line = 'Compare the finish with each time limit.';
    if (lateVerdict && !shortened)
      line =
        'Museum still open   /   user deadline fails by ' +
        (original.finish - original.deadline) +
        ' min';
    if (shortened)
      line = 'Visitor approved ' + active.visitMinutes + ' minutes inside. Same bus and arrival.';
    if (shortened && verdict && active.feasible)
      line =
        'Both limits pass. Take the ' +
        clock(LATER_BUS_ROUTE.depart) +
        ' bus for the ' +
        active.visitMinutes +
        '-minute visit.';
    if (line) api.text(ctx, line, 960, 966, 40, C.ink, 'center');
  });
}
export default {
  id: 'fresh-itinerary',
  draw: drawFreshItinerary,
  cues: [
    'fresh-bus',
    'fresh-inputs',
    'fresh-question',
    'fresh-arrival',
    'fresh-finish',
    'fresh-failed',
    'fresh-short',
    'fresh-trim',
    'fresh-repaired',
    'fresh-repair-pass',
    'fresh-margin',
  ],
};
