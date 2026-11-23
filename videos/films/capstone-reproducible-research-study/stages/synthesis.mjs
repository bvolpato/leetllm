import { cueProgress, ledger, signed, summary } from '../evidence.mjs';

const missing = ledger.filter((row) => row.gain < 0);
const draft = summary(ledger.filter((row) => row.gain >= 0));

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const restore = cueProgress(state, 'restore-missing-rows', 1, 0.08, 0.63);
  const restored = Math.floor(restore * missing.length);
  const retained = ledger.filter((row) => row.gain >= 0 || missing.indexOf(row) < restored);
  const result = summary(retained);
  const corrected = cueProgress(state, 'correct-draft', 2, 0.05, 0.5) === 1;
  api.focus.target('report-ledger', () => {
    api.text(ctx, 'Seed rows behind the figure', 135, 260, 37, C.ink);
    api.text(ctx, 'Change in goals per 30 early episodes', 135, 326, 29, C.muted);
    ledger.forEach((row, i) => {
      const x = 135 + 168 * (i % 6),
        y = 388 + 113 * Math.floor(i / 6);
      const present = retained.includes(row);
      const color = present ? (row.gain < 0 ? C.pink : C.cyan) : C.muted;
      api.rect(ctx, x, y, 146, 91, C.panel, color, 5);
      api.text(ctx, `Seed ${row.seed}`, x + 73, y + 31, 25, C.muted, 'center');
      api.text(ctx, present ? signed(row.gain) : '…', x + 73, y + 74, 37, color, 'center');
    });
    const draftLabel = corrected ? `Draft from ${ledger.length - missing.length} pairs` : 'Draft figure';
    api.text(ctx, draftLabel, 1472, 330, 36, C.muted, 'center');
    api.text(
      ctx,
      `${signed(draft.points, 1)} points`,
      1472,
      407,
      58,
      corrected ? C.muted : C.ink,
      'center',
    );
    api.text(
      ctx,
      `${retained.length} of ${ledger.length} seed pairs`,
      1472,
      535,
      39,
      C.ink,
      'center',
    );
    api.text(
      ctx,
      `${signed(result.gain)} / ${result.episodesPerArm}`,
      1472,
      654,
      56,
      C.ink,
      'center',
    );
    api.text(ctx, 'net goals / early episodes per arm', 1472, 704, 27, C.muted, 'center');
    if (corrected)
      api.text(ctx, `${signed(result.points, 1)} points`, 1472, 802, 54, C.yellow, 'center');
    const note = corrected
      ? 'Report the mean from all 24 pairs and its paired interval.'
      : restored === missing.length
        ? 'All rows restored. What belongs in the figure?'
        : 'Compare the draft with the retained table, seed by seed.';
    api.text(ctx, note, 960, 960, 38, C.ink, 'center');
  });
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['inspect-draft', 'restore-missing-rows', 'correct-draft'],
};
