import { cueProgress, detailNote, detailTag, detailText, progressArrow } from '../defaults.mjs';
import { research } from '../model.mjs';
export function drawResearchRequest(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('research-request-mechanism', () => {
    if (currentBeat === 0) {
      detailText(
        ctx,
        api,
        'Compare applicable US and EU production-access policies',
        960,
        280,
        34,
        themeColors.blue,
      );
      if (cueProgress(ctx, api, 'request-questions'))
        ['Shared identity checks', 'Regional approvals', 'Unresolved conflicts'].forEach((v, i) =>
          detailTag(
            ctx,
            api,
            v,
            350 + i * 610,
            420,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
            540,
          ),
        );
      if (cueProgress(ctx, api, 'research-contract')) {
        [
          ['steps', 6],
          ['sources', 12],
          ['seconds', 300],
        ].forEach(([name, n], i) => {
          const x = 380 + i * 580;
          detailText(
            ctx,
            api,
            String(n),
            x,
            585,
            58,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          );
          detailText(ctx, api, name + ' maximum', x, 642, 30, themeColors.muted);
        });
      }
      if (cueProgress(ctx, api, 'request-last')) {
        const max = 6;
        const used = resultComplete('request-limit') ? 6 : 5;
        for (let i = 0; i < max; i++)
          api.rect(
            ctx,
            155 + i * 93,
            710,
            82,
            35,
            i < used ? themeColors.blue : themeColors.panel,
            themeColors.blue,
            2,
          );
        const state = research(used, max);
        detailText(
          ctx,
          api,
          state === 'BUDGET STOP'
            ? '6 of 6 steps used · refuse the next search'
            : '5 of 6 steps used · two searches proposed',
          1290,
          742,
          34,
          themeColors.ink,
        );
      }
      if (resultComplete('request-source-cap'))
        detailTag(ctx, api, 'Proposed source 13 → refuse', 620, 845, themeColors.pink, 870);
      if (resultComplete('request-time-cap'))
        detailTag(ctx, api, 'Deadline → stop new work', 1490, 845, themeColors.pink, 690);
    } else {
      detailTag(
        ctx,
        api,
        'Current lookup: first passage with accepted entailed review',
        960,
        300,
        themeColors.blue,
        1580,
      );
      const rows = [
        ['US policy v3', 'US region · stated scope'],
        ['EU policy v2', 'EU region · stated scope'],
      ];
      rows.forEach(([name, detail], i) => {
        detailTag(ctx, api, name, 510 + i * 900, 500, [themeColors.blue, themeColors.cyan][i], 690);
        detailText(ctx, api, detail, 510 + i * 900, 590, 30, themeColors.muted);
      });
      if (cueProgress(ctx, api, 'request-first-hit'))
        progressArrow(ctx, api, 510, 650, 960, 760, themeColors.blue);
      if (resultComplete('research-precedence'))
        detailText(
          ctx,
          api,
          'No conflict detector, precedence rule or effective-date resolver',
          960,
          830,
          32,
          themeColors.pink,
        );
      if (resultComplete('request-policy-rule'))
        detailText(
          ctx,
          api,
          'Resolve applicability before treating rank as authority',
          960,
          935,
          35,
          themeColors.yellow,
        );
    }
    detailNote(
      ctx,
      api,
      'Product controls remain host-enforced across search, fetch, cache and response',
    );
  });
  return;
}
export default {
  id: 'research-request',
  draw: drawResearchRequest,
  cues: [
    'research-contract',
    'request-last',
    'request-limit',
    'request-questions',
    'request-source-cap',
    'request-time-cap',
    'research-precedence',
    'request-first-hit',
    'request-policy-rule',
  ],
};
