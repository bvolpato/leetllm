import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

const cueSheets = new WeakMap();

// Source-only stills use the spoken word order. The delivered film uses measured cues.
export function caseClock(scene, state) {
  if (state.cueTiming === 'provider-words') return clockFrom(state.cues);
  let sheet = cueSheets.get(scene);
  if (!sheet) {
    sheet = new Map(
      validateVisualCues(scene).map((cue) => [
        cue.id,
        { ...cue, words: lexicalTokens(scene.beats[cue.beat].say).length },
      ]),
    );
    cueSheets.set(scene, sheet);
  }
  const cues = Object.fromEntries(
    [...sheet].map(([id, cue]) => {
      if (state.cues?.[id]) return [id, state.cues[id]];
      const beat = state.beat ?? 0;
      const word = (state.beatP ?? 0) * cue.words;
      const progress =
        beat < cue.beat
          ? 0
          : beat > cue.beat
            ? 1
            : Math.max(0, Math.min(1, (word - cue.first) / (cue.last + 1 - cue.first)));
      return [
        id,
        { progress, phase: progress === 1 ? 'after' : progress === 0 ? 'before' : 'during' },
      ];
    }),
  );
  return clockFrom(cues);
}

function clockFrom(cues) {
  return {
    cues,
    started: (id) => cues[id].phase !== 'before',
    done: (id) => cues[id].phase === 'after',
    progress: (id) => cues[id].progress,
  };
}

export function casePage(ctx, api) {
  return {
    C: api.C,
    text: (value, x, y, size = 38, color = api.C.ink, align = 'left', font = 'sans') =>
      api.text(ctx, String(value), x, y, size, color, align, font),
    rule: (x1, y1, x2, y2, color = api.C.muted, width = 2) =>
      api.line(ctx, x1, y1, x2, y2, color, width),
    box: (x, y, w, h, fill = api.C.panel, stroke) => api.rect(ctx, x, y, w, h, fill, stroke, 4),
    focus: (id, paint) => (api.focus ? api.focus.target(id, paint) : paint()),
  };
}
