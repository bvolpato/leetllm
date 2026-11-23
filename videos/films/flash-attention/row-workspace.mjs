import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';
import { SCORES, VALUES } from './fixtures.mjs';
import { summarize } from './model.mjs';

export const words = ['fix', 'this', 'test'];
export const first = summarize(SCORES.slice(0, 2), VALUES.slice(0, 2));
export const full = summarize(SCORES, VALUES);
export const fixed = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(3));

const estimates = new WeakMap();

// Untimed storyboards approximate the same phrases. Production supplies measured word cues.
export function rowClock(scene, state) {
  function cue(id) {
    if (state.cues) return state.cues[id];
    if (!estimates.has(scene)) {
      const spans = new Map(validateVisualCues(scene).map((c) => [c.id, c]));
      estimates.set(scene, spans);
    }
    const span = estimates.get(scene).get(id);
    if (!span) return;
    const count = lexicalTokens(scene.beats[span.beat].say).length;
    const word =
      state.beat < span.beat
        ? -1
        : state.beat > span.beat
          ? count + 1
          : ((state.beatP ?? 0) * count) / 0.9;
    const progress = Math.max(0, Math.min(1, (word - span.first) / (span.last + 1 - span.first)));
    return {
      phase: word < span.first ? 'before' : word < span.last + 1 ? 'during' : 'after',
      progress,
    };
  }
  return {
    started: (id) => ['during', 'after'].includes(cue(id)?.phase),
    done: (id) => cue(id)?.phase === 'after',
    progress: (id) => cue(id)?.progress ?? 0,
  };
}

export function scratch(
  ctx,
  api,
  { keys, values = VALUES, weights = [], label = 'Local tile', term = false },
) {
  const { C } = api;
  api.focus.target('scratch', () => {
    api.text(ctx, label, 116, 284, 36, C.ink);
    const rows = ['Score', 'Value', 'Weight'];
    if (term) rows.push('Weight × value');
    rows.forEach((word, r) => api.text(ctx, word, 116, 471 + r * 96, 31, C.muted));
    for (let i = 0; i < 2; i++) {
      const key = keys[i],
        x = 382 + 202 * i;
      const col = key === 2 ? C.yellow : C.blue;
      api.rect(ctx, x, 365, 172, term ? 425 : 329, C.panel, key == null ? C.muted : col, 8);
      api.text(
        ctx,
        key == null ? 'free' : words[key],
        x + 86,
        419,
        34,
        key == null ? C.muted : col,
        'center',
      );
      if (key == null) continue;
      const w = weights[i];
      const data = [SCORES[key], values[key], w == null ? '·' : fixed(w)];
      if (term) data.push(w == null ? '·' : fixed(w * values[key]));
      data.forEach((v, r) => api.text(ctx, v, x + 86, 475 + r * 96, 43, C.ink, 'center'));
    }
  });
}

export function reference(ctx, api, value, heading = 'Retained for this query') {
  api.focus.target('reference', () => {
    api.text(ctx, heading, 885, 284, 36, api.C.ink);
    api.text(ctx, value, 885, 386, 40, api.C.cyan);
  });
}

export function track(ctx, api, kind, { a = 0, b = 0, previous, readout } = {}) {
  const { C } = api;
  const weight = kind === 'weight';
  const title = weight ? 'Total weight' : 'Weighted value sum';
  const unit = weight ? 'ℓ' : 'u';
  const x = 888,
    y = weight ? 500 : 695,
    w = 815;
  const scale = w / (weight ? 2 : 50);
  api.focus.target(kind + '-track', () => {
    api.text(ctx, title, x, y, 36, C.ink);
    api.text(ctx, readout ?? unit + ' = ' + (a + b).toFixed(3), x + w, y, 38, C.ink, 'right');
    api.rect(ctx, x, y + 34, w, 42, C.panel, undefined, 0);
    if (a > 0) api.rect(ctx, x, y + 34, a * scale, 42, C.blue, undefined, 0);
    if (b > 0) api.rect(ctx, x + a * scale, y + 34, b * scale, 42, C.yellow, undefined, 0);
    if (previous != null) {
      const tick = x + previous * scale;
      api.line(ctx, tick, y + 21, tick, y + 91, C.muted, 3);
    }
    api.text(ctx, '0', x, y + 119, 25, C.muted);
    api.text(ctx, weight ? '2' : '50', x + w, y + 119, 25, C.muted, 'right');
  });
}

export function tileNote(ctx, api, note, color = api.C.ink) {
  api.focus.target('tile-note', () => api.text(ctx, note, 960, 952, 38, color, 'center'));
}
