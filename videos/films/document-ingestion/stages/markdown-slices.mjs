import {
  arrow,
  cueProgress,
  cueStarted,
  detailText,
  fade,
  focusTarget,
  heading,
  recordField,
  rectangle,
  sourcePage,
} from '../defaults.mjs';
export function drawMarkdownSlices(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const lines = [
      'Incident response handbook.',
      '## Rollback failure',
      'Page on-call within 15 minutes and include deploy ID.',
      '',
      '## Agent command',
      '~~~bash',
      '    # Keep this comment inside the command block',
      'incidentctl rollback --service payments-api',
      '~~~',
      '',
      '## Agent command',
      'Include the deploy ID in the incident report.',
    ];
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Ordered source records preserve repeated headings'
        : 'Slice original source without rebuilding its whitespace',
    );
    focusTarget(ctx, api, 'markdown-records', () => {
      sourcePage(
        ctx,
        api,
        150,
        335,
        970,
        620,
        'Immutable Markdown source · current version',
        [],
        themeColors.blue,
      );
      lines.forEach((line, i) => {
        detailText(
          ctx,
          api,
          String(i + 1).padStart(2, ' '),
          177,
          445 + i * 39,
          23,
          themeColors.muted,
        );
        detailText(
          ctx,
          api,
          line,
          230,
          445 + i * 39,
          24,
          currentBeat === 1 && i >= 5 && i <= 8
            ? themeColors.muted
            : i === 6
              ? themeColors.yellow
              : themeColors.ink,
        );
      });
    });
    if (currentBeat === 0) {
      const n = cueStarted(ctx, api, 'markdown-records')
        ? Math.min(4, 1 + Math.floor(cueProgress(ctx, api, 'markdown-records') * 4))
        : 0;
      [
        ['line 1', 'document preamble'],
        ['line 2', 'Rollback failure'],
        ['line 5', 'Agent command'],
        ['line 11', 'Agent command'],
      ].forEach(([loc, title], i) => {
        if (i < n)
          recordField(
            ctx,
            api,
            loc,
            title,
            1220,
            370 + i * 125,
            530,
            i > 1 ? themeColors.cyan : themeColors.blue,
          );
      });
      if (cueStarted(ctx, api, 'fenced-comment'))
        focusTarget(ctx, api, 'fenced-comment', () => {
          rectangle(ctx, api, 220, 607, 870, 166, themeColors.yellow, null);
          detailText(
            ctx,
            api,
            'Fence retains comment + command',
            1485,
            915,
            26,
            themeColors.yellow,
            'center',
          );
        });
    } else {
      const movement = cueProgress(ctx, api, 'source-slices');
      focusTarget(ctx, api, 'source-slices', () => {
        rectangle(ctx, api, 220, 607, 870, 166, themeColors.cyan, null);
        fade(ctx, api, movement, () => {
          const x = 1200;
          rectangle(ctx, api, 1200, 607, 600, 172, themeColors.cyan);
          detailText(ctx, api, '~~~bash', 1200 + 16, 640, 25, themeColors.cyan);
          detailText(
            ctx,
            api,
            '    # Keep this comment inside the command block',
            1200 + 16,
            679,
            24,
            themeColors.yellow,
          );
          detailText(
            ctx,
            api,
            'incidentctl rollback --service payments-api',
            1200 + 16,
            718,
            26,
            themeColors.ink,
          );
          detailText(ctx, api, '~~~', 1200 + 16, 757, 25, themeColors.cyan);
          if (movement > 0)
            arrow(ctx, api, 1105, 700, api.lerp(1105, 1185, movement), 700, themeColors.cyan);
        });
      });
      if (cueStarted(ctx, api, 'heading-locators'))
        focusTarget(ctx, api, 'heading-locators', () => {
          recordField(ctx, api, 'Agent command', 'line=5', 1215, 360, 540, themeColors.cyan);
          recordField(ctx, api, 'Agent command', 'line=11', 1215, 470, 540, themeColors.cyan);
          detailText(
            ctx,
            api,
            'stable section identity ≠ line position',
            1485,
            870,
            25,
            themeColors.yellow,
            'center',
          );
          detailText(
            ctx,
            api,
            'CRLF → LF; keep indentation / fences / trailing spaces',
            960,
            984,
            27,
            themeColors.yellow,
            'center',
          );
        });
    }
    return;
  }
  return;
}
export default {
  id: 'markdown-slices',
  draw: drawMarkdownSlices,
  cues: ['markdown-records', 'fenced-comment', 'source-slices', 'heading-locators'],
};
