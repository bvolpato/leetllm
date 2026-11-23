import {
  caption,
  codeText,
  coreText,
  cueVisible,
  focusTargets,
  line,
  rectangle,
} from '../defaults.mjs';
export function drawScoredTokenLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'toy-capacity',
        'query-eleven',
        'document-ten',
        'governing-omitted',
        'span-digests',
        'mismatch-reject',
        'source-token-separation',
        'window-scope',
        'window-opportunities',
        'reverse-truncation',
      ],
      () => {
        if (currentBeat === 0) {
          coreText(
            ctx,
            api,
            'One position per whitespace-separated word',
            150,
            300,
            30,
            themeColors.muted,
          );
          const cells = 24,
            x = 180,
            w = 65;
          for (let i = 0; i < cells; i++) {
            const color =
              i < 3
                ? themeColors.muted
                : i < 14
                  ? themeColors.yellow
                  : i < 24
                    ? themeColors.blue
                    : themeColors.muted;
            api.rect(ctx, x + i * w, 400, 58, 95, themeColors.panel, color, 3);
            if (i < 3)
              coreText(ctx, api, 'S', x + i * w + 29, 460, 25, themeColors.muted, 'center');
            else if (i < 14 && cueVisible(ctx, api, 'query-eleven'))
              coreText(
                ctx,
                api,
                'q' + (i - 2),
                x + i * w + 29,
                460,
                23,
                themeColors.yellow,
                'center',
              );
            else if (i >= 14 && cueVisible(ctx, api, 'document-ten'))
              coreText(
                ctx,
                api,
                'd' + (i - 13),
                x + i * w + 29,
                460,
                23,
                themeColors.blue,
                'center',
              );
          }
          if (cueVisible(ctx, api, 'toy-capacity'))
            coreText(ctx, api, '24 total − 3 special', 150, 610, 35, themeColors.muted);
          if (cueVisible(ctx, api, 'query-eleven'))
            coreText(ctx, api, '− 11 query', 700, 610, 35, themeColors.yellow);
          if (cueVisible(ctx, api, 'document-ten'))
            coreText(ctx, api, '= 10 document tokens', 1220, 610, 35, themeColors.blue);
          coreText(
            ctx,
            api,
            'Source: background … [ governing audit condition ]',
            150,
            770,
            33,
            themeColors.ink,
          );
          if (cueVisible(ctx, api, 'governing-omitted')) {
            line(ctx, api, 600, 810, 600, 875, themeColors.pink, 3);
            coreText(ctx, api, 'scored prefix stops', 600, 935, 28, themeColors.pink, 'center');
            coreText(
              ctx,
              api,
              'condition outside scored input',
              1400,
              860,
              32,
              themeColors.pink,
              'center',
            );
          }
        } else if (currentBeat === 1) {
          coreText(ctx, api, 'Scored span', 150, 350, 34, themeColors.blue);
          coreText(ctx, api, 'Packed source', 1050, 350, 34, themeColors.green);
          rectangle(ctx, api, 150, 420, 660, 170, themeColors.blue);
          rectangle(ctx, api, 1050, 420, 700, 280, themeColors.green);
          coreText(ctx, api, 'background prefix', 180, 490, 32, themeColors.blue);
          coreText(ctx, api, 'background + governing condition', 1080, 490, 30, themeColors.green);
          coreText(ctx, api, 'normalized toy token digest', 150, 760, 28, themeColors.muted);
          coreText(ctx, api, 'normalized toy token digest', 1050, 760, 28, themeColors.muted);
          if (cueVisible(ctx, api, 'span-digests')) {
            codeText(
              ctx,
              api,
              'digest(prefix) ≠ digest(full)',
              960,
              845,
              32,
              themeColors.pink,
              'center',
            );
          }
          if (cueVisible(ctx, api, 'mismatch-reject'))
            coreText(
              ctx,
              api,
              'Release refuses undeclared span mismatch',
              960,
              940,
              35,
              themeColors.pink,
              'center',
            );
          if (cueVisible(ctx, api, 'source-token-separation'))
            coreText(
              ctx,
              api,
              'Keep source revision + exact text/span + each model’s token count.',
              960,
              1000,
              27,
              themeColors.ink,
              'center',
            );
        } else {
          coreText(
            ctx,
            api,
            'Same source, explicitly scoped windows',
            150,
            310,
            33,
            themeColors.ink,
          );
          ['background', 'endpoint rule', 'audit condition'].forEach((v, i) => {
            rectangle(
              ctx,
              api,
              150 + i * 570,
              440,
              510,
              130,
              i === 2 ? themeColors.green : themeColors.blue,
            );
            coreText(
              ctx,
              api,
              v,
              405 + i * 570,
              520,
              32,
              i === 2 ? themeColors.green : themeColors.blue,
              'center',
            );
          });
          if (cueVisible(ctx, api, 'window-scope')) {
            line(ctx, api, 720, 610, 1740, 610, themeColors.yellow, 3);
            coreText(
              ctx,
              api,
              'Rule + qualification must remain together',
              1230,
              690,
              31,
              themeColors.yellow,
              'center',
            );
          }
          if (cueVisible(ctx, api, 'window-opportunities'))
            coreText(
              ctx,
              api,
              'max over more windows → more scoring opportunities',
              960,
              820,
              32,
              themeColors.ink,
              'center',
            );
          if (cueVisible(ctx, api, 'reverse-truncation')) {
            coreText(
              ctx,
              api,
              'Full scored passage → packed prefix',
              960,
              930,
              34,
              themeColors.pink,
              'center',
            );
            coreText(
              ctx,
              api,
              'Qualification lost at packing is a separate failure.',
              960,
              990,
              28,
              themeColors.pink,
              'center',
            );
          }
        }
      },
    );
    caption(ctx, api, 'Record the exact source span for each reader.');
  }
}
export default {
  id: 'scored-token-ledger',
  draw: drawScoredTokenLedger,
  cues: [
    'toy-capacity',
    'query-eleven',
    'document-ten',
    'governing-omitted',
    'span-digests',
    'mismatch-reject',
    'source-token-separation',
    'window-scope',
    'window-opportunities',
    'reverse-truncation',
  ],
};
