import { sampleModel } from '../model.mjs';
import { prompt } from '../fixtures.mjs';
import { movement } from '../replay.mjs';
import { ruler, slot } from '../strips.mjs';

const x = 365;
const width = 179;

export function drawGeneration(ctx, scene, state, api) {
  const { C } = api;
  const model = sampleModel('generation', state);
  const prefill = movement(state, 0, 'generation-beat-1-focus-2');
  const cache = prefill < 1 && state.beat === 0 ? [] : model.cached;
  const forwards = prefill < 1 && state.beat === 0 ? 0 : model.forwardCount;
  api.focus.target('generation-tracks', () => {
    api.text(
      ctx,
      '“' + model.sequence.join(' ').replace(' .', '.') + '”',
      100,
      279,
      64,
      C.ink,
      'left',
      'serif',
    );
    ruler(ctx, api, x, 374, width, 8);
    api.text(ctx, 'Sequence', 100, 480, 38, C.blue);
    api.text(ctx, 'Cached KV', 100, 714, 38, C.cyan);
    for (let i = 0; i < 8; i++) {
      const left = x + i * width;
      const pending = model.sequence[i] !== undefined && i >= cache.length;
      slot(ctx, api, {
        x: left,
        y: 417,
        width,
        word: model.sequence[i],
        size: 36,
        color: pending && i >= prompt.length ? C.yellow : C.blue,
      });
      slot(ctx, api, { x: left, y: 649, width, word: cache[i], size: 36, color: C.cyan });
      if (prefill > 0 && prefill < 1 && i < prompt.length) {
        api.line(ctx, left + width / 2, 552, left + width / 2, 552 + 78 * prefill, C.cyan, 5);
      }
    }
    if (model.forwarding) {
      const cx = x + (cache.length + 0.5) * width;
      api.line(ctx, cx, 543, cx, 543 + 92 * model.forwardProgress, C.cyan, 5);
      api.circle(ctx, cx, 543 + 92 * model.forwardProgress, 9, C.cyan);
    }
    if (model.sequence.length > cache.length && cache.length >= prompt.length) {
      const cx = x + (cache.length + 0.5) * width;
      api.text(ctx, state.beat === 0 ? '?' : 'Open slot', cx, 709, 29, C.yellow, 'center');
    }
    api.text(ctx, model.sequence.length + ' returned tokens', 100, 893, 45, C.blue);
    api.text(ctx, cache.length + ' cached positions', 715, 893, 45, C.cyan);
    api.text(ctx, forwards + (forwards === 1 ? ' forward' : ' forwards'), 1450, 893, 45, C.ink);
    api.text(
      ctx,
      model.resumed
        ? 'Scores ready after the period. No further selection.'
        : 'Illustrative greedy run   /   one beam   /   sampling off',
      100,
      1000,
      33,
      model.resumed ? C.green : C.muted,
    );
  });
}

export default {
  id: 'generation',
  draw: drawGeneration,
  cues: [
    'generation-beat-1-focus-2',
    'generation-first-selection',
    'generation-first-question',
    'generation-forward-near',
    'generation-select-home',
    'generation-forward-home',
    'generation-third-selection',
    'generation-stop',
    'generation-resume-final',
    'generation-stop-count',
  ],
};
