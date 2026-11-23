import {
  cueProgress,
  cueSeen,
  moderationBox,
  moderationLine,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawEvidenceScope(ctx, scene, state, api) {
  return api.focus.target('evidence-scope-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    {
      const { C, teaching: t } = api,
        b = state.beat ?? 0;
      {
        moderationText(
          ctx,
          api,
          'Minimal decision metadata and raw evidence have separate purposes',
          150,
          270,
          32,
        );
        moderationBox(
          ctx,
          api,
          'D8 · rev8 · policy-v44 · scoped reference',
          170,
          375,
          760,
          90,
          C.blue,
          26,
        );
        moderationBox(ctx, api, 'Raw evidence · restricted access', 1110, 375, 650, 90, C.pink, 28);
        if (b === 0) {
          [
            'scope / versions',
            'category result',
            'route timestamps',
            'reason / appeal link',
          ].forEach((value, i) => {
            if (cueProgress(ctx, api, 'evidence-record') > i / 4)
              moderationBox(ctx, api, value, 180, 530 + i * 105, 690, 70, C.blue, 26);
          });
          if (cueSeen(ctx, api, 'evidence-raw')) {
            for (let i = 0; i < 12; i++)
              api.rect(
                ctx,
                1170 + (i % 4) * 135,
                555 + Math.floor(i / 4) * 90,
                105,
                60,
                C.panel,
                C.muted,
                0,
              );
            moderationText(
              ctx,
              api,
              'Reference ≠ copied raw content',
              1430,
              925,
              28,
              C.pink,
              'center',
            );
          }
        } else if (b === 1) {
          ['purpose', 'retention', 'role / assignment', 'audited reads', 'deletion'].forEach(
            (name, i) => {
              if (cueProgress(ctx, api, 'evidence-purpose') > i / 5)
                moderationBox(ctx, api, name, 160 + i * 345, 655, 305, 80, C.cyan, 27);
            },
          );
          if (cueSeen(ctx, api, 'evidence-minimum'))
            moderationBox(
              ctx,
              api,
              'GDPR Article 5: necessary data; necessary duration',
              290,
              875,
              1340,
              85,
              C.yellow,
              31,
            );
          moderationNote(
            ctx,
            api,
            'Check provider retention and cross-border handling before copying evidence.',
          );
        } else {
          const names = ['cache', 'search index', 'derived dataset', 'provider copy'];
          names.forEach((name, i) => {
            const x = 160 + i * 430;
            moderationBox(ctx, api, name, x, 645, 380, 85, C.blue, 27);
            if (cueSeen(ctx, api, 'evidence-delete')) {
              moderationLine(ctx, api, x + 25, 760, x + 355, 760, C.pink, 4);
              moderationText(ctx, api, 'Deletion scope', x + 190, 825, 25, C.pink, 'center');
            }
          });
          if (cueSeen(ctx, api, 'evidence-hold'))
            moderationBox(
              ctx,
              api,
              'Authorized legal hold · restricted case/purpose',
              330,
              910,
              1260,
              75,
              C.yellow,
              30,
            );
        }
      }
    }
  });
}
export default {
  id: 'evidence-scope',
  draw: drawEvidenceScope,
  cues: [
    'evidence-record',
    'evidence-raw',
    'evidence-purpose',
    'evidence-minimum',
    'evidence-delete',
    'evidence-hold',
  ],
};
