// Pure Cinema dual-request meters for "Reset my password" vs "Reset my password now".
// Zero legacy chrome, zero boxed cards, >= 26 px floating typography.
import { dynamic, group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, code, dictionary, glowDot, lumBar, rule, txt, vec } from './parts.mjs';

export const credential = vec.scale(dictionary[0], code[0]);
export const urgency = vec.scale(dictionary[1], code[1]);

export function resetState(request, { blue = 1, pink = 1, error = 0 } = {}) {
  const components = [vec.scale(credential, blue), vec.scale(urgency, request * pink), [0, error]];
  return { components, activation: components.reduce(vec.add, [0, 0]) };
}

const pairText = (v) => `[${v.map((n) => n.toFixed(2)).join(', ')}]`;

/**
 * Dual glowing meters sharing one zero and scale. Each colored segment shows that component's
 * dot product with `weights`, and dashed original markers stay visible through ablations.
 */
export function cinemaRequestMeters({ read, weights, max, quantity, original }) {
  const leftText = -840;
  const railLeft = -210;
  const railRight = 740;
  const railW = railRight - railLeft;
  const x = (value) => railLeft + (value / max) * railW;
  const colors = [ROLE.first, ROLE.second, ROLE.residual];
  const parts = (i) => read(i).components.map((v) => vec.dot(v, weights));
  const total = (i) => vec.dot(read(i).activation, weights);

  const headText = txt(quantity, 0, -280, 42, COSMOS.ink, 'mono', 'center').glow(6, ROLE.other);

  const rowYs = [-115, 75];
  const rows = rowYs.map((y, i) => {
    const promptParts = [
      txt('Reset my password', leftText, y - 16, 40, COSMOS.ink, 'sans', 'left'),
    ];
    if (i === 1) {
      promptParts.push(
        txt('now', leftText + 396, y - 16, 40, ROLE.second, 'sans', 'left').glow(8, ROLE.second),
      );
    }

    const input =
      original &&
      dynamic(() =>
        txt(
          `x = ${pairText(read(i).activation)}`,
          leftText,
          y + 36,
          30,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );

    const track = rule(railLeft, y, railRight, y, '#36466b', 4);
    const ticks = Array.from({ length: max + 1 }, (_, n) => [
      line([x(n), y + 18], [x(n), y + 30], { stroke: '#4d608e', width: 2.5 }),
      txt(String(n), x(n), y + 54, 26, COSMOS.dim, 'mono', 'center'),
    ]).flat();

    const end = dynamic(() => {
      const val = total(i);
      const px = x(val);
      return [
        glowDot(px, y, { radius: 9, color: ROLE.mark, glow: 12 }),
        txt(val.toFixed(2), px + 22, y - 50, 36, ROLE.mark, 'mono', 'left').glow(6, ROLE.mark),
      ];
    });

    const plain = dynamic(() => {
      const w = x(total(i)) - railLeft;
      if (w < 3) return [];
      return [
        lumBar(railLeft + w / 2, y, w, 24, {
          color: ROLE.mark,
          fillOpacity: 0.4,
          strokeWidth: 2.4,
          glow: 9,
          radius: 5,
        }),
      ];
    });

    const stack = dynamic(() => {
      let cursor = railLeft;
      return parts(i).flatMap((val, k) => {
        const w = x(val) - railLeft;
        if (w < 1.5) return [];
        const bar = lumBar(cursor + w / 2, y, w, 28, {
          color: colors[k],
          fillOpacity: 0.48,
          strokeWidth: 2.2,
          glow: 8,
          radius: 5,
        });
        cursor += w;
        return [bar];
      });
    });

    const previous =
      original &&
      line([x(original[i]), y - 18], [x(original[i]), y + 20], {
        stroke: COSMOS.ink,
        width: 3.5,
        dash: [7, 5],
      }).opacity(0.85);

    return {
      base: [...promptParts, track, ...ticks],
      plain,
      stack,
      end,
      input,
      previous,
    };
  });

  const gap = dynamic(() => {
    const a = x(total(0));
    const b = x(total(1));
    const gy = 212;
    const mid = (a + b) / 2;
    const diff = total(1) - total(0);
    return [
      ...(Math.abs(a - b) > 2
        ? [line([a, gy], [b, gy], { stroke: ROLE.mark, width: 4 }).glow(8, ROLE.mark)]
        : []),
      line([a, gy - 12], [a, gy + 12], { stroke: ROLE.mark, width: 3.5 }),
      line([b, gy - 12], [b, gy + 12], { stroke: ROLE.mark, width: 3.5 }),
      txt(
        `urgent − plain = ${diff.toFixed(2)}`,
        mid,
        gy + 44,
        34,
        ROLE.mark,
        'mono',
        'center',
      ).glow(6, ROLE.mark),
    ];
  });

  const caption = (words, color = COSMOS.ink) =>
    txt(words, 0, 385, 38, color, 'sans', 'center').glow(color === ROLE.mark ? 6 : 0, color);

  const legend = (includeError) => {
    const items = [
      group(
        glowDot(leftText + 10, 212, { radius: 8, color: colors[0], glow: 9 }),
        txt('credential', leftText + 30, 212, 30, colors[0], 'sans', 'left'),
      ),
      group(
        glowDot(leftText + 220, 212, { radius: 8, color: colors[1], glow: 9 }),
        txt('urgency', leftText + 240, 212, 30, colors[1], 'sans', 'left'),
      ),
    ];
    if (includeError) {
      items.push(
        group(
          glowDot(leftText + 405, 212, { radius: 8, color: colors[2], glow: 9 }),
          txt('residual', leftText + 425, 212, 30, colors[2], 'sans', 'left'),
        ),
      );
    }
    return items;
  };

  return { headText, rows, gap, caption, legend, footerY: 385 };
}
