import assert from 'node:assert/strict';
import {
  instrumentFixture,
  junctionPathOpen,
  monotoneCompliance,
  standardizedFixture,
} from '../../../films/causality/model.mjs';
import {
  C,
  arrow,
  cue,
  dot,
  labelValue,
  line,
  mix,
  num,
  pct,
  rect,
  rule,
  screw,
  sign,
  slug,
  stamp,
  stock,
  text,
  title,
} from './workshop.mjs';
import { intervalPlot } from './tickets.mjs';

function relay(ctx, p, label, color = C.cream, condition = false) {
  const [x, y] = p,
    w = 170,
    h = 59;
  rect(ctx, x - w / 2 - 3, y - h / 2 + 1, w + 6, h + 5, C.deep, 7);
  rect(ctx, x - w / 2, y - h / 2, w, h, condition ? C.brass : color, 6);
  text(ctx, label, x, y + 7, 20, C.ink, 'center', 'Serif', 500);
  screw(ctx, x - w / 2 + 8, y);
  screw(ctx, x + w / 2 - 8, y);
  if (condition) {
    rect(ctx, x - 69, y + 30, 138, 21, C.deep, 2);
    text(ctx, 'CONDITIONED', x, y + 46, 12, C.brass, 'center', 'Mono', 600);
  }
}
function edge(ctx, a, b, color = C.muted) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const reach = Math.min(88 / (Math.abs(dx) || 0.001), 32 / (Math.abs(dy) || 0.001));
  arrow(ctx, a[0] + dx * reach, a[1] + dy * reach, b[0] - dx * reach, b[1] - dy * reach, color, 3);
}

export function unit(ctx, k) {
  const version = cue(k, 2, 'A changed prompt'),
    shared = cue(k, 3, 'staff availability');
  title(ctx, 'A ticket at the routing decision');
  stock(ctx, 59, 105, 408, 344);
  stamp(ctx, 'SERVICE LOG   /   A-HIGH-1', 84, 146, C.blueInk);
  text(ctx, 'Service outage', 84, 204, 38, C.ink, 'left', 'Serif');
  rule(ctx, 84, 224, 353, '#b5ac94');
  labelValue(ctx, 84, 266, 'Intake risk', 'hard', 351);
  labelValue(ctx, 84, 310, 'Route received', 'assistant v1', 351);
  labelValue(ctx, 84, 354, 'Deadline', '24 hours', 351);
  labelValue(ctx, 84, 401, 'Outcome', 'resolved', 351, C.greenInk);
  if (shared) {
    text(ctx, 'Shared staff queue', 535, 165, 28, C.ivory, 'left', 'Serif');
    for (let i = 0; i < 4; i++)
      slug(ctx, 536 + i * 86, 205, 74, 61, i === 0 ? C.blue : C.cream, 'T' + (i + 1));
    arrow(ctx, 570, 282, 657, 321, C.brass);
    text(ctx, 'Time available to the next ticket', 528, 362, 20, C.cream);
  } else if (k.beat.beatIndex >= 1) {
    text(ctx, 'Workflow version', 526, 159, 27, C.cream, 'left', 'Serif');
    text(ctx, 'Model  +  prompt  +  tools', 526, 210, 20, C.ivory);
    stock(ctx, 526, 246, 369, 138);
    stamp(ctx, version ? 'CHANGED PROMPT' : 'LOGGED ACTION', 549, 281, C.blueInk);
    text(ctx, version ? 'Assistant v2' : 'Assistant v1', 549, 339, 34, C.ink, 'left', 'Serif');
  } else {
    text(ctx, 'Intake', 545, 219, 24, C.cream);
    text(ctx, '24 h', 853, 219, 24, C.brass, 'right');
    arrow(ctx, 546, 244, 850, 244);
    dot(ctx, 547, 244, 6, C.blue);
    text(ctx, 'One deadline for both workflows', 536, 300, 19, C.cream);
  }
}

export function assignment(ctx, k) {
  const ch = k.beat.chapterId,
    back = ch === 'c06',
    intervene = ch === 'c07';
  const disconnect = 'Disconnect the arrow from risk to routing';
  const duration = intervene && k.beat.beatIndex === 1
    ? k.wordCue(disconnect).end - k.wordCue(disconnect).start
    : 0;
  const opening = intervene ? cue(k, 2, disconnect, duration) : 0;
  const fixed = opening === 1;
  const conditioned = back || (!intervene && cue(k, 2, 'conditioning on risk'));
  const hidden = back && cue(k, 4, 'hidden customer tier');
  const risk = [310, 149],
    route = [151, 322],
    out = [487, 322],
    tier = [307, 453];
  title(
    ctx,
    intervene
      ? 'Set the routing switch'
      : back
        ? 'Which paths enter the switch?'
        : 'Wire the assumed routing mechanism',
  );
  if (opening === 0) edge(ctx, risk, route, conditioned ? C.brass : C.muted);
  else {
    line(ctx, 277, 185, 244, 221, C.muted, 2);
    line(ctx, 209, 261, 180, 290, C.muted, 2);
    dot(ctx, 244, 221, 5, C.brass);
    dot(ctx, 209, 261, 5, C.brass);
    const angle = mix(Math.atan2(-40, 35), -0.92 * Math.PI, opening);
    const lever = Math.hypot(35, 40);
    line(ctx, 209, 261, 209 + lever * Math.cos(angle), 261 + lever * Math.sin(angle), C.brass, 3);
  }
  edge(ctx, risk, out);
  edge(ctx, route, out, C.blue);
  const example =
    (back && k.beat.beatIndex === 1) || (!back && !intervene && k.beat.beatIndex === 2);
  if (example) {
    const mediator = back ? !cue(k, 2, 'selected audit') : !cue(k, 3, 'common effect');
    edge(ctx, route, tier, mediator ? C.blue : C.red);
    if (mediator) edge(ctx, tier, out, C.blue);
    else edge(ctx, out, tier, C.red);
    relay(ctx, tier, mediator ? 'Summary' : 'Audit selection', mediator ? C.blue : C.red);
  }
  if (hidden) {
    edge(ctx, tier, route, C.red);
    edge(ctx, tier, out, C.red);
    relay(ctx, tier, 'Customer tier', C.red);
  }
  relay(ctx, risk, 'Intake risk', C.cream, conditioned);
  relay(ctx, route, fixed ? 'Set assistant' : 'Routing', C.blue);
  relay(ctx, out, 'Resolution', C.green);
  stock(ctx, 630, 129, 292, 302);
  stamp(ctx, intervene ? 'ASSIGNMENT MECHANISM' : 'PATH INSPECTION', 650, 164, C.brassInk);
  const notes = intervene
    ? fixed
      ? ['Set A = assistant', 'Risk still reaches', 'the outcome.']
      : opening > 0
        ? ['Replace the routing rule', 'Keep both outcome', 'arrows in place.']
        : ['Received A = 1', '54 / 100 resolved', 'Observed group']
    : hidden
      ? ['Risk held fixed', 'Tier still reaches', 'both endpoints.']
      : example
        ? ['Total effect', 'Condition on risk.', 'Leave the lower', 'junction alone.']
        : back && k.beat.beatIndex === 2
          ? ['Within each risk', 'Rate × target share', 'Sum for each arm.']
          : conditioned
            ? ['Risk held fixed', 'A ← risk → Y', 'Fork blocked']
            : ['Common cause', 'A ← risk → Y', 'Fork open'];
  notes.forEach((v, i) =>
    text(ctx, v, 650, 225 + i * 48, i ? 20 : 24, C.ink, 'left', i ? 'Sans' : 'Serif'),
  );
  if (intervene && cue(k, 3, 'shared queue'))
    text(ctx, 'Deployment can change the staff queue for other tickets.', 45, 479, 20, C.cream);
}
function junctionState(k) {
  if (cue(k, 2, 'Bring the arrows together'))
    return { kind: 'collider', conditioned: !!cue(k, 2, 'Select audited tickets') };
  if (cue(k, 2, 'Now turn'))
    return { kind: 'fork', conditioned: !!cue(k, 2, 'Conditioning on risk') };
  return { kind: 'chain', conditioned: !!cue(k, 1, 'Conditioning on that mediator') };
}
export function junctions(ctx, k) {
  const { kind, conditioned } = junctionState(k),
    open = junctionPathOpen(kind, conditioned);
  const a = [148, 286],
    m = [480, 185],
    y = [812, 286];
  title(ctx, 'Trace one path from assignment to resolution');
  if (kind === 'fork') edge(ctx, m, a);
  else edge(ctx, a, m);
  if (kind === 'collider') edge(ctx, y, m);
  else edge(ctx, m, y);
  relay(ctx, a, 'Assignment', C.blue);
  relay(
    ctx,
    m,
    { chain: 'Summary', fork: 'Intake risk', collider: 'Audited' }[kind],
    C.cream,
    conditioned,
  );
  relay(ctx, y, 'Resolution', C.green);
  line(ctx, 151, 365, 808, 365, C.edge, 2);
  dot(ctx, 466, 365, 5, C.brass);
  dot(ctx, 495, 365, 5, C.brass);
  line(ctx, 466, 365, open ? 495 : 490, open ? 365 : 346, C.brass, 4);
  text(
    ctx,
    kind + '  /  path ' + (open ? 'open' : 'blocked'),
    480,
    421,
    28,
    C.ivory,
    'center',
    'Mono',
  );
  if (k.beat.beatIndex === 2)
    text(ctx, 'D-separation requires every path to be blocked.', 480, 472, 20, C.cream, 'center');
}
export function instrument(ctx, k) {
  const bypass = cue(k, 3, 'flag also delays');
  const flag = [146, 249],
    use = [465, 249],
    y = [813, 249],
    u = [643, 108],
    lat = [479, 402];
  title(ctx, 'Trace an encouragement through the gateway');
  edge(ctx, flag, use, C.blue);
  edge(ctx, use, y, C.blue);
  edge(ctx, u, use);
  edge(ctx, u, y);
  if (bypass) {
    edge(ctx, flag, lat, C.red);
    edge(ctx, lat, y, C.red);
    relay(ctx, lat, 'Latency', C.red);
  }
  relay(ctx, u, 'Hidden urgency');
  relay(ctx, flag, 'Random flag', C.brass);
  relay(ctx, use, 'Uptake', C.blue);
  relay(ctx, y, 'Resolution', C.green);
  text(
    ctx,
    bypass
      ? 'The flag reaches resolution even with uptake held fixed.'
      : 'Check every route from the random flag to the outcome.',
    480,
    479,
    23,
    bypass ? C.red : C.cream,
    'center',
    'Serif',
  );
}
const flagGroups = [
  { uptake: 0.3, resolved: 0.68 },
  { uptake: 0.7, resolved: 0.72 },
];
const complianceGroups = [
  { key: 'always', label: 'Always', offRoute: 'Assistant', onRoute: 'Assistant', color: C.cream },
  { key: 'compliers', label: 'Compliers', offRoute: 'Human', onRoute: 'Assistant', color: C.blue },
  { key: 'never', label: 'Never', offRoute: 'Human', onRoute: 'Human', color: C.brass },
];

export function wald(ctx, k) {
  const [off, on] = flagGroups;
  const uptakeChange = on.uptake - off.uptake;
  const resolutionChange = on.resolved - off.resolved;
  const estimate = resolutionChange / uptakeChange;
  const types = monotoneCompliance(off.uptake, on.uptake);
  const show = cue(k, 2, 'Divide four points');
  const question = cue(k, 4, 'Could it delay resolution');
  const heading = question ? 'Could the flag itself delay resolution?'
    : k.beat.beatIndex === 3 ? 'Which tickets changed routes?' : 'What changed when the flag switched on?';
  title(ctx, heading);
  const xs = [241, 541];
  for (const [i, { uptake, resolved }] of flagGroups.entries()) {
    const x = xs[i];
    text(ctx, i ? 'Encouraged' : 'Unencouraged', x, 140, 22, C.ivory, 'left', 'Serif');
    for (const [j, v] of [uptake, resolved].entries()) {
      const row = 203 + j * 84;
      rect(ctx, x, row - 19, 209, 26, C.edge);
      rect(ctx, x, row - 19, 209 * v, 26, j ? C.green : C.blue);
      text(ctx, pct(v), x + 217, row + 3, 18, C.cream, 'left', 'Mono');
    }
  }
  text(ctx, 'Assistant uptake', 42, 205, 22, C.blue);
  text(ctx, 'Resolved in 24 h', 42, 289, 22, C.green);
  if (show) {
    const ratio = num(100 * resolutionChange) + ' pp / ' + num(100 * uptakeChange) + ' pp = ' + num(estimate);
    text(ctx, 'Wald ratio   ' + ratio, 45, 335, 25, C.brass, 'left', 'Mono');
    text(ctx, 'If the flag is valid and no ticket defies it', 540, 334, 18, C.cream);
  }
  if (cue(k, 3, 'compliers')) {
    const focused = cue(k, 4, 'our ten-point estimate') ? 'compliers'
      : cue(k, 4, 'The never-takers') ? 'never'
      : cue(k, 4, 'The always-takers') ? 'always' : null;
    stamp(ctx, 'WORKFLOW WITH FLAG OFF → ON', 45, 377, C.cream);
    let x = 45;
    complianceGroups.forEach(({ key, label, offRoute, onRoute, color }) => {
      const width = types[key] * 870;
      const active = question ? offRoute === onRoute : key === focused;
      const center = x + width / 2;
      rect(ctx, x, 393, width - 3, 67, color);
      if (active) {
        ctx.strokeStyle = C.ivory;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, 388, width - 3, 77);
      }
      text(ctx, label + '  ' + pct(types[key]), center, 420, 20, C.ink, 'center', 'Sans', 600);
      text(ctx, offRoute + ' → ' + onRoute, center, 446, 17, C.ink, 'center', 'Mono');
      x += width;
    });
    if (question)
      text(ctx, 'These tickets keep the same workflow with either flag.', 480, 500, 22, C.cream, 'center', 'Serif');
    else if (focused === 'compliers')
      text(ctx, 'Estimated gain for these switchers   ' + sign(100 * estimate) + ' pp', 480, 500, 22, C.cream, 'center', 'Serif');
  }
}
export function weak(ctx, k) {
  const small = cue(k, 3, 'shrink the uptake change'),
    f = instrumentFixture(small ? 0.04 : 0.4, 0.01);
  const ready = cue(k, 2, 'With uptake change');
  title(ctx, 'One bypass, two instrument strengths');
  stock(ctx, 48, 123, 376, 317);
  stamp(ctx, 'EXCLUSION VIOLATION', 70, 159, C.redInk);
  labelValue(ctx, 70, 221, 'True complier effect', sign(100 * f.tau) + ' pp', 329);
  labelValue(ctx, 70, 267, 'Direct effect of flag', '+1 pp', 329, C.redInk);
  if (ready) labelValue(ctx, 70, 319, 'Change in uptake', sign(100 * f.firstStage) + ' pp', 329);
  if (ready) {
    const x = 483,
      y = 250,
      mult = 7200;
    text(ctx, 'Change in resolution', x, 161, 24, C.ivory, 'left', 'Serif');
    rect(ctx, x, y, f.mediated * mult, 40, C.blue);
    rect(ctx, x + f.mediated * mult, y, f.direct * mult, 40, C.red);
    text(ctx, 'Via uptake ' + sign(f.mediated * 100) + ' pp', x, 208, 18, C.blue);
    text(ctx, 'Bypass +1 pp', x, 324, 18, C.red);
    text(
      ctx,
      num(100 * f.outcomeDifference) + ' / ' + num(100 * f.firstStage) + ' = ' + num(f.ratio, 3),
      x,
      392,
      26,
      C.ivory,
      'left',
      'Mono',
    );
    text(ctx, 'Reported effect   ' + sign(100 * f.ratio) + ' pp', x, 437, 21, C.brass);
  }
}
export function release(ctx, k) {
  const result = cue(k, 5, 'raw report'),
    band = cue(k, 6, 'interval runs'),
    decision = cue(k, 7, 'test the change');
  title(ctx, 'Routing decision for next week');
  if (!result) {
    stock(ctx, 49, 110, 859, 326);
    stamp(ctx, 'RELEASE MEETING  /  EVIDENCE RECEIPT', 75, 151, C.brassInk);
    const lines = [
      ['Deployment queue', '70 easy  /  30 hard'],
      ['Comparison', 'Assistant v1  vs.  human workflow'],
      ['Resolution deadline', '24 hours for every eligible ticket'],
      ['Assignment', 'Risk at intake  •  both routes possible'],
    ];
    if (cue(k, 2, 'missing outcomes'))
      lines.push(['Follow-up', 'Missing outcomes  •  shared staff']);
    if (cue(k, 3, 'random draw'))
      lines[3] = [
        'Proposed trial',
        cue(k, 3, 'within each risk group')
          ? 'Randomize within risk groups'
          : 'Common random assignment',
      ];
    lines.forEach(([name, value], i) => {
      text(ctx, name, 77, 204 + i * 46, 18, C.brassInk);
      text(ctx, value, 341, 204 + i * 46, 19, C.ink);
    });
    return;
  }
  text(ctx, 'Observed log', 48, 144, 23, C.cream);
  text(ctx, '54% − 76% = −22 pp', 49, 197, 31, C.ivory, 'left', 'Mono');
  if (cue(k, 5, 'At next week')) {
    text(ctx, '70 / 30 target mix', 512, 144, 23, C.cream);
    text(ctx, '78% − 68% = +10 pp', 513, 197, 31, C.green, 'left', 'Mono');
  }
  if (band) intervalPlot(ctx, 82, 338, 784, standardizedFixture());
  if (decision)
    text(
      ctx,
      cue(k, 8, 'independent queues')
        ? 'Shared staff? Randomize independent queues.'
        : 'Test the routing change before a full rollout.',
      480,
      470,
      27,
      C.brass,
      'center',
      'Serif',
    );
}
export function checkRouting() {
  for (const kind of ['chain', 'fork', 'collider'])
    assert.deepEqual(
      [false, true].map((v) => junctionPathOpen(kind, v)),
      kind === 'collider' ? [false, true] : [true, false],
    );
  const [off, on] = flagGroups;
  const t = monotoneCompliance(off.uptake, on.uptake);
  for (const [route, group] of [['offRoute', off], ['onRoute', on]]) {
    const assistantShare = complianceGroups.reduce(
      (sum, type) => sum + (type[route] === 'Assistant' ? t[type.key] : 0), 0,
    );
    assert.equal(pct(assistantShare), pct(group.uptake));
  }
  assert.equal(num((on.resolved - off.resolved) / (on.uptake - off.uptake)), num(instrumentFixture().ratio));
  assert.deepEqual(complianceGroups.filter((g) => g.offRoute !== g.onRoute).map((g) => g.key), ['compliers']);
  assert.deepEqual(
    [t.always, t.compliers, t.never].map((v) => Math.round(v * 100)),
    [30, 40, 30],
  );
  assert.deepEqual(
    [0.4, 0.04].map((v) => num(instrumentFixture(v, 0.01).ratio, 3)),
    ['0.125', '0.35'],
  );
  assert.equal(pct(instrumentFixture().ratio), '10%');
}
