import { ESTABLISHED_SCENES, answer, probes, scope } from './fixtures.mjs';
import { cueFinished, hash, population, wilsonLower } from './arithmetic.mjs';
import { check, sampleModel, select } from './model.mjs';
export function drawSemanticText(
  ctx,
  api,
  themeColors,
  v,
  x,
  y,
  size = 30,
  color = themeColors.ink,
  align = 'left',
) {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawSemanticCard(
  ctx,
  api,
  themeColors,
  c,
  label,
  x,
  y,
  width,
  color = themeColors.cyan,
  height = 90,
) {
  return c.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    padding: 14,
    baselineOffset: label.includes('\n') ? -15 : 0,
    fill: themeColors.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawSemanticTransfer(ctx, api, s, t, source, target, color) {
  return t.transfer({
    source: {
      shape: source,
      opacity: 1,
    },
    target: {
      shape: target,
      opacity: 1,
    },
    progress: s.p,
    color,
    particle: {
      radius: 8,
      fill: color,
    },
    gap: 22,
  });
}
export function drawSemanticConstructionsText(
  ctx,
  api,
  themeColors,
  s,
  x,
  y,
  size = 30,
  color = themeColors.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawSemanticConstructionsCenter(
  ctx,
  api,
  themeColors,
  s,
  y,
  color = themeColors.muted,
  size = 29,
) {
  return drawSemanticConstructionsText(ctx, api, themeColors, s, 960, y, size, color, 'center');
}
export function drawSemanticConstructionsLine(
  ctx,
  api,
  themeColors,
  x1,
  y1,
  x2,
  y2,
  color = themeColors.muted,
  w = 3,
) {
  return api.line(ctx, x1, y1, x2, y2, color, w);
}
export function drawSemanticConstructionsBox(
  ctx,
  api,
  themeColors,
  c,
  s,
  x,
  y,
  w = 500,
  color = themeColors.blue,
  h = 88,
  size = 28,
) {
  return c.card({
    label: s,
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    baselineOffset: -(s.split('\n').length - 1) * size * 0.6,
    padding: 12,
    fill: themeColors.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawSemanticConstructionsArrow(
  ctx,
  api,
  themeColors,
  x1,
  y1,
  x2,
  y2,
  color = themeColors.cyan,
) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 3);
}
export function drawSemanticConstructionsFoot(ctx, api, themeColors, s) {
  return drawSemanticConstructionsCenter(ctx, api, themeColors, s, 1015, themeColors.muted, 26);
}
export function drawSemanticConstructionsTable(
  ctx,
  api,
  themeColors,
  rows,
  x = 160,
  y = 350,
  w = 1600,
  h = 100,
  colors = [],
) {
  const cols = rows[0].length;
  rows.forEach((row, r) => {
    const yy = y + r * h;
    drawSemanticConstructionsLine(
      ctx,
      api,
      themeColors,
      x,
      yy + h - 12,
      x + w,
      yy + h - 12,
      themeColors.panel,
      2,
    );
    row.forEach((v, j) =>
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        String(v),
        x + (j * w) / cols + 14,
        yy + 43,
        r === 0 ? 28 : 29,
        colors[r] ?? (r === 0 ? themeColors.muted : themeColors.ink),
      ),
    );
  });
}
export function withSemanticLegacyFrame(ctx, scene, state, api, paint) {
  const { C: themeColors, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state),
    currentBeat = s.step;
  if (state.cues) {
    if (scene.id === 'geometry' && currentBeat > 0) {
      const amount = api.focus.progress('rotate-question', s.p),
        a = Math.acos(probes[0].score),
        z = Math.acos(probes[4].score),
        angle = a + (z - a) * amount;
      s.vector = [Math.cos(angle), Math.sin(angle)];
      s.similarity = s.vector[0];
      s.distance = 1 - s.similarity;
      s.settled = amount === 1;
    }
    if (scene.id === 'threshold') {
      s.threshold =
        currentBeat === 0
          ? 0.99
          : currentBeat === 1
            ? 0.99 + 0.005 * api.focus.progress('raise-threshold', 1)
            : 0.995 + 0.004 * api.focus.progress('strict-threshold', 1);
      Object.assign(s, select(s.threshold));
    }
    if (scene.id === 'gates')
      s.p = api.focus.progress(
        currentBeat === 0
          ? 'trusted-scope'
          : currentBeat === 1
            ? 'release-change'
            : 'expiration-boundary',
        s.p,
      );
    if (scene.id === 'admission') {
      s.record =
        api.focus.visible('edit-answer') && !api.focus.visible('revoke-approval')
          ? {
              ...answer,
              text: 'Revoked keys remain forever.',
            }
          : answer;
      s.revoked = api.focus.visible('revoke-approval');
      s.digest = hash(s.record);
      Object.assign(s, check(s.record, scope, 100, true, s.revoked));
    }
    if (scene.id === 'economics')
      Object.assign(s, population(Math.ceil(6 * api.focus.progress('reuse-six', s.hits / 6))));
    if (scene.id === 'evidence') {
      s.n = api.focus.visible('independent-population') ? 5714 : 4;
      s.success = s.n;
      s.lower = wilsonLower(s.n, s.n);
    }
  }
  return paint(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
}
export function withSemanticConstructionFrame(ctx, scene, state, api, paint) {
  if (ESTABLISHED_SCENES.has(scene.id)) return false;
  const { C: themeColors, components: c, teaching: t } = api,
    id = scene.id,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && cueFinished(state, cue)),
    progress = (cue) => {
      const q = state.cues?.[cue];
      return q ? (q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress) : beatProgress;
    },
    op = progress('sc-' + id + '-b' + currentBeat);
  api.focus.target('sc-' + id + '-mechanism', () => {
    return paint(
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
    );
  });
  return true;
}
