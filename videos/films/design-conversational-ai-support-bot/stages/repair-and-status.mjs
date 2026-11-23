import {
  drawSupportArrow,
  drawSupportFooter,
  drawSupportHeading,
  drawSupportRectangle,
  drawSupportRow,
  drawSupportText,
  supportCueVisible,
  withSupportFocus,
} from '../defaults.mjs';
export function drawRepairAndStatus(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      drawSupportHeading(ctx, api, 'A phrase list catches wording, not every unsupported promise');
      const bad = supportCueVisible(ctx, api, 'bad-promise'),
        caught = supportCueVisible(ctx, api, 'phrase-catch'),
        miss = supportCueVisible(ctx, api, 'phrase-miss');
      drawSupportRow(
        ctx,
        api,
        'Validated state: applied credits = 0 · specialist review required',
        160,
        355,
        1600,
        themeColors.blue,
      );
      withSupportFocus(ctx, api, 'bad-promise', () => {
        drawSupportRectangle(ctx, api, 160, 485, 1600, 125, themeColors.pink);
        drawSupportText(
          ctx,
          api,
          bad ? '“I have credited $900.”' : 'Draft one · waiting for inspection',
          190,
          560,
          37,
          bad ? themeColors.pink : themeColors.muted,
        );
      });
      withSupportFocus(ctx, api, 'phrase-catch', () => {
        if (caught)
          drawSupportText(
            ctx,
            api,
            'Flags: prohibited promise + missing citation',
            960,
            680,
            31,
            themeColors.pink,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'phrase-miss', () => {
        if (miss) {
          drawSupportRectangle(ctx, api, 160, 755, 1600, 135, themeColors.yellow);
          drawSupportText(
            ctx,
            api,
            '“Your refund is on the way.”',
            190,
            815,
            34,
            themeColors.yellow,
          );
          drawSupportText(
            ctx,
            api,
            'Passes this limited phrase list · still unsupported by the state',
            190,
            865,
            28,
            themeColors.pink,
          );
        }
      });
      drawSupportFooter(
        ctx,
        api,
        'A source identifier still needs a claim-to-passage support check.',
      );
    } else if (currentBeat === 1) {
      drawSupportHeading(ctx, api, 'Render the financial status from validated state');
      const rendered = supportCueVisible(ctx, api, 'state-template'),
        blocked = supportCueVisible(ctx, api, 'no-dispatch');
      drawSupportRectangle(ctx, api, 150, 365, 660, 200, themeColors.blue);
      drawSupportText(ctx, api, 'Case state · $900.00', 480, 425, 34, themeColors.blue, 'center');
      drawSupportText(
        ctx,
        api,
        'No applied credit · review required',
        480,
        505,
        28,
        themeColors.ink,
        'center',
      );
      const status = withSupportFocus(ctx, api, 'state-template', () => {
        const a = drawSupportRectangle(
          ctx,
          api,
          1030,
          365,
          740,
          200,
          rendered ? themeColors.green : themeColors.muted,
        );
        drawSupportText(
          ctx,
          api,
          rendered ? '“A specialist needs to review' : 'Application status template',
          1400,
          435,
          30,
          rendered ? themeColors.green : themeColors.muted,
          'center',
        );
        if (rendered)
          drawSupportText(
            ctx,
            api,
            'your $900.00 credit request.”',
            1400,
            505,
            30,
            themeColors.green,
            'center',
          );
        return a;
      });
      if (rendered) drawSupportArrow(ctx, api, 840, 465, 1000, 465, themeColors.green);
      drawSupportRectangle(ctx, api, 180, 695, 1560, 155, themeColors.muted);
      drawSupportText(
        ctx,
        api,
        'Model explanation: admitted passage + privacy + semantic support checks',
        960,
        755,
        29,
        themeColors.muted,
        'center',
      );
      withSupportFocus(ctx, api, 'no-dispatch', () => {
        if (blocked)
          drawSupportText(
            ctx,
            api,
            'Rejected draft tool calls → 0 dispatches',
            960,
            815,
            32,
            themeColors.pink,
            'center',
          );
      });
      drawSupportFooter(
        ctx,
        api,
        'The restricted response may contain only the status template and admitted passage.',
      );
      void status;
    } else {
      drawSupportHeading(ctx, api, 'One repair allowance sits inside the shared request budget');
      const one = supportCueVisible(ctx, api, 'one-revision'),
        same = supportCueVisible(ctx, api, 'same-authority'),
        none = supportCueVisible(ctx, api, 'no-attempts');
      ['Primary timeout', 'Fallback draft fails checks'].forEach((s, i) => {
        drawSupportRectangle(
          ctx,
          api,
          180 + i * 840,
          375,
          720,
          160,
          none ? themeColors.pink : themeColors.blue,
        );
        drawSupportText(
          ctx,
          api,
          s,
          540 + i * 840,
          470,
          31,
          none ? themeColors.pink : themeColors.blue,
          'center',
        );
      });
      drawSupportArrow(ctx, api, 930, 455, 990, 455, themeColors.muted);
      withSupportFocus(ctx, api, 'same-authority', () => {
        drawSupportRow(
          ctx,
          api,
          same
            ? 'Evidence + permissions + contract remain fixed'
            : 'Original evidence / violation feedback',
          180,
          625,
          1560,
          same ? themeColors.yellow : themeColors.muted,
        );
      });
      withSupportFocus(ctx, api, 'one-revision', () => {
        if (one)
          drawSupportRow(
            ctx,
            api,
            'At most one explanation revision',
            430,
            755,
            1060,
            themeColors.blue,
          );
      });
      withSupportFocus(ctx, api, 'no-attempts', () => {
        if (none) {
          drawSupportText(
            ctx,
            api,
            '2 attempts used / 2 allowed → 0 revisions remain',
            960,
            915,
            37,
            themeColors.pink,
            'center',
          );
        }
      });
      drawSupportFooter(
        ctx,
        api,
        'Exhaustion ends in declared abstention or an acknowledged handoff.',
      );
    }
  }
}
export default {
  id: 'repair-and-status',
  draw: drawRepairAndStatus,
  cues: [
    'bad-promise',
    'phrase-catch',
    'phrase-miss',
    'state-template',
    'no-dispatch',
    'one-revision',
    'same-authority',
    'no-attempts',
  ],
};
