import { policyValueFixture } from '../model.mjs';
import {
  box,
  cellGrid,
  code,
  datum,
  detailText,
  focusProgress,
  footer,
  label,
} from '../defaults.mjs';
export function drawPolicyValue(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%',
    num = (v, d = 3) => Number(v.toFixed(d));
  api.focus.target('cau-policy-value-mechanism', () => {
    const f = policyValueFixture({
        rewardShift: 0,
      }),
      active = done('target-policy-weights'),
      newVersion = done('value-new-version');
    label(
      ctx,
      api,
      'Same 200 logged decisions · target always assistant',
      960,
      285,
      themeColors.ink,
      35,
    );
    cellGrid(ctx, api, f.rows, 200, 355, 20, 31, 23);
    if (newVersion)
      box(
        ctx,
        api,
        'New target: assistant v2',
        ['Logs contain assistant v1', 'v2 value: unsupported here'],
        1080,
        355,
        650,
        180,
        themeColors.pink,
      );
    else
      box(
        ctx,
        api,
        'One retained row',
        ['context / workflow / reward', 'actual logging probability'],
        1080,
        355,
        650,
        180,
        themeColors.blue,
      );
    const arms = ['assistant', 'control'];
    arms.forEach((arm, i) => {
      const sum = f.rows
          .filter((t) => t.arm === arm)
          .reduce((s, t) => s + t.ratio * Number(t.resolved), 0),
        yy = 680 + i * 110;
      detailText(ctx, api, arm, 230, yy + 35, 31, i ? themeColors.pink : themeColors.cyan);
      api.rect(
        ctx,
        680,
        yy,
        active ? sum * 5 : 1,
        50,
        i ? themeColors.pink : themeColors.cyan,
        undefined,
        5,
      );
      if (active)
        code(ctx, api, num(sum) + ' weighted rewards', 680, yy + 85, 29, themeColors.yellow);
    });
    datum(
      ctx,
      api,
      (newVersion ? 'v1 value ' : 'Value ') + pc(f.ips, 0),
      1490,
      930,
      done('policy-value-result'),
      themeColors.green,
      41,
    );
    footer(
      ctx,
      api,
      'A changed prompt is a new action version; old-workflow support does not automatically evaluate it.',
    );
  });
}
export default {
  id: 'policy-value',
  draw: drawPolicyValue,
  cues: [
    'cau-policy-value-0',
    'cau-policy-value-1',
    'cau-target-policy-weights',
    'cau-policy-value-result',
    'cau-policy-value-2',
    'cau-value-new-version',
  ],
};
