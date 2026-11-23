import { facts, lanes } from '../fixtures.mjs';
import { compile, violations } from '../model.mjs';
import { after, progress } from '../timing.mjs';
import { card, text } from '../defaults.mjs';

const contract = compile(facts);
const cheap = lanes.find((lane) => lane.id === 'F');
const local = lanes.find((lane) => lane.id === 'D');

function accessForm(ctx, api) {
  const { C } = api;
  const edge = [
    { x: 190, y: 300 },
    { x: 834, y: 300 },
    { x: 908, y: 374 },
    { x: 908, y: 766 },
    { x: 190, y: 766 },
  ];
  api.path(ctx, edge, { fill: C.ink, width: 0, closed: true });
  api.path(ctx, [edge[1], { x: 834, y: 374 }, edge[2]], { fill: C.muted, width: 0, closed: true });
  text(ctx, api, 'R900   /   Private', 244, 371, 32, C.panel);
  api.text(ctx, 'Access review', 240, 469, 72, C.bg, 'left', 'serif');
  api.line(ctx, 244, 503, 842, 503, C.muted, 3);
  text(ctx, api, 'Evidence ID', 244, 583, 41, C.bg);
  api.rect(ctx, 244, 616, 597, 88, C.ink, C.panel, 8);
  api.line(ctx, 257, 766, 257, 825, C.muted, 4);
  api.arrow(ctx, 257, 825, 306, 825, C.muted, 4);
  text(ctx, api, 'Send to a reviewer', 337, 840, 38, C.ink);
}

function outputSample(ctx, api, lane, x) {
  const { C } = api;
  const w = 528;
  if (lane.schema) {
    api.rect(ctx, x, 492, w, 214, C.panel, C.cyan, 12);
    text(ctx, api, 'Structured form', x + 42, 561, 48, C.ink);
    api.line(ctx, x + 42, 588, x + w - 42, 588, C.muted, 2);
    text(ctx, api, 'Evidence ID', x + 42, 655, 34, C.cyan);
    api.rect(ctx, x + 263, 614, 215, 57, C.panel, C.cyan, 6);
  } else {
    const points = [
      { x, y: 492 },
      { x: x + w, y: 492 },
      { x: x + w, y: 706 },
      { x, y: 706 },
      { x, y: 676 },
      { x: x - 55, y: 654 },
      { x, y: 622 },
    ];
    api.path(ctx, points, { closed: true, fill: C.panel, color: C.cyan, width: 4 });
    text(ctx, api, 'Plain text', x + 42, 573, 57, C.ink);
    api.line(ctx, x + 46, 619, x + 462, 619, C.cyan, 6);
    api.line(ctx, x + 46, 654, x + 323, 654, C.cyan, 6);
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 2) {
    const boxes = [
      ['Access desk', 'R900', 145, C.ink],
      ['Gateway', 'Filter and select', 755, C.yellow],
      ['D’s adapter', 'Translate the call', 1365, C.cyan],
    ];
    for (const [name, detail, x, color] of boxes) {
      focus.target('dispatch-path', () => card(ctx, api, name, x, 490, 410, color, 130));
      text(ctx, api, detail, x + 205, 690, 32, color, 'center');
    }
    const send = progress(state, 'gateway-choice', 2, 0.04, 0.35);
    const invoke = progress(state, 'adapter-call', 2, 0.42, 0.72);
    for (const [left, fraction] of [
      [575, send],
      [1185, invoke],
    ]) {
      api.line(ctx, left, 555, left + 158, 555, C.muted, 3);
      focus.target('dispatch-path', () =>
        api.circle(ctx, left + 158 * fraction, 555, 12, fraction > 0 ? C.cyan : C.muted),
      );
    }
    text(
      ctx,
      api,
      'Lane D   ·   local model + adapter + private review workflow',
      960,
      855,
      34,
      C.cyan,
      'center',
    );
    return;
  }
  // The global mark ends before this shot. The form is visible on the cut.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const compared = progress(state, 'compare-d', 1, 0.57, 0.68);
  const lane = compared > 0 ? local : cheap;
  const rejected = after(state, 'decline-f', 1, 0.08);
  const fits = violations(lane, contract).length === 0;
  const confirmed = fits && after(state, 'd-compatible', 1, 0.76);
  focus.target('primary-attempt', () =>
    text(ctx, api, 'Primary C timed out   ·   0 words delivered', 190, 246, 34, C.blue),
  );
  focus.target('request-form', () => accessForm(ctx, api));
  focus.target('lane-offer', () => {
    text(ctx, api, lane === cheap ? 'Backup F' : 'Backup D', 1080, 394, 58, C.ink);
    text(ctx, api, 'Available output format', 1080, 450, 32, C.muted);
    const travel = api.phase(state.t ?? 0, -0.28, 1.02);
    outputSample(ctx, api, lane, 1072 + 225 * (1 - travel));
    text(ctx, api, 'Healthy   ·   accepts private notes', 1080, 780, 34, C.cyan);
    text(
      ctx,
      api,
      lane === cheap ? 'Within the price limit' : 'Review handoff available',
      1080,
      840,
      34,
      C.cyan,
    );
  });
  if (lane === cheap && rejected) text(ctx, api, 'Skip F', 960, 976, 48, C.pink, 'center');
  if (confirmed)
    text(ctx, api, 'D meets the form and review requirements', 960, 976, 48, C.green, 'center');
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'primary-timeout',
    'read-offer',
    'decline-f',
    'compare-d',
    'd-compatible',
    'gateway-choice',
    'adapter-call',
  ],
};
