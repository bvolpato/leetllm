import { ARTICLE_RECORD } from '../fixtures.mjs';
import { exactIdentity } from '../model.mjs';
import {
  drawSemanticConstructionsArrow,
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintExactBytes(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'Hash the actual text, complete release scope and route identity',
    245,
  );
  const rows =
    currentBeat === 0
      ? [
          {
            label: 'Seed + exact repeat',
            text: ARTICLE_RECORD.source_query,
            scope: ARTICLE_RECORD.scope,
          },
          {
            label: 'Paraphrase',
            text: 'How long do revoked keys stay in audit logs?',
            scope: ARTICLE_RECORD.scope,
          },
          {
            label: 'New release',
            text: ARTICLE_RECORD.source_query,
            scope: {
              ...ARTICLE_RECORD.scope,
              release_id: 'R8-film-alias',
            },
          },
        ]
      : ['UserID', 'userid', 'User  ID', 'User ID'].map((text) => ({
          label: 'Exact text bytes',
          text,
          scope: ARTICLE_RECORD.scope,
        }));
  rows.forEach((r, i) => {
    const y = 335 + i * (currentBeat === 0 ? 172 : 130),
      processed = op >= (i + 1) / (rows.length + 1);
    drawSemanticConstructionsText(ctx, api, themeColors, r.label, 180, y, 25, themeColors.muted);
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      JSON.stringify(r.text),
      180,
      y + 52,
      currentBeat === 0 ? 28 : 33,
      i === 0 ? themeColors.cyan : themeColors.yellow,
    );
    drawSemanticConstructionsArrow(ctx, api, themeColors, 1035, y + 30, 1140, y + 30);
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      processed ? exactIdentity(r.text, r.scope).slice(0, 21) : 'hash pending',
      1200,
      y + 52,
      29,
      processed ? themeColors.blue : themeColors.muted,
    );
  });
  if (currentBeat === 0)
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      done(0, 'sc-exact-different')
        ? 'Changed text or release → different exact identity'
        : 'Same supplied bytes + same scope → same exact identity',
      950,
      themeColors.yellow,
      31,
    );
  else
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Never silently lowercase code or collapse spaces',
      160,
      900,
      1600,
      themeColors.pink,
      80,
      30,
    );
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'First 21 hexadecimal digits of each SHA-256 key',
  );
}
export function drawExactBytes(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintExactBytes);
}
export default {
  id: 'exact-bytes',
  draw: drawExactBytes,
  cues: ['sc-exact-bytes-b0', 'sc-exact-different', 'sc-exact-bytes-b1'],
};
