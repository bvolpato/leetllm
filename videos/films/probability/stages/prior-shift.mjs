import { cueProgress } from '../construction.mjs';
import { priorSnapshot } from '../model.mjs';
import { focus, rectangle, text } from '../defaults.mjs';

export function drawPriorShift(ctx, scene, state, api) {
  const { C } = api;
  const s = priorSnapshot(state.beat, state.beatP, state.cues);
  const result = cueProgress(state, 'prior-result', 2) === 1;
  const left = 230;
  const width = 1460;
  focus(api, 'prior-controls', () => {
    text(ctx, api, 'All 10,000 signups', left, 298, 43, C.ink, 'left');
    text(ctx, api, 'Abuse share   ' + (100 * s.prior).toFixed(1) + '%', left + width, 298, 40, C.red, 'right');
    const boundary = width * s.prior;
    rectangle(ctx, api, left, 344, boundary, 64, C.red);
    rectangle(ctx, api, left + boundary, 344, width - boundary, 64, C.blue);
    text(ctx, api, '95% of abusive signups flagged', left, 482, 36, C.red, 'left');
    text(ctx, api, '5% of clean signups flagged', left + width, 482, 36, C.blue, 'right');
  });
  focus(api, 'prior-masses', () => {
    text(ctx, api, 'Review queue', left, 625, 43, C.ink, 'left');
    const scale = width / 1400;
    rectangle(ctx, api, left, 678, width, 86, C.panel);
    rectangle(ctx, api, left, 678, s.tp * scale, 86, C.red);
    rectangle(ctx, api, left + s.tp * scale, 678, s.fp * scale, 86, C.blue);
    text(ctx, api, 'Abusive  ' + Math.round(s.tp), left, 831, 42, C.red, 'left');
    text(ctx, api, 'Clean  ' + Math.round(s.fp), left + width, 831, 42, C.blue, 'right');
    const initial = state.beat === 0;
    const label = initial || result
      ? Math.round(s.tp) + ' / ' + Math.round(s.total) + '  ≈  ' + (100 * s.posterior).toFixed(1) + '% abusive'
      : 'What fraction of this queue is abusive?';
    text(ctx, api, label, 960, 971, 50, C.yellow);
  });
}
export default { id: 'prior-shift', draw: drawPriorShift, cues: ['prior-prediction', 'prior-change', 'prior-result'] };
