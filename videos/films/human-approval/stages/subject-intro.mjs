import { PROPOSAL } from '../fixtures.mjs';
import { cueClock, trafficStrip } from '../routing.mjs';

const brown = { leather: '#b27548', heel: '#815033', collar: '#e6bb86', trim: '#f3d5a4' };
const red = { leather: '#c94d54', heel: '#913840', collar: '#ec9691', trim: '#ffcab0' };

// The same two products appear in both rankings. Their color travels with them.
function boot(ctx, api, centerX, centerY, size, palette) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(size, size);
  ctx.translate(-132, -83);
  const polygon = (vertices, fill) =>
    api.path(
      ctx,
      vertices.map(([x, y]) => ({ x, y })),
      { closed: true, fill, width: 0 },
    );

  polygon(
    [
      [31, 20],
      [25, 5],
      [32, 2],
      [44, 22],
    ],
    palette.collar,
  );
  polygon(
    [
      [25, 17],
      [85, 15],
      [109, 7],
      [118, 15],
      [123, 46],
      [142, 73],
      [167, 91],
      [194, 100],
      [228, 103],
      [246, 109],
      [256, 120],
      [258, 139],
      [238, 148],
      [165, 151],
      [102, 135],
      [77, 139],
      [18, 136],
      [16, 112],
      [22, 84],
      [26, 51],
    ],
    palette.leather,
  );
  polygon(
    [
      [25, 17],
      [82, 15],
      [100, 11],
      [101, 24],
      [83, 31],
      [27, 33],
    ],
    palette.collar,
  );
  polygon(
    [
      [19, 102],
      [36, 81],
      [57, 76],
      [72, 87],
      [81, 113],
      [99, 135],
      [76, 141],
      [18, 137],
    ],
    palette.heel,
  );
  polygon(
    [
      [86, 28],
      [112, 18],
      [124, 48],
      [147, 76],
      [160, 86],
      [143, 92],
      [118, 75],
      [101, 54],
    ],
    palette.heel,
  );
  polygon(
    [
      [16, 129],
      [72, 131],
      [101, 127],
      [166, 141],
      [227, 140],
      [259, 128],
      [259, 145],
      [241, 155],
      [223, 160],
      [162, 161],
      [105, 150],
      [73, 145],
      [70, 155],
      [17, 153],
    ],
    '#53535a',
  );
  api.path(
    ctx,
    [
      [18, 132],
      [72, 136],
      [101, 132],
      [163, 146],
      [225, 145],
      [256, 135],
    ].map(([x, y]) => ({ x, y })),
    { color: palette.trim, width: 3 },
  );
  for (const [x, y] of [
    [98, 35],
    [105, 48],
    [114, 61],
    [125, 73],
  ]) {
    api.circle(ctx, x, y, 4.5, palette.trim);
    api.line(ctx, x, y, x + 16, y - 6, '#433b38', 3);
  }
  ctx.restore();
}

function rankings(ctx, api, cue, clicked, answered) {
  const { C } = api;
  const order = api.ease(cue('intro-red').progress);
  const lift = Math.sin(Math.PI * order);
  const caption = (x, word) => api.text(ctx, word, x, 647, 32, C.muted, 'center');
  api.focus.target('serving-path', () => {
    api.text(
      ctx,
      clicked && !answered ? 'Shopper’s results before the click' : 'Shopper’s results',
      115,
      253,
      44,
      C.cyan,
    );
    boot(ctx, api, 312, 459, 1.24, brown);
    boot(ctx, api, 709, 459, 1.24, red);
    caption(312, 'First');
    caption(709, 'Second');
  });
  api.line(ctx, 956, 226, 956, 652, C.panel, 4);
  api.focus.target('shadow-path', () => {
    api.text(ctx, 'Shadow test  ·  reranker v17', 1018, 253, 44, C.blue);
    const first = 1215,
      second = 1612;
    const size = 1.24 - 0.19 * lift;
    boot(ctx, api, first + (second - first) * order, 459 + 111 * lift, size, brown);
    boot(ctx, api, second - (second - first) * order, 459 - 111 * lift, size, red);
    if (cue('intro-red').phase === 'after') {
      caption(first, 'First');
      caption(second, 'Second');
    }
  });
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const click = cue('intro-click');
  const clicked = click.phase === 'after';
  const answered = cue('intro-zero').phase === 'after';
  const saved = cue('intro-saved').phase === 'after';
  rankings(ctx, api, cue, clicked, answered);
  api.line(ctx, 115, 694, 1805, 694, C.muted, 2);

  api.focus.target('live-share', () => {
    api.text(
      ctx,
      clicked && !answered ? 'Last live reading before the click' : 'Live traffic on v17',
      115,
      774,
      37,
      C.ink,
    );
    api.text(ctx, PROPOSAL.fromTraffic + '%', 115, 912, 98, C.cyan, 'left', 'serif');
    trafficStrip(ctx, api, 335, 844, 555, PROPOSAL.fromTraffic, C.cyan);
    if (answered)
      api.text(ctx, 'Waiting for the worker to change the route', 115, 1000, 32, C.muted);
  });
  if (state.beat === 0) return;

  api.focus.target('proposed-share', () => {
    const request = cue('intro-target');
    const percent = 5 * Math.floor((PROPOSAL.trafficPercent / 5) * request.progress);
    api.text(ctx, 'Vega’s requested canary', 1018, 774, 37, C.ink);
    trafficStrip(ctx, api, 1250, 844, 555, percent, C.yellow);
    if (request.phase === 'after')
      api.text(ctx, PROPOSAL.trafficPercent + '%', 1018, 912, 98, C.yellow, 'left', 'serif');
  });
  api.focus.target('decision', () => {
    if (cue('intro-target').phase !== 'after') return;
    const color = saved ? C.green : C.yellow;
    api.rect(ctx, 1018, 943, 343, 73, clicked ? C.panel : color, color, 14);
    api.text(
      ctx,
      saved ? 'Approval saved' : clicked ? 'Click received' : 'Approve',
      1189,
      992,
      36,
      clicked ? color : C.bg,
      'center',
    );
    if (click.phase === 'during') {
      const x = 1452 - 112 * click.progress;
      const y = 1035 - 55 * click.progress;
      api.path(
        ctx,
        [
          { x, y },
          { x: x + 7, y: y + 38 },
          { x: x + 16, y: y + 26 },
          { x: x + 32, y: y + 25 },
        ],
        { closed: true, fill: C.ink, color: C.bg, width: 3 },
      );
    }
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'intro-red',
    'intro-shopper',
    'intro-target',
    'intro-click',
    'intro-question',
    'intro-zero',
    'intro-saved',
  ],
};
