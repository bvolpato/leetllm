import { prefBound } from '../arithmetic.mjs';
import {
  caption,
  cell,
  constructionText,
  focusTarget,
  heading,
  line,
  rectangle,
} from '../defaults.mjs';
export function drawRoleOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const construction = () => {
    heading(ctx, api, 'One rollout keeps distinct model roles and probability owners');
    const tokens = ['cite', 'P7', 'escalate'],
      xs = [470, 910, 1350];
    tokens.forEach((v, i) => {
      cell(ctx, api, v, xs[i], 600, 260, 85, themeColors.cyan, 36);
      if (i < 2) api.arrow(ctx, xs[i] + 270, 642, xs[i + 1] - 20, 642, themeColors.cyan, 4);
    });
    constructionText(
      ctx,
      api,
      'actor πθ · trainable next-token policy',
      170,
      360,
      32,
      themeColors.cyan,
    );
    if (currentBeat === 2) {
      line(ctx, api, 280, 385, 130, 385, themeColors.cyan);
      line(ctx, api, 130, 385, 130, 570, themeColors.cyan);
      line(ctx, api, 130, 570, 600, 570, themeColors.cyan);
      api.arrow(ctx, 600, 570, 600, 590, themeColors.cyan, 3);
    } else line(ctx, api, 280, 385, 600, 570, themeColors.cyan);
    constructionText(
      ctx,
      api,
      'reward scorer · finished response',
      1100,
      365,
      29,
      themeColors.yellow,
    );
    if (currentBeat === 2) {
      line(ctx, api, 1570, 390, 1790, 390, themeColors.yellow);
      line(ctx, api, 1790, 390, 1790, 570, themeColors.yellow);
      line(ctx, api, 1790, 570, 1480, 570, themeColors.yellow);
      api.arrow(ctx, 1480, 570, 1480, 590, themeColors.yellow, 3);
    } else line(ctx, api, 1570, 390, 1480, 580, themeColors.yellow);
    constructionText(
      ctx,
      api,
      'reference πref · frozen drift log-probs',
      170,
      840,
      29,
      themeColors.blue,
    );
    constructionText(
      ctx,
      api,
      'critic V · trainable prefix return',
      1040,
      840,
      29,
      themeColors.green,
    );
    for (let i = 0; i < 3; i++) {
      const tokenCenter = xs[i] + 130;
      line(ctx, api, tokenCenter, 705, tokenCenter, 745, themeColors.blue);
      constructionText(ctx, api, 'log πref', tokenCenter, 785, 25, themeColors.blue, 'center');
      constructionText(ctx, api, 'V(prefix)', tokenCenter, 935, 25, themeColors.green, 'center');
    }
    if (currentBeat === 2) {
      focusTarget(ctx, api, 'pa-old-snapshot', () => {
        rectangle(ctx, api, 170, 425, 1580, 105, themeColors.muted);
        constructionText(ctx, api, 'Stored rollout snapshot πold', 205, 490, 30, themeColors.muted);
        constructionText(
          ctx,
          api,
          'πθ(token | prefix) / πold(token | prefix)',
          980,
          490,
          29,
          themeColors.yellow,
        );
      });
    }
    caption(ctx, api, 'The actor and critic can share weights.');
    return;
  };
  focusTarget(ctx, api, 'role-ownership-construction', construction);
}
export default {
  id: 'role-ownership',
  draw: drawRoleOwnership,
  cues: ['role-ownership-b0', 'role-ownership-b1', 'role-ownership-b2', 'pa-old-snapshot'],
};
