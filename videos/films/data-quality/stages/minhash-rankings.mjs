import { minhashCases } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionChip,
  drawConstructionEquation,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionText,
} from '../defaults.mjs';
export function drawMinhashRankings(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1,
    v = drawConstructionP(ctx, api, `${'minhash-rankings'}-voice-${currentBeat + 1}`);
  api.focus.target('minhash-rankings-construction', () => {
    if (currentBeat === 0) {
      drawConstructionText(ctx, api, 'A = {a,b,c} · B = {a,b,c,d}', 160, 300, 36, themeColors.cyan);
      const cases = [
        ['a', 'b', 'c', 'd'],
        ['b', 'c', 'd', 'a'],
        ['c', 'd', 'a', 'b'],
        ['d', 'a', 'b', 'c'],
      ];
      cases.forEach((order, i) => {
        const y = 405 + i * 125;
        drawConstructionText(ctx, api, 'ordering ' + (i + 1), 170, y + 40, 27, themeColors.muted);
        order.forEach((letter, j) =>
          drawConstructionChip(
            ctx,
            api,
            letter,
            420 + j * 190,
            y,
            150,
            letter === 'd' ? themeColors.yellow : themeColors.cyan,
          ),
        );
        const active =
          i === 3
            ? drawConstructionP(ctx, api, 'minhash-different')
            : drawConstructionP(ctx, api, 'minhash-shared');
        if (active > 0 && active < 1) {
          const x = 420 + 75;
          drawConstructionArrow(
            ctx,
            api,
            x,
            y - 22,
            x,
            y - 5,
            i === 3 ? themeColors.yellow : themeColors.green,
          );
        }
        if (active === 1) {
          const first = order[0],
            amin = order.find((x) => x !== 'd');
          drawConstructionText(ctx, api, 'min A: ' + amin, 1260, y + 42, 31, themeColors.cyan);
          drawConstructionText(
            ctx,
            api,
            'min B: ' + first,
            1510,
            y + 42,
            31,
            first === amin ? themeColors.green : themeColors.pink,
          );
        }
      });
      drawConstructionNote(ctx, api, 'a: build has · b: has not · c: not passed · d: my build');
    } else if (currentBeat === 1) {
      drawConstructionText(
        ctx,
        api,
        'Every permutation of the same four shingles',
        160,
        300,
        34,
        themeColors.cyan,
      );
      const count = Math.ceil(
        api.phase(drawConstructionP(ctx, api, 'minhash-probability'), 0, 0.85) * 24,
      );
      minhashCases.forEach((c, i) => {
        const x = 160 + (i % 6) * 270,
          y = 385 + Math.floor(i / 6) * 125;
        api.rect(
          ctx,
          x,
          y,
          240,
          95,
          themeColors.panel,
          i < count ? (c.match ? themeColors.green : themeColors.pink) : themeColors.muted,
          2,
        );
        drawConstructionText(
          ctx,
          api,
          c.order.join(' '),
          x + 120,
          y + 38,
          28,
          i < count ? themeColors.ink : themeColors.muted,
          'center',
          true,
        );
        if (i < count)
          drawConstructionText(
            ctx,
            api,
            c.a + ' / ' + c.b,
            x + 120,
            y + 78,
            27,
            c.match ? themeColors.green : themeColors.pink,
            'center',
            true,
          );
      });
      if (done('minhash-probability'))
        drawConstructionEquation(
          ctx,
          api,
          'P(\\min A=\\min B)=\\frac{18}{24}=\\frac34',
          960,
          970,
          49,
          themeColors.green,
        );
      else drawConstructionNote(ctx, api, 'Construct each minimum from the visible ordering.');
    } else {
      drawConstructionText(
        ctx,
        api,
        'A finite signature estimates the ideal probability',
        160,
        300,
        34,
        themeColors.cyan,
      );
      const cases = [0, 6, 12, 18, 20, 23].map((i) => minhashCases[i]);
      cases.forEach((c, i) => {
        drawConstructionText(ctx, api, 'rank ' + (i + 1), 190, 430 + i * 70, 27, themeColors.muted);
        drawConstructionText(
          ctx,
          api,
          c.order.join(' → '),
          470,
          430 + i * 70,
          31,
          themeColors.cyan,
          'left',
          true,
        );
        if (v > (i + 1) / 8) {
          drawConstructionText(ctx, api, c.a, 1150, 430 + i * 70, 33, themeColors.blue);
          drawConstructionText(
            ctx,
            api,
            c.b,
            1400,
            430 + i * 70,
            33,
            c.match ? themeColors.green : themeColors.pink,
          );
        }
      });
      drawConstructionText(
        ctx,
        api,
        'Practical rankings use hashes.',
        160,
        910,
        31,
        themeColors.yellow,
      );
      drawConstructionNote(
        ctx,
        api,
        'Empty inputs need an explicit rule; blanks are rejected before the similarity stage.',
      );
    }
  });
}
export default {
  id: 'minhash-rankings',
  draw: drawMinhashRankings,
  cues: [
    'minhash-rankings-b1',
    'minhash-rankings-voice-1',
    'minhash-shared',
    'minhash-different',
    'minhash-rankings-b2',
    'minhash-rankings-voice-2',
    'minhash-probability',
    'minhash-rankings-b3',
    'minhash-rankings-voice-3',
  ],
};
