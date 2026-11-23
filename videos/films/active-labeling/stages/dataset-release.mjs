import { cleanedRows, draftRows } from '../fixtures.mjs';
import { phase, ramp, sampleModel, smooth } from '../construction.mjs';
import { auditRelease, releaseSummaryGate } from '../model.mjs';
import {
  card,
  cueVisible,
  detailFooter,
  detailHeading,
  detailRow,
  detailTarget,
  detailText,
  text,
} from '../defaults.mjs';
export function drawDatasetRelease(ctx, scene, state, api) {
  if (drawManifestEvidence(ctx, scene, state, api)) return;
  const { C: themeColors, components: components } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('dataset-release', state);
  {
    if (state.cues?.['remove-related']) {
      const rebuilt = api.focus.progress('remove-related', 0) >= 1,
        completed = !rebuilt || api.focus.progress('complete-audit', 0) >= 1;
      Object.assign(modelState, auditRelease(rebuilt ? cleanedRows : draftRows, completed));
    }
    const entries = [
      ['Redaction', modelState.checks.redaction],
      ['Overlap audit', modelState.checks.leakage],
      ['Agreement ≥ .65', modelState.checks.agreement],
      ['Safe + resolved targets', modelState.checks.safeTargets && modelState.checks.resolved],
      ['Provenance', modelState.checks.provenance],
      ['Audit bound to snapshot', modelState.checks.snapshot],
    ];
    text(ctx, api, 'Dataset row identities', 475, 295, 31, themeColors.ink, 'center');
    const movement =
      beat === 2 ? smooth(api.focus.progress('remove-related', ramp(progress, 0.01, 0.09))) : 0;
    draftRows.forEach((row, i) => {
      const excluded = i >= 2,
        x = 150 + (excluded ? 980 * movement : 0),
        y = 340 + i * 115;
      api.focus.target('dataset-rows', () =>
        card(
          ctx,
          api,
          `${row.id}\nSource family: ${row.family}`,
          x,
          y,
          650,
          excluded ? themeColors.pink : themeColors.green,
          100,
          27,
        ),
      );
    });
    if (beat === 2)
      text(
        ctx,
        api,
        'Excluded from the rebuilt snapshot',
        1455,
        550,
        28,
        themeColors.pink,
        'center',
      );
    const shortLabels = [
      'Redaction',
      'Source overlap',
      'Agreement',
      'Safe + resolved',
      'Provenance',
      'Current audit',
    ];
    entries.forEach(([, passed], i) => {
      const pending = !modelState.completed && (i === 1 || i === 5);
      api.focus.target('release-checks', () =>
        card(
          ctx,
          api,
          `${shortLabels[i]}\n${passed ? 'PASS' : pending ? 'WAIT' : 'BLOCK'}`,
          150 + i * 280,
          850,
          240,
          passed ? themeColors.green : pending ? themeColors.yellow : themeColors.pink,
          95,
          24,
        ),
      );
    });
    api.focus.target('release-manifest', () =>
      components.panel(
        {
          x: 1130,
          y: 280,
          width: 650,
          height: 235,
          fill: themeColors.panel,
          stroke: themeColors.yellow,
          scope: 'label',
          padding: 20,
        },
        () => {
          text(ctx, api, modelState.manifest.dataset, 1160, 325, 32, themeColors.yellow);
          api.focus.target('dataset-digest', () =>
            text(
              ctx,
              api,
              `Rows ${modelState.rows.length} · SHA ${modelState.digest.slice(0, 16)}`,
              1160,
              380,
              26,
              themeColors.ink,
            ),
          );
          text(
            ctx,
            api,
            `${modelState.manifest.selector} · ${modelState.manifest.redactor} · ${modelState.manifest.rubric}`,
            1160,
            435,
            24,
            themeColors.blue,
          );
          text(
            ctx,
            api,
            `${modelState.manifest.evaluation} · ${modelState.manifest.sourceWindow}`,
            1160,
            485,
            25,
            themeColors.muted,
          );
        },
      ),
    );
    api.focus.target('release-state', () =>
      text(
        ctx,
        api,
        modelState.open
          ? 'The gate opens for these exact rebuilt rows.'
          : !modelState.completed
            ? 'Rebuilt snapshot · current overlap audit pending'
            : 'Reserved source and derivative block this draft.',
        960,
        1010,
        29,
        modelState.open ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
  }
}
function drawManifestEvidence(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (!(currentBeat === 3)) return false;
  const { C: themeColors } = api;
  {
    detailHeading(ctx, api, 'A complete manifest still needs authentic reports bound to the rows');
    const evidence = cueVisible(ctx, api, 'manifest-evidence'),
      closed = cueVisible(ctx, api, 'closed-gate'),
      trained = cueVisible(ctx, api, 'post-training');
    detailTarget(ctx, api, 'manifest-evidence', () => {
      detailRow(
        ctx,
        api,
        'Illustrative counts: 182 demonstrations / 904 preferences',
        150,
        365,
        1620,
        themeColors.blue,
      );
      if (evidence)
        detailRow(
          ctx,
          api,
          'Immutable row snapshot ↔ completed audit ↔ exact digest',
          150,
          475,
          1620,
          themeColors.cyan,
        );
    });
    detailTarget(ctx, api, 'closed-gate', () => {
      if (closed) {
        const bad = [
            ['Missing audit', {}],
            [
              'Boolean kappa',
              {
                kappa: true,
              },
            ],
            [
              'Nonfinite kappa',
              {
                kappa: NaN,
              },
            ],
            [
              'Unsafe count 1',
              {
                unsafe: 1,
              },
            ],
          ],
          base = {
            redaction: true,
            completed: true,
            findings: [],
            kappa: 0.835,
            threshold: 0.65,
            unsafe: 0,
            unresolved: 0,
          };
        bad.forEach(([name, delta], i) => {
          const v =
            i === 0
              ? {
                  ...base,
                  completed: undefined,
                }
              : {
                  ...base,
                  ...delta,
                };
          detailRow(
            ctx,
            api,
            name + ' → ' + (releaseSummaryGate(v) ? 'PASS' : 'BLOCK'),
            150 + (i % 2) * 840,
            650 + Math.floor(i / 2) * 110,
            760,
            themeColors.pink,
          );
        });
      }
    });
    detailTarget(ctx, api, 'post-training', () => {
      if (trained)
        detailText(
          ctx,
          api,
          'After training: deleting a row does not undo its parameter update.',
          960,
          945,
          32,
          themeColors.pink,
          'center',
        );
    });
    detailFooter(ctx, api, 'Retrain from a clean checkpoint or obtain a fresh independent test.');
  }
  return true;
}
export default {
  id: 'dataset-release',
  draw: drawDatasetRelease,
  cues: [
    'release-manifest',
    'exact-dataset',
    'reserved-overlap',
    'remove-related',
    'audit-gate',
    'complete-audit',
    'manifest-evidence',
    'closed-gate',
    'post-training',
  ],
};
