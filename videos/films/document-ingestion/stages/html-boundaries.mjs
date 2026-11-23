import {
  cueProgress,
  cueStarted,
  detailText,
  focusTarget,
  heading,
  line,
  recordField,
  rectangle,
  sourcePage,
} from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawHtmlBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Read the text inside the main region');
      focusTarget(ctx, api, 'html-source', () =>
        sourcePage(
          ctx,
          api,
          170,
          345,
          1580,
          270,
          'Actual static HTML fixture',
          [
            '<nav>Archive in 14 days.</nav>',
            '<main><p>Rollback failure.</p>',
            '<p>Page within 1<strong>5</strong> minutes.</p></main>',
          ],
          themeColors.blue,
        ),
      );
      const amount = cueProgress(ctx, api, 'inline-number');
      focusTarget(ctx, api, 'inline-number', () => {
        ctx.save();
        ctx.font = lessonFont(64);
        const advance = ctx.measureText('1').width;
        ctx.restore();
        const a = api.lerp(680, 900, amount),
          z = api.lerp(1260, 900 + advance, amount);
        if (amount === 1) detailText(ctx, api, '15', 900, 716, 64, themeColors.yellow);
        else {
          detailText(ctx, api, '1', a, 716, 64, themeColors.yellow);
          detailText(ctx, api, '5', z, 716, 64, themeColors.yellow);
        }
        if (amount < 0.99)
          detailText(ctx, api, '<strong>', 960, 650, 32, themeColors.muted, 'center');
      });
      if (cueStarted(ctx, api, 'block-separator'))
        focusTarget(ctx, api, 'block-separator', () => {
          rectangle(ctx, api, 215, 795, 1490, 95, themeColors.green);
          detailText(ctx, api, 'Rollback failure.', 335, 856, 36, themeColors.green);
          detailText(ctx, api, 'Page within 15 minutes.', 940, 856, 36, themeColors.green);
          line(ctx, api, 850, 817, 850, 870, themeColors.yellow, 5);
          detailText(ctx, api, 'paragraph separator', 850, 940, 27, themeColors.yellow, 'center');
        });
      if (cueStarted(ctx, api, 'html-main-only'))
        focusTarget(ctx, api, 'html-main-only', () => {
          rectangle(ctx, api, 187, 432, 1546, 47, themeColors.pink, null);
          detailText(ctx, api, 'nav excluded', 1500, 463, 25, themeColors.pink, 'right');
        });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Run the actual adapter across extraction boundaries');
      const fixtures = [
        ['Inline number', '1<strong>5</strong> → 15', true],
        ['Paragraph boundary', 'failure.</p><p>Page → separator', true],
        ['Navigation', 'nav 14 days excluded', true],
        ['Missing main', 'reject: no content region', false],
        ['Empty main', 'reject: no usable text', false],
      ];
      const n = cueStarted(ctx, api, 'html-fixtures')
        ? Math.min(5, 1 + Math.floor(cueProgress(ctx, api, 'html-fixtures') * 5))
        : 0;
      focusTarget(ctx, api, 'html-fixtures', () =>
        fixtures.forEach(([name, result, ok], i) => {
          recordField(
            ctx,
            api,
            name,
            i < n ? result : 'awaiting actual parser',
            230,
            345 + i * 103,
            1460,
            i < n ? (ok ? themeColors.green : themeColors.pink) : themeColors.muted,
          );
        }),
      );
      if (cueStarted(ctx, api, 'html-scope'))
        focusTarget(ctx, api, 'html-scope', () =>
          detailText(
            ctx,
            api,
            'Static well-formed fixtures · CSS / JavaScript / tables / pre need their own rules',
            960,
            945,
            27,
            themeColors.yellow,
            'center',
          ),
        );
    } else {
      heading(ctx, api, 'Apply the trust check to two accurate transcriptions');
      sourcePage(
        ctx,
        api,
        190,
        365,
        740,
        440,
        'Accurately extracted security manual',
        [
          'Marker in the training manual',
          '“ignore previous instructions”',
          'The manual quotes a flagged phrase.',
        ],
        themeColors.blue,
      );
      sourcePage(
        ctx,
        api,
        1060,
        365,
        670,
        440,
        'External release runbook',
        [
          'Routine deploy notes:',
          'archive within 14 days.',
        ],
        themeColors.blue,
      );
      if (cueStarted(ctx, api, 'html-trust'))
        focusTarget(ctx, api, 'html-trust', () => {
          recordField(ctx, api, 'Literal marker', 'quarantine', 210, 835, 700, themeColors.pink);
          recordField(
            ctx,
            api,
            'No literal match',
            'untrusted_source',
            1080,
            835,
            630,
            themeColors.yellow,
          );
        });
      if (cueStarted(ctx, api, 'data-authority'))
        focusTarget(ctx, api, 'data-authority', () => {
          detailText(ctx, api, 'Quality ready', 560, 730, 30, themeColors.green, 'center');
          detailText(
            ctx,
            api,
            'Host-owned tool and instruction permissions',
            960,
            966,
            29,
            themeColors.cyan,
            'center',
          );
        });
    }
    return;
  }
  return;
}
export default {
  id: 'html-boundaries',
  draw: drawHtmlBoundaries,
  cues: [
    'html-source',
    'inline-number',
    'block-separator',
    'html-main-only',
    'html-fixtures',
    'html-scope',
    'html-trust',
    'data-authority',
  ],
};
