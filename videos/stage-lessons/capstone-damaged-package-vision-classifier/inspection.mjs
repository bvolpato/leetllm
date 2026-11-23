import { group, line, place, polygon, polyline, rect } from 'vizmatic/stage';
import { label } from '../kit-narrated.mjs';
import { visionRows } from '../../films/capstone-damaged-package-vision-classifier/fixtures.mjs';
import { visionRoute } from '../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';

export function recordedView(id) {
  const row = visionRows.find(({ photo }) => photo.photo_id === id);
  return { ...row, trace: visionRoute(row.photo, row.output) };
}

// Draw schematic captures. A dark capture leaves the condition of the seam unresolved.
export function photograph(region, kind) {
  const p = (x, y) => [region.left + x * region.width, region.top + y * region.height];
  const shape = (points, fill, stroke = fill, width = 2) =>
    polygon(
      points.map(([x, y]) => p(x, y)),
      { fill, stroke, width },
    );
  const mark = (points, stroke, width = 3) =>
    polyline(
      points.map(([x, y]) => p(x, y)),
      { fill: null, stroke, width },
    );
  const dark = kind === 'dark';
  const background = dark ? '#10171e' : '#334652';
  const parts = [
    place(
      rect(region.width, region.height, {
        fill: background,
        stroke: dark ? '#637480' : '#8295a2',
        width: 3,
      }),
      region,
    ),
  ];
  const rail = dark ? '#1c2731' : '#526571';
  for (const y of [0.18, 0.78])
    parts.push(
      mark(
        [
          [0, y],
          [1, y - 0.07],
        ],
        rail,
        3,
      ),
    );

  if (kind === 'empty') return group(...parts);
  if (kind === 'mailer') {
    parts.push(
      shape(
        [
          [0.1, 0.25],
          [0.78, 0.16],
          [0.9, 0.72],
          [0.23, 0.85],
        ],
        '#c49c68',
      ),
      shape(
        [
          [0.1, 0.25],
          [0.78, 0.16],
          [0.75, 0.3],
          [0.16, 0.4],
        ],
        '#9f7950',
      ),
      mark(
        [
          [0.13, 0.26],
          [0.18, 0.32],
          [0.23, 0.29],
          [0.25, 0.4],
          [0.31, 0.38],
          [0.35, 0.47],
        ],
        '#452c26',
        10,
      ),
      mark(
        [
          [0.23, 0.8],
          [0.87, 0.68],
        ],
        '#99734d',
        3,
      ),
      shape(
        [
          [0.57, 0.4],
          [0.76, 0.37],
          [0.79, 0.56],
          [0.6, 0.6],
        ],
        '#e9ddc4',
      ),
    );
    for (let k = 0; k < 9; k++) {
      const x = 0.604 + k * 0.016;
      parts.push(
        mark(
          [
            [x, 0.448 - k * 0.0025],
            [x + 0.013, 0.54 - k * 0.0025],
          ],
          '#514e47',
          k % 3 === 0 ? 5 : 2,
        ),
      );
    }
  } else {
    const front = dark ? '#282a2e' : '#be9666';
    const top = dark ? '#313136' : '#d5b281';
    const side = dark ? '#20252b' : '#906c48';
    parts.push(
      shape(
        [
          [0.12, 0.32],
          [0.32, 0.14],
          [0.88, 0.19],
          [0.66, 0.38],
        ],
        top,
      ),
      shape(
        [
          [0.12, 0.32],
          [0.66, 0.38],
          [0.67, 0.83],
          [0.13, 0.76],
        ],
        front,
      ),
      shape(
        [
          [0.66, 0.38],
          [0.88, 0.19],
          [0.88, 0.63],
          [0.67, 0.83],
        ],
        side,
      ),
      shape(
        [
          [0.37, 0.35],
          [0.43, 0.355],
          [0.44, 0.8],
          [0.38, 0.79],
        ],
        dark ? '#343439' : '#dcbf8d',
      ),
      shape(
        [
          [0.37, 0.35],
          [0.58, 0.164],
          [0.64, 0.169],
          [0.43, 0.355],
        ],
        dark ? '#39393c' : '#ebcd9e',
      ),
    );
    if (kind === 'carton-with-tear') {
      parts.push(
        mark(
          [
            [0.13, 0.43],
            [0.18, 0.47],
            [0.16, 0.52],
            [0.21, 0.57],
          ],
          '#4a342a',
          5,
        ),
      );
    }
  }
  return group(...parts);
}

export function seamFinder(region) {
  const left = region.left + region.width * 0.105,
    right = region.left + region.width * 0.38;
  const top = region.top + region.height * 0.21,
    bottom = region.top + region.height * 0.52;
  const corners = [
    [left, top, 1, 1],
    [right, top, -1, 1],
    [left, bottom, 1, -1],
    [right, bottom, -1, -1],
  ];
  return group(
    ...corners.flatMap(([x, y, dx, dy]) => [
      line([x, y], [x + dx * 22, y], { stroke: 'yellow', width: 5 }),
      line([x, y], [x, y + dy * 22], { stroke: 'yellow', width: 5 }),
    ]),
  );
}

export function caption(region, words, color = 'ink', size = 40) {
  return place(label(words, { size, color }), region);
}
