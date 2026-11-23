import { cueProgress, fixedWindows, requiredPhrasesPresent } from '../arithmetic.mjs';
import { RUNBOOK, RUNBOOK_WORDS } from '../fixtures.mjs';

export function drawOverlapLimit(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const overlaps = [0, 2, 4];
  const index = Math.min(beat, overlaps.length - 1);
  const overlap = overlaps[index];
  const chunks = fixedWindows(RUNBOOK, 7, overlap);
  const progress = beat > 2 ? 1 : cueProgress(state, ['zero-overlap', 'two-overlap', 'four-overlap'][index], api.phase(p, 0.14, 0.50));
  const count = Math.min(chunks.length, Math.floor(progress * chunks.length + 1e-9));
  const built = chunks.slice(0, count);
  const cell = 93;
  const x = i => 202 + cell * i;
  const factStart = RUNBOOK_WORDS.indexOf('15');
  const ruleEnd = RUNBOOK_WORDS.indexOf('ID.') + 1;
  const holdsFact = w => w.start <= factStart && w.end >= ruleEnd;
  api.focus.target('overlap-page', () => {
    text(ctx, 'Window: 7 words', 128, 265, 38, C.ink);
    text(ctx, 'Overlap: ' + overlap + ' words', 775, 265, 38, C.blue);
    text(ctx, 'Step: ' + (7 - overlap) + ' words', 1780, 265, 38, C.ink, 'right');
    line(ctx, x(0), 350, x(ruleEnd) - 4, 350, C.muted, 3);
    text(ctx, 'Paging rule  /  10 words', x(0), 334, 28, C.muted);
    RUNBOOK_WORDS.forEach((word, i) => text(ctx, word, x(i + 0.5), 413, 24,
      i >= factStart && i < ruleEnd ? C.yellow : C.ink, 'center'));
    line(ctx, x(factStart), 437, x(ruleEnd) - 4, 437, C.yellow, 5);
    chunks.forEach((hit, i) => {
      const u = Math.max(0, Math.min(1, progress * chunks.length - i));
      if (u === 0) return;
      const y = 482 + 65 * i;
      // fixedWindows describes a half-open range, including its shorter final window.
      const end = x(hit.start + u * hit.words.length);
      text(ctx, 'Hit ' + (i + 1), 124, y + 28, 25, C.muted, 'center');
      rect(ctx, x(hit.start), y, Math.max(2, end - x(hit.start) - 3), 39, C.blue, undefined, 3);
      const lo = x(Math.max(hit.start, factStart));
      const hi = Math.min(end, x(Math.min(hit.end, ruleEnd))) - 3;
      if (hi > lo) rect(ctx, lo, y + 12, hi - lo, 15, C.yellow, undefined, 2);
    });
    const values = [
      ['Indexed word occurrences', built.reduce((n, hit) => n + hit.words.length, 0), C.blue],
      ['Hits with deadline and ID', built.filter(holdsFact).length, C.yellow],
      ['Hits with the whole rule', built.filter(hit => requiredPhrasesPresent(hit.text)).length, C.ink],
    ];
    values.forEach(([label, value, color], i) => {
      const wholeRule = i === 2;
      if (wholeRule && (beat < 2 || (beat === 2 && cueProgress(state, 'compare-whole-rule', api.phase(p, 0.55, 0.68)) === 0))) return;
      const waiting = wholeRule && beat === 2 && cueProgress(state, 'whole-rule-count', api.phase(p, 0.81, 0.94)) < 1;
      const cx = 390 + i * 568;
      text(ctx, waiting ? '?' : String(value), cx, 902, 62, color, 'center');
      text(ctx, label, cx, 968, 32, C.muted, 'center');
    });
  });
}

export default {
  id: 'overlap-limit', draw: drawOverlapLimit, cues: ['zero-overlap', 'two-overlap', 'four-overlap', 'compare-whole-rule', 'whole-rule-count'],
};
