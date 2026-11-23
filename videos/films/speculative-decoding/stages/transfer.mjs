import { wordOdds } from '../word-odds.mjs';
import { movement } from '../construction.mjs';
import { CHAIN } from '../fixtures.mjs';
import { transferSnapshot } from '../model.mjs';
import { originalCard, originalText } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const current = transferSnapshot(currentBeat, progress, state.cues),
      row = CHAIN[1];
    if (currentBeat < 2) {
      api.focus.target('transfer-prefix', () =>
        originalText(
          ctx,
          api,
          'Committed prefix: The bird sang',
          960,
          270,
          36,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('transfer-proposal', () =>
        components.tokenRow({
          values: ['The', 'bird', 'sang', 'softly', 'today'],
          centerX: 960,
          y: 320,
          width: 220,
          gap: 25,
          height: 82,
          fontSize: 30,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
        }),
      );
      if (currentBeat === 0) {
        wordOdds(ctx, api, {
          words: row.words, p: row.p, q: row.q, y: 545, selected: row.candidate,
          targets: ['transfer-candidate', 'transfer-nearby-odds', 'transfer-today-odds'],
        });
        const draw = movement(state, 0, 'transfer-draw', 0.47, 0.64);
        api.focus.target('transfer-uniform', () =>
          originalText(ctx, api, draw > 0 ? 'Acceptance draw  ' + current.draw.toFixed(2) : 'Acceptance draw  ?',
            165, 810, 35, themeColors.yellow),
        );
        api.focus.target('transfer-prediction', () =>
          originalText(ctx, api, 'Predict the acceptance result for softly. Which word has a shortfall?',
            960, 960, 37, themeColors.ink, 'center'),
        );
      } else {
        api.focus.target('transfer-deficit-bars', () =>
          teaching.bars({
            x: 180,
            y: 500,
            width: 650,
            height: 260,
            values: current.deficit,
            labels: row.words,
            color: themeColors.yellow,
            max: 0.6,
            progress: current.deficitProgress,
            showValues: true,
            format: (v) => v.toFixed(2),
            fontSize: 29,
            gap: 50,
          }),
        );
        api.focus.target('transfer-residual-bars', () =>
          teaching.bars({
            x: 1090,
            y: 500,
            width: 650,
            height: 260,
            values: current.residual,
            labels: row.words,
            color: themeColors.green,
            max: 1,
            progress: current.residualProgress,
            showValues: true,
            format: (v) => v.toFixed(2),
            fontSize: 29,
            gap: 50,
          }),
        );
        if (current.deficitVisible)
          api.focus.target('transfer-deficit-label', () =>
            originalText(
              ctx,
              api,
              'Positive deficit max(p - q, 0)',
              505,
              455,
              29,
              themeColors.yellow,
              'center',
            ),
          );
        if (current.residualProgress > 0)
          api.focus.target('transfer-residual-label', () =>
            originalText(
              ctx,
              api,
              'Normalized residual r',
              1415,
              455,
              31,
              themeColors.green,
              'center',
            ),
          );
        if (current.rejected)
          api.focus.target('transfer-ratio', () =>
            originalText(
              ctx,
              api,
              'α = min(1, 0.30 / 0.60) = ' +
                (state.cues?.['ratio-answer'] && state.cues['ratio-answer'].phase !== 'after'
                  ? '?' : current.acceptance.toFixed(2)),
              960,
              860,
              40,
              themeColors.yellow,
              'center',
            ),
          );
        if (current.discarded)
          api.focus.target('transfer-rejection-result', () =>
            originalText(
              ctx,
              api,
              'u = 0.80 > 0.50 · reject softly; discard today',
              960,
              920,
              30,
              themeColors.pink,
              'center',
            ),
          );
        if (current.corrected)
          api.focus.target('transfer-correction', () =>
            originalCard(ctx, api, 'Residual sample: nearby', 570, 975, 780, themeColors.green),
          );
      }
    } else {
      api.focus.target('transfer-committed-output', () =>
        originalText(ctx, api, 'Committed output', 960, 275, 31, themeColors.green, 'center'),
      );
      api.focus.target('transfer-output', () =>
        components.tokenRow({
          values: current.committed,
          centerX: 960,
          y: 370,
          width: 310,
          gap: 42,
          height: 90,
          fontSize: 33,
          fill: themeColors.panel,
          stroke: themeColors.green,
          textColor: themeColors.ink,
        }),
      );
      api.focus.target('transfer-verifier-state', () =>
        originalText(
          ctx,
          api,
          current.trimProgress === 0
            ? 'Target verification state before rejection cleanup'
            : current.trimmed
              ? 'Target verification state after rejection cleanup'
              : 'Removing rejected suffix KV',
          960,
          510,
          30,
          current.trimmed
            ? themeColors.green
            : current.trimProgress > 0
              ? themeColors.yellow
              : themeColors.blue,
          'center',
        ),
      );
      api.focus.target('transfer-verified-kv', () =>
        components.tokenRow({
          values: current.cleanupKV,
          centerX: 960,
          y: 600,
          width: 315,
          gap: 48,
          height: 82,
          fontSize: 27,
          fill: themeColors.panel,
          stroke: current.trimProgress > 0 ? themeColors.yellow : themeColors.blue,
          textColor: themeColors.ink,
        }),
      );
      api.focus.target('transfer-retained-kv', () =>
        originalText(
          ctx,
          api,
          current.trimmed
            ? 'Retain KV: sang'
            : current.trimProgress > 0
              ? 'Cleanup in progress · keep committed prefix KV'
              : 'Retained prefix KV: sang · rejected suffix still provisional',
          960,
          735,
          29,
          current.trimmed
            ? themeColors.green
            : current.trimProgress > 0
              ? themeColors.yellow
              : themeColors.blue,
          'center',
        ),
      );
      api.focus.target('transfer-pending-nearby', () =>
        originalCard(
          ctx,
          api,
          current.forwarded ? 'KV ready: sang + nearby' : 'Pending KV: nearby',
          520,
          820,
          880,
          current.forwarded ? themeColors.green : themeColors.yellow,
        ),
      );
      if (current.forwarded)
        api.focus.target('transfer-forward-nearby', () =>
          originalText(
            ctx,
            api,
            'Forward nearby on the corrected prefix · next decode can read it',
            960,
            965,
            29,
            themeColors.green,
            'center',
          ),
        );
      else
        api.focus.target('transfer-forward-nearby', () =>
          originalText(
            ctx,
            api,
            'Forward the correction before the next decode',
            960,
            965,
            29,
            themeColors.yellow,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'same-prefix',
    'candidate-distribution',
    'transfer-draw',
    'candidate-prediction',
    'rejection-ratio',
    'ratio-answer',
    'discard-dependent',
    'positive-deficit',
    'normalize-residual',
    'sample-correction',
    'trim-provisional-kv',
    'retain-accepted-kv',
    'forward-nearby',
    'cache-nearby',
  ],
};
