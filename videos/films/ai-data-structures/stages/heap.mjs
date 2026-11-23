import { clamp, mix } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, drawTransfer, withFocus } from '../defaults.mjs';
export function drawHeap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    const first = progress('heap-first', 0),
      second = progress('heap-second', 1),
      replace = progress('heap-replace', 3),
      sift = progress('heap-sift', 3, 0.55, 0.88),
      scanZero = progress('heap-scan-zero', 4, 0.11, 0.27),
      discard = progress('heap-discard', 4, 0.36, 0.4),
      output = progress('heap-output', 4, 0.65, 0.9);
    const root = {
        x: 1000,
        y: 380,
      },
      child = {
        x: 1280,
        y: 650,
      },
      incoming = {
        x: 250,
        y: 430,
      };
    drawText(ctx, api, 'Min-heap · k = 2', 1080, 280, 34, themeColors.ink, 'center');
    let rootNode, childNode;
    withFocus(ctx, api, 'heap-actors', () => {
      const node = (id, score, x, y, color = themeColors.cyan) =>
        drawCard(ctx, api, 'M' + id + ' · score ' + score, x, y, 270, 90, color, 1, 29);
      if (currentBeat === 0)
        node(
          3,
          1,
          mix(incoming.x, root.x, first),
          mix(incoming.y, root.y, first),
          themeColors.green,
        );
      else if (currentBeat < 3) {
        rootNode = node(3, 1, root.x, root.y, themeColors.pink);
        if (currentBeat === 1)
          childNode = node(
            2,
            2,
            mix(incoming.x, child.x, second),
            mix(incoming.y, child.y, second),
            themeColors.green,
          );
        else {
          childNode = node(2, 2, child.x, child.y);
          node(0, 2, incoming.x, incoming.y, themeColors.yellow);
        }
      } else {
        if (replace < 0.45) {
          rootNode = node(
            3,
            1,
            mix(root.x, 650, replace / 0.45),
            root.y,
            themeColors.pink,
          );
        }
        const enter = clamp((replace - 0.45) / 0.55);
        if (replace < 0.99) {
          if (replace >= 0.45)
            drawCard(
              ctx,
              api,
              '',
              root.x,
              root.y,
              270,
              90,
              themeColors.muted,
              0.4 * (1 - enter),
              29,
            );
          const entering = node(
            0,
            2,
            mix(incoming.x, root.x, enter),
            mix(incoming.y, root.y, enter),
            themeColors.yellow,
          );
          if (replace >= 0.45) rootNode = entering;
          childNode = node(2, 2, child.x, child.y);
        } else {
          const zero = node(
              0,
              2,
              mix(root.x, child.x, sift) + Math.sin(Math.PI * sift) * 190,
              mix(root.y, child.y, sift),
              themeColors.green,
            ),
            two = node(
              2,
              2,
              mix(child.x, root.x, sift) - Math.sin(Math.PI * sift) * 190,
              mix(child.y, root.y, sift),
              themeColors.cyan,
            );
          if (sift === 0) {
            rootNode = zero;
            childNode = two;
          } else if (sift === 1) {
            rootNode = two;
            childNode = zero;
          }
        }
        if (currentBeat === 4 && scanZero > 0 && discard < 1) {
          const x = mix(incoming.x, 100, discard);
          drawText(ctx, api, 'From the full scan', x, incoming.y - 40, 30, themeColors.muted);
          node(1, 0, x, incoming.y, themeColors.pink);
        }
      }
      drawText(
        ctx,
        api,
        currentBeat === 2
          ? 'Which retained note leaves?'
          : currentBeat >= 3 && sift < 0.98
            ? 'Replacement and heap repair'
            : 'Root: the next retained result to evict',
        960,
        865,
        30,
        currentBeat === 2 ? themeColors.yellow : themeColors.muted,
        'center',
      );
      if (currentBeat >= 3)
        drawText(
          ctx,
          api,
          '(score, −message ID) · lower ID wins a tied score',
          960,
          940,
          29,
          themeColors.muted,
          'center',
        );
    });
    if (rootNode && childNode && !(currentBeat === 3 && replace < 1))
      drawTransfer(ctx, api, rootNode, childNode, themeColors.muted);
    withFocus(ctx, api, 'heap-output', () => {
      if (output === 1) {
        drawCard(ctx, api, 'Ranked output: M0, M2', 180, 710, 590, 95, themeColors.green, 1, 32);
        drawText(ctx, api, 'Heap storage: M2, M0', 475, 850, 27, themeColors.muted, 'center');
      } else drawText(ctx, api, 'Ranked output pending', 475, 770, 30, themeColors.muted, 'center');
    });
  }
}
export default {
  id: 'heap',
  draw: drawHeap,
  cues: [
    'heap-first',
    'heap-second',
    'heap-predict',
    'heap-replace',
    'heap-sift',
    'heap-scan-zero',
    'heap-discard',
    'heap-output',
  ],
};
