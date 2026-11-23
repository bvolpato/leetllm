import { sha } from '../arithmetic.mjs';
import { LAB_POLICY } from '../fixtures.mjs';
import {
  cueProgress,
  detailNote,
  detailParagraph,
  detailTag,
  detailText,
  progressArrow,
} from '../defaults.mjs';
export function drawStrictCorpus(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('strict-corpus-mechanism', () => {
    if (currentBeat === 0) {
      detailText(
        ctx,
        api,
        'Candidate IDs must be unique before chunking',
        960,
        280,
        35,
        themeColors.blue,
      );
      if (cueProgress(ctx, api, 'corpus-id-pair'))
        for (let i = 0; i < 2; i++) {
          detailTag(ctx, api, 'access-policy-us-v3', 480 + i * 960, 410, themeColors.blue, 760);
          detailText(
            ctx,
            api,
            'Candidate ' + (i + 1) + ' · same ID / same text',
            480 + i * 960,
            485,
            27,
            themeColors.muted,
          );
          if (resultComplete('corpus-duplicates'))
            detailText(
              ctx,
              api,
              'REJECT both: duplicate identifier',
              480 + i * 960,
              555,
              29,
              themeColors.pink,
            );
        }
      if (cueProgress(ctx, api, 'corpus-typed-flags')) {
        ['true', 'false', '"false"', '1'].forEach((v, i) => {
          const x = 315 + i * 430;
          detailTag(ctx, api, v, x, 715, i < 2 ? themeColors.blue : themeColors.pink, 325);
          detailText(
            ctx,
            api,
            i < 2 ? 'Boolean type' : 'Invalid flag type',
            x,
            800,
            27,
            i < 2 ? themeColors.blue : themeColors.pink,
          );
        });
      }
      if (resultComplete('corpus-admit-checks'))
        detailText(
          ctx,
          api,
          'Then check grant + source kind + scope + digest',
          960,
          920,
          34,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      detailTag(
        ctx,
        api,
        'workspace-note-48291 · same private-note bytes',
        960,
        300,
        themeColors.pink,
        1520,
      );
      detailTag(ctx, api, 'Controlled registry', 430, 470, themeColors.yellow, 640);
      detailTag(ctx, api, 'Published-policy grant', 1430, 470, themeColors.pink, 650);
      progressArrow(
        ctx,
        api,
        800,
        470,
        1050,
        470,
        themeColors.yellow,
        cueProgress(ctx, api, 'bad-registry-grant'),
      );
      if (resultComplete('bad-registry-grant')) {
        detailTag(
          ctx,
          api,
          'Admission accepts the improperly authorized note',
          960,
          665,
          themeColors.pink,
          1450,
        );
        detailText(
          ctx,
          api,
          'Matching bytes do not establish legitimate authority',
          960,
          795,
          36,
          themeColors.yellow,
        );
      }
      if (resultComplete('document-data-only'))
        detailText(
          ctx,
          api,
          'Evidence response ≠ account or tool permission',
          960,
          915,
          36,
          themeColors.cyan,
        );
    } else {
      detailParagraph(
        ctx,
        api,
        ['Loaded app snapshot contains registry + admitted records + parser identity'],
        280,
        themeColors.blue,
        31,
      );
      if (cueProgress(ctx, api, 'snapshot-components')) {
        ['Registry', 'Admitted records', 'Parser identity'].forEach((v, i) =>
          detailTag(
            ctx,
            api,
            v,
            370 + i * 590,
            365,
            [themeColors.yellow, themeColors.blue, themeColors.cyan][i],
            510,
          ),
        );
      }
      if (cueProgress(ctx, api, 'snapshot-file-edit')) {
        const after = LAB_POLICY.replace('may be', 'may not be'),
          scan = cueProgress(ctx, api, 'snapshot-file-edit');
        api.teaching.byteDifference({
          x: 180,
          y: 440,
          width: 1560,
          height: 300,
          fontSize: 26,
          maxColumns: 10,
          before: new TextEncoder().encode(LAB_POLICY),
          after: new TextEncoder().encode(after),
          scanProgress: scan,
          revealVerdict: resultComplete('snapshot-held'),
          beforeLabel: 'Loaded',
          afterLabel: 'Edited',
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          mutedColor: themeColors.muted,
          scanColor: themeColors.cyan,
          changeColor: themeColors.pink,
        });
        detailText(
          ctx,
          api,
          'Loaded text SHA ' + sha(LAB_POLICY).slice(0, 16) + '…',
          520,
          820,
          29,
          themeColors.blue,
        );
        detailText(
          ctx,
          api,
          'Edited file SHA ' + sha(after).slice(0, 16) + '…',
          1410,
          820,
          29,
          themeColors.pink,
        );
        if (resultComplete('snapshot-held'))
          detailText(
            ctx,
            api,
            'Running app still uses the loaded snapshot',
            960,
            920,
            36,
            themeColors.yellow,
          );
      }
    }
    detailNote(
      ctx,
      api,
      'Executed admission/snapshot contract · registry protection and live revocation require implementation',
    );
  });
  return;
}
export default {
  id: 'strict-corpus',
  draw: drawStrictCorpus,
  cues: [
    'corpus-duplicates',
    'corpus-id-pair',
    'corpus-typed-flags',
    'corpus-admit-checks',
    'registry-authority',
    'bad-registry-grant',
    'document-data-only',
    'snapshot-lifetime',
    'snapshot-components',
    'snapshot-file-edit',
    'snapshot-held',
  ],
};
