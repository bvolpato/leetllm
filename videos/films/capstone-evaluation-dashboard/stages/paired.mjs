import { DASHBOARD_FIXTURES, drawIds, keys, rowNames } from '../fixtures.mjs';
import {
  dashboardCue,
  dashboardPairs,
  dashboardRows,
  dashboardStarted,
  percentileBand,
  resamples,
  sum,
} from '../arithmetic.mjs';
import {
  dashboardCell as cell,
  dashboardText as text,
  dashboardLine as line,
} from '../defaults.mjs';

const before = dashboardRows('extractive-v1');
const arrivalOrder = [0, 3, 2, 1];
const signed = (v) => (v > 0 ? '+' + v : String(v).replace('-', '−'));

export function drawPaired(ctx, scene, state, api) {
  const b = state.beat ?? 0;
  const { C } = api;
  const align = b > 0 ? 1 : dashboardCue(state, 'align-ids', state.beatP > 0.7 ? 1 : 0);
  const repaired = b > 1 || (b === 1 && dashboardStarted(state, 'switch-pair', state.beatP > 0.5));
  const candidate = dashboardRows(repaired ? 'hybrid-v2' : 'hybrid-v1');
  const file = arrivalOrder.map((i) => candidate[i]);
  const pairs = dashboardPairs(before, file);
  const changes = DASHBOARD_FIXTURES.map((f) => pairs.find((row) => row.id === f.id).delta);
  api.focus.target('matched-rows', () => {
    if (b < 2) {
      text(ctx, api, 'Fixture', 130, 290, 33, C.muted);
      text(ctx, api, 'extractive-v1', 710, 290, 33, C.blue, 'center', 'mono');
      text(ctx, api, candidate[0].run, 1190, 290, 33, C.blue, 'center', 'mono');
      text(ctx, api, 'Change', 1650, 290, 33, C.muted, 'center');
      before.forEach((row, i) => {
        const y = 385 + i * 122;
        line(ctx, api, 125, y + 65, 1795, y + 65, C.panel, 2);
        text(ctx, api, keys[i] + '   ' + rowNames[i], 130, y + 17, 37, C.ink);
        text(
          ctx,
          api,
          Number(row.passed),
          710,
          y + 17,
          48,
          row.passed ? C.green : C.pink,
          'center',
        );
        if (align >= 1)
          text(
            ctx,
            api,
            signed(changes[i]),
            1650,
            y + 17,
            48,
            changes[i] < 0 ? C.pink : changes[i] > 0 ? C.green : C.muted,
            'center',
          );
      });
      file.forEach((row, slot) => {
        const dest = before.findIndex((r) => r.id === row.id);
        const bend = Math.sign(dest - slot) * 245 * Math.sin(Math.PI * align);
        const x = 1190 + bend;
        const y = 385 + 122 * (slot + (dest - slot) * align);
        cell(
          ctx,
          api,
          keys[dest] + '     ' + Number(row.passed),
          x - 99,
          y - 40,
          198,
          80,
          row.passed ? C.green : C.pink,
          37,
        );
      });
      const mean = sum(changes) / changes.length;
      const footer =
        align < 1
          ? 'Can you pair these rows by position?'
          : repaired
            ? 'One additional pass / four fixtures = ' + mean * 100 + ' percentage points'
            : 'One gain and one loss     ·     Net change ' + mean * 100 + ' points';
      text(ctx, api, footer, 960, 958, 40, C.yellow, 'center');
    } else {
      const rows = ['Fixture drawn', 'Baseline pass', 'Candidate pass', 'Added pass'];
      rows.forEach((label, i) => text(ctx, api, label, 130, 335 + i * 118, 34, C.ink));
      drawIds.forEach((source, slot) => {
        const x = 640 + 305 * slot;
        const values = [
          keys[source],
          Number(before[source].passed),
          Number(candidate[source].passed),
          signed(changes[source]),
        ];
        values.forEach((v, i) =>
          text(
            ctx,
            api,
            v,
            x,
            335 + i * 118,
            47,
            i === 3 && changes[source] ? C.yellow : C.ink,
            'center',
          ),
        );
      });
      line(ctx, api, 130, 625, 1770, 625, C.muted, 2);
      const extra = sum(drawIds.map((i) => changes[i]));
      text(
        ctx,
        api,
        'This draw     ' + extra + ' added passes / 4 = +' + (extra / 4) * 100 + ' points',
        960,
        839,
        42,
        C.yellow,
        'center',
      );
      if (dashboardStarted(state, 'paired-band', state.beatP > 0.55)) {
        const [low, high] = percentileBand(
          resamples(
            before.map((r) => r.passed),
            candidate.map((r) => r.passed),
          ),
        );
        text(
          ctx,
          api,
          'Across resamples     ' + 100 * low + ' to ' + 100 * high + ' percentage points',
          960,
          944,
          38,
          C.ink,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'paired',
  draw: drawPaired,
  cues: ['align-ids', 'switch-pair', 'paired-band'],
};
