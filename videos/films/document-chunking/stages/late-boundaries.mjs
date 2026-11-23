import { cueProgress } from '../arithmetic.mjs';
import { extendedFrame } from '../construction.mjs';
import { lateChunkFixture } from '../model.mjs';
import {
  extendedLine,
  extendedNote,
  extendedText,
  movingPacket,
  spanBracket,
  wordRibbon,
} from '../defaults.mjs';
export function drawLateBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, progress, begun } = extendedFrame('late-boundaries', state);
  const colors = [themeColors.blue, themeColors.green, themeColors.pink];
  api.focus.target('late-boundaries-operation', () => {
    const fixture = lateChunkFixture(),
      words = fixture.tokens.map((x) => x.text),
      coord = wordRibbon(ctx, api, words, 300, {
        colorFor: (i) =>
          i === 2 ? themeColors.yellow : i >= 4 ? themeColors.green : themeColors.blue,
      });
    if (currentBeat === 0) {
      const encoded = begun('late-shared-encode'),
        pooled = begun('late-offset-pool');
      extendedText(
        ctx,
        api,
        'Same selected span · token states precede chunk pooling',
        960,
        255,
        31,
        themeColors.ink,
        'center',
      );
      fixture.tokens.forEach((token, i) => {
        const x = coord(i + 0.5) - 3;
        if (encoded) {
          extendedText(
            ctx,
            api,
            'h' + i,
            x,
            510,
            29,
            fixture.selected.includes(i) ? themeColors.green : themeColors.muted,
            'center',
          );
          if (fixture.selected.includes(i)) {
            extendedLine(ctx, api, x, 550, x, 650, themeColors.green, 3);
            if (pooled)
              extendedText(
                ctx,
                api,
                token.mayaFeature.toFixed(2),
                x,
                698,
                27,
                themeColors.green,
                'center',
              );
          }
        }
      });
      if (encoded)
        spanBracket(
          ctx,
          api,
          coord(0),
          coord(8) - 6,
          440,
          'shared longer input first',
          themeColors.cyan,
        );
      if (pooled) {
        spanBracket(
          ctx,
          api,
          coord(4),
          coord(8) - 6,
          745,
          'selected content-token offsets',
          themeColors.green,
        );
        extendedText(
          ctx,
          api,
          'mean illustrative feature = ' + fixture.pooledFeature.toFixed(2),
          960,
          914,
          38,
          themeColors.yellow,
          'center',
        );
      }
      extendedNote(
        ctx,
        api,
        'Illustrative feature fixture. Pool actual contextual token states; handle special tokens and normalization deliberately.',
      );
    } else if (currentBeat === 1) {
      extendedText(
        ctx,
        api,
        'Encoder context is bounded by capacity and attention',
        960,
        250,
        32,
        themeColors.ink,
        'center',
      );
      const windows = [
        [0, 6],
        [2, 8],
      ];
      windows.forEach(([start, end], i) => {
        const y = 550 + i * 210;
        colorWindow(start, end, y, i);
      });
      function colorWindow(start, end, y, i) {
        const color = colors[i];
        spanBracket(
          ctx,
          api,
          coord(start),
          coord(end) - 6,
          y,
          'illustrative capacity 6 · window ' + (i + 1),
          color,
        );
        for (let j = start; j < end; j++) {
          const x = coord(j + 0.5) - 3;
          extendedLine(ctx, api, x, y - 65, x, y - 20, color, 2);
        }
      }
      extendedText(
        ctx,
        api,
        'Each encoding pass can use the words inside its own window.',
        960,
        933,
        31,
        themeColors.yellow,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'One pooled vector per child differs from retaining multiple vectors for late interaction.',
      );
    } else {
      const repaired = cueProgress(state, 'late-trust-repair', api.phase(state.beatP ?? 0, 0.55, 0.72)) === 1;
      const privateX = coord(2.5) - 3,
        publicX = coord(6) - 3;
      spanBracket(ctx, api, coord(0), coord(4) - 6, 450, 'Restricted section', themeColors.pink);
      spanBracket(ctx, api, coord(4), coord(8) - 6, 450, 'Public instruction', themeColors.green);
      if (!repaired) {
        movingPacket(
          ctx,
          api,
          {
            x: privateX,
            y: 610,
          },
          {
            x: publicX,
            y: 740,
          },
          progress('late-dependence'),
          themeColors.pink,
        );
        extendedText(
          ctx,
          api,
          'Public chunk vector',
          publicX,
          790,
          32,
          themeColors.pink,
          'center',
        );
        spanBracket(ctx, api, coord(0), coord(8) - 6, 861, 'One encoder input', themeColors.blue);
      } else {
        for (const [start, end, label, color] of [
          [0, 4, 'Restricted encoder input', themeColors.pink],
          [4, 8, 'Public encoder input', themeColors.green],
        ]) {
          const left = coord(start), right = coord(end) - 6;
          const center = (left + right) / 2;
          api.arrow(ctx, center, 539, center, 627, color, 4);
          api.rect(ctx, left + 14, 650, right - left - 28, 194, themeColors.panel, color, 8);
          extendedText(ctx, api, label, center, 717, 33, color, 'center');
          extendedText(ctx, api, words.slice(start, end).join(' '), center, 797, 45, themeColors.ink, 'center');
        }
      }
      extendedNote(
        ctx,
        api,
        'Record which source version and permission scope produced each vector.',
      );
    }
  });
}
export default {
  id: 'late-boundaries',
  draw: drawLateBoundaries,
  cues: [
    'late-boundaries-0',
    'late-shared-encode',
    'late-offset-pool',
    'late-boundaries-1',
    'late-boundaries-2',
    'late-dependence',
    'late-trust-repair',
  ],
};
