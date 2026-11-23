import { appealReplayFixture, oversight } from '../model.mjs';
import { cueProgress, governancePermission } from '../construction.mjs';

function drawFramework(ctx, state, api) {
  const { C, text, line } = api;
  const functions = [
    ['Map', 'Who will use this model?', 'Workflow inventory', 'map-case'],
    ['Measure', 'Which requests failed?', 'Test cases and effects', 'measure-case'],
    ['Manage', 'Who can fix a denial?', 'Hold, repair or appeal', 'manage-case'],
  ];
  api.focus.target('framework-records', () => {
    text(ctx, 'Govern', 110, 300, 54, C.yellow);
    text(
      ctx,
      'The release owner sets decision authority for all three activities.',
      450,
      298,
      34,
      C.ink,
    );
    line(ctx, 110, 352, 1800, 352, C.yellow, 4);
    functions.forEach(([name, question, record, cue], i) => {
      const x = 110 + i * 590;
      text(ctx, name, x, 480, 55, C.cyan);
      if (state.beat > 2 || cueProgress(state, cue) > 0) {
        text(ctx, question, x, 590, 37, C.ink);
        text(ctx, record, x, 667, 31, C.muted);
      }
    });
    if (state.beat === 3) {
      line(ctx, 110, 762, 1800, 762, C.muted, 2);
      text(ctx, 'NIST AI RMF 1.0', 110, 854, 36, C.ink);
      text(ctx, 'Voluntary framework and Generative AI Profile', 110, 923, 28, C.muted);
      if (cueProgress(state, 'iso-system') > 0) {
        text(ctx, 'ISO/IEC 42001:2023', 1030, 854, 36, C.ink);
        text(ctx, 'Organizational AI management system', 1030, 923, 28, C.muted);
      }
    }
  });
}

// Connected pen strokes on the release signature line.
const signature = [{ x: 756, y: 552 }];
for (const [cx, cy, x, y] of [
  [790, 536, 822, 471],
  [853, 419, 840, 473],
  [821, 528, 800, 560],
  [825, 467, 882, 479],
  [931, 496, 841, 524],
  [866, 558, 902, 539],
  [934, 491, 927, 524],
  [911, 565, 958, 514],
  [942, 554, 977, 520],
  [987, 511, 989, 529],
  [995, 540, 1020, 520],
  [1055, 495, 1140, 492],
]) {
  const from = signature.at(-1);
  for (let i = 1; i <= 12; i++) {
    const t = i / 12,
      u = 1 - t;
    signature.push({
      x: u * u * from.x + 2 * u * t * cx + t * t * x,
      y: u * u * from.y + 2 * u * t * cy + t * t * y,
    });
  }
}

function drawPen(ctx, api, tip) {
  const { C, path, rect } = api;
  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(-0.67);
  path(
    ctx,
    [
      { x: 0, y: 0 },
      { x: 32, y: -12 },
      { x: 32, y: 12 },
    ],
    {
      closed: true,
      fill: C.yellow,
      color: C.panel,
      width: 3,
    },
  );
  rect(ctx, 31, -14, 154, 28, C.panel, undefined, 10);
  rect(ctx, 58, -14, 7, 28, C.cyan, undefined, 1);
  api.line(ctx, 131, -6, 177, -6, C.cyan, 4);
  ctx.restore();
}

export function drawIntro(ctx, scene, state, api) {
  if (state.beat >= 2) return drawFramework(ctx, state, api);

  const { C, focus, text, line, path } = api;
  const record = appealReplayFixture().originalRecord;
  const decision = oversight(record.proposal, record.receipts);
  const held = governancePermission(state, 'original-hold') && !decision.eligible;
  const readEffect = governancePermission(state, 'original-effect');
  const readingEffect = cueProgress(state, 'original-effect') > 0;
  const appeal = cueProgress(state, 'original-appeal') > 0;

  focus.target('approval-form', () => {
    path(
      ctx,
      [
        { x: 250, y: 225 },
        { x: 1570, y: 225 },
        { x: 1660, y: 315 },
        { x: 1660, y: 824 },
        { x: 250, y: 824 },
      ],
      { closed: true, fill: C.ink, width: 0 },
    );
    path(
      ctx,
      [
        { x: 1570, y: 225 },
        { x: 1570, y: 315 },
        { x: 1660, y: 315 },
      ],
      { closed: true, fill: C.muted, width: 0 },
    );
    text(ctx, 'Rollout approval', 340, 350, 62, C.panel, 'left', 'serif');
    text(ctx, decision.required.length + ' signatures required', 1510, 347, 37, C.panel, 'right');
    line(ctx, 340, 391, 1560, 391, C.muted, 3);
    decision.required.forEach((role, i) => {
      const y = 567 + i * 158;
      text(ctx, role, 340, y - 14, 52, C.panel);
      line(ctx, 725, y, 1530, y, C.panel, 3);
    });
    if (decision.matching.includes('Release')) {
      const progress = Math.min(1, 0.13 + state.t / 2.4);
      const tip = api.trace(ctx, signature, progress, C.panel, 7);
      if (progress < 1) drawPen(ctx, api, tip);
    }
    const look = state.beat > 0 ? 1 : cueProgress(state, 'intro-lookup');
    if (look > 0) {
      api.rect(ctx, 725, 733, 805 * look, 9, C.yellow, undefined, 3);
    }
    if (held) {
      api.rect(ctx, 1298, 642, 230, 63, C.yellow, C.panel, 5);
      text(ctx, 'HELD', 1413, 690, 44, C.panel, 'center');
    }
  });

  if (readingEffect)
    focus.target('effect-record', () => {
      text(ctx, 'Executor record', 250, 908, 32, C.muted);
      text(
        ctx,
        readEffect ? record.effects.length + ' traffic changes' : 'Checking events…',
        250,
        985,
        52,
        readEffect ? C.cyan : C.ink,
      );
    });
  if (appeal)
    focus.target('appeal-record', () => {
      text(ctx, 'Independent appeal', 906, 908, 32, C.muted);
      text(ctx, 'Original request, policy and receipts', 906, 981, 40, C.ink);
    });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-beat-1-focus-1',
    'gov-intro-policy',
    'gov-intro-lookup',
    'gov-original-hold',
    'gov-original-effect',
    'gov-original-appeal',
    'gov-map-case',
    'gov-measure-case',
    'gov-manage-case',
    'gov-framework-scope',
    'gov-iso-system',
  ],
};
