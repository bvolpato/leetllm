import { recursiveConstructionState } from '../construction.mjs';
import { box, constructionCode, constructionText, focusProgress, label } from '../defaults.mjs';
export function drawFreshNesting(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-fresh-nesting-mechanism', () => {
      const fresh = true,
        aId = 'sg-fresh-a',
        bId = 'sg-fresh-b';
      const z = recursiveConstructionState(
          true,
          focusProgress(ctx, api, 'sg-fresh-a'),
          focusProgress(ctx, api, 'sg-fresh-b'),
        ),
        { depth, prefix } = z,
        tokens = [z.a, z.bad];
      label(
        ctx,
        api,
        z.accepted
          ? 'Accepted A · four closings consumed'
          : 'Fresh input · four unresolved objects',
        960,
        274,
        themeColors.blue,
        32,
      );
      constructionCode(
        ctx,
        api,
        z.committedPrefix,
        210,
        350,
        31,
        z.accepted ? themeColors.green : themeColors.yellow,
      );
      const eos = z.accepted
        ? done('sg-fresh-eos')
          ? 'allowed'
          : '?'
        : done('sg-fresh-old-eos')
          ? 'blocked'
          : '?';
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
          q = focusProgress(ctx, api, i ? 'sg-fresh-b' : 'sg-fresh-a'),
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
        if (i && true && done('sg-fresh-old-eos'))
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
  id: 'fresh-nesting',
  draw: drawFreshNesting,
  cues: [
    'sg-fresh-nesting-0',
    'sg-fresh-nesting-1',
    'sg-fresh-a',
    'sg-fresh-eos',
    'sg-fresh-b',
    'sg-fresh-old-eos',
    'sg-fresh-nesting-2',
  ],
};
