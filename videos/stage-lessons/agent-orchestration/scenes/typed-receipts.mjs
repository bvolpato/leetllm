// Scene `typed-receipts`: what one worker may write.
//
// The picture: the board, and the receipt of eval enlarged in the band. Its upper row is the
// identity of the request, the same on every card. Its lower row is what eval owns. A write from
// this receipt to the approval and to the traffic of the request is drawn in red and cut. Then a
// wrong value keeps its type and fails its check. The last beat puts the channels of the shared
// state in the band: a list, a scalar, and the three owned slots of the packet.
import {
  arrow,
  beside,
  boxOf,
  column,
  draw,
  indicate,
  lagged,
  par,
  pictogram,
  place,
  rect,
  recolor,
  row,
  seq,
} from 'vizmatic/stage';
import { RECEIPTS } from '../packet.mjs';
import { REQUEST, values } from '../../../films/agent-orchestration/fixtures.mjs';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  AGE,
  BAND,
  BRANCH_COLOR,
  MARK,
  OTHER_TENANT,
  QUIET,
  SMALL,
  TENANT,
  WRONG,
  board,
  channels,
  replaceReceipt,
} from '../parts.mjs';

const EVAL = 0;
/** The fields of one receipt, as the model holds them. The age is the time of the join less the time of the read. */
const IDENTITY = [
  { name: 'request', type: 'str', value: REQUEST.request },
  { name: 'tenant', type: 'str', value: REQUEST.tenant },
  { name: 'release', type: 'str', value: REQUEST.release },
  { name: 'revision', type: 'int', value: `${REQUEST.version}` },
];
const OWNED = [
  { name: 'age', type: 'int', value: `${AGE.fresh} s` },
  { name: 'value', type: 'dict', value: `${values.eval.failures} / ${values.eval.cases}` },
  { name: 'digest', type: 'str', value: `#${RECEIPTS[EVAL].digest.slice(0, 4)}` },
];

export default function typedReceipts(s, c) {
  const b = board(s);
  const { ask, fan, slotNames, approval } = b.nodes;
  const color = BRANCH_COLOR[EVAL];

  // The receipt of eval, enlarged: a name and a value for each field. A type comes after each name.
  const cell = (field, tint) => ({
    name: note(field.name, { color: tint }),
    type: mono(field.type, { size: SMALL, color: QUIET }),
    value: mono(field.value, { size: 36 }),
  });
  const identity = IDENTITY.map((field) => cell(field, QUIET)),
    owned = OWNED.map((field) => cell(field, color));
  const fieldBlock = (field) =>
    column([row([field.name, field.type], { gap: 'tight' }), field.value], { gap: 'tight' });
  const title = row([label('one receipt'), chip('eval', { color, stroke: color })]);
  // The sheet leaves room at both sides: a write that the contract does not have is drawn there.
  const sheet = BAND.inset(60, 'none').rows([5, 1], 'none')[0];
  const sheetFrame = rect(sheet.width, sheet.height, {
    radius: 14,
    stroke: color,
    width: 3,
    fill: 'surface',
  }).at(sheet.cx, sheet.cy);
  place(
    column(
      [
        title,
        row(identity.map(fieldBlock), { gap: 'normal' }),
        row(owned.map(fieldBlock), { gap: 'wide' }),
      ],
      {
        gap: 'normal',
      },
    ),
    sheet.inset('normal', 'tight'),
    'left',
  );
  const names = [...identity, ...owned].map((field) => field.name);
  s.add(heading(c.title));
  b.enter(c);

  const [nodeRoom, fieldRoom] = BAND.rows([3, 2], 'normal');
  const [inputRoom, branchRoom] = nodeRoom.columns([1, 3], 'wide');
  const branchFrame = rect(branchRoom.width, branchRoom.height, {
    radius: 16,
    stroke: color,
    width: 3,
    fill: 'surface',
  }).at(branchRoom.cx, branchRoom.cy);
  const [branchHeader, internals] = branchRoom.inset('normal').rows([1, 2], 'tight');
  const [viewRoom, helperRoom] = internals.columns(2, 'wide');
  const stateInput = place(label('graph state', { size: 38 }), inputRoom);
  const branchTitle = place(note('Python branch node  /  eval', { color }), branchHeader, 'left');
  const view = place(chip('read-only copy', { stroke: color }), viewRoom);
  const helper = place(chip('receipt helper'), helperRoom);
  const inputPath = arrow(boxOf(stateInput).point('right'), [branchRoom.left, nodeRoom.cy], {
    stroke: MARK,
    width: 3,
    pad: 16,
  });
  const copyPath = arrow(boxOf(view).point('right'), boxOf(helper).point('left'), {
    stroke: color,
    width: 3,
    pad: 5,
  });
  const projected = place(
    mono('promote-104  tenant-7  reranker-v17  v3  25%', { size: 34 }),
    fieldRoom,
  );
  const internalsOnScreen = [
    stateInput,
    branchFrame,
    branchTitle,
    inputPath,
    view,
    helper,
    copyPath,
    projected,
  ];
  s.add(stateInput);
  c.show('node-state', [branchFrame, branchTitle, draw(inputPath, { duration: 0.5 })]);
  c.show('copied-view', [view, helper, draw(copyPath, { duration: 0.6 })]);
  c.show('trusted-identity', projected);
  c.swap('owned-branch-results', internalsOnScreen, [
    sheetFrame,
    title,
    ...names,
    ...identity.map((f) => f.value),
  ]);
  c.on('trusted-identity', () =>
    s.play(
      ask.pulse({ color: MARK }),
      ...fan.map((edge) => edge.pulse({ color: MARK })),
      b.hot.tenant.to(1, { duration: 0.4 }),
      b.hot.rev.to(1, { duration: 0.4 }),
    ),
  );
  c.show(
    'owned-branch-results',
    owned.map((field) => field.value),
  );
  c.on('owned-branch-results', () =>
    s.play(
      b.hot.tenant.to(0, { duration: 0.3 }),
      b.hot.rev.to(0, { duration: 0.3 }),
      ...b.card.map((card) => card.shown.to(1, { duration: 0.3 })),
      ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
      ...b.card.map((card) => card.pos.to(2, { duration: 1.4 })),
      lagged(
        slotNames.map((slot, i) => indicate(slot, { color: BRANCH_COLOR[i], scale: 1.15 })),
        { lag: 0.5 },
      ),
    ),
  );
  c.on('eval-evidence', () => s.play(indicate([owned[1].name, owned[1].value], { color: MARK })));
  // The two writes that the contract of eval does not have: to the approval, and to the traffic of the request.
  const forbidden = (from, to) => ({
    path: arrow(from, to, { stroke: WRONG, width: 4, dash: [12, 9], pad: 6 }),
    stop: pictogram('cross', { size: 56, accent: WRONG }).at((from[0] + to[0]) / 2, from[1]),
  });
  const approvalBox = boxOf(approval.frame);
  const toApproval = forbidden([sheet.right, approvalBox.cy], [approvalBox.left, approvalBox.cy]);
  const [trafficX, trafficY] = b.ticketPoint(4);
  const toTraffic = forbidden([sheet.left, trafficY], [trafficX, trafficY]);
  c.show('cannot-approval', draw(toApproval.path, { duration: 0.8 }));
  c.show('cannot-approval', toApproval.stop, { after: true });
  c.show('cannot-traffic', draw(toTraffic.path, { duration: 0.8 }));
  c.on('cannot-traffic', () => s.play(b.hot.traffic.to(1, { duration: 0.3 })));
  c.show('cannot-traffic', toTraffic.stop, { after: true });

  // Beat 1. A type says the shape. A check says the value: a wrong tenant is still a string.
  const types = [...identity, ...owned].map((field) => field.type);
  c.hide('types', [toApproval.path, toApproval.stop, toTraffic.path, toTraffic.stop]);
  c.on('types', () => s.play(b.hot.traffic.to(0, { duration: 0.3 })));
  c.show('types', types, { stagger: 0.15 });
  const tenant = identity[1];
  const otherTenant = place(mono('tenant9', { size: 36 }), boxOf(tenant.value), 'left');
  c.swap('field-ownership', tenant.value, otherTenant);
  c.on('field-ownership', () =>
    s.play(
      indicate(tenant.type, { color: MARK }),
      replaceReceipt(b.card[EVAL], { tenant: OTHER_TENANT }),
    ),
  );
  c.after('field-ownership', () => {
    b.card[EVAL].read.set(1);
    b.card[EVAL].verdict.set(-1);
    s.play(indicate(otherTenant, { color: WRONG, scale: 1 }));
  });
  const sourceCheck = place(
    note('Article merge  /  source scope matches request', { color: MARK }),
    BAND,
    'bottom left',
  );
  c.show('source-identity', sourceCheck);
  c.hide('text-claim', sourceCheck);
  c.swap('source-identity', otherTenant, tenant.value);
  c.on('source-identity', () =>
    s.play(
      replaceReceipt(b.card[EVAL], { tenant: TENANT }),
      b.hot.age.to(1, { duration: 0.3 }),
      indicate([owned[2].name, owned[2].value, owned[0].name, owned[0].value], { color: MARK }),
    ),
  );
  // A text claim in the place of the result: the digest of the source does not fit it.
  const resultBox = boxOf(owned[1].value);
  const claim = mono('"passed"', { size: 36, anchor: 'left' }).at(resultBox.left, resultBox.cy);
  c.swap('text-claim', owned[1].value, claim);
  c.on('text-claim', () => s.play(b.hot.age.to(0, { duration: 0.3 })));
  const mismatch = beside(
    pictogram('cross', { size: 48, accent: WRONG }),
    owned[2].value,
    'right',
    'tight',
  );
  c.show('stand-in', mismatch, { after: true });
  c.after('stand-in', () =>
    s.play(indicate(owned[2].value, { color: WRONG }), recolor(claim, WRONG)),
  );
  // Supplied scope is checked separately from the registry's branch values.
  const sheetParts = [
    sheetFrame,
    title,
    names,
    types,
    identity.map((field) => field.value),
    owned[0].value,
    owned[2].value,
    claim,
    mismatch,
  ];
  const [scopeRoom, registryRoom] = BAND.columns([2, 3], 'wide');
  const scope = place(
    column(
      [
        label('Supplied scope', { size: 36 }),
        mono(REQUEST.tenant, { size: 36 }),
        mono(REQUEST.release + '  v' + REQUEST.version, { size: 36 }),
        note(AGE.fresh + ' s / host clock'),
        note('request + clock', { color: MARK }),
      ],
      { gap: 'normal' },
    ),
    scopeRoom,
    'left',
  );
  const [registryTop, registryBottom] = registryRoom.rows([3, 2], 'normal');
  const registryTitle = label('Local registry', { size: 36 });
  const registryValue = mono('eval: ' + values.eval.failures + ' / ' + values.eval.cases, {
    size: 36,
    color,
  });
  const registryDigest = mono('#' + RECEIPTS[EVAL].digest.slice(0, 4), { size: 36, color });
  const registryFields = place(
    column(
      [
        registryTitle,
        row([registryValue, registryDigest], { gap: 'loose' }),
        note('branch values → digest'),
      ],
      { gap: 'normal' },
    ),
    registryTop,
    'left',
  );
  const hashRoute = arrow(
    boxOf(registryValue).point('right'),
    boxOf(registryDigest).point('left'),
    { stroke: color, width: 3, pad: 10 },
  );
  const noScope = place(
    column(
      [
        mono('tenant: absent', { size: 30, color: WRONG }),
        mono('revision: absent', { size: 30, color: WRONG }),
      ],
      { gap: 'normal' },
    ),
    registryBottom,
    'left',
  );
  const trustScope = place(
    note('Production: authenticate scoped sources', { color: MARK }),
    BAND,
    'bottom left',
  );
  c.swap('film-scope', sheetParts, scope);
  c.show('registry-values', registryFields);
  c.on('registry-values', () =>
    s.play(
      seq(
        indicate(registryValue, { color: MARK, scale: 1 }),
        draw(hashRoute, { duration: 0.7 }),
        indicate(registryDigest, { color: MARK, scale: 1 }),
      ),
    ),
  );
  c.show('fixture-trust', noScope, { after: true });
  c.show('authenticate-source', trustScope);

  // Beat 2. How updates combine: a list keeps what arrives, a scalar takes one write, a slot has one owner.
  const state = channels(s, BAND, { entries: [2, 0, 1, 1] });
  const ownedSlots = place(
    column(
      [
        label('One receipt per required branch'),
        row(
          RECEIPTS.map(({ branch }, i) =>
            chip(branch, { color: BRANCH_COLOR[i], stroke: BRANCH_COLOR[i] }),
          ),
          { gap: 'normal' },
        ),
      ],
      { gap: 'normal' },
    ),
    BAND,
    'left',
  );
  c.swap(2, [scope, registryFields, hashRoute, noScope, trustScope], state.frame);
  s.add(...state.live);
  const arrive = (entry) =>
    par(entry.shown.to(1, { duration: 0.2 }), entry.drop.to(1, { duration: 0.5 }));
  c.on('branch-ownership', () => s.play(lagged(state.list.slice(0, 3).map(arrive), { lag: 0.6 })));
  c.on('list-duplicates', () => s.play(indicate(state.frame[2], { color: MARK, scale: 1 })));
  c.after('list-duplicates', () =>
    s.play(seq(arrive(state.list[3]), state.list[3].wrong.to(1, { duration: 0.2 }))),
  );
  // Permute reducer inputs. Their order need not match network completion.
  c.on('reducer-order', () =>
    s.play(
      seq(
        par(...state.list.slice(0, 2).map((entry) => entry.shown.to(0, { duration: 0.25 }))),
        par(
          state.list[0].slot.to(1, { duration: 0.05 }),
          state.list[1].slot.to(0, { duration: 0.05 }),
          ...state.list.slice(0, 2).map((entry) => entry.drop.to(0, { duration: 0.05 })),
        ),
        arrive(state.list[1]),
        arrive(state.list[0]),
      ),
    ),
  );
  c.on('scalar-conflict', () => s.play(par(...state.scalar.writes.map(arrive))));
  c.after('scalar-conflict', () => s.play(state.scalar.clash.to(1, { duration: 0.3 })));
  c.swap('choose-rule', [...state.frame, ...state.live], ownedSlots, { after: true });
  c.on('choose-rule', () =>
    s.play(
      lagged(
        slotNames.map((slot, i) => indicate(slot, { color: BRANCH_COLOR[i], scale: 1.15 })),
        { lag: 0.3 },
      ),
    ),
  );
  c.on('unique-owners', () => s.play(...b.card.map((card) => card.read.to(3, { duration: 0.9 }))));
  c.after('unique-owners', () => {
    b.card.forEach((card) => card.verdict.set(1));
    b.packet.seal.set(1);
  });

  b.leave(c);
}
