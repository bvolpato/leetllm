import { featureNames } from '../fixtures.mjs';
import { featureFrame, featureVector } from '../model.mjs';

const row = { pool: 'a100-pool', queued: 42, heartbeat: 0.5, backlog: 18, priority: false };
const replay = featureVector(row);
const capture = featureVector({ ...row, backlog: 0 });

export function drawWrap(ctx, scene, state, api) {
  const f = featureFrame(state),
    { C } = api;
  const reveal = f.started('wrap-backlog', 1);
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  api.focus.target('wrap-rows', () => {
    t('J-204     /     09:00 UTC     /     layout v1', 141, 286, 40, C.ink, 'left');
    t('Captured', 160, 578, 34, C.pink, 'left');
    t('Replay', 160, 743, 34, C.cyan, 'left');
    featureNames.forEach((name, i) => {
      const x = 487 + i * 179;
      const different = reveal && replay[i] !== capture[i];
      const color = different ? C.yellow : C.muted;
      t(name, x, 455, 29, color);
      if (different) api.rect(ctx, x - 76, 494, 152, 281, C.panel, C.yellow, 3);
      t(String(capture[i]), x, 585, 51, different ? C.yellow : C.ink);
      t(String(replay[i]), x, 750, 51, different ? C.yellow : C.ink);
    });
    t(
      reveal
        ? 'The capture records what ran. The replay uses the source readable at nine.'
        : 'Which slot needs an explanation?',
      960,
      926,
      39,
      reveal ? C.ink : C.yellow,
    );
  });
}
export default { id: 'wrap', draw: drawWrap, cues: ['wrap-compare', 'wrap-backlog'] };
