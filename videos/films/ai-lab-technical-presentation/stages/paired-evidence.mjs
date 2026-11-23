import { pairedPlayback, sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawPairedEvidence(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('paired-evidence', state);
  {
    const paired = pairedPlayback(state.beat ?? 0, state.beatP ?? 0, state.cues);
    text(
      ctx,
      api,
      'same 200 query IDs · one relevant runbook per query',
      960,
      285,
      31,
      themeColors.muted,
      'center',
    );
    text(ctx, api, 'candidate succeeds', 670, 345, 27, themeColors.green, 'center');
    text(ctx, api, 'candidate misses', 1295, 345, 27, themeColors.pink, 'center');
    text(ctx, api, 'baseline succeeds', 145, 520, 27, themeColors.blue);
    text(ctx, api, 'baseline misses', 145, 700, 27, themeColors.muted);
    api.focus.target('paired-matrix', () =>
      teaching.grid({
        x: 500,
        y: 385,
        width: 1080,
        height: 360,
        rows: 2,
        columns: 2,
        cellFocusTarget: (row, column) =>
          [
            ['paired-both', 'paired-regressed'],
            ['paired-improved', 'paired-neither'],
          ][row][column],
        labels: [
          [String(paired.counts.both), String(paired.counts.baselineOnly)],
          [String(paired.counts.candidateOnly), String(paired.counts.neither)],
        ],
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        fontSize: 45,
        highlights: [
          {
            row: 0,
            column: 1,
            fill: '#ef9ac82b',
            stroke: themeColors.pink,
          },
          {
            row: 1,
            column: 0,
            fill: '#8cdeb52b',
            stroke: themeColors.green,
          },
        ],
      }),
    );
    api.focus.target('paired-totals', () =>
      text(
        ctx,
        api,
        paired.n
          ? `${paired.baselineHits} / ${paired.n}  →  ${paired.candidateHits} / ${paired.n}`
          : 'Awaiting paired observations · 0 / 200 checked',
        960,
        815,
        38,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.reveal('paired-rates', () =>
      api.focus.target('paired-rates', () =>
        text(
          ctx,
          api,
          paired.n
            ? `${((100 * paired.baselineHits) / paired.n).toFixed(0)}% → ${((100 * paired.candidateHits) / paired.n).toFixed(0)}% · +${((100 * (paired.candidateHits - paired.baselineHits)) / paired.n).toFixed(0)} percentage points`
            : 'Rates pending',
          960,
          925,
          32,
          themeColors.yellow,
          'center',
        ),
      ),
    );
  }
}
export default {
  id: 'paired-evidence',
  draw: drawPairedEvidence,
  cues: [
    'paired-population',
    'paired-totals',
    'paired-rates',
    'paired-improved',
    'paired-regressed',
    'paired-both',
    'paired-neither',
  ],
};
