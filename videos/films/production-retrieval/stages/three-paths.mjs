import { prEvent } from '../construction.mjs';
import {
  arrow,
  card,
  centeredText,
  extensionFooter,
  extensionText,
  meter,
  sourcePage,
} from '../defaults.mjs';
export function drawThreePaths(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('three-paths-mechanism', () => {
    if (currentBeat === 0) {
      sourcePage(ctx, api, 110, 345, 800, 420);
      card(
        ctx,
        api,
        'Luna · trusted EU caller\nstale age 10 d · signal 48 h',
        1100,
        355,
        690,
        140,
        themeColors.blue,
      );
      centeredText(
        ctx,
        api,
        done('qualifies', 0) ? 'Both conditions pass → eligible' : 'Check both conditions',
        1445,
        690,
        37,
        done('qualifies', 0) ? themeColors.green : themeColors.muted,
      );
      if (ev('rule', 0) > 0) {
        meter(ctx, api, 1120, 790, 600, 10, 20, themeColors.yellow, 'Stale age · threshold 14 d');
        api.line(ctx, 1540, 760, 1540, 840, themeColors.pink, 4);
      }
    } else if (currentBeat === 1) {
      [
        'Ingest · source lifetime',
        'Serve · request lifetime',
        'Evaluate · release lifetime',
      ].forEach((label, i) => {
        const y = 335 + i * 210;
        extensionText(
          ctx,
          api,
          label,
          130,
          y,
          30,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
        );
        const amount = ev(['lifetimes', 'request', 'release'][i], 1);
        card(
          ctx,
          api,
          ['page → span → revision', 'Luna → allowed E1 → answer', 'same cases → candidate bundle'][
            i
          ],
          730,
          y - 48,
          1020,
          100,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
        );
        if (amount > 0)
          api.circle(
            ctx,
            750 + 950 * amount,
            y + 100,
            14,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          );
      });
    } else {
      card(ctx, api, 'Generator weights\nunchanged', 160, 460, 530, 170, themeColors.blue, 34);
      const amount = ev('memory', 2);
      sourcePage(ctx, api, 1040, 345, 760, 420, {
        title:
          amount < 1 ? 'Indexed source memory · changing' : 'New source revision · same generator',
      });
      arrow(ctx, api, 720, 540, 1000, 540, themeColors.cyan);
      centeredText(
        ctx,
        api,
        'Available evidence changes; authority still needs separate checks',
        960,
        900,
        31,
        themeColors.yellow,
      );
    }
    extensionFooter(ctx, api, 'Invented policy fixture · complete conditions travel with E1');
  });
}
export default {
  id: 'three-paths',
  draw: drawThreePaths,
  cues: ['pr-rule', 'pr-qualifies', 'pr-lifetimes', 'pr-request', 'pr-release', 'pr-memory'],
};
