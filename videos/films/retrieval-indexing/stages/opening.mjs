import { DOCS, RELEVANT } from '../fixtures.mjs';
import { TOKENS } from '../analysis.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
import { picture } from '../picture.mjs';

const counts = Object.fromEntries(
  Object.entries(TOKENS).map(([id, words]) => [id, words.filter((word) => word === 'soup').length]),
);
const winner = Object.keys(counts).reduce((best, id) => (counts[id] > counts[best] ? id : best));

function underline(ctx, api, p, text, x, y, size, font, fraction, color) {
  if (fraction <= 0) return;
  const index = text.toLowerCase().indexOf('soup');
  ctx.save();
  ctx.font = lessonFont(size, font);
  const left = x + ctx.measureText(text.slice(0, index)).width;
  const end = left + ctx.measureText(text.slice(index, index + 4)).width * fraction;
  ctx.restore();
  const baseline = y + (size > 40 ? 26 : 18);
  p.rule(left, baseline, end, baseline, color, 6);
  if (fraction < 1) {
    const marker = [
      [0, 0],
      [15, 0],
      [21, -5],
      [101, 13],
      [96, 35],
      [16, 17],
      [14, 10],
    ];
    api.path(
      ctx,
      marker.map(([dx, dy]) => ({
        x: end + (dx * size) / 67,
        y: baseline + (size > 40 ? dy : dy * 0.2),
      })),
      {
        closed: true,
        fill: p.C.yellow,
        color: p.C.bg,
        width: 3,
      },
    );
  }
}

function drawPage(ctx, api, p, id, headingMark, bodyMark) {
  const recipe = id === 'd1';
  const x = recipe ? 116 : 1004;
  const { C, label, box, rule, dot } = p;
  const paper = recipe ? C.ink : C.panel;
  const ink = recipe ? C.bg : C.ink;
  const accent = recipe ? C.bg : C.cyan;
  const [heading, body] = DOCS[id].split('. ');
  const lineBreak = body.indexOf(recipe ? 'beans' : 'is served');
  const lines = [body.slice(0, lineBreak), body.slice(lineBreak)];

  box(x, 289, 800, 378, paper, recipe ? undefined : C.muted);
  if (recipe) {
    for (let i = 0; i < 6; i++) {
      const ring = x + 72 + i * 131;
      dot(ring, 317, 10, C.bg);
      rule(ring, 275, ring, 317, C.muted, 6);
    }
  } else {
    rule(x + 28, 311, x + 772, 311, C.muted, 2);
    rule(x + 28, 645, x + 772, 645, C.muted, 2);
  }
  const headingX = x + 50;
  label(id, headingX, 385, 31, ink, 'left', 'mono');
  label(heading, headingX, 472, 67, ink, 'left', 'serif');
  underline(ctx, api, p, heading, headingX, 472, 67, 'serif', headingMark, accent);
  lines.forEach((line, i) => {
    const y = 568 + 62 * i;
    label(line.trim(), headingX, y, 37, ink);
    if (line.toLowerCase().includes('soup'))
      underline(ctx, api, p, line.trim(), headingX, y, 37, 'sans', bodyMark, accent);
  });

  // The recipe shows a lidded pot. The menu shows a bowl with a spoon.
  const cx = x + 693;
  const outline = (points, fill) =>
    api.path(
      ctx,
      points.map(([dx, dy]) => ({ x: cx + dx, y: 375 + dy })),
      { color: ink, width: 4, closed: true, fill },
    );
  if (recipe) {
    outline(
      [
        [-46, -7],
        [46, -7],
        [42, 26],
        [34, 33],
        [-34, 33],
        [-42, 26],
      ],
      ink,
    );
    rule(cx - 58, 374, cx - 41, 374, ink, 7);
    rule(cx + 41, 374, cx + 58, 374, ink, 7);
    rule(cx - 49, 359, cx + 49, 359, ink, 5);
    rule(cx - 11, 350, cx + 11, 350, ink, 6);
  } else {
    rule(cx + 18, 374, cx + 46, 345, ink, 6);
    outline(
      [
        [-49, -9],
        [49, -9],
        [43, 9],
        [30, 23],
        [12, 30],
        [-12, 30],
        [-30, 23],
        [-43, 9],
      ],
      ink,
    );
    rule(cx - 18, 408, cx + 18, 408, ink, 5);
  }
}

export function drawOpening(ctx, scene, state, api) {
  // Cut to the printed pages on the first lesson frame after the brand.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const p = picture(ctx, state, api);
  const { C, label, box, target, progress, started, after } = p;
  const count = progress('open-count');
  const recipeMark = Math.min(1, 0.12 + (state.t ?? 0) / 0.85);
  const returned = after('open-menu');
  const instruction = started('open-read');
  const judged = after('open-judged');
  target('open-counts', () => {
    drawPage(ctx, api, p, 'd1', recipeMark, 0);
    drawPage(ctx, api, p, 'd4', Math.min(1, count * 2), Math.max(0, count * 2 - 1));
  });
  for (const [id, x] of [
    ['d1', 116],
    ['d4', 1004],
  ]) {
    target(id === winner ? 'open-menu' : 'open-recipe', () => {
      if (count >= 1) {
        label(counts[id] + (counts[id] === 1 ? ' match' : ' matches'), x + 42, 750, 47, C.cyan);
      }
      if (id === winner && returned) label('Search result', x + 756, 750, 42, C.yellow, 'right');
      if (judged && RELEVANT.includes(id))
        label('Useful steps', x + 756, 750, 42, C.green, 'right');
    });
  }
  target('open-instruction', () => {
    if (instruction) {
      box(116, 793, 1688, 94, C.panel);
      label('d2', 157, 853, 34, C.muted, 'left', 'mono');
      label(DOCS.d2, 260, 855, 45);
      if (judged) label('Useful steps', 1760, 853, 40, C.green, 'right');
    }
  });
  target('open-question', () => {
    const question = after('open-neither')
      ? '“make” and “soup” both miss d2.'
      : instruction
        ? 'Which words from “make soup” appear in d2?'
        : returned
          ? 'The menu tells you what you can order.'
          : 'Which page has more “soup” matches?';
    label(question, 116, instruction ? 985 : 893, 49, C.yellow);
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'open-count',
    'open-ask',
    'open-menu',
    'open-read',
    'open-match',
    'open-neither',
    'open-judged',
  ],
};
