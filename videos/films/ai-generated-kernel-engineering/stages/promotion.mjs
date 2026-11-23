import { mix } from '../arithmetic.mjs';
import { sceneClock } from '../worksheet.mjs';

export function drawPromotion(ctx, scene, state, api) {
  const { C } = api;
  const { progress, after } = sceneClock(state);
  const submitted = progress('kg-recovery-submit', 0, 0.04, 0.21);
  const fault = after('kg-recovery-fault', 0, 0.42, 0.59);
  const off = after('kg-recovery-disable', 0, 0.6, 0.69);
  const next = after('kg-recovery-next', 0, 0.7, 0.85);
  const direct = progress('kg-recovery-new-route', 1, 0.05, 0.19);
  const replacement = after('kg-recovery-replace', 1, 0.35, 0.5);
  const retry = progress('kg-recovery-retry', 1, 0.58, 0.73);
  const done = after('kg-recovery-done', 1, 0.74, 0.85);
  const label = (s, x, y, size, color = C.ink, align = 'left') => api.text(ctx, s, x, y, size, color, align);
  const packet = (s, x, y, w, color) => {
    api.rect(ctx, x, y, w, 65, C.panel, color, 5);
    label(s, x + w / 2, y + 45, 31, color, 'center');
  };
  api.focus.target('recovery-paths', () => {
    label('Canary recovery drill', 155, 263, 35, C.muted);
    label('Candidate routing    ' + (off ? 'OFF' : 'ON'), 1740, 263, 39, off ? C.yellow : C.cyan, 'right');
    const from = 430, to = 1030;
    for (const y of [421, 643, 848]) api.line(ctx, from, y, to + 260, y, C.muted, 2);
    label('Submitted', 358, 435, 37, C.blue, 'right');
    label('New arrival', 358, 657, 37, C.cyan, 'right');
    label('Saved retry', 358, 862, 37, C.yellow, 'right');
    packet('R1', mix(from, to, submitted), 388, 130, C.blue);
    label('Worker W17', 1375, 403, 39, fault ? C.pink : C.ink);
    label(replacement ? 'Process terminated' : fault ? 'Illegal address' : 'Candidate', 1375, 463, 33, fault ? C.pink : C.muted);
    if (next) packet('R2', mix(from, to, direct), 610, 130, C.cyan);
    label('Healthy reference', 1375, 647, 35, C.cyan);
    if (after('kg-recovery-new-route', 1, 0.05, 0.19))
      label('R2 routed directly', 1375, 703, 31, C.cyan);
    packet('R1 · input A · key K', mix(from, to - 65, retry), 815, 354, C.yellow);
    label(replacement ? 'Worker W18' : 'Retry target', 1375, 838, 39, replacement ? C.green : C.muted);
    label(done ? 'Reference returned R1' : replacement ? 'Healthy reference' : 'Await replacement', 1375, 894, 31, done ? C.green : C.muted);
    if (done)
      label('R1 completed after retry   ·   R2 used the reference on arrival', 960, 1003, 38, C.green, 'center');
    else if (next && direct === 0)
      label('Which request still needs recovery?', 960, 1003, 42, C.yellow, 'center');
    else if (submitted > 0)
      label('The service retains R1’s input and retry key outside W17.', 960, 1003, 33, C.muted, 'center');
  });
}
export default {
  id: 'promotion', draw: drawPromotion,
  cues: ['kg-recovery-submit', 'kg-recovery-fault', 'kg-recovery-disable', 'kg-recovery-next',
    'kg-recovery-new-route', 'kg-recovery-replace', 'kg-recovery-retry', 'kg-recovery-done'],
};
