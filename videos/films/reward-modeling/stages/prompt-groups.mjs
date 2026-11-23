import { cueProgress, motion } from '../construction.mjs';
import {
  arrow,
  badge,
  circleLabel,
  formula,
  lines,
  nodeEdge,
  panel,
  tokenRow,
} from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = cueProgress(
      state,
      beat === 0 ? 'build-six-pairs' : beat === 1 ? 'split-pairs' : 'group-prompts',
      api.ease(api.clamp(state.beatP ?? state.p)),
    );
  panel(api, ctx, 160, 290, 700, 540, api.C.cyan);
  badge(api, ctx, 'ONE PROMPT · FOUR ANSWERS', 510, 340, api.C.cyan, 28);
  const points = [
    [330, 460],
    [690, 460],
    [330, 660],
    [690, 660],
  ];
  const pairs = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3],
  ];
  const pairProgress = cueProgress(
      state,
      beat === 0 ? 'build-six-pairs' : beat === 1 ? 'split-pairs' : 'group-prompts',
      motion(state, 0.03, 0.81),
    ),
    activePair = Math.min(5, Math.floor(pairProgress * 6));
  pairs.forEach(([a, b], i) => {
    const color =
      beat === 1
        ? i < 3
          ? api.C.cyan
          : api.C.red
        : beat === 2
          ? api.C.cyan
          : i % 2
            ? api.C.muted
            : api.C.blue;
    nodeEdge(
      api,
      ctx,
      points[a],
      points[b],
      34,
      color,
      beat === 0 ? api.phase(progress, i / 7, (i + 1) / 7) : 1,
    );
    if (beat === 1 && i === activePair)
      nodeEdge(api, ctx, points[a], points[b], 34, api.C.yellow, 1);
  });
  points.forEach(([x, y], i) => circleLabel(api, ctx, `A${i + 1}`, x, y, 34, api.C.blue, 24));
  badge(api, ctx, 'ALL SIX PAIRS SHARE PROMPT 17', 510, 785, api.C.yellow, 26);
  if (beat === 0) {
    api.focus.target('six-pairs', () =>
      formula(api, ctx, '\\binom{4}{2}=6', 1360, 465, 88, api.C.yellow, 'center'),
    );
    lines(api, ctx, ['Each answer appears', 'in several comparisons'], 1360, 610, 36);
  } else if (beat === 1) {
    const train = panel(api, ctx, 1110, 320, 620, 210, api.C.cyan);
    const evaluation = panel(api, ctx, 1110, 620, 620, 210, api.C.red);
    api.focus.target('split-train', () =>
      badge(api, ctx, 'TRAIN PAIRS', train.cx, 366, api.C.cyan),
    );
    api.focus.target('split-eval', () =>
      badge(api, ctx, 'EVALUATION PAIRS', evaluation.cx, 666, api.C.red),
    );
    ['1–2', '1–3', '1–4'].forEach((value, i) =>
      tokenRow(
        api,
        ctx,
        [value],
        1212 + i * 140,
        405,
        activePair === i ? api.C.yellow : api.C.cyan,
        122,
        18,
        24,
      ),
    );
    ['2–3', '2–4', '3–4'].forEach((value, i) =>
      tokenRow(
        api,
        ctx,
        [value],
        1212 + i * 140,
        705,
        activePair === i + 3 ? api.C.yellow : api.C.red,
        122,
        18,
        24,
      ),
    );
    arrow(api, ctx, 860, 490, train.x, train.cy, api.C.cyan);
    arrow(api, ctx, 860, 630, evaluation.x, evaluation.cy, api.C.red);
    badge(api, ctx, 'SAME PROMPT LEAKS ACROSS THE SPLIT', 960, 940, api.C.red, 31);
  } else {
    const train = panel(api, ctx, 1110, 320, 620, 210, api.C.cyan);
    const evaluation = panel(api, ctx, 1110, 620, 620, 210, api.C.yellow);
    badge(api, ctx, 'TRAIN PROMPTS', train.cx, 366, api.C.cyan);
    api.focus.target('heldout-prompts', () =>
      badge(api, ctx, 'UNSEEN PROMPTS', evaluation.cx, 666, api.C.yellow),
    );
    tokenRow(api, ctx, ['1–2', '1–3', '1–4'], 1245, 392, api.C.cyan, 106, 16, 23);
    tokenRow(api, ctx, ['2–3', '2–4', '3–4'], 1245, 458, api.C.cyan, 106, 16, 23);
    badge(api, ctx, 'other prompt IDs', evaluation.cx, 747, api.C.ink, 35);
    arrow(api, ctx, 860, 560, train.x, train.cy, api.C.cyan);
  }
}

export function drawPromptGroups(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'prompt-groups',
  draw: drawPromptGroups,
  cues: ['build-six-pairs', 'split-pairs', 'group-prompts'],
};
