import { sum } from './arithmetic.mjs';
import { inputs } from './fixtures.mjs';
export function partial(hops) {
  const ranks = [3, 0, 1, 2].slice(0, hops + 1);
  return {
    ranks,
    rank: ranks.at(-1),
    value: sum(ranks.map((rank) => inputs[rank][2])),
  };
}
