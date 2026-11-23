import { trace } from '../fixtures.mjs';
import { admissionReceipt } from '../arithmetic.mjs';
import { phraseEnded, phraseProgress } from '../construction.mjs';

const longGroup = trace.at(-1);

export function drawCapacity(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const events = [
    ['capacity-next-b', 1, 0.12],
    ['capacity-next-c', 1, 0.58],
    ['capacity-l-arrives', 2, 0.25],
  ];
  const rowCount = 1 + events.filter(([id, beat, at]) => end(id, beat, at)).length;
  const showLag = end('capacity-age', 3, 0.35);
  const decision = end('capacity-train', 3, 0.72);
  const current = trace[rowCount - 1];
  const B = 1,
    S = 2;
  api.text(ctx, 'Before each update', 125, 266, 42, C.ink, 'left', 'serif');
  api.text(
    ctx,
    '1 group per update     S = 2     room for 3 groups',
    1790,
    265,
    35,
    C.cyan,
    'right',
  );

  trace.forEach((row, j) => {
    const x = 130 + j * 425;
    api.focus.target('capacity-step-' + row.step, () =>
      api.text(ctx, 'Step ' + row.step, x + 180, 357, 40, j < rowCount ? C.ink : C.muted, 'center'),
    );
    if (j >= rowCount) return;
    const r = admissionReceipt({ ...row, B, S, workers: 3 });
    const shortReady = trace
      .slice(r.consumed, r.accepted)
      .filter((group) => group.id !== longGroup.id);
    const slots = [shortReady[0]?.id, shortReady[1]?.id, longGroup.id];
    api.focus.target('capacity-step-' + row.step, () => {
      slots.forEach((id, i) => {
        const y = 395 + i * 103;
        const running = id === longGroup.id && row.step < longGroup.step;
        const color = !id ? C.muted : running ? C.yellow : C.blue;
        api.rect(ctx, x, y, 360, 82, C.panel, color, 10);
        const label = !id ? 'free' : id + (running ? '   generating' : '   ready');
        api.text(ctx, label, x + 180, y + 54, id ? 34 : 28, color, 'center');
      });
      api.text(
        ctx,
        `${r.accepted} + ${r.running} − ${r.consumed}`,
        x + 180,
        763,
        38,
        C.ink,
        'center',
      );
      api.text(
        ctx,
        `${r.outstanding} / ${r.budget} outstanding`,
        x + 180,
        830,
        31,
        C.cyan,
        'center',
      );
    });
  });

  // L stays in the same slot while each new pre-consumption snapshot comes into view.
  events.forEach(([id, beat, at], j) => {
    const move = phraseProgress(state, api, id, beat, 0, at);
    if (move > 0) {
      const start = 495 + 425 * j;
      api.line(ctx, start, 642, start + move * 55, 642, C.yellow, 5);
    }
  });
  api.focus.target('capacity-decision', () => {
    const lag = current.step - longGroup.scheduled;
    const last = rowCount === trace.length;
    const status = last
      ? decision
        ? `Train L at step ${current.step}    ·    log lag ${lag}`
        : showLag
          ? `Scheduling lag   ${current.step} − ${longGroup.scheduled} = ${lag}     ·     S = ${S}`
          : 'L started at step 1. Does its age force SkyRL to drop it?'
      : 'L started at step 1    ·    waiting for the database';
    api.text(ctx, status, 960, 934, 40, decision ? C.green : C.yellow, 'center');
  });
  api.text(
    ctx,
    'Outstanding = accepted so far + running − previously consumed',
    960,
    1011,
    31,
    C.muted,
    'center',
  );
}
export default {
  id: 'capacity',
  draw: drawCapacity,
  cues: [
    'capacity-first',
    'capacity-next-b',
    'capacity-next-c',
    'capacity-l-arrives',
    'capacity-question',
    'capacity-age',
    'capacity-train',
  ],
};
