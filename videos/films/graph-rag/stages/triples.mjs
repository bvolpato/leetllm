import { RECORDS } from '../fixtures.mjs';
import { connector, cueAmount, cueStarted, dot, footer, line, paper, text } from '../defaults.mjs';
export function drawTriples(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => state.cues?.['triples-' + id]?.phase === 'after';
  api.focus.target('triples-mechanism', () => {
    if (currentBeat === 3) {
      text(ctx, api, 'triples', 'Stored-edge lookup', 480, 295, 38, themeColors.blue, 'center');
      text(
        ctx,
        api,
        'triples',
        'Learned message passing',
        1440,
        295,
        38,
        themeColors.yellow,
        'center',
      );
      line(ctx, api, 960, 330, 960, 880, themeColors.muted, 2);
      dot(ctx, api, 'triples', 'Lena', 260, 500, themeColors.blue, 70);
      dot(ctx, api, 'triples', 'Book', 720, 500, themeColors.yellow, 70);
      connector(ctx, api, 340, 500, 640, 500, Math.min(1, progress * 7));
      text(ctx, api, 'triples', 'wrote [A]', 490, 440, 30, themeColors.cyan, 'center');
      paper(
        ctx,
        api,
        'triples',
        'Retrieved evidence',
        ['Lena wrote River Walk.'],
        150,
        680,
        670,
        themeColors.blue,
      );
      dot(ctx, api, 'triples', '0.4', 1190, 460, themeColors.blue, 58);
      dot(ctx, api, 'triples', '0.8', 1670, 460, themeColors.green, 58);
      dot(
        ctx,
        api,
        'triples',
        done('messages-mean') ? '0.6' : '?',
        1430,
        690,
        themeColors.yellow,
        74,
      );
      const messages = cueAmount(ctx, api, 'triples', 'gather-messages');
      connector(ctx, api, 1228, 505, 1388, 626, messages, themeColors.blue);
      connector(ctx, api, 1632, 505, 1472, 626, messages, themeColors.green);
      text(
        ctx,
        api,
        'triples',
        done('messages-mean') ? '(0.4 + 0.8) ÷ 2 = 0.6' : 'Aggregate neighbor messages',
        1440,
        845,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      paper(
        ctx,
        api,
        'triples',
        'A · revision 1',
        [RECORDS.author.text],
        120,
        235,
        760,
        themeColors.blue,
      );
      paper(
        ctx,
        api,
        'triples',
        'B · revision 1',
        ['River Walk was published by Willow Press.'],
        1020,
        235,
        780,
        themeColors.green,
      );
      const a = currentBeat > 0 || cueStarted(ctx, api, 'triples', 'typed-person'),
        z = currentBeat > 0 || cueStarted(ctx, api, 'triples', 'typed-book'),
        r = currentBeat > 0 || cueStarted(ctx, api, 'triples', 'typed-publisher');
      const names = ['Lena', 'River Walk', 'Willow Press'],
        xs = [300, 960, 1620],
        colors = [themeColors.blue, themeColors.yellow, themeColors.green];
      [a, z, r].forEach((yes, i) => {
        if (yes) {
          dot(ctx, api, 'triples', names[i], xs[i], 625, colors[i], i === 2 ? 112 : 95);
          text(
            ctx,
            api,
            'triples',
            ['Person', 'Book', 'Publisher'][i],
            xs[i],
            485,
            29,
            colors[i],
            'center',
          );
        }
      });
      const omitted =
          currentBeat === 2 &&
          cueStarted(ctx, api, 'triples', 'omit-edge') &&
          !cueStarted(ctx, api, 'triples', 'reverse-failure'),
        reversed =
          (currentBeat === 0 && cueStarted(ctx, api, 'triples', 'reverse-edge')) ||
          (currentBeat === 2 &&
            cueStarted(ctx, api, 'triples', 'reverse-failure') &&
            !cueStarted(ctx, api, 'triples', 'invent-edge')),
        invented = currentBeat === 2 && cueStarted(ctx, api, 'triples', 'invent-edge');
      const h1 = currentBeat > 0 ? 1 : cueAmount(ctx, api, 'triples', 'edge-wrote'),
        h2 = currentBeat > 0 ? 1 : cueAmount(ctx, api, 'triples', 'edge-published');
      if (h1 > 0 && !omitted)
        connector(
          ctx,
          api,
          reversed ? 855 : 395,
          625,
          reversed ? 405 : 855,
          625,
          h1,
          reversed || invented ? themeColors.pink : themeColors.cyan,
        );
      if (h2 > 0) connector(ctx, api, 1065, 625, 1508, 625, h2);
      if (h1 > 0)
        text(
          ctx,
          api,
          'triples',
          omitted ? 'link omitted' : reversed ? 'reversed' : invented ? 'owns [A]' : 'wrote [A]',
          630,
          565,
          31,
          omitted || reversed || invented ? themeColors.pink : themeColors.cyan,
          'center',
        );
      if (h2 > 0)
        text(ctx, api, 'triples', 'published by [B]', 1280, 565, 29, themeColors.cyan, 'center');
      if (currentBeat === 1) {
        text(ctx, api, 'triples', 'A: source revision 1', 630, 830, 30, themeColors.blue, 'center');
        text(
          ctx,
          api,
          'triples',
          'B: source revision 1',
          1280,
          830,
          30,
          themeColors.green,
          'center',
        );
        line(ctx, api, 630, 740, 630, 790, themeColors.blue);
        line(ctx, api, 1280, 740, 1280, 790, themeColors.green);
      }
      if (currentBeat === 2)
        text(
          ctx,
          api,
          'triples',
          omitted
            ? 'No path from author to book'
            : reversed
              ? 'Changed direction changes the proposition'
              : invented
                ? 'Valid fields; unsupported ownership claim'
                : 'Reviewed typed graph',
          960,
          875,
          36,
          themeColors.pink,
          'center',
        );
      footer(ctx, api, 'triples', 'Each typed, directed relation keeps its own source receipt');
    }
  });
}
export default {
  id: 'triples',
  draw: drawTriples,
  cues: [
    'triples-b1-1',
    'triples-b1-2',
    'triples-typed-person',
    'triples-typed-book',
    'triples-typed-publisher',
    'triples-edge-wrote',
    'triples-edge-published',
    'triples-reverse-edge',
    'triples-b2-1',
    'triples-receipt-a',
    'triples-receipt-b',
    'triples-b3-1',
    'triples-omit-edge',
    'triples-reverse-failure',
    'triples-invent-edge',
    'triples-core-4',
    'triples-gather-messages',
    'triples-messages-mean',
  ],
};
