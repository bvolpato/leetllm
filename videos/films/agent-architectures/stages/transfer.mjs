import { BUS_ROUTE, VISIT_HOURS } from '../fixtures.mjs';
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

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const hours = VISIT_HOURS,
    route = BUS_ROUTE;
  const schedule = visitSchedule(hours, route);
  const receipt = (target, text, y, color) =>
    api.focus.target(target, () => {
      api.rect(ctx, 180, y, 1560, 86, C.panel, color, 8);
      api.text(ctx, text, 245, y + 58, 35, color);
    });
  const hoursIn = beat ? 1 : cueAmount(state, 'transfer-b1-1');
  const routeIn = beat ? 1 : cueAmount(state, 'transfer-b1-2');
  api.text(ctx, 'Your request   /   90 minutes inside, finish by 17:00', 180, 269, 39, C.ink);
  receipt(
    'hours-evidence',
    hours.id + ' · ' + hours.venue + ' / ' + hours.day + ' / closes ' + clock(hours.closes),
    650 - 310 * hoursIn,
    C.green,
  );
  receipt(
    'route-evidence',
    route.id +
      ' · ' +
      route.venue +
      ' / ' +
      route.day +
      ' / bus ' +
      clock(route.depart) +
      ' / journey ' +
      route.minutes +
      ' min',
    820 - 365 * routeIn,
    C.cyan,
  );
  if (beat === 0) return;
  clockLimits(ctx, api, schedule, 640);
  timeStrip(ctx, api, timetableY);
  const ride = cueAmount(state, 'transfer-b2-1');
  const visit = cueAmount(state, 'transfer-b2-2');
  const finish = cueDone(state, 'transfer-finish');
  api.focus.target('journey-duration', () => {
    markTime(ctx, api, route.depart, timetableY, clock(route.depart), C.cyan);
    durationBar(ctx, api, route.depart, ride * route.minutes, timetableY, C.cyan);
    if (cueDone(state, 'transfer-arrival'))
      markTime(ctx, api, schedule.arrival, timetableY, clock(schedule.arrival), C.ink, true);
  });
  api.focus.target('visit-duration', () => {
    // Leave the terminal mark open until the finish clause completes.
    const progress = visit * 0.75 + cueAmount(state, 'transfer-finish') * 0.25;
    durationBar(ctx, api, schedule.arrival, schedule.visitMinutes * progress, timetableY, C.yellow);
    if (finish)
      markTime(ctx, api, schedule.finish, timetableY, 'finish ' + clock(schedule.finish), C.ink);
    const margin = schedule.deadline - schedule.finish;
    let status =
      clock(route.depart) +
      '  +  ' +
      route.minutes +
      ' min on the bus  +  ' +
      schedule.visitMinutes +
      ' min inside';
    if (finish) status += '  =  ' + clock(schedule.finish);
    if (cueDone(state, 'transfer-limits') && schedule.feasible)
      status =
        'Take the ' +
        clock(route.depart) +
        ' bus to History. Leave at ' +
        clock(schedule.finish) +
        '.';
    if (cueDone(state, 'transfer-b3-1')) {
      const from = clockX(schedule.finish);
      const to = clockX(schedule.deadline);
      api.line(ctx, from, 852, to, 852, C.green, 4);
      for (const x of [from, to]) api.line(ctx, x, 842, x, 862, C.green, 4);
      api.text(ctx, margin + ' min to spare', (from + to) / 2, 907, 31, C.green, 'center');
    }
    api.text(ctx, status, 960, 994, 39, C.ink, 'center');
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-b1-1',
    'transfer-b1-2',
    'transfer-b2-1',
    'transfer-arrival',
    'transfer-b2-2',
    'transfer-finish',
    'transfer-limits',
    'transfer-b3-1',
  ],
};
