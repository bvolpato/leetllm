import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

const untimedScenes = new WeakMap();
let authoredScenes;

// Word timing drives delivery. Untimed storyboards place each cue at its share of the beat.
export function cueClock(scene, state) {
  if (state.cues) return (id) => state.cues[id];
  if (!scene.beats) {
    // A compact storyboard can supply just the scene ID and beat position.
    authoredScenes ??= parse(
      readFileSync(new URL('../../lessons/human-approval.lesson.yaml', import.meta.url), 'utf8'),
    ).scenes;
    scene = authoredScenes.find((entry) => entry.id === scene.id);
  }
  if (!untimedScenes.has(scene)) {
    const cues = validateVisualCues(scene);
    untimedScenes.set(
      scene,
      new Map(
        cues.map((cue) => {
          const words = lexicalTokens(scene.beats[cue.beat].say).length;
          return [
            cue.id,
            { ...cue, start: cue.beat + cue.first / words, end: cue.beat + (cue.last + 1) / words },
          ];
        }),
      ),
    );
  }
  const position = (state.beat ?? 0) + (state.beatP ?? 0);
  return (id) => {
    const { start, end } = untimedScenes.get(scene).get(id);
    return {
      phase: position < start ? 'before' : position < end ? 'during' : 'after',
      progress: Math.max(0, Math.min(1, (position - start) / (end - start))),
    };
  };
}

// Twenty fixed slots keep the proposed and live shares on the same scale.
export function trafficStrip(ctx, api, x, y, width, percent, color) {
  const pitch = width / 20;
  for (let i = 0; i < 20; i++) {
    const filled = i * 5 < percent;
    api.rect(
      ctx,
      x + pitch * i,
      y,
      pitch - 5,
      68,
      filled ? color : api.C.panel,
      filled ? color : api.C.muted,
      3,
    );
  }
}

export function trafficRow(ctx, api, { y, label, detail, percent, color, value = percent + '%' }) {
  if (label) api.text(ctx, label, 115, y, 44, api.C.ink);
  api.text(ctx, detail, 115, y + 64, 31, api.C.muted);
  trafficStrip(ctx, api, 665, y - 34, 940, percent, color);
  if (value) api.text(ctx, value, 1800, y + 27, 64, color, 'right');
}

// Each execution history has its own revision, share and evidence below the same ruler.
export function historyColumn(
  ctx,
  api,
  { x, label, row, evidence, status, statusColor, shareLabel = 'Live canary traffic' },
) {
  const { C } = api;
  api.text(ctx, label, x, 509, 41, C.ink);
  api.text(ctx, shareLabel, x, 590, 33, C.muted);
  api.text(ctx, row.trafficPercent + '%', x + 765, 595, 55, C.cyan, 'right');
  trafficStrip(ctx, api, x, 625, 770, row.trafficPercent, C.cyan);
  api.text(ctx, 'Deployment revision ' + row.revision, x, 759, 35, C.ink);
  if (evidence) api.text(ctx, evidence, x, 826, 31, C.muted);
  if (status) api.text(ctx, status, x, 897, 37, statusColor ?? C.ink);
}

export function footer(ctx, api, message, color = api.C.ink) {
  api.text(ctx, message, 960, 1000, 37, color, 'center');
}
