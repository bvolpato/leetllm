import { categoricalSampling } from 'vizmatic';
import { group, line, rect } from 'vizmatic/stage';
import { mono } from '../kit-narrated.mjs';

// All strips measure fractions of the same unit. The pin stays at its absolute rank.
export function massStrip(region, masses, colors, height = 64) {
  let start = 0;
  return masses.flatMap((mass, i) => {
    const center = start + mass / 2;
    start += mass;
    if (mass <= 0) return [];
    return [
      rect(region.width * mass, height, { fill: colors[i], stroke: null }).moveTo([
        region.left + center * region.width,
        region.cy,
      ]),
    ];
  });
}

export function rankPin(region, value, caption) {
  const x = region.left + value * region.width;
  return group(
    line([x, region.cy - 51], [x, region.cy + 36], { stroke: 'ink', width: 5 }),
    mono(caption, { size: 36 }).moveTo([x, region.cy - 82]),
  ).zIndex(2);
}

export function drawWord(words, probabilities, uniform) {
  const result = categoricalSampling({
    categories: words.map((word, i) => ({ id: word, label: word, mass: probabilities[i] })),
    normalization: 'probabilities',
    draws: [{ id: 'pin', uniform }],
  });
  return result.draws[0].categoryId;
}
