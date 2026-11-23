import { REPORT } from '../fixtures.mjs';
import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { drawPromptText } from '../defaults.mjs';

export function drawEntryAndObjective(ctx, scene, state, api) {
  const { C } = api;
  const begun = (id) => cueBegun(state.cues, id, false);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);
  api.focus.target('entry-origin', () => {
    api.line(ctx, 126, 262, 126, 385, C.blue, 7);
    text('External report author', 160, 295, 28, C.blue);
    text('“' + REPORT.attack + '”', 160, 365, 48);
  });
  const lanes = [
    { id: 'paste', y: 548, label: 'Colleague pastes into chat', result: 'Direct injection' },
    { id: 'fetch', y: 724, label: 'Assistant fetches report', result: 'Indirect injection' },
  ];
  for (const { id, y, label, result } of lanes) {
    const cue = 'entry-' + id;
    if (!begun(cue) && id === 'fetch') continue;
    const p = cueProgress(state.cues, cue, 0);
    api.focus.target(cue, () => {
      text(label, 132, y + 6, 32);
      if (p > 0) {
        const x = 610 + 456 * p;
        if (x > 620) api.line(ctx, 610, y, x - 7, y, C.blue, 3);
        api.line(ctx, x + 341, y, 1422, y, C.muted, 3);
        api.rect(ctx, x, y - 36, 334, 72, C.panel, C.blue, 6);
        text('Report excerpt', x + 25, y + 12, 33, C.blue);
      } else api.line(ctx, 610, y, 1422, y, C.muted, 3);
      if (after(cue)) text(result, 1466, y + 12, 34, C.cyan);
    });
  }
  api.focus.target('entry-effect', () => {
    api.line(ctx, 125, 845, 1790, 845, C.muted, 2);
    const label = begun('entry-session')
      ? 'Session user-17   /   Read R42 and return a summary'
      : begun('entry-media')
        ? 'OCR or transcript   /   Preserve the original source'
        : begun('entry-objective')
          ? 'Requested effect in both cases   /   Release C17'
          : '';
    if (label) text(label, 130, 949, 39);
  });
}
export default {
  id: 'entry-and-objective',
  draw: drawEntryAndObjective,
  cues: [
    'entry-source',
    'entry-paste',
    'entry-fetch',
    'entry-objective',
    'entry-media',
    'entry-session',
  ],
};
