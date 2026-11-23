import {
  cueProgress,
  cueVisible,
  evidenceBox,
  evidenceFootnote,
  evidenceLine,
  evidenceText,
} from '../defaults.mjs';
import { candidateGate } from '../model.mjs';
export function drawReleaseReport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    resultComplete = (id) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : cueProgress(ctx, api, id) === 1;
  api.focus.target('release-report-mechanism', () => {
    if (currentBeat === 0) {
      const fields = [
        'candidate / prompt / tools',
        'suite / exposure / holdout',
        'outcome / permission evidence',
        'grouped repeated protocol',
        'all spend / CPST / latency',
        'judge + failure trace pointers',
      ];
      fields.forEach((s, i) => {
        if (i <= Math.floor(cueProgress(ctx, api, 'report-fields') * 6))
          evidenceBox(
            ctx,
            api,
            s,
            230 + (i % 2) * 780,
            310 + Math.floor(i / 2) * 165,
            680,
            115,
            themeColors.cyan,
          );
      });
      if (cueVisible(ctx, api, 'report-domain'))
        evidenceBox(
          ctx,
          api,
          'Finite rates · real integer counts · required fields',
          320,
          830,
          1280,
          90,
          themeColors.yellow,
        );
      if (cueVisible(ctx, api, 'report-nan'))
        evidenceText(
          ctx,
          api,
          'NaN < threshold is false → validate first',
          960,
          950,
          34,
          themeColors.pink,
          'center',
        );
    } else if (currentBeat === 1) {
      const gates = cueVisible(ctx, api, 'promotion-gates'),
        verdict = resultComplete('promotion-verdict'),
        labels = [
          'Every regression passes',
          'Zero critical failures',
          'All-3 reliability ≥ 0.95',
          'CPST ≤ $0.08',
        ],
        costs = [0.032, 0.038, 0.041],
        total = costs.reduce((sum, cost) => sum + cost, 0),
        candidate = {
          runs: costs.length,
          passes: 2,
          critical: 1,
          allThree: 1 / 3,
          cpst: total / 2,
        },
        values = [
          candidate.passes + ' / ' + candidate.runs,
          String(candidate.critical),
          '1 / 3',
          '$' +
            total.toFixed(3) +
            ' / ' +
            candidate.passes +
            (resultComplete('promotion-input') ? ' = $' + candidate.cpst.toFixed(4) : ' = ?'),
        ],
        checks = candidateGate(candidate).checks;
      labels.forEach((label, i) => {
        const y = 305 + i * 145;
        evidenceBox(
          ctx,
          api,
          label,
          220,
          y,
          780,
          105,
          gates ? themeColors.yellow : themeColors.line,
        );
        if (
          cueVisible(
            ctx,
            api,
            ['promotion-runs', 'promotion-critical', 'promotion-repeats', 'promotion-spend'][i],
          ) ||
          resultComplete('promotion-input')
        )
          evidenceBox(
            ctx,
            api,
            values[i],
            1120,
            y,
            560,
            105,
            verdict ? (checks[i] ? themeColors.green : themeColors.pink) : themeColors.cyan,
          );
        if (verdict)
          evidenceText(
            ctx,
            api,
            checks[i] ? '✓' : '×',
            1060,
            y + 68,
            45,
            checks[i] ? themeColors.green : themeColors.pink,
            'center',
          );
      });
      if (verdict)
        evidenceText(
          ctx,
          api,
          'BLOCK · cost cannot compensate for three failed gates',
          960,
          930,
          35,
          themeColors.pink,
          'center',
        );
    } else {
      evidenceBox(ctx, api, 'Well-formed report', 230, 335, 600, 140, themeColors.cyan);
      evidenceBox(ctx, api, 'Authentic complete evidence', 1070, 335, 600, 140, themeColors.yellow);
      evidenceLine(ctx, api, 850, 405, 1045, 405, themeColors.line);
      ['record authenticity', 'permission proof', 'sample adequacy', 'untouched holdout'].forEach(
        (s, i) => {
          evidenceBox(
            ctx,
            api,
            s,
            260 + (i % 2) * 770,
            620 + Math.floor(i / 2) * 130,
            640,
            95,
            cueVisible(ctx, api, 'report-proof') ? themeColors.yellow : themeColors.muted,
          );
        },
      );
      if (cueVisible(ctx, api, 'report-trust'))
        evidenceText(
          ctx,
          api,
          'A valid dictionary cannot supply these missing proofs',
          960,
          940,
          33,
          themeColors.pink,
          'center',
        );
    }
    evidenceFootnote(
      ctx,
      api,
      'Authored promotion fixture · thresholds belong to this local policy',
    );
  });
  return;
}
export default {
  id: 'release-report',
  draw: drawReleaseReport,
  cues: [
    'report-fields',
    'report-domain',
    'report-nan',
    'promotion-input',
    'promotion-runs',
    'promotion-critical',
    'promotion-repeats',
    'promotion-spend',
    'promotion-gates',
    'promotion-verdict',
    'report-proof',
    'report-trust',
  ],
};
