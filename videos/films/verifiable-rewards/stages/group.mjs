import { ANSWERS, REWARDS } from '../fixtures.mjs';
import { checkedGroupState } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawGroup(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const current = checkedGroupState(currentBeat, progress);
    text(
      ctx,
      api,
      'P14 · What is fourteen times twelve?',
      960,
      300,
      38,
      themeColors.blue,
      'center',
    );
    text(
      ctx,
      api,
      'Same sampling setup · exact-answer verifier v1',
      960,
      360,
      29,
      themeColors.muted,
      'center',
    );
    ANSWERS.forEach((value, i) => {
      const x = 220 + i * 405,
        checked = i < current.checked;
      const color = checked
        ? REWARDS[i]
          ? themeColors.green
          : themeColors.pink
        : themeColors.muted;
      const top = api.focus.target('rollout-identities', () =>
        components.card({
          label: `P14 · R${i + 1}\nFinal answer: ${value}`,
          x,
          y: 425,
          width: 330,
          height: 125,
          fontSize: 29,
          baselineOffset: -8,
          padding: 14,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
        }),
      );
      const bottom = api.focus.target('checked-outcomes', () =>
        card(
          ctx,
          api,
          checked ? `Checked reward ${REWARDS[i]}` : 'Check pending',
          x,
          650,
          330,
          color,
        ),
      );
      api.connect(ctx, top, bottom, {
        color,
        gap: 12,
      });
      if (checked)
        teaching.changeCue({
          x: x - 8,
          y: 640,
          width: 346,
          height: 114,
          from: -1,
          to: REWARDS[i],
          progress: 1,
          color,
          emphasis:
            currentBeat === 0
              ? Math.max(0, 1 - (current.elapsed - current.checkTimes[i]) / 0.5)
              : 0,
        });
      if (current.meanVisible)
        api.focus.target('centered-outcomes', () =>
          equation(
            ctx,
            api,
            `${REWARDS[i]}-0.5=${REWARDS[i] ? '+0.5' : '-0.5'}`,
            x + 165,
            835,
            34,
            color,
          ),
        );
    });
    if (current.meanVisible)
      api.focus.target('group-average', () =>
        equation(
          ctx,
          api,
          String.raw`\mu=\frac{1+0+1+0}{4}=${current.mean.toFixed(1)}`,
          960,
          950,
          44,
          themeColors.yellow,
        ),
      );
    else if (current.checked === 4)
      equation(ctx, api, '[1, 0, 1, 0]', 960, 865, 50, themeColors.yellow);
    else
      text(
        ctx,
        api,
        `${current.checked} of 4 outcomes checked`,
        960,
        865,
        34,
        themeColors.yellow,
        'center',
      );
  }
}
export default {
  id: 'group',
  draw: drawGroup,
  cues: ['group-b1-1', 'group-b2-1', 'group-b2-2', 'group-b3-1'],
};
