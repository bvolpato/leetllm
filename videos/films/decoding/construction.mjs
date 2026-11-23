import { BASE, WORDS } from './fixtures.mjs';
import { nucleus } from './arithmetic.mjs';
import { seededRandom } from 'vizmatic';
export function categoricalDraws(count = 100, seed = 19) {
  const ids = nucleus(BASE),
    mass = ids.reduce((sum, id) => sum + BASE[id], 0);
  const probabilities = ids.map((id) => BASE[id] / mass),
    random = seededRandom(seed);
  return Array.from(
    {
      length: count,
    },
    (_, index) => {
      const uniform = random();
      let total = 0,
        selected = ids.length - 1;
      for (let bin = 0; bin < probabilities.length; bin++) {
        total += probabilities[bin];
        if (uniform < total) {
          selected = bin;
          break;
        }
      }
      return {
        index: index + 1,
        uniform,
        bin: selected,
        token: WORDS[ids[selected]],
      };
    },
  );
}
export const DRAW_STREAM = categoricalDraws();
