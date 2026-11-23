import { conciseMicro } from '../fixtures.mjs';
import { payoffConstruction } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawWrap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const v = payoffConstruction(state),
      money = (value) => '$' + (value / 1e6).toFixed(5);
    if (currentBeat <= 2) {
      text(
        ctx,
        api,
        'Same two support tasks · three concise attempts',
        960,
        295,
        35,
        themeColors.ink,
      );
      const starts = [
          [210, 430],
          [765, 430],
          [1320, 430],
        ],
        ends = [
          [300, 510],
          [1110, 510],
          [1110, 700],
        ];
      v.attempts.forEach((receipt, i) => {
        if (!v.receiptsVisible) return;
        const arrival = api.clamp(v.show * 3 - i),
          arrived = i < v.received;
        const x = api.lerp(
            starts[i][0],
            ends[i][0],
            i === 2 ? api.phase(v.group, 0.55, 1) : v.group,
          ),
          y = api.lerp(
            starts[i][1] - 45 * (1 - arrival),
            ends[i][1],
            i === 2 ? api.phase(v.group, 0, 0.45) : v.group,
          );
        const color = arrived
          ? receipt.accepted
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted;
        api.focus.target('payoff-receipt-' + i, () =>
          card(
            ctx,
            api,
            receipt.id +
              ' · ' +
              (arrived ? (receipt.accepted ? 'ACCEPT' : 'FAIL') : 'incoming receipt'),
            x,
            y,
            color,
            390,
            80,
          ),
        );
        if (arrival > 0 && !arrived)
          api.rect(ctx, x + 15, y + 88, 360 * arrival, 6, themeColors.cyan, undefined, 3);
        text(
          ctx,
          api,
          arrived ? money(receipt.costMicro) : 'Awaiting receipt payload',
          x + 195,
          y + 117,
          arrived ? 29 : 23,
          color,
        );
        if (arrived)
          text(ctx, api, '920 ordinary + 1,280 read + 130 output', x + 195, y + 150, 18, color);
      });
      if (v.group > 0) {
        api.focus.target('payoff-task-groups', () => {
          text(ctx, api, 'Task A · one accepted result', 495, 390, 29, themeColors.green);
          text(ctx, api, 'Task B · one accepted result', 1305, 390, 29, themeColors.green);
        });
      }
      api.focus.target('payoff-spend', () => {
        const count = v.received;
        for (let i = 0; i < count; i++)
          api.rect(
            ctx,
            420 + i * 360,
            870,
            350,
            45,
            i === 1 ? themeColors.pink : themeColors.green,
            undefined,
            6,
          );
        text(
          ctx,
          api,
          (count === 3
            ? 'All 3 receipts remain in spend'
            : count + ' / 3 receipts added to spend') +
            ' · ' +
            money(count * conciseMicro),
          960,
          990,
          33,
          themeColors.yellow,
        );
      });
      if (currentBeat === 2) {
        text(ctx, api, 'Verbose: 2 accepts × $0.00592 = $0.01184', 960, 215, 35, themeColors.blue);
      }
      return;
    }
    const x = 440,
      fullWidth = 1110,
      scale = fullWidth / v.current.spend;
    const verboseEnd = x + v.baseline.spend * scale;
    text(
      ctx,
      api,
      'Generation spend for the same two accepted tasks',
      960,
      295,
      43,
      themeColors.ink,
    );
    api.focus.target('payoff-comparison', () => {
      text(ctx, api, 'Verbose', 394, 455, 35, themeColors.blue, 'right');
      text(ctx, api, 'Concise', 394, 652, 35, themeColors.green, 'right');
      for (const [i, receipt] of v.baseline.receipts.entries()) {
        const width = receipt.costMicro * scale;
        api.rect(ctx, x + i * width, 393, width - 4, 92, themeColors.blue, undefined, 3);
        text(ctx, api, receipt.id + ' accepted', x + (i + 0.5) * width, 452, 29, themeColors.bg);
      }
      // The first two accepted attempts are common to the comparison. Stack the paid failure last.
      const ordered = [v.attempts[0], v.attempts[2], v.attempts[1]];
      ordered.forEach((receipt, i) => {
        const width = receipt.costMicro * scale;
        const fraction = i === 2 ? v.compare : 1;
        if (fraction > 0)
          api.rect(
            ctx,
            x + i * width,
            590,
            (width - 4) * fraction,
            92,
            receipt.accepted ? themeColors.green : themeColors.pink,
            undefined,
            3,
          );
        if (fraction === 1)
          text(
            ctx,
            api,
            receipt.id + (receipt.accepted ? ' accepted' : ' failed'),
            x + (i + 0.5) * width,
            650,
            29,
            themeColors.bg,
          );
      });
      api.line(ctx, verboseEnd, 493, verboseEnd, 574, themeColors.blue, 3);
      text(ctx, api, 'Verbose total  $0.01184', verboseEnd, 370, 32, themeColors.blue);
    });
    api.focus.target('payoff-accepted-cost', () => {
      const complete = v.compare === 1;
      text(
        ctx,
        api,
        complete
          ? '$0.01371 ÷ 2 = $0.006855 per accepted task'
          : 'Include the charge for B’s failed attempt.',
        960,
        814,
        48,
        themeColors.ink,
      );
      if (complete)
        text(ctx, api, 'Verbose: $0.005920 per accepted task', 960, 912, 36, themeColors.blue);
    });
  }
}
export default {
  id: 'wrap',
  draw: drawWrap,
  cues: ['payoff-receipts', 'payoff-group-tasks', 'payoff-compare'],
};
