import { NEGATIVE_OUTPUTS } from '../fixtures.mjs';
import { completed, event, extendedEmbeddingState } from '../construction.mjs';
import { axes, centeredText, extensionText, footer } from '../defaults.mjs';
import assert from 'node:assert/strict';
export function drawNegativeStep(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat),
    done = (name, beat) => completed(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString()),
    vec = (v) => '[' + v.map(fmt).join(', ') + ']';
  api.focus.target('negative-step-mechanism', () => {
    const f = extendedEmbeddingState('negative-step', state),
      a = axes(ctx, api, 220, 405, 580, 480, [0.91, 1.11], [-0.1, 0.1], [-0.1, 0, 0.1]);
    centeredText(
      ctx,
      api,
      'Same center u · fixed output rows in this one-step toy',
      960,
      285,
      34,
      themeColors.yellow,
    );
    const origin = a.point(1, 0);
    api.circle(ctx, origin.x, origin.y, 9, themeColors.muted);
    if (currentBeat < 2) {
      NEGATIVE_OUTPUTS.forEach((row, i) => {
        extensionText(
          ctx,
          api,
          i ? 'noise ' + i : 'observed',
          1050,
          385 + i * 150,
          29,
          i ? themeColors.pink : themeColors.cyan,
        );
        centeredText(ctx, api, vec(row), 1450, 385 + i * 150, 34, themeColors.ink);
        centeredText(
          ctx,
          api,
          'score ' + fmt(f.scores[i]) + ' · coefficient ' + fmt(f.coefficients[i]),
          1350,
          445 + i * 150,
          29,
          i ? themeColors.pink : themeColors.cyan,
        );
      });
      centeredText(
        ctx,
        api,
        currentBeat === 0 ? 'Separate input and output owners' : 'g = (σ(s+) − 1)v+ + Σ σ(sn)vn',
        960,
        920,
        31,
        themeColors.ink,
      );
      if (currentBeat === 1)
        centeredText(
          ctx,
          api,
          done('sigmoid-zero', 1) ? 'σ(0) = 0.5' : 'σ(z) = 1 / (1 + exp(−z))',
          500,
          330,
          30,
          themeColors.yellow,
        );
    } else {
      const out = api.teaching.vectorAccumulation({
        plot: a,
        initial: [1, 0],
        terms: f.updateTerms.map((term, i) => ({
          ...term,
          color: i ? themeColors.pink : themeColors.cyan,
        })),
        progress: ev('negative-move', 2),
        ledger: {
          x: 1020,
          y: 385,
          width: 750,
          height: 430,
        },
        fontSize: 30,
        color: themeColors.green,
        restColor: themeColors.muted,
        revealTotal: done('negative-move', 2),
        totalLabel: 'Updated center',
        format: fmt,
      });
      centeredText(
        ctx,
        api,
        'positive score ' + fmt(f.positiveScore),
        1370,
        880,
        34,
        themeColors.cyan,
      );
      centeredText(
        ctx,
        api,
        f.reveal
          ? 'loss ' + fmt(f.lossBefore) + ' → ' + fmt(f.loss)
          : 'initial loss ' + fmt(f.lossBefore),
        1370,
        955,
        36,
        f.reveal ? themeColors.green : themeColors.muted,
      );
      assert(out.state.sum.every((v, i) => Math.abs(v - f.updated[i]) < 1e-12));
    }
    footer(
      ctx,
      api,
      'Actual supplied loss and gradient determine the motion; no trained semantic-quality claim',
    );
  });
}
export default {
  id: 'negative-step',
  draw: drawNegativeStep,
  cues: [
    'emb-negative-inputs',
    'emb-negative-noise',
    'emb-sigmoid-zero',
    'emb-negative-gradient',
    'emb-negative-update-rule',
    'emb-negative-before',
    'emb-negative-move',
    'emb-negative-loss',
  ],
};
