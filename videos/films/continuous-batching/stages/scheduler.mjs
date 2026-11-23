import { schedule } from '../model.mjs';
import { cueProgress, drawEstablishedBatchingColor as requestColor } from '../defaults.mjs';

const trace = schedule(true);
const x = (pass) => 445 + (pass - 2) * 285;
const y = (seat) => 400 + seat * 157;

export function drawScheduler(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const arrived = beat > 1 || (beat === 1 && cueProgress(state, 'later-arrival', 0.03, 0.09) > 0);
  const fourth = beat > 1 || (beat === 1 && cueProgress(state, 'admission-boundary', 0.12, 0.23) > 0);
  const bDone = beat > 1 || (beat === 1 && cueProgress(state, 'scheduler-b-finishes', 0.34, 0.45) >= 1);
  const join = beat > 1 ? 1 : beat === 1 ? cueProgress(state, 'scheduler-e-joins', 0.46, 0.6) : 0;
  const third = beat > 0 || cueProgress(state, 'scheduler-launch', 0.84, 0.98) > 0;
  const last = join >= 1 ? 5 : fourth ? 4 : third ? 3 : 2;

  function cell(cx, cy, label, color) {
    api.rect(ctx, cx - 98, cy - 49, 196, 93, C.panel, color, 8);
    api.text(ctx, label, cx, cy + 12, 39, color, 'center');
  }

  api.focus.target('scheduler-mechanism', () => {
    if (beat === 2) {
      api.text(ctx, 'A different boundary', 960, 277, 43, C.ink, 'center');
      api.focus.target('scheduler-readout-4', () => {
        api.text(ctx, 'Decode seats', 240, 475, 40, C.muted);
        ['B', 'C', 'open'].forEach((id, i) =>
          cell(770 + i * 284, 460, id, requestColor(ctx, api, id)));
      });
      api.focus.target('scheduler-readout-2', () => {
        api.text(ctx, 'D needs', 240, 690, 40, C.yellow);
        cell(770, 675, 'page', C.yellow);
        cell(1054, 675, 'page', C.yellow);
        api.text(ctx, 'Only one page is free', 960, 887, 44, C.ink, 'center');
      });
      return;
    }
    api.focus.target('scheduler-readout', () => {
      for (let pass = 2; pass <= 5; pass++)
        api.text(ctx, 'Pass ' + pass, x(pass), 265, 40, pass <= last ? C.ink : C.muted, 'center');
    });
    api.focus.target('scheduler-readout-4', () => {
      for (let seat = 0; seat < 3; seat++) {
        const cy = y(seat);
        api.text(ctx, 'Seat ' + (seat + 1), 171, cy + 12, 34, C.muted);
        api.line(ctx, x(2) - 113, cy + 60, x(5) + 113, cy + 60, C.muted, 1);
        for (let pass = 2; pass <= last; pass++) {
          const entry = trace[pass - 1].slots[seat];
          if (pass === 5 && seat === 1) continue;
          const label = pass === 4 && !bDone ? entry.id : entry.id + ' · ' + entry.generated;
          cell(x(pass), cy, label, requestColor(ctx, api, entry.id));
        }
      }
    });
    api.focus.target('scheduler-readout-2', () => {
      let status = 'All reads, writes and transfers on A’s pages have finished.';
      if (third) status = 'D joins for pass 3. B and C keep their histories.';
      if (fourth) status = bDone ? 'B has finished its fourth turn.' : 'Three seats occupied for pass 4';
      if (join >= 1) status = 'E starts with its own history in the seat B released.';
      api.text(ctx, status, 960, 926, 37, C.ink, 'center');
    });
    api.focus.target('scheduler-readout-3', () => {
      if (beat === 0 && !third) {
        api.text(ctx, 'Waiting', 1620, 289, 34, C.muted, 'center');
        cell(1620, y(0), 'D', C.yellow);
      }
      if (arrived) {
        if (join === 0) api.text(ctx, 'Waiting', 1620, 424, 34, C.muted, 'center');
        cell(api.lerp(1620, x(5), api.ease(join)), y(1), join >= 1 ? 'E · 1' : 'E', C.green);
      }
    });
  });
}

export default {
  id: 'scheduler',
  draw: drawScheduler,
  cues: ['iteration-boundary', 'fitting-request', 'scheduler-launch', 'later-arrival', 'admission-boundary',
    'scheduler-b-finishes', 'scheduler-e-joins', 'empty-correct', 'request-fits'],
};
