import { SHORT, documents } from './fixtures.mjs';
export function cueProgress(state, api, id, beat, start = 0.05, end = 0.8) {
  const cue = state.cues?.[id];
  if (cue) {
    if (cue.phase === 'before') return 0;
    if (cue.phase === 'after') return 1;
    return api.clamp(cue.progress);
  }
  const current = state.beat ?? 0;
  if (current !== beat) return current > beat ? 1 : 0;
  if (state.cues) return 0;
  return api.phase(state.beatP ?? 0, start, end);
}
export function drawRecommendationText(
  ctx,
  api,
  C,
  v,
  x,
  y,
  size = 30,
  color = C.ink,
  align = 'center',
) {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawRecommendationMath(ctx, api, C, v, x, y, size = 38, color = C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawRecommendationClamp(ctx, api, q) {
  return api.clamp(q);
}
export function drawRecommendationFade(ctx, api, q, paint) {
  if (q <= 0) return;
  ctx.save();
  ctx.globalAlpha *= q;
  paint();
  ctx.restore();
}
export function drawRecommendationFocus(ctx, api, target, paint) {
  return api.focus ? api.focus.target(target, paint) : paint();
}
export function drawRecommendationColor(ctx, api, C, d) {
  return (
    {
      'api-guide': C.cyan,
      'retry-runbook': C.blue,
      'sdk-example': C.green,
      'blog-post': C.pink,
      'legacy-changelog': C.muted,
      'private-draft': C.red,
      'stale-guide': C.yellow,
    }[typeof d === 'string' ? d : d.id] ?? C.ink
  );
}
export function drawRecommendationRect(ctx, api, C, x, y, w, h, stroke = C.muted, fill = C.panel) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 8);
}
export function drawRecommendationOutline(ctx, api, C, x, y, w, h, c = C.yellow) {
  api.line(ctx, x, y, x + w, y, c, 2);
  api.line(ctx, x + w, y, x + w, y + h, c, 2);
  api.line(ctx, x + w, y + h, x, y + h, c, 2);
  api.line(ctx, x, y + h, x, y, c, 2);
}
export function drawRecommendationDocument(
  ctx,
  api,
  C,
  d,
  x,
  y,
  { w = 300, h = 72, score, grade, subtitle, muted = false, label } = {},
) {
  if (typeof d === 'string')
    d = documents.find((q) => q.id === d) ?? {
      id: d,
    };
  const co = muted ? C.muted : drawRecommendationColor(ctx, api, C, d);
  drawRecommendationRect(ctx, api, C, x, y, w, h, co);
  api.line(ctx, x + 8, y + 10, x + 8, y + h - 10, co, 5);
  drawRecommendationText(
    ctx,
    api,
    C,
    label ?? SHORT[d.id] ?? d.id,
    x + 24,
    y + (subtitle ? 31 : h / 2 + 10),
    27,
    co,
    'left',
  );
  if (subtitle) drawRecommendationText(ctx, api, C, subtitle, x + 24, y + 60, 23, C.muted, 'left');
  if (score !== undefined)
    drawRecommendationText(ctx, api, C, score, x + w - 18, y + h / 2 + 10, 26, co, 'right');
  if (grade !== undefined) {
    api.circle(ctx, x + w - 24, y + 20, 16, C.panel, co, 1.5);
    drawRecommendationText(ctx, api, C, grade, x + w - 24, y + 27, 22, co);
  }
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function drawRecommendationVector(
  ctx,
  api,
  C,
  values,
  x,
  y,
  {
    size = 120,
    label,
    co = C.cyan,
    unknown = false,
    format = (v) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)))),
    vertical = false,
  } = {},
) {
  if (label)
    drawRecommendationText(
      ctx,
      api,
      C,
      label,
      x + (vertical ? size / 2 : (values.length * size) / 2),
      y - 25,
      27,
      co,
    );
  values.forEach((v, i) => {
    drawRecommendationRect(
      ctx,
      api,
      C,
      x + (vertical ? 0 : i * size),
      y + (vertical ? i * size : 0),
      size - 6,
      size - 6,
      co,
    );
    drawRecommendationText(
      ctx,
      api,
      C,
      unknown ? '?' : format(v),
      x + (vertical ? size / 2 : i * size + size / 2) - 3,
      y + (vertical ? i * size : 0) + size / 2 + 10,
      30,
      co,
    );
  });
}
export function drawRecommendationStraight(ctx, api, C, x1, y1, x2, y2, q, co = C.cyan, value) {
  if (q <= 0) return;
  const x = api.lerp(x1, x2, drawRecommendationEase(ctx, api, q)),
    y = api.lerp(y1, y2, drawRecommendationEase(ctx, api, q));
  api.arrow(ctx, x1, y1, x, y, co, 2.5);
  if (q < 1 && value !== undefined) {
    drawRecommendationRect(ctx, api, C, x - 48, y - 21, 96, 42, co);
    drawRecommendationText(ctx, api, C, value, x, y + 9, 25, co);
  }
}
export function drawRecommendationRowGrades(
  ctx,
  api,
  C,
  grades,
  x,
  y,
  { width = 250, height = 72, labels, progress = 1, co = C.cyan } = {},
) {
  return grades.forEach((g, i) => {
    const q = drawRecommendationClamp(ctx, api, progress * grades.length - i);
    drawRecommendationFade(ctx, api, q, () => {
      drawRecommendationRect(ctx, api, C, x + i * width, y, width - 14, height, co);
      drawRecommendationText(
        ctx,
        api,
        C,
        labels?.[i] ?? g,
        x + i * width + (width - 14) / 2,
        y + height / 2 + 10,
        30,
        co,
      );
    });
  });
}
export function drawRecommendationStatus(ctx, api, C, label, value, x, y, co = C.ink) {
  drawRecommendationText(ctx, api, C, label, x, y, 27, C.muted, 'left');
  drawRecommendationText(ctx, api, C, value, x + 720, y, 31, co, 'right');
}
export function drawRecommendationEase(ctx, api, q) {
  q = drawRecommendationClamp(ctx, api, q);
  return q * q * (3 - 2 * q);
}
export function withRecommendationFocus(ctx, api, targets, paint) {
  const next = (i) =>
    i === targets.length
      ? paint()
      : drawRecommendationFocus(ctx, api, targets[i], () => next(i + 1));
  return next(0);
}
export function recommendationFocusTargets(id) {
  const focusAliases = {
    'retrieval-recall': [
      'retrieval-recall-object-distribution-retrieval-recall-10',
      'retrieval-recall-object-candidate-recall-12',
    ],
    reranking: [
      'reranking-simulation-17',
      'reranking-object-label-x-item-cx-180-y-item-cy-43-width-360-height--18',
    ],
    'ranking-metrics': [
      'ranking-metrics-simulation-20',
      'ranking-metrics-object-ideal-order-25',
      'ranking-metrics-object-whole-system-ndcg-28',
    ],
    'two-tower-retrieval': ['two-tower-retrieval-simulation-31'],
    'position-bias': [
      'position-bias-simulation-36',
      'position-bias-object-position-impressions-37',
    ],
  };
  return [id + '-construction', ...(focusAliases[id] ?? [])];
}
