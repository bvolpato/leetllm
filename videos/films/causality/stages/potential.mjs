import { populations } from '../fixtures.mjs';
import { equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawPotential(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    if (currentBeat === 0) {
      text(ctx, api, 'assigned workflow', 475, 280, 30, themeColors.muted, 'center');
      text(ctx, api, 'assistant outcome', 840, 280, 30, themeColors.cyan, 'center');
      text(ctx, api, 'control outcome', 1380, 280, 30, themeColors.pink, 'center');
      const assigned = [1, 0, 1, 0],
        observed = [1, 0, 0, 1];
      optionalFocusTarget(ctx, api, 'potential-simulation-31', () => {
        for (let i = 0; i < 4; i++) {
          text(ctx, api, 'ticket ' + (i + 1), 170, 410 + i * 140, 30, themeColors.muted);
          api.components.card({
            label: assigned[i] ? 'assistant' : 'control',
            x: 350,
            y: 345 + i * 140,
            width: 250,
            height: 100,
            fill: themeColors.panel,
            stroke: assigned[i] ? themeColors.cyan : themeColors.pink,
            textColor: assigned[i] ? themeColors.cyan : themeColors.pink,
            fontSize: 30,
            padding: 12,
          });
          optionalFocusTarget(ctx, api, 'potential-simulation-34', () =>
            [0, 1].forEach((j) => {
              const visible = assigned[i] === (j === 0 ? 1 : 0) && phaseForBeat(0) * 4 > i;
              api.components.card({
                label: visible ? String(observed[i]) : '?',
                x: 700 + j * 540,
                y: 345 + i * 140,
                width: 280,
                height: 100,
                fill: themeColors.panel,
                stroke: j ? themeColors.pink : themeColors.cyan,
                textColor: visible ? themeColors.ink : themeColors.muted,
                fontSize: 42,
                padding: 15,
              });
            }),
          );
        }
      });
      text(
        ctx,
        api,
        'One actual assignment reveals one outcome.',
        960,
        965,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      populations.forEach((pop, i) => {
        optionalFocusTarget(ctx, api, 'potential-object-hypothetical-population-37', () =>
          text(
            ctx,
            api,
            `Hypothetical population ${i ? 'B' : 'A'}`,
            540 + i * 850,
            275,
            32,
            themeColors.ink,
            'center',
          ),
        );
        optionalFocusTarget(ctx, api, 'potential-object-distribution-potential-38', () =>
          api.teaching.bars({
            x: 220 + i * 850,
            y: 390,
            width: 650,
            height: 370,
            values: pop,
            labels: ['either', 'helped', 'harmed', 'neither'],
            colors: [themeColors.blue, themeColors.green, themeColors.red, themeColors.muted],
            max: 80,
            progress: phaseForBeat(1),
            showValues: true,
            fontSize: 28,
          }),
        );
      });
      equation(ctx, api, 'E[Y(1)-Y(0)]=0.10', 960, 965, 48, themeColors.yellow, 'center');
    }
  }
}
export default {
  id: 'potential',
  draw: drawPotential,
  cues: [
    'potential-beat-1-focus-1',
    'potential-beat-1-focus-2',
    'potential-beat-2-focus-1',
    'potential-beat-3-focus-1',
  ],
};
