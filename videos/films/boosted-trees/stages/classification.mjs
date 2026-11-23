import { sigmoid } from '../arithmetic.mjs';
import { CLASS_FIXTURE } from '../fixtures.mjs';
import { TRACKS, boostCue, establishedProgress } from '../construction.mjs';
import { classificationTreeStep } from '../model.mjs';
import { focusScope, legacyEquation, legacyText, recordCard } from '../defaults.mjs';
export function drawClassification(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const once = (firstBeat = 0, from = 0.08, to = 0.82) =>
    establishedProgress(state, firstBeat, from, to);
  const snapshot = TRACKS['classification'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const plot = teaching.axes({
      x: 250,
      y: 390,
      width: 900,
      height: 420,
      xDomain: [-3, 3],
      yDomain: [0, 1],
      xTicks: [-2, 0, 2],
      yTicks: [0, 0.5, 1],
      xLabel: 'raw logit z',
      yLabel: 'probability σ(z)',
      fontSize: 25,
    });
    teaching.curve({
      plot,
      points: Array.from(
        {
          length: 101,
        },
        (_, index) => {
          const z = -3 + index * 0.06;
          return {
            x: z,
            y: sigmoid(z),
          };
        },
      ),
      color: themeColors.cyan,
      width: 5,
      progress: once(0, 0.06, 0.74),
    });
    const rows = snapshot.rows;
    const origin = plot.point(CLASS_FIXTURE.initialLogit, sigmoid(CLASS_FIXTURE.initialLogit));
    focusScope(ctx, api, 'classification-origin', () =>
      api.circle(ctx, origin.x, origin.y, snapshot.stage === 0 ? 15 : 11, themeColors.yellow),
    );
    legacyText(
      ctx,
      api,
      snapshot.stage === 0 ? 'Initial rows · z = 0, p = 0.50' : 'Initial state · z = 0, p = 0.50',
      800,
      350,
      24,
      themeColors.yellow,
      'center',
    );
    if (snapshot.stage !== 0) {
      focusScope(ctx, api, 'classification-simulation-22', () => {
        for (const label of [0, 1]) {
          const row = rows.find((candidate) => candidate.label === label);
          const z = api.lerp(0, row.logitAfterIllustration, once(1, 0.08, 0.72));
          const at = plot.point(z, sigmoid(z));
          const color = label ? themeColors.green : themeColors.pink;
          api.circle(ctx, at.x, at.y, 14, color);
          const start = plot.point(0, 0.5);
          api.path(ctx, [start, at], {
            color,
            width: 3,
            clip: plot.bounds,
            opacity: once(1, 0.15, 0.72),
          });
        }
      });
    }
    if (beat === 2) {
      const tree = classificationTreeStep(),
        leafProgress = boostCue(state, 'classification-beat-3-focus-1', 2),
        showWeights = leafProgress > 0.6,
        paint = () =>
          focusScope(ctx, api, 'classification-fitted-tree', () => {
            const root = recordCard(
              ctx,
              api,
              'classification',
              'Illustrative job feature ≤ 1.5',
              1240,
              335,
              560,
              78,
              themeColors.yellow,
              1,
              26,
            );
            const leaves = tree.leaves.map((leaf, i) =>
              recordCard(
                ctx,
                api,
                'classification',
                showWeights ? 'Leaf ' + (leaf.value > 0 ? '+' : '') + leaf.value : 'Leaf ?',
                1190 + i * 335,
                525,
                280,
                80,
                i ? themeColors.green : themeColors.pink,
                1,
                28,
              ),
            );
            leaves.forEach((leaf, i) =>
              teaching.transfer({
                source: {
                  shape: root,
                  opacity: 1,
                },
                target: {
                  shape: leaf,
                  opacity: 1,
                },
                progress: 1,
                color: i ? themeColors.green : themeColors.pink,
                gap: 12,
              }),
            );
            tree.leaves.forEach((leaf, i) =>
              legacyText(
                ctx,
                api,
                i ? 'R2,R3: Σg −1, Σh .5' : 'R1: g +.5, h .25',
                1330 + i * 335,
                642,
                24,
                i ? themeColors.green : themeColors.pink,
                'center',
              ),
            );
            if (showWeights)
              tree.leaves.forEach((leaf, i) =>
                legacyEquation(
                  ctx,
                  api,
                  '-(' +
                    leaf.gradient.toFixed(1) +
                    ')/' +
                    leaf.hessian.toFixed(2) +
                    '=' +
                    (leaf.value > 0 ? '+' : '') +
                    leaf.value,
                  1330 + i * 335,
                  690,
                  32,
                  i ? themeColors.green : themeColors.pink,
                ),
              );
            legacyText(
              ctx,
              api,
              'row 1 → left · rows 2,3 → right',
              1500,
              765,
              27,
              themeColors.muted,
              'center',
            );
          });
      if (api.focus) api.focus.reveal('classification-beat-3-focus-1', paint);
      else paint();
      const update = () =>
        focusScope(ctx, api, 'classification-shrunken-update', () => {
          legacyEquation(
            ctx,
            api,
            'z_{new}=0+0.5h(x)\\in\\{-1,+1\\}',
            1485,
            875,
            35,
            themeColors.yellow,
          );
          legacyEquation(
            ctx,
            api,
            'p=\\sigma(z)\\in\\{0.269,0.731\\}',
            1485,
            980,
            33,
            themeColors.cyan,
          );
        });
      if (api.focus) api.focus.reveal('classification-tree-update', update);
      else update();
    } else {
      recordCard(
        ctx,
        api,
        'classification',
        snapshot.stage === 0 ? 'Starting logit · z = 0' : 'At z = 0 · initial ∂L/∂z = p − y',
        1260,
        430,
        430,
        78,
        themeColors.yellow,
        once(0, 0.12, 0.72),
        snapshot.stage === 0 ? 27 : 23,
      );
      focusScope(ctx, api, 'classification-object-trees-add-to-z-sigmoid-reads-p-26', () =>
        recordCard(
          ctx,
          api,
          'classification',
          'Trees add to z; sigmoid reads p',
          1260,
          540,
          430,
          78,
          themeColors.green,
          once(0, 0.22, 0.8),
          26,
        ),
      );
      if (beat > 0)
        focusScope(ctx, api, 'classification-simulation-27', () =>
          rows.forEach((row, index) =>
            recordCard(
              ctx,
              api,
              'classification',
              `Row ${index + 1} · y=${row.label} · gradient ${row.gradient > 0 ? '+' : ''}${row.gradient.toFixed(2)}`,
              1260,
              650 + index * 58,
              430,
              48,
              row.label ? themeColors.green : themeColors.pink,
              once(1, index * 0.08, 0.6 + index * 0.08),
              22,
            ),
          ),
        );
      if (beat > 0)
        legacyText(
          ctx,
          api,
          'Illustrative one-unit score move',
          1475,
          855,
          24,
          themeColors.muted,
          'center',
        );
      legacyEquation(
        ctx,
        api,
        String.raw`p=\sigma(z)=\frac{1}{1+e^{-z}}`,
        1475,
        945,
        37,
        themeColors.ink,
      );
    }
  }
}
export default {
  id: 'classification',
  draw: drawClassification,
  cues: [
    'classification-beat-1-focus-1',
    'classification-beat-1-focus-2',
    'classification-beat-2-focus-1',
    'classification-beat-3-focus-1',
    'classification-beat-3-focus-2',
    'classification-tree-update',
  ],
};
