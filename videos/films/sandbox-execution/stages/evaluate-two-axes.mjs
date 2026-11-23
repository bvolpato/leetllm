import { CANDIDATE_PAIRS, CANDIDATE_POOL } from '../construction.mjs';
import { evaluationSnapshot } from '../model.mjs';
import {
  drawSandboxCard,
  drawSandboxStage,
  drawSandboxText,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradeText,
  sandboxResultCompleted,
} from '../defaults.mjs';
export function paintEvaluateTwoAxesLegacy(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  phase,
  t,
  currentBeat,
  beatProgress,
  routeProgress,
) {
  const v = evaluationSnapshot(currentBeat, beatProgress);
  if (currentBeat === 0) {
    drawSandboxText(
      ctx,
      api,
      themeColors,
      'Independent, labeled probe fixtures',
      960,
      285,
      34,
      themeColors.ink,
      'center',
    );
    ['Artifact', 'Functional test', 'Network boundary probe'].forEach((label, i) =>
      drawSandboxText(
        ctx,
        api,
        themeColors,
        label,
        [240, 700, 1260][i],
        395,
        30,
        themeColors.muted,
      ),
    );
    [
      ['P1', true, false],
      ['P2', false, true],
      ['P3', true, true],
    ].forEach(([id, functional, contained], i) => {
      const y = 455 + i * 140;
      drawSandboxCard(ctx, api, themeColors, c, id, 170, y, 300, themeColors.blue, 95, 33);
      api.focus.target('functional-result', () =>
        drawSandboxCard(
          ctx,
          api,
          themeColors,
          c,
          v.seconds >= 2.6125 ? (functional ? 'PASS' : 'FAIL') : 'pending',
          650,
          y,
          400,
          v.seconds >= 2.6125
            ? functional
              ? themeColors.green
              : themeColors.pink
            : themeColors.muted,
          95,
          32,
        ),
      );
      api.focus.target('containment-result', () =>
        drawSandboxCard(
          ctx,
          api,
          themeColors,
          c,
          v.seconds >= 7.1125 ? (contained ? 'egress denied' : 'unexpected egress') : 'pending',
          1200,
          y,
          530,
          v.seconds >= 7.1125
            ? contained
              ? themeColors.green
              : themeColors.pink
            : themeColors.muted,
          95,
          29,
        ),
      );
    });
  } else {
    CANDIDATE_POOL.forEach((candidate, i) => {
      const visible = i < v.poolVisible;
      api.focus.target('candidate-pool', () =>
        drawSandboxCard(
          ctx,
          api,
          themeColors,
          c,
          candidate.id + '\n' + (visible ? (candidate.passed ? 'PASS' : 'FAIL') : 'pending'),
          180 + i * 320,
          285,
          275,
          visible ? (candidate.passed ? themeColors.green : themeColors.pink) : themeColors.muted,
          130,
          27,
        ),
      );
    });
    drawSandboxText(
      ctx,
      api,
      themeColors,
      'Every unordered pair · success requires at least one passing candidate',
      960,
      455,
      30,
      themeColors.ink,
      'center',
    );
    CANDIDATE_PAIRS.forEach((pair, i) => {
      const selected = i < v.pairs.length,
        x = 180 + (i % 5) * 320,
        y = 505 + Math.floor(i / 5) * 130;
      api.focus.target('candidate-pairs', () =>
        drawSandboxCard(
          ctx,
          api,
          themeColors,
          c,
          pair.ids.join(' + ') +
            '\n' +
            (selected ? (pair.successful ? 'success' : 'both fail') : 'not counted'),
          x,
          y,
          275,
          selected ? (pair.successful ? themeColors.green : themeColors.pink) : themeColors.muted,
          118,
          23,
        ),
      );
    });
    if (
      v.revealRatio &&
      (currentBeat > 1 || sandboxResultCompleted(ctx, api, 'evaluate-two-axes-ratio-result'))
    )
      api.focus.target('pass-at-two', () =>
        api.math(
          ctx,
          String.raw`\widehat{\mathrm{pass@2}}=\frac{7}{10}=1-\frac{\binom{3}{2}}{\binom{5}{2}}=0.70`,
          960,
          825,
          42,
          themeColors.cyan,
          'center',
        ),
      );
    else
      t.valueChange({
        x: 590,
        y: 795,
        width: 740,
        height: 105,
        from: 0,
        to: v.successful,
        progress: 1,
        label: 'Successful pairs · ' + v.pairs.length + ' / 10 inspected',
        format: (n) => Math.round(n).toString(),
        color: themeColors.green,
        fontSize: 31,
        showDelta: false,
      });
    if (currentBeat === 2) {
      const labels = [
        'Secret: omitted',
        'Network: denied',
        'Timeout: terminated',
        'Cleanup: verified',
      ];
      labels.forEach((label, i) =>
        api.focus.target('containment-result', () =>
          drawSandboxCard(
            ctx,
            api,
            themeColors,
            c,
            v.probes[i] ? label : 'Separate probe pending',
            105 + i * 445,
            925,
            400,
            v.probes[i] ? themeColors.green : themeColors.muted,
            75,
            23,
          ),
        ),
      );
      drawSandboxText(
        ctx,
        api,
        themeColors,
        'Runtime probe fixture · candidate-tree-7 · worker-A/g7',
        960,
        1050,
        24,
        themeColors.muted,
        'center',
      );
    } else {
    }
  }
}
export function paintEvaluateTwoAxes(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  currentBeat,
  beatProgress,
  id,
  on,
  done,
) {
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'The same observed 5-index pool defines two experiments',
    960,
    300,
    37,
    themeColors.ink,
    'center',
  );
  drawSandboxUpgradeCard(
    ctx,
    api,
    themeColors,
    c,
    'Without replacement',
    130,
    410,
    760,
    120,
    themeColors.blue,
    36,
  );
  drawSandboxUpgradeCard(
    ctx,
    api,
    themeColors,
    c,
    'With replacement',
    1030,
    410,
    760,
    120,
    themeColors.yellow,
    36,
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    '7 /10 successful unordered pairs',
    510,
    660,
    34,
    themeColors.blue,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    on('replacement-input') ? '1 − (3/5)²' : 'Replacement calculation pending',
    1410,
    660,
    on('replacement-input') ? 40 : 30,
    on('replacement-input') ? themeColors.yellow : themeColors.muted,
    'center',
  );
  drawSandboxUpgradeText(ctx, api, themeColors, '70%', 510, 805, 49, themeColors.blue, 'center');
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    done('replacement-result') ? '64%' : 'Result pending',
    1410,
    805,
    done('replacement-result') ? 49 : 31,
    done('replacement-result') ? themeColors.yellow : themeColors.muted,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Dependent repairs ≠ independent trajectory samples',
    960,
    960,
    34,
    themeColors.pink,
    'center',
  );
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Sample indices can repeat the same code; evaluate complete independent trajectories under fixed budgets',
  );
}
export function drawEvaluateTwoAxes(ctx, scene, state, api) {
  return drawSandboxStage(ctx, scene, state, api, paintEvaluateTwoAxes, paintEvaluateTwoAxesLegacy);
}
export default {
  id: 'evaluate-two-axes',
  draw: drawEvaluateTwoAxes,
  cues: [
    'evaluate-two-axes-b1-1',
    'evaluate-two-axes-b1-2',
    'evaluate-two-axes-b2-1',
    'evaluate-two-axes-b2-2',
    'evaluate-two-axes-b2-3',
    'evaluate-two-axes-ratio-result',
    'evaluate-two-axes-b3-1',
    'evaluate-two-axes-extension-4',
    'evaluate-two-axes-replacement-input',
    'evaluate-two-axes-replacement-result',
  ],
};
