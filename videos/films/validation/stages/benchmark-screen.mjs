import { phraseProgress } from '../defaults.mjs';

const reference = 'keep audit logs for seven days';
const candidates = [reference, 'retain audit records for one week'];

function fiveGrams(text) {
  const words = text.toLowerCase().split(/\s+/);
  return words.slice(4).map((_, i) => words.slice(i, i + 5).join(' '));
}

export function drawBenchmarkScreen(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const referenceGrams = fiveGrams(reference);
  if (beat <= 3) {
    const candidate = candidates[beat < 2 ? 0 : 1];
    const windows = fiveGrams(candidate);
    const scan =
      beat === 3
        ? phraseProgress(state, api, 'compare-word-windows', 3, 0, 0.07)
        : beat === 1
          ? api.phase(state.beatP ?? 0, 0.02, 0.28)
          : 0;
    const complete =
      beat === 3 ? phraseProgress(state, api, 'no-shared-window', 3, 0.08, 0.14) === 1 : scan === 1;
    const n = windows.filter((g) => referenceGrams.includes(g)).length;
    const left = 185;
    const step = 305;
    api.focus.target('word-windows', () =>
      [reference, candidate].forEach((phrase, i) => {
        const y = 459 + i * 227;
        api.text(ctx, i ? 'Evaluation prompt' : 'Training text', left - 45, y - 91, 32, C.muted);
        phrase
          .split(' ')
          .forEach((word, j) => api.text(ctx, word, left + step * j, y, 45, C.ink, 'center'));
        const start = left + step * scan - 68;
        const end = start + 4 * step + 136;
        api.line(ctx, start, y + 24, end, y + 24, i ? C.yellow : C.blue, 4);
        api.line(ctx, start, y + 14, start, y + 24, i ? C.yellow : C.blue, 4);
        api.line(ctx, end, y + 14, end, y + 24, i ? C.yellow : C.blue, 4);
      }),
    );
    const verdict = complete
      ? n + ' shared five-word sequences  ·  ' + (n ? 'Flag for review' : 'No exact match')
      : beat === 2
        ? 'Will a five-word window match?'
        : 'Compare five consecutive words at a time';
    api.focus.target('window-result', () =>
      api.text(ctx, verdict, 960, 884, 44, complete ? C.yellow : C.ink, 'center'),
    );
    if (beat === 3 && complete)
      api.text(
        ctx,
        'A week and seven days give the same instruction.',
        960,
        980,
        34,
        C.ink,
        'center',
      );
  } else {
    api.text(ctx, 'Candidate pair', 140, 295, 34, C.muted);
    api.text(ctx, reference, 140, 408, 48, C.blue);
    api.text(ctx, candidates[1], 140, 500, 48, C.ink);
    api.line(ctx, 140, 567, 1750, 567, C.muted, 2);
    api.text(ctx, 'Before treating it as new', 140, 685, 35, C.yellow);
    api.text(ctx, 'Trace the two prompts to their source pages.', 140, 780, 43, C.ink);
    api.text(
      ctx,
      'Check the dated release, training cutoff, and later access.',
      140,
      872,
      38,
      C.ink,
    );
  }
}

export default {
  id: 'benchmark-screen',
  draw: drawBenchmarkScreen,
  cues: ['compare-word-windows', 'no-shared-window'],
};
