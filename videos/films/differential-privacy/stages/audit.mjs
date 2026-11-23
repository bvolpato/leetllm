import { releaseTraceSnapshot } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawAudit(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const trace = releaseTraceSnapshot(state),
      done = (key) => api.focus.progress('dp-result-audit-' + key, 0) === 1;
    if (currentBeat === 0) {
      text(
        ctx,
        api,
        'Predict R4’s contribution after clipping to C = 1',
        960,
        285,
        38,
        themeColors.ink,
        'center',
      );
      const origin = {
          x: 450,
          y: 735,
        },
        unit = 83,
        raw = [3, 4];
      api.line(ctx, 240, origin.y, 880, origin.y, themeColors.muted, 2);
      api.line(ctx, origin.x, 355, origin.x, 850, themeColors.muted, 2);
      api.circle(ctx, origin.x, origin.y, unit, themeColors.cyan + '22', themeColors.cyan, 3);
      text(ctx, api, 'C = 1', origin.x + unit + 18, origin.y - 8, 28, themeColors.cyan);
      const shrink = 1 - 0.8 * trace.clipProgress;
      const endpoint = {
        x: origin.x + raw[0] * unit * shrink,
        y: origin.y - raw[1] * unit * shrink,
      };
      api.focus.target('clip-vector', () =>
        api.arrow(ctx, origin.x, origin.y, endpoint.x, endpoint.y, themeColors.yellow, 6),
      );
      text(ctx, api, 'R4 gradient', endpoint.x + 18, endpoint.y - 8, 27, themeColors.yellow);
      card(ctx, api, 'Raw R4: [3, 4] · norm 5', 1060, 425, 540, themeColors.blue, 96);
      if (trace.clipOutcomeProgress > 0)
        api.focus.target('clip-outcome', () => {
          card(ctx, api, 'Clip bound C = 1 · scale 1/5', 1060, 565, 540, themeColors.yellow, 96);
          card(
            ctx,
            api,
            done('clip') ? 'R4 contributes [0.6, 0.8]' : 'R4 contribution: pending',
            1060,
            705,
            540,
            done('clip') ? themeColors.green : themeColors.muted,
            96,
          );
        });
      text(
        ctx,
        api,
        'Same direction; the norm stops at the bound',
        960,
        900,
        30,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      text(
        ctx,
        api,
        'Carry that clipped record into the noisy sum',
        960,
        265,
        38,
        themeColors.ink,
        'center',
      );
      const origin = {
          x: 245,
          y: 790,
        },
        sx = 225,
        sy = 205;
      const point = ([x, y]) => ({
        x: origin.x + x * sx,
        y: origin.y - y * sy,
      });
      api.line(ctx, 180, origin.y, 790, origin.y, themeColors.muted, 2);
      api.line(ctx, origin.x, 335, origin.x, 835, themeColors.muted, 2);
      const recordIds = ['R1', 'R2', 'R4'];
      const colors = [themeColors.blue, themeColors.cyan, themeColors.green];
      let cursor = [0, 0];
      trace.records.slice(0, trace.visibleContributions).forEach((vector, index) => {
        const end = cursor.map((value, axis) => value + vector[axis]);
        const from = point(cursor),
          to = point(end);
        const id = recordIds[index];
        const target = 'record-' + id.toLowerCase();
        api.focus.target('record-sum', () =>
          api.focus.target(target, () => api.arrow(ctx, from.x, from.y, to.x, to.y, colors[index], 5)),
        );
        api.focus.target(target, () =>
          text(
            ctx,
            api,
            `${id} ${JSON.stringify(vector.map((value) => Number(value.toFixed(1))))}`,
            980,
            420 + index * 62,
            27,
            colors[index],
          ),
        );
        cursor = end;
      });
      if (trace.aggregateProgress > 0) {
        const end = point(trace.aggregate);
        api.focus.target('aggregate-point', () =>
          api.circle(ctx, end.x, end.y, 12, themeColors.yellow),
        );
        text(
          ctx,
          api,
          done('aggregate') ? 'Aggregate [1.6, 1.9]' : 'Aggregate result: pending',
          980,
          625,
          28,
          done('aggregate') ? themeColors.yellow : themeColors.muted,
        );
      }
      if (trace.noiseProgress > 0) {
        const start = point(trace.aggregate),
          end = point(trace.aggregate.map((v, i) => v + trace.noise[i] * trace.noiseProgress));
        api.focus.target('noise-step', () =>
          api.arrow(ctx, start.x, start.y, end.x, end.y, themeColors.pink, 6),
        );
        api.focus.target('noisy-release', () => {
          api.circle(ctx, end.x, end.y, 12, themeColors.pink);
          text(ctx, api, 'Noise [0.2, -0.3]', 980, 690, 27, themeColors.pink);
          text(
            ctx,
            api,
            done('noise') ? 'After authored draw: [1.8, 1.6]' : 'Authored draw result: pending',
            980,
            752,
            27,
            done('noise') ? themeColors.pink : themeColors.muted,
          );
        });
      }
      text(
        ctx,
        api,
        'Each arrow starts at the previous endpoint',
        1180,
        900,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'Checkpoint selection adds another private release',
        960,
        245,
        37,
        themeColors.ink,
        'center',
      );
      text(
        ctx,
        api,
        'Private validation · suppose the DP selector chooses',
        445,
        330,
        25,
        themeColors.muted,
        'center',
      );
      const candidates = ['C5', 'C6', 'C7', 'C8'].map((label, i) => {
        const x = 40 + i * 215,
          chosen = label === 'C7' && done('selection');
        return api.focus.target('candidate-selection', () =>
          card(
            ctx,
            api,
            chosen ? label + ' selected' : label,
            x,
            380,
            205,
            chosen ? themeColors.green : themeColors.blue,
            88,
          ),
        );
      });
      void candidates;
      const trainRow =
        trace.ledgerProgress > 0
          ? api.focus.target('training-ledger', () =>
              card(ctx, api, 'Training · (ε₁, δ₁)', 940, 380, 690, themeColors.cyan, 82),
            )
          : null;
      const selectRow =
        trace.ledgerProgress > 0
          ? api.focus.target('selection-ledger', () =>
              card(ctx, api, 'Private selector · (ε₂, δ₂)', 940, 475, 690, themeColors.green, 82),
            )
          : null;
      if (trace.ledgerProgress > 0) {
        api.focus.target('selection-to-ledger', () =>
          api.arrow(ctx, 573, 470, 930, 516, themeColors.green, 4),
        );
        api.focus.target('composition-assumptions', () =>
          text(
            ctx,
            api,
            'Same protected unit · same adjacency',
            1285,
            585,
            27,
            themeColors.muted,
            'center',
          ),
        );
      }
      if (trace.compositionProgress > 0) {
        api.focus.target('composition-flow', () =>
          api.arrow(ctx, 1285, 620, 1285, 652, themeColors.yellow, 4),
        );
        api.focus.target('composed-budget', () => {
          text(
            ctx,
            api,
            'Sequential basic-composition bound',
            1285,
            682,
            27,
            themeColors.yellow,
            'center',
          );
          const epsilonBound = done('composition') ? 'ε₁ + ε₂' : 'ε₁ + …';
          const deltaBound = done('composition') ? 'δ₁ + δ₂' : 'δ₁ + …';
          text(
            ctx,
            api,
            `(${epsilonBound}, ${deltaBound})`,
            1285,
            730,
            36,
            themeColors.yellow,
            'center',
          );
        });
      }
      if (trace.accountantProgress > 0) {
        api.focus.target('matching-accountant', () =>
          card(ctx, api, 'Sampler · noise scale · step count', 940, 805, 690, themeColors.yellow, 82),
        );
      }
      void trainRow;
      void selectRow;
      if (trace.controlsProgress > 0)
        api.focus.target('other-data-controls', () =>
          card(
            ctx,
            api,
            'Raw ticket lookup requires read permission',
            360,
            900,
            1150,
            themeColors.pink,
            76,
          ),
        );
    }
  }
}
export default {
  id: 'audit',
  draw: drawAudit,
  cues: [
    'trace-clip',
    'trace-clip-result',
    'dp-result-audit-clip',
    'trace-add',
    'trace-add-r1',
    'trace-add-r2',
    'trace-add-r4',
    'trace-aggregate',
    'trace-noise',
    'dp-result-audit-aggregate',
    'dp-result-audit-noise',
    'select-checkpoint',
    'account-selection',
    'compose-releases',
    'matching-accountant',
    'other-data-paths',
    'dp-result-audit-selection',
    'dp-result-audit-composition',
  ],
};
