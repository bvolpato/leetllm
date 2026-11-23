import { arrow, box, constructionFooter, focusProgress, table } from '../defaults.mjs';
export function drawDigestIdentities(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-digest-identities-mechanism', () => {
      const duplicate = currentBeat >= 2,
        mentions = duplicate
          ? [
              {
                service: 'auth-api',
                status: 'healthy',
              },
              {
                service: 'auth-api',
                status: 'outage',
              },
            ]
          : [
              {
                service: 'auth-api',
                status: 'healthy',
              },
              {
                service: 'vector-indexer',
                status: 'degraded',
              },
              {
                service: 'report-worker',
                status: 'unknown',
              },
            ];
      if (!duplicate) {
        table(
          ctx,
          api,
          ['service', 'proposed status', 'Catalog'],
          mentions.map((m) => [
            m.service,
            m.status,
            m.service === 'report-worker'
              ? done('sg-digest-unknown')
                ? 'review unknown name'
                : '?'
              : 'cataloged',
          ]),
          180,
          350,
          1550,
          125,
          [0.35, 0.25, 0.4],
        );
        if (done('sg-empty-digest') && currentBeat === 1)
          box(
            ctx,
            api,
            'Separate empty report',
            ['{"mentions": []} → accepted'],
            400,
            795,
            1120,
            135,
            themeColors.green,
          );
      } else {
        const last = done('sg-digest-last-wins'),
          reject = done('sg-digest-duplicate');
        box(
          ctx,
          api,
          'Array preserves both entries',
          ['auth-api: healthy', 'auth-api: outage'],
          180,
          325,
          750,
          205,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Dictionary · same key',
          last ? ['auth-api: outage', 'healthy entry overwritten'] : ['convert these entries'],
          1050,
          325,
          690,
          205,
          last ? themeColors.yellow : themeColors.blue,
        );
        if (last) arrow(ctx, api, 945, 425, 1030, 425, themeColors.yellow);
        box(
          ctx,
          api,
          'Identity gate retains the original array',
          reject
            ? ['duplicate auth-api → REJECT', 'resolve current state from evidence']
            : ['compare both service identities'],
          350,
          700,
          1220,
          175,
          reject ? themeColors.pink : themeColors.blue,
        );
      }
      constructionFooter(
        ctx,
        api,
        'A later array position cannot establish the latest real service state.',
      );
    });
  }
}
export default {
  id: 'digest-identities',
  draw: drawDigestIdentities,
  cues: [
    'sg-digest-identities-0',
    'sg-digest-unknown',
    'sg-digest-identities-1',
    'sg-empty-digest',
    'sg-digest-identities-2',
    'sg-digest-last-wins',
    'sg-digest-duplicate',
  ],
};
