import assert from 'node:assert/strict';
import { PROPOSAL, FRESH_PROPOSAL } from '../../../films/human-approval/fixtures.mjs';
import {
  conditionalWrite,
  deploymentRow,
  digest,
  decisionStore,
} from '../../../films/human-approval/model.mjs';
import { drawBoot } from './boots.mjs';

const totalGroups = 20;
const groupsFor = (row) => (row.trafficPercent * totalGroups) / 100;
const shadow = deploymentRow(PROPOSAL.revision, PROPOSAL.fromTraffic);
const otherRelease = conditionalWrite(shadow, {
  ...PROPOSAL,
  trafficPercent: FRESH_PROPOSAL.fromTraffic,
});
const staleWrite = conditionalWrite(otherRelease.row, PROPOSAL);
const freshWrite = conditionalWrite(staleWrite.row, FRESH_PROPOSAL);

const beats = [
  {
    id: 'shadow-search',
    say: 'Look at the first result for trail boots. The red hiker just edged out the tan boot. The store ran this new ranking on a copy of the search.',
    hold: 0.7,
  },
  {
    id: 'shopper-search',
    say: 'What would a shopper see? Each spot on this wall stands for an equal share of traffic making that same search. Every group still gets the tan boot first.',
    hold: 0.9,
  },
  {
    id: 'five-places',
    say: 'Casey is reviewing a request to give five of those groups the new ranking. That’s a quarter of the traffic. The request starts from zero, on deployment revision three.',
    hold: 0.85,
  },
  {
    id: 'another-operator',
    say: 'While Casey reads the test results, another operator puts two groups on the new ranking. That change takes the store to revision four. Look back at the revision on Casey’s request.',
    hold: 0.95,
  },
  {
    id: 'casey-approves',
    say: 'Casey clicks Approve. The review service checks her authority and saves her decision with a fingerprint of the exact request. Can her approval turn three more boots red?',
    hold: 1.7,
  },
  {
    id: 'the-guarded-write',
    say: 'Watch those three places. The store checks the required revision as part of the write that would change traffic. Casey approved a move from revision three. The store found four. Two groups keep the new ranking.',
    hold: 0.95,
  },
  {
    id: 'new-starting-point',
    say: 'Casey opens a fresh request with new test results. This one starts at ten percent on revision four. She approves it.',
    hold: 0.8,
  },
  {
    id: 'the-top-shelf',
    say: 'Watch the top shelf. The store found revision four, applied the change, and advanced to revision five. Five groups now get the red boot first.',
    hold: 2.5,
  },
];

function check() {
  const store = decisionStore();
  const first = store.decide('review-17', PROPOSAL, 'casey', 'approve', 200);
  assert.equal(first.digest, digest(PROPOSAL));
  assert.equal(store.permits(first.id, PROPOSAL, shadow.revision, 101), true);
  assert.equal(store.permits(first.id, FRESH_PROPOSAL, otherRelease.row.revision, 101), false);
  assert.equal(store.permits(first.id, PROPOSAL, otherRelease.row.revision, 101), false);
  assert.equal(otherRelease.rows, 1);
  assert.equal(staleWrite.rows, 0);
  assert.deepEqual(staleWrite.row, otherRelease.row);
  const fresh = store.decide('review-18', FRESH_PROPOSAL, 'casey', 'approve', 200);
  assert.notEqual(first.digest, fresh.digest);
  assert.equal(store.permits(fresh.id, FRESH_PROPOSAL, staleWrite.row.revision, 101), true);
  assert.equal(freshWrite.rows, 1);
  assert.deepEqual(
    [shadow, otherRelease.row, staleWrite.row, freshWrite.row].map(groupsFor),
    [0, 2, 2, 5],
  );
  assert.deepEqual(
    [shadow, otherRelease.row, staleWrite.row, freshWrite.row].map((row) => row.revision),
    [3, 4, 4, 5],
  );
}

const ink = '#312b30';
const sienna = '#6f372c';
const slate = '#3c4a5c';
const smooth = (x) => x * x * (3 - 2 * x);
const clamp = (x) => Math.min(1, Math.max(0, x));
const mix = (a, b, t) => a + (b - a) * t;

function step(clock, index, phrase, duration = 0.45) {
  if (clock.index < index) return 0;
  if (clock.index > index) return 1;
  return smooth(clock.reveal(phrase, duration));
}

function type(c, value, x, y, size, options = {}) {
  const { color = ink, family = 'Sans', weight = 400, align = 'left' } = options;
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.fillText(value, x, y);
}

function gradient(c, x1, y1, x2, y2, stops) {
  const gradient = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  return gradient;
}

function panel(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}

function polygon(c, coords, fill) {
  c.fillStyle = fill;
  c.beginPath();
  coords.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}

function shadowUnder(c, x, y, rx, ry, opacity) {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(57,36,33,' + opacity + ')');
  g.addColorStop(0.5, 'rgba(57,36,33,' + opacity * 0.64 + ')');
  g.addColorStop(1, 'rgba(57,36,33,0)');
  c.fillStyle = g;
  c.fillRect(-1, -1, 2, 2);
  c.restore();
}

function previewSet(c) {
  panel(
    c,
    0,
    0,
    1920,
    1080,
    gradient(c, 0, 0, 1000, 830, [
      [0, '#f8e7cf'],
      [0.55, '#eec8a8'],
      [1, '#d9aa93'],
    ]),
  );
  // Long window shadows fall behind the products and stay fixed as the ranks change.
  polygon(
    c,
    [
      [885, 0],
      [1580, 0],
      [720, 648],
      [140, 648],
    ],
    '#ffedd12e',
  );
  polygon(
    c,
    [
      [1613, 0],
      [1692, 0],
      [860, 648],
      [782, 648],
    ],
    '#b47e6e18',
  );
  polygon(
    c,
    [
      [0, 655],
      [1920, 655],
      [1920, 794],
      [0, 794],
    ],
    gradient(c, 0, 655, 0, 794, [
      [0, '#c87f67'],
      [0.08, '#ca8269'],
      [1, '#bb745c'],
    ]),
  );
  polygon(
    c,
    [
      [0, 549],
      [1920, 549],
      [1920, 655],
      [0, 655],
    ],
    gradient(c, 0, 549, 0, 655, [
      [0, '#deac8e'],
      [1, '#f1c4a1'],
    ]),
  );
  panel(c, 0, 655, 1920, 3, '#ffdab5');
  panel(
    c,
    0,
    794,
    1920,
    286,
    gradient(c, 0, 794, 0, 1080, [
      [0, '#ebc6a8'],
      [1, '#f1d1b5'],
    ]),
  );
  panel(
    c,
    0,
    794,
    1920,
    10,
    gradient(c, 0, 794, 0, 804, [
      [0, '#9c634c55'],
      [1, '#ab776200'],
    ]),
  );
  type(c, 'SHADOW SEARCH   /   RERANKER 17', 82, 96, 32, { weight: 600, color: sienna });
  type(c, 'Trail boots', 76, 191, 99, { family: 'Serif' });
  type(c, 'Second result', 1050, 738, 43, { color: '#482d29' });
}

function swapRanks(c, t) {
  const arc = Math.sin(Math.PI * t);
  const first = 400,
    second = 1330;
  const brown = {
    red: false,
    x: mix(first, second, t),
    y: 637 - 74 * arc,
    w: mix(620, 560, t) - 150 * arc,
  };
  const red = {
    red: true,
    x: mix(second, first, t),
    y: 637 - 22 * arc,
    w: mix(560, 620, t) + 44 * arc,
  };
  for (const shoe of [brown, red]) shadowUnder(c, shoe.x, 627, shoe.w * 0.5, 18, 0.32 - 0.12 * arc);
  for (const shoe of [brown, red]) drawBoot(c, shoe.red, shoe.x, shoe.y, shoe.w);
}

function pill(c, text, x, y, w, filled, press) {
  c.save();
  c.translate(x, y + press * 4);
  c.beginPath();
  c.roundRect(0, 0, w, 58, 29);
  c.fillStyle = filled ? '#453237' : '#f3dbc2';
  c.fill();
  c.strokeStyle = filled ? '#453237' : '#9c6c56';
  c.lineWidth = 2;
  c.stroke();
  type(c, text, w / 2, 40, 31, {
    weight: 600,
    align: 'center',
    color: filled ? '#ffefe2' : sienna,
  });
  c.restore();
}

function review(c, clock, state) {
  type(c, state.request ? 'Casey’s request' : 'First result', 80, 738, 43, { color: '#482d29' });
  if (state.request === 0) return;
  const proposal = state.fresh ? FRESH_PROPOSAL : PROPOSAL;
  c.save();
  c.globalAlpha = state.request;
  type(c, 'Requires rev ' + proposal.revision, 82, 865, 44, { color: sienna, weight: 600 });
  type(c, proposal.fromTraffic + '% → ' + proposal.trafficPercent + '%', 76, 962, 84, {
    family: 'Serif',
  });
  const approved = state.fresh ? state.freshApproved : state.firstApproved;
  let label = 'In review';
  const clicking = clock.index === 4 && state.click > 0 && !approved;
  if (clicking) label = 'Approve';
  if (approved) label = 'Casey approved';
  pill(c, label, 456, 694, 290, approved, clicking ? Math.sin(Math.PI * state.click) : 0);
  c.restore();
}

const wallLeft = 807;
const rackLeft = 858;
const rackRight = 1859;
const columns = 5;
const pitch = (rackRight - rackLeft) / columns;
const shelfY = (row) => 343 + row * 133;

function shopWall(c) {
  panel(
    c,
    wallLeft,
    0,
    1920 - wallLeft,
    1080,
    gradient(c, wallLeft, 100, 1900, 940, [
      [0, '#dce4ea'],
      [0.5, '#eff1ed'],
      [1, '#c3d0d8'],
    ]),
  );
  panel(
    c,
    wallLeft,
    0,
    19,
    1080,
    gradient(c, wallLeft, 0, wallLeft + 19, 0, [
      [0, '#7b84865c'],
      [1, '#89929500'],
    ]),
  );
  type(c, 'Live search', 862, 109, 78, { family: 'Serif' });
  type(c, 'First result in each of 20 equal traffic groups', 867, 175, 39, { color: slate });
  for (let row = 0; row < totalGroups / columns; row++) {
    const y = shelfY(row);
    panel(
      c,
      rackLeft + 6,
      y + 17,
      rackRight - rackLeft - 5,
      29,
      gradient(c, 0, y + 17, 0, y + 46, [
        [0, '#56687c52'],
        [1, '#61779100'],
      ]),
    );
    polygon(
      c,
      [
        [rackLeft + 15, y - 12],
        [rackRight - 14, y - 12],
        [rackRight, y + 5],
        [rackLeft, y + 5],
      ],
      '#e4e6e3',
    );
    panel(
      c,
      rackLeft,
      y + 5,
      rackRight - rackLeft,
      13,
      gradient(c, 0, y + 5, 0, y + 18, [
        [0, '#a9b6c1'],
        [0.85, '#99a6b1'],
        [1, '#808e9b'],
      ]),
    );
  }
}

function placeMarks(c, n, alpha) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const x = rackLeft + pitch * (i + 0.5);
    panel(c, x - 56, shelfY(0) + 6, 112, 8, '#934230');
  }
  c.restore();
}

function stateAt(clock) {
  const request = step(clock, 2, 'Casey is reviewing', 0.7);
  const drift = step(clock, 3, 'While Casey reads', 1.05);
  const click = step(clock, 4, 'Casey clicks Approve', 0.64);
  const firstApproved = step(clock, 4, 'saves her decision', 0.3) > 0.5;
  const compare = step(clock, 5, 'Watch those three places', 0.65);
  const fresh = step(clock, 6, 'Casey opens a fresh request', 0.65) > 0.5;
  const freshApproved = step(clock, 6, 'She approves it', 0.4) > 0.5;
  const apply = step(clock, 7, 'Watch the top shelf', 1.05);
  const live = apply >= 0.5 ? freshWrite.row : drift >= 0.5 ? staleWrite.row : shadow;
  return { request, drift, click, firstApproved, compare, fresh, freshApproved, apply, live };
}

function shelves(c, state) {
  const count = groupsFor(state.live);
  for (let i = 0; i < totalGroups; i++) {
    const x = rackLeft + pitch * ((i % columns) + 0.5);
    const y = shelfY(Math.floor(i / columns));
    const part =
      i < groupsFor(otherRelease.row)
        ? state.drift
        : i < groupsFor(freshWrite.row)
          ? state.apply
          : 0;
    // A brief turn edge-on swaps the product and the routing state at the same instant.
    const scaleX = Math.max(0.014, Math.abs(Math.cos(Math.PI * part)));
    const lift = 12 * Math.sin(Math.PI * part);
    shadowUnder(c, x, y - 1, 80, 6, 0.28);
    c.save();
    c.translate(x, y - lift);
    c.scale(scaleX, 1);
    drawBoot(c, i < count, 0, 0, 171);
    c.restore();
  }
}

function liveReadout(c, state) {
  const row = state.live;
  const red = groupsFor(row);
  type(c, 'Live rev ' + row.revision, 869, 864, 44, { color: slate, weight: 600 });
  type(c, row.trafficPercent + '%', 865, 963, 88, { family: 'Serif' });
  type(c, red + ' of ' + totalGroups + ' groups', 1134, 942, 45, { color: slate });
}

function topShelf(c, state) {
  const row = state.live;
  const request = state.fresh ? FRESH_PROPOSAL : PROPOSAL;
  const approved = state.fresh ? state.freshApproved : state.firstApproved;
  const applied = state.apply >= 0.5;
  const compared = state.compare > 0.5 && !state.fresh;
  const matches = request.revision === row.revision;
  panel(
    c,
    0,
    0,
    1920,
    1080,
    gradient(c, 0, 0, 1920, 900, [
      [0, '#dce4ea'],
      [0.62, '#eff1ed'],
      [1, '#c3d0d8'],
    ]),
  );
  type(c, 'TRAIL BOOTS', 95, 90, 34, { color: slate, weight: 600 });
  type(c, 'Live search', 88, 200, 99, { family: 'Serif' });
  type(c, 'First five traffic groups', 1810, 180, 49, { align: 'right', color: slate });

  polygon(
    c,
    [
      [65, 474],
      [1852, 474],
      [1883, 504],
      [32, 504],
    ],
    '#e4e6e3',
  );
  panel(
    c,
    32,
    504,
    1851,
    26,
    gradient(c, 0, 504, 0, 530, [
      [0, '#adbac4'],
      [1, '#8d9da9'],
    ]),
  );
  for (let i = 0; i < columns; i++) {
    const x = 249 + 353 * i;
    const part = i < groupsFor(otherRelease.row) ? state.drift : state.apply;
    const turn = Math.sin(Math.PI * part);
    shadowUnder(c, x, 493, 139, 12, 0.3);
    c.save();
    c.translate(x, 496 - 14 * turn);
    c.scale(Math.max(0.014, Math.abs(Math.cos(Math.PI * part))), 1);
    drawBoot(c, i < groupsFor(row), 0, 0, 315);
    c.restore();
    if (i >= groupsFor(otherRelease.row) && !state.fresh) {
      panel(c, x - 96, 506, 192, 12, 'rgba(147,66,48,' + (1 - state.compare) + ')');
    }
  }
  panel(
    c,
    0,
    557,
    957,
    523,
    gradient(c, 0, 557, 900, 1080, [
      [0, '#f7dec1'],
      [1, '#e5b89b'],
    ]),
  );
  panel(
    c,
    957,
    557,
    963,
    523,
    gradient(c, 957, 557, 1870, 1080, [
      [0, '#d8e1e6'],
      [1, '#c7d1d8'],
    ]),
  );
  const decision = approved ? 'Casey approved' : 'In review';
  type(c, decision, 95, 654, 46, { color: sienna, weight: 600 });
  type(c, 'Requires rev ' + request.revision, 87, 799, 97, { family: 'Serif' });
  type(c, request.fromTraffic + '% → ' + request.trafficPercent + '%', 95, 924, 72, {
    color: sienna,
  });
  type(
    c,
    compared ? 'Write stopped' : applied ? 'Change applied' : 'Current deployment',
    1054,
    654,
    46,
    { weight: 600, color: compared ? '#913f31' : slate },
  );
  type(c, 'Live rev ' + row.revision, 1046, 799, 97, { family: 'Serif' });
  type(c, row.trafficPercent + '% live', 1054, 924, 72, { color: slate });
  if (compared || (state.fresh && !applied)) {
    c.beginPath();
    c.arc(957, 763, 62, 0, Math.PI * 2);
    c.fillStyle = matches ? '#334b59' : '#834434';
    c.fill();
    type(c, matches ? '=' : '≠', 957, 785, 77, {
      align: 'center',
      color: '#fff2df',
      family: 'Serif',
    });
  }
}

function draw(c, clock) {
  const state = stateAt(clock);
  if (
    clock.index === 5 ||
    clock.index === 6 ||
    (clock.index === 7 && clock.reveal('Five groups now', 0.05) === 0)
  ) {
    topShelf(c, state);
    return;
  }
  const swap = clock.index === 0 ? smooth(clamp(clock.elapsed / 1.8)) : 1;
  const wall = step(clock, 1, 'What would a shopper see', 1.2);
  previewSet(c);
  swapRanks(c, swap);
  review(c, clock, state);
  if (wall === 0) return;
  c.save();
  c.translate((1920 - wallLeft) * (1 - wall), 0);
  shopWall(c);
  shelves(c, state);
  const planned = clock.index === 2 ? step(clock, 2, 'five of those groups', 0.8) : 0;
  placeMarks(c, groupsFor(freshWrite.row), planned);
  if (clock.index === 4) {
    const ask = step(clock, 4, 'three more boots', 0.6);
    c.save();
    c.beginPath();
    c.rect(rackLeft + groupsFor(otherRelease.row) * pitch, 320, 800, 60);
    c.clip();
    placeMarks(c, groupsFor(freshWrite.row), ask * (1 - state.compare));
    c.restore();
  }
  liveReadout(c, state);
  c.restore();
}

export default { title: 'Human approval for a live search change', beats, draw, check };
