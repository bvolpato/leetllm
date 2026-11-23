import { MINING_FIXTURE } from '../fixtures.mjs';
import { formatValue, miningCandidates } from '../arithmetic.mjs';
import { drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawMiningLoop(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-mining-loop-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('mining-loop-mechanism', () => {
    const query = 'How do I rotate an API key?',
      selected = new Set(miningCandidates('How do I rotate an API key?').map((r) => r.id)),
      terms = new Set(
        'How do I rotate an API key?'
          .toLowerCase()
          .replace(/[?.!,]/g, '')
          .split(' '),
      ),
      rows = currentBeat
        ? MINING_FIXTURE.map((r) => ({
            ...r,
            overlap: [
              ...new Set(
                r.text
                  .toLowerCase()
                  .replace(/[?.!,]/g, '')
                  .split(' '),
              ),
            ].filter((t) => terms.has(t)).length,
          }))
        : [
            {
              id: 'API answer',
              relevant: true,
            },
            {
              id: 'replacement',
              relevant: true,
            },
            {
              id: 'KMS intent',
              relevant: false,
            },
            {
              id: 'GPU guide',
              relevant: false,
            },
          ];
    drawText(
      ctx,
      api,
      currentBeat
        ? 'Actual executed mining fixture · retained query'
        : 'Audit the query-specific relevance relation',
      960,
      285,
      35,
      themeColors.yellow,
    );
    if (currentBeat)
      drawText(ctx, api, 'How do I rotate an API key?', 960, 350, 30, themeColors.blue);
    rows.forEach((r, i) => {
      const y = 450 + i * 110,
        col = r.relevant
          ? themeColors.green
          : r.id === 'GPU guide'
            ? themeColors.blue
            : themeColors.pink;
      drawPill(ctx, api, r.id, 470, y, 610, col);
      if (currentBeat || resultComplete('audit'))
        drawText(ctx, api, r.relevant ? 'verified +' : 'non-match', 950, y + 11, 28, col);
      if (currentBeat && (B('lexical') || currentBeat > 1))
        drawText(ctx, api, 'overlap ' + r.overlap, 1230, y + 11, 27, themeColors.cyan);
      if (currentBeat && (resultComplete('teacher') || currentBeat > 1))
        drawText(
          ctx,
          api,
          'teacher ' + formatValue(r.teacher, 2),
          1560,
          y + 11,
          27,
          selected.has(r.id) ? themeColors.pink : themeColors.muted,
        );
    });
    if (currentBeat === 1 && resultComplete('mass'))
      drawText(
        ctx,
        api,
        'Separate cosine row: .90 / .20 / +.72 → loss .026958',
        960,
        955,
        31,
        themeColors.pink,
      );
    if (currentBeat === 2) {
      drawText(
        ctx,
        api,
        'Re-encode + index v2 · hold-out groups stay outside mining',
        960,
        945,
        30,
        themeColors.cyan,
      );
    }
    drawNote(
      ctx,
      api,
      'Lexical overlap and supplied teacher labels executed locally · no BM25 or neural teacher run',
    );
  });
}
export default {
  id: 'mining-loop',
  draw: drawMiningLoop,
  cues: [
    'cl-mining-loop-audit',
    'cl-mining-loop-lexical',
    'cl-mining-loop-teacher',
    'cl-mining-loop-mass',
    'cl-mining-loop-round',
    'cl-mining-loop-holdout',
  ],
};
