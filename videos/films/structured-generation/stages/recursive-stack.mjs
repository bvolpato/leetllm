import { recursiveConstructionState } from '../construction.mjs';
import { recursivePrefix } from '../model.mjs';
import {
  arrow,
  box,
  constructionCode,
  constructionFooter,
  constructionText,
  focusProgress,
  label,
} from '../defaults.mjs';
export function drawRecursiveStack(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    const cueProgress = (i) => focusProgress(ctx, api, `sg-${'recursive-stack'}-${i}`);
    api.focus.target('sg-recursive-stack-mechanism', () => {
      const fresh = false,
        aId = 'sg-stack-three',
        bId = 'sg-stack-reject';
      const z = recursiveConstructionState(
          false,
          focusProgress(ctx, api, 'sg-stack-three'),
          focusProgress(ctx, api, 'sg-stack-reject'),
        ),
        { depth, prefix } = z,
        tokens = [z.a, z.bad];
      if (currentBeat === 0) {
        const flatN = 1 + Math.floor(Math.min(1, cueProgress(0) * 2) * 4),
          nestedN = 1 + Math.floor(Math.max(0, (cueProgress(0) - 0.48) / 0.52) * 4);
        box(
          ctx,
          api,
          'Flat list · repeat the same item',
          [
            '[' +
              Array.from(
                {
                  length: flatN,
                },
                () => '{}',
              ).join(',') +
              ']',
          ],
          180,
          320,
          740,
          165,
          themeColors.blue,
        );
        api.rect(ctx, 270, 600, 240, 120, themeColors.panel, themeColors.blue, 12);
        label(ctx, api, 'item {}', 390, 673, themeColors.blue, 35);
        api.rect(ctx, 620, 600, 240, 120, themeColors.panel, themeColors.cyan, 12);
        label(ctx, api, 'comma / end', 740, 671, themeColors.cyan, 29);
        arrow(ctx, api, 525, 660, 605, 660);
        api.line(ctx, 740, 730, 740, 810, themeColors.cyan, 3);
        api.line(ctx, 740, 810, 390, 810, themeColors.cyan, 3);
        arrow(ctx, api, 390, 810, 390, 735);
        label(ctx, api, 'Repeat one fixed-depth state cycle', 550, 905, themeColors.muted, 29);
        box(
          ctx,
          api,
          'Nested child · retain each return point',
          [],
          1030,
          320,
          710,
          585,
          themeColors.yellow,
        );
        const nestedPrefix = '{"child":'.repeat(nestedN - 1) + '{';
        constructionCode(ctx, api, nestedPrefix, 1060, 425, 25, themeColors.yellow);
        recursivePrefix(nestedPrefix).frames.forEach((frame, i) => {
          const y = 475 + i * 72;
          api.rect(ctx, 1110 + i * 20, y, 510, 57, themeColors.panel, themeColors.yellow, 8);
          constructionCode(
            ctx,
            api,
            `return for open offset ${frame.offset}`,
            1130 + i * 20,
            y + 39,
            24,
            themeColors.yellow,
          );
        });
        constructionFooter(
          ctx,
          api,
          'Length can repeat a state; unresolved nesting retains return information.',
        );
        return;
      }
      label(ctx, api, 'Tiny recursive node grammar', 960, 274, themeColors.blue, 32);
      constructionCode(
        ctx,
        api,
        z.committedPrefix,
        210,
        350,
        31,
        z.accepted ? themeColors.green : themeColors.yellow,
      );
      const eos = z.accepted ? 'allowed' : 'blocked';
      box(
        ctx,
        api,
        'Accepted state',
        [`${z.committed.frames.length} pending object closings`, 'EOS: ' + eos],
        180,
        410,
        650,
        180,
        z.accepted ? themeColors.green : themeColors.yellow,
      );
      if (z.accepted) label(ctx, api, 'Committed stack is empty', 510, 700, themeColors.green, 30);
      else
        z.committed.frames.forEach((frame, i) => {
          const y = 620 + i * 73;
          api.rect(ctx, 250, y, 420, 66, themeColors.panel, themeColors.yellow, 9);
          constructionCode(
            ctx,
            api,
            `open offset ${frame.offset} → }`,
            270,
            y + 44,
            26,
            themeColors.yellow,
          );
        });
      const accept = z.accepted,
        reject = z.rejected;
      tokens.forEach((token, i) => {
        const x = 1000,
          y = 390 + i * 270,
          verdict = i ? reject : accept,
          q = focusProgress(ctx, api, i ? 'sg-stack-reject' : 'sg-stack-three'),
          checked = Math.floor(q * token.length),
          trial = i ? z.bTrial : z.aTrial;
        box(
          ctx,
          api,
          'Candidate ' + (i ? 'B' : 'A'),
          [],
          x,
          y,
          740,
          235,
          verdict ? (i ? themeColors.pink : themeColors.green) : themeColors.blue,
        );
        [...token].forEach((ch, j) => {
          const xx = 1040 + j * 86,
            color =
              j < checked
                ? i && j === token.length - 1
                  ? themeColors.pink
                  : themeColors.cyan
                : themeColors.blue;
          api.rect(ctx, xx, y + 75, 68, 65, themeColors.panel, color, 7);
          constructionCode(ctx, api, ch, xx + 34, y + 119, 34, color, 'center');
        });
        label(ctx, api, 'Trial returns', 1590, y + 54, themeColors.yellow, 26);
        trial.frames.forEach((frame, j) => {
          api.rect(ctx, 1480, y + 78 + j * 38, 220, 35, themeColors.panel, themeColors.yellow, 5);
          constructionCode(
            ctx,
            api,
            'open ' + frame.offset + ' → }',
            1490,
            y + 103 + j * 38,
            26,
            themeColors.yellow,
          );
        });
        if (!trial.frames.length) label(ctx, api, 'empty', 1590, y + 126, themeColors.green, 29);
        constructionCode(
          ctx,
          api,
          i ? 'original prefix · depth ' + depth : 'checked bytes: ' + checked,
          x + 22,
          y + (i ? 170 : 205),
          26,
          themeColors.muted,
        );
        if (i && false && done('sg-fresh-old-eos'))
          constructionCode(
            ctx,
            api,
            'original EOS: blocked',
            x + 22,
            y + 210,
            26,
            themeColors.yellow,
          );
        if (verdict)
          label(
            ctx,
            api,
            i ? 'Whole token rejected' : 'Whole token accepted',
            1360,
            y + 259,
            i ? themeColors.pink : themeColors.green,
            29,
          );
      });
      constructionText(
        ctx,
        api,
        accept
          ? 'B starts from the original prefix; only a complete valid trial commits.'
          : 'Trial return frames pop while the accepted state stays unchanged.',
        960,
        1000,
        27,
        themeColors.muted,
        'center',
      );
    });
  }
}
export default {
  id: 'recursive-stack',
  draw: drawRecursiveStack,
  cues: [
    'sg-recursive-stack-0',
    'sg-recursive-stack-1',
    'sg-stack-three',
    'sg-recursive-stack-2',
    'sg-stack-reject',
  ],
};
