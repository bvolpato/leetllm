import {
  ink,
  white,
  teal,
  blue,
  red,
  gold,
  mix,
  box,
  dot,
  path,
  line,
  arrow,
  txt,
  cap,
  slip,
  trace,
  cue,
  head,
} from './art.mjs';
import { ROUTE_FIXTURE } from '../../../films/preference-alignment/fixtures.mjs';
export const entrance = [502, 348],
  corner = [244, 348],
  station = [244, 161];
const detour = [entrance, [732, 348], [732, 205], [502, 205], entrance];
export function walkState(k) {
  const first = cue(k, 0, 'take the first', 1.6),
    second = cue(k, 1, 'Turn right', 1.5);
  const loop = cue(k, 2, 'past the park', 3);
  return {
    first,
    second,
    loop,
    onB: k.beat.beatIndex >= 2,
    vote: cue(k, 3, "I'd keep A") === 1,
  };
}
function hand(c, x, y) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.22);
  c.beginPath();
  c.moveTo(2, 4);
  c.bezierCurveTo(-4, -4, -11, -1, -10, 9);
  c.lineTo(-6, 38);
  c.lineTo(-16, 33);
  c.bezierCurveTo(-25, 29, -28, 35, -22, 44);
  c.lineTo(-2, 74);
  c.lineTo(36, 73);
  c.bezierCurveTo(44, 56, 47, 35, 36, 32);
  c.quadraticCurveTo(30, 25, 24, 29);
  c.quadraticCurveTo(16, 19, 10, 26);
  c.lineTo(2, 4);
  c.fillStyle = '#d69d72';
  c.fill();
  c.strokeStyle = ink;
  c.lineWidth = 2;
  c.stroke();
  box(c, 0, 71, 39, 16, blue);
  c.restore();
}
function train(c, x, y) {
  for (const n of [-17, 17]) line(c, x + n, y - 5, x + n * 1.8, y + 17, ink, 3);
  for (const dy of [4, 11]) line(c, x - 26, y + dy, x + 26, y + dy, ink, 2);
  box(c, x - 36, y - 58, 72, 55, ink, 13);
  box(c, x - 28, y - 51, 56, 24, '#b6d5cb', 5);
  line(c, x, y - 51, x, y - 28, ink, 3);
  dot(c, x - 20, y - 14, 4, gold);
  dot(c, x + 20, y - 14, 4, gold);
}
function cafe(c, x, y) {
  box(c, x - 33, y - 36, 67, 36, '#dbbd8e');
  box(c, x - 27, y - 26, 25, 19, blue);
  box(c, x + 6, y - 26, 20, 26, ink);
  path(
    c,
    [
      [x - 32, y - 53],
      [x + 31, y - 53],
      [x + 40, y - 33],
      [x - 40, y - 33],
    ],
    red,
    0,
    true,
  );
  for (let i = 0; i < 4; i++)
    path(
      c,
      [
        [x - 26 + i * 16, y - 53],
        [x - 19 + i * 16, y - 53],
        [x - 22 + i * 18, y - 33],
        [x - 31 + i * 18, y - 33],
      ],
      white,
      0,
      true,
    );
}
export function walk(c, k) {
  const s = walkState(k);
  box(c, 0, 0, 960, 540, '#e9e1cb');
  // Pale city blocks keep the uninterrupted streets visible under both walks.
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 7; i++) {
      const x = 20 + i * 144,
        y = 80 + j * 112;
      box(c, x, y, 107, 76, ['#dad5bb', '#d6cfb5', '#d3d4b8'][(i + j) % 3], 9);
      box(c, x + 8, y + 8, 40, 24, '#e3dcc6', 3);
      box(c, x + 58, y + 36, 36, 28, '#e3dcc6', 3);
    }
  path(
    c,
    [
      [830, 0],
      [797, 127],
      [779, 193],
      [790, 245],
      [845, 318],
      [853, 540],
    ],
    '#b0ceca',
    38,
  );
  for (const pts of [
    [station, corner, entrance, detour[1]],
    [...detour.slice(1), entrance],
  ])
    path(c, pts, white, 28);
  box(c, 0, 0, 960, 65, ink);
  txt(c, 'How do I reach the station?', 40, 44, 31, white, 'left', 'Serif', 600);
  arrow(c, 892, 48, 892, 19, white, 3);
  txt(c, 'N', 911, 41, 19, white);
  train(c, 244, 151);
  txt(c, 'Station', 291, 142, 22);
  cafe(c, 207, 317);
  txt(c, 'Café', 145, 349, 21, ink, 'right');
  for (const [x, y] of [
    [674, 295],
    [697, 304],
    [713, 286],
  ]) {
    line(c, x, y, x, y + 15, ink, 3);
    dot(c, x, y - 4, 13, '#7c9c76');
  }
  txt(c, 'Park', 729, 314, 19);
  txt(c, 'River', 798, 204, 19, ink);
  let tip = trace(c, [entrance, corner], s.first, teal);
  if (s.second > 0) tip = trace(c, [corner, station], s.second, teal);
  if (s.onB) tip = trace(c, detour, s.loop, blue);
  dot(c, ...entrance, 7, ink);
  dot(c, ...corner, 5, teal);
  if (s.second === 1) dot(c, ...station, 8, teal);
  if (s.onB && s.loop === 1) {
    dot(c, ...entrance, 10, blue);
    dot(c, ...entrance, 4, white);
  }
  txt(c, 'North entrance', 464, 310, 22, ink, 'right');
  line(c, 470, 308, 496, 338, ink, 1.5);
  if (!s.vote) {
    const settle = cue(k, 0, "You're at the north entrance", 1.1);
    hand(c, tip[0] + (1 - settle) * 38, tip[1] + (1 - settle) * 65);
  } else {
    txt(c, 'A', station[0] + 27, station[1] + 27, 22, teal, 'left', 'Mono', 700);
    txt(c, 'B', entrance[0] + 16, entrance[1] + 30, 22, blue, 'left', 'Mono', 700);
  }
  box(c, 0, 459, 960, 81, white);
  const lines =
    k.beat.beatIndex === 0
      ? s.first === 1
        ? ['At the café, which turn', 'reaches the train?']
        : ['Reply A   /   Face north at the entrance.']
      : k.beat.beatIndex === 1
        ? ['Reply A   /   Turn right at the café.']
        : s.vote
          ? ['Recorded vote   /   A over B']
          : ['Reply B   /   Past the park and river,', 'then back to the entrance.'];
  box(c, 426, 0, 448, 65, white);
  const baseline = lines.length === 1 ? 41 : 27;
  lines.forEach((text, i) =>
    txt(c, text, 438, baseline + 27 * i, 25, s.vote ? teal : ink, 'left', 'Serif', 600),
  );
}
export function swap(c, k) {
  head(c, 'How do I reach the station?', 'Saved question   /   North entrance, facing north');
  const q = cue(k, 1, 'swap their positions', 2.3);
  for (const [i, lines] of [ROUTE_FIXTURE.chosen, ROUTE_FIXTURE.rejected].entries()) {
    const x = mix(i ? 529 : 61, i ? 61 : 529, (q - 0.22) / 0.56),
      y = 195 + (i ? 1 : -1) * 83 * Math.min(1, q / 0.22, (1 - q) / 0.22);
    slip(
      c,
      x,
      y,
      366,
      145,
      i ? 'Reply B' : 'Reply A',
      lines,
      i ? blue : teal,
      i ? '' : 'Reviewer’s choice',
    );
  }
  if (k.beat.beatIndex === 1 && k.reveal('If we stored only', 0)) {
    const selectsB = k.reveal('the walk back', 0);
    txt(c, selectsB ? '“Left” would select B' : 'Save “left”?', 244, 157, 25, ink, 'center');
    if (selectsB) path(c, [[62, 189], [62, 172], [426, 172], [426, 189]], ink, 3);
  }
  cap(c, 'STORED COMPARISON', 59, 478);
  txt(c, 'A over B', 284, 482, 25, teal, 'left', 'Mono', 600);
}
export function policy(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'Temporary admin access', 'Service account   /   Tonight’s migration');
  box(c, 47, 124, 864, 66, ink, 3);
  txt(c, 'P-7', 66, 166, 25, gold, 'left', 'Mono', 700);
  txt(c, 'Cite the policy and escalate privileged changes.', 154, 166, 24, white);
  slip(
    c,
    48,
    222,
    410,
    145,
    'Reply A',
    ['Open a reviewer ticket.', 'Cite policy P-7.'],
    blue,
    cue(k, 1, 'A follows the policy') ? 'Reviewer’s choice' : '',
  );
  slip(c, 500, 222, 410, 145, 'Reply B', ['Go ahead tonight.', 'Clean it up tomorrow.'], blue);
  if (b === 1 && cue(k, 1, 'A comparison'))
    txt(c, 'Demonstration   A                         Comparison   A over B', 50, 436, 24);
  if (b === 2) {
    cap(c, 'SEPARATE RELEASE CANDIDATE', 48, 412);
    txt(c, 'Reward  +0.31', 48, 459, 25);
    if (cue(k, 2, 'out of four hundred')) txt(c, 'Human wins  184 / 400', 349, 459, 25);
    if (cue(k, 2, 'extra tokens')) txt(c, 'Length  +48', 732, 459, 25);
  }
}
