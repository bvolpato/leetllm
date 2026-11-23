import { admit, readableRankedCandidates, sampleModel } from '../model.mjs';
import { card, originalText } from '../defaults.mjs';
export function drawAccess(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel(state);
  {
    const b = state.beat ?? 0,
      P = (id) => api.focus.progress(id, 0),
      D = (id) => P(id) === 1;
    api.focus.target('access-mechanism', () => {
      if (b === 0) {
        api.focus.target('authenticated-caller', () =>
          originalText(
            ctx,
            api,
            'Trusted server identity resolves caller region: US',
            960,
            280,
            36,
            themeColors.yellow,
            'center',
          ),
        );
        const rows = admit('US');
        rows.forEach((r, i) => {
          const y = 450 + i * 190;
          api.focus.target('readable-corpus', () =>
            card(ctx, api, r.documentId, 230, y, 1460, themeColors.blue, 100),
          );
          if (P('access-b1-3'))
            originalText(
              ctx,
              api,
              'Eligible before scoring · publication and caller access checked',
              960,
              y + 145,
              29,
              themeColors.green,
              'center',
            );
        });
        api.focus.target('search-candidates', () =>
          originalText(
            ctx,
            api,
            'Actual fixture: 2 readable US policies; 0 EU policies',
            960,
            930,
            31,
            themeColors.muted,
            'center',
          ),
        );
      } else {
        api.focus.target('principal', () =>
          originalText(
            ctx,
            api,
            'Separate ranking toy · caller has EU access · choose top 1',
            960,
            275,
            35,
            themeColors.yellow,
            'center',
          ),
        );
        const rows = [
          {
            id: 'US-A',
            region: 'US',
            score: 9,
          },
          {
            id: 'EU-A',
            region: 'EU',
            score: 8,
          },
          {
            id: 'EU-B',
            region: 'EU',
            score: 7,
          },
        ];
        rows.forEach((r, i) => {
          const y = 400 + i * 145;
          originalText(
            ctx,
            api,
            r.id,
            310,
            y + 30,
            32,
            r.region === 'EU' ? themeColors.cyan : themeColors.pink,
            'center',
          );
          api.rect(
            ctx,
            480,
            y - 10,
            r.score * 105,
            65,
            r.region === 'EU' ? themeColors.cyan : themeColors.pink,
          );
          originalText(ctx, api, 'score ' + r.score, 1540, y + 30, 30, themeColors.ink, 'center');
        });
        if (P('access-global')) {
          const after = readableRankedCandidates(rows, 'EU', 1, false);
          api.focus.target('readable-corpus', () =>
            originalText(
              ctx,
              api,
              D('access-result-complete')
                ? 'Global top 1 → US-A → discard → ' + after.length + ' results'
                : 'Global top 1: US-A · access check pending',
              960,
              860,
              34,
              D('access-result-complete') ? themeColors.pink : themeColors.muted,
              'center',
            ),
          );
        }
        if (P('access-alternative')) {
          const before = readableRankedCandidates(rows, 'EU', 1, true);
          originalText(
            ctx,
            api,
            D('access-result-complete')
              ? 'EU filter first → ' + before[0].id + ' is retained'
              : 'EU filter first · readable selection pending',
            960,
            950,
            35,
            D('access-result-complete') ? themeColors.green : themeColors.muted,
            'center',
          );
        }
      }
    });
  }
}
export default {
  id: 'access',
  draw: drawAccess,
  cues: [
    'access-b1-1',
    'access-b1-2',
    'access-b1-3',
    'access-b2-1',
    'access-b2-2',
    'access-result-complete',
    'access-global',
    'access-alternative',
  ],
};
