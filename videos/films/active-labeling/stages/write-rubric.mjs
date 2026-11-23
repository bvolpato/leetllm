import { phase, sampleModel } from '../construction.mjs';
import {
  card,
  cueVisible,
  detailFooter,
  detailHeading,
  detailRectangle,
  detailRow,
  detailTarget,
  detailText,
  text,
} from '../defaults.mjs';
export function drawWriteRubric(ctx, scene, state, api) {
  if (drawRubricAnchors(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('write-rubric', state);
  const route = (source, target, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      color,
      progress: q,
      gap: 22,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 4,
    });
  {
    text(
      ctx,
      api,
      modelState.pair[0].id === 'C'
        ? 'New pair · both answers violate the safety rule'
        : 'First apply authorization, then correctness',
      140,
      265,
      33,
    );
    const rubric = api.focus.target('policy-rubric', () =>
      card(
        ctx,
        api,
        'Required: approval evidence + authorized action',
        460,
        345,
        1000,
        themeColors.yellow,
        100,
        30,
      ),
    );
    const nodes = modelState.pair.map((item, i) =>
      api.focus.target('candidate-answers', () =>
        card(
          ctx,
          api,
          `${item.id} · ${item.label}`,
          150 + i * 990,
          560,
          620,
          item.safe ? themeColors.green : themeColors.pink,
          150,
          29,
        ),
      ),
    );
    if (modelState.evaluated)
      nodes.forEach((node, i) =>
        route(rubric, node, modelState.pair[i].safe ? themeColors.green : themeColors.pink),
      );
    api.focus.target('rubric-decision', () =>
      text(
        ctx,
        api,
        modelState.decision,
        960,
        850,
        38,
        modelState.decision === 'BOTH BAD' ? themeColors.pink : themeColors.green,
        'center',
      ),
    );
    if (beat === 2)
      api.focus.target('decision-types', () =>
        text(
          ctx,
          api,
          'Safe equivalent pair → TIE · missing evidence → ADJUDICATE',
          960,
          970,
          28,
          themeColors.muted,
          'center',
        ),
      );
  }
}
function drawRubricAnchors(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (!(currentBeat === 3)) return false;
  const { C: themeColors } = api;
  {
    detailHeading(ctx, api, 'Ordered anchors and missing evidence produce different judgments');
    const anchors = cueVisible(ctx, api, 'rating-anchors'),
      missing = cueVisible(ctx, api, 'missing-context');
    const levels = [
      ['5', 'Suite + approval cited'],
      ['3', 'Suite cited; approval omitted'],
      ['1', 'Invented authorization'],
    ];
    detailTarget(ctx, api, 'rating-anchors', () => {
      levels.forEach(([n, s], i) => {
        const y = 375 + i * 140;
        detailRectangle(
          ctx,
          api,
          150,
          y,
          170,
          95,
          i === 0 ? themeColors.green : i === 1 ? themeColors.yellow : themeColors.pink,
        );
        detailText(
          ctx,
          api,
          n,
          235,
          y + 65,
          45,
          i === 0 ? themeColors.green : i === 1 ? themeColors.yellow : themeColors.pink,
          'center',
        );
        if (anchors)
          detailRow(
            ctx,
            api,
            s,
            380,
            y + 12,
            1380,
            i === 0 ? themeColors.green : i === 1 ? themeColors.yellow : themeColors.pink,
          );
      });
    });
    detailTarget(ctx, api, 'missing-context', () => {
      if (missing) {
        detailRow(ctx, api, 'Approval record absent → REVIEW', 350, 850, 1220, themeColors.pink);
        detailText(
          ctx,
          api,
          'A fluent claim cannot resolve missing authorized evidence.',
          960,
          975,
          29,
          themeColors.muted,
          'center',
        );
      }
    });
    detailFooter(ctx, api, 'Blind model identity, balance order and retain versions for replay.');
  }
  return true;
}
export default {
  id: 'write-rubric',
  draw: drawWriteRubric,
  cues: [
    'policy-first',
    'compare-pair',
    'choose-a',
    'both-unsafe',
    'separate-outcomes',
    'rating-anchors',
    'missing-context',
  ],
};
