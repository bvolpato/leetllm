import assert from 'node:assert/strict';
import {
  responseTypePairing,
  causalTicketLedger,
  freshAuditFixture,
  auditSelectionState,
} from '../../../films/causality/model.mjs';
import {
  C,
  cue,
  dot,
  labelValue,
  line,
  num,
  pct,
  rect,
  rule,
  sign,
  slug,
  stamp,
  stock,
  text,
  title,
} from './workshop.mjs';
import { dial } from './instrument-art.mjs';

const outage = causalTicketLedger().find((ticket) => ticket.id === 'A-high-1');

function pairing(shift) {
  const counts = { always: 0, helped: 0, harmed: 0, never: 0 };
  for (let i = 0; i < 100; i++) {
    const a = (i - shift + 100) % 100 < 78,
      h = i < 68;
    counts[h ? (a ? 'always' : 'harmed') : a ? 'helped' : 'never']++;
  }
  return {
    counts,
    assistantSuccess: counts.always + counts.helped,
    controlSuccess: counts.always + counts.harmed,
  };
}
export function pairings(ctx, k) {
  const bound = k.beat.chapterId === 'c12';
  if (!bound && !cue(k, 2, 'population of a hundred tickets')) {
    title(ctx, 'Two possible outcomes for one ticket');
    stock(ctx, 121, 143, 718, 246);
    stamp(ctx, 'TICKET 01  /  RESOLUTION WITHIN 24 HOURS', 154, 181, C.blueInk);
    const assigned = cue(k, 1, 'Send the ticket to the assistant');
    for (const [i, name] of ['Assistant', 'Human control'].entries()) {
      const x = 156 + i * 352;
      text(ctx, name, x, 238, 26, C.ink, 'left', 'Serif');
      rect(ctx, x, 259, 293, 80, assigned && i === 0 ? C.green : C.cream, 4);
      text(
        ctx,
        assigned
          ? i
            ? cue(k, 2, 'That outcome is missing')
              ? 'Unobserved'
              : '?'
            : 'Resolved'
          : 'Potential outcome',
        x + 146,
        307,
        23,
        C.ink,
        'center',
      );
    }
    return;
  }
  const turn = bound
    ? cue(k, 3, 'Turn to the last dark slot', 1.2)
    : cue(k, 3, 'Turn the blue ring', 1.2);
  const returnTurn = bound ? cue(k, 5, 'no-harm assumption', 1.2) : 0;
  const shift = Math.round(turn * (bound ? 22 : 10) * (1 - returnTurn));
  const state = pairing(shift);
  const showOutage = bound && cue(k, 5, 'Take the outage from our log');
  ctx.save();
  ctx.translate(269, 266);
  ctx.scale(0.526, 0.526);
  dial(ctx, {
    shift,
    counts: state.counts,
    closeup: 0,
    lightBlue: 1,
    lightGold: 1,
    revealRest: 1,
    centerCount: showOutage ? 0 : 1,
    traceGold: 0,
    arc: 1,
    help: 1,
  });
  ctx.restore();
  if (showOutage) {
    stock(ctx, 143, 194, 252, 150);
    stamp(ctx, 'SERVICE LOG  /  ' + outage.id.toUpperCase(), 157, 224, C.blueInk);
    text(ctx, 'Outage ticket', 157, 258, 25, C.ink, 'left', 'Serif');
    labelValue(ctx, 157, 294, 'Assistant', outage.resolved ? 'Resolved' : 'Open', 222);
    labelValue(ctx, 157, 327, 'Human', '?', 222);
  }
  stock(ctx, 537, 42, 385, 448);
  stamp(ctx, 'HYPOTHETICAL POPULATION  /  100', 559, 81, C.brassInk);
  text(ctx, 'Would resolve in a day', 559, 131, 28, C.ink, 'left', 'Serif');
  labelValue(ctx, 559, 176, 'Blue  ·  assistant', state.assistantSuccess, 338, C.blueInk);
  labelValue(ctx, 559, 215, 'Gold  ·  human', state.controlSuccess, 338, C.brassInk);
  rule(ctx, 558, 239, 338, '#aaa088');
  const rows = bound
    ? [
        ['Both resolve', state.counts.always],
        ['Helped', state.counts.helped],
        ['Harmed', state.counts.harmed],
        ['Neither resolves', state.counts.never],
      ]
    : [
        ['Helped', state.counts.helped],
        ['Harmed', state.counts.harmed],
        ['Net gain', sign(state.counts.helped - state.counts.harmed)],
      ];
  rows.forEach(([label, n], i) => labelValue(ctx, 559, 279 + i * 41, label, n, 336));
  if (bound && cue(k, 4, 'smaller of those two rates'))
    text(
      ctx,
      returnTurn === 1 ? 'With the no-harm assumption' :
        returnTurn > 0 ? 'Turning to zero harm' : 'Harm ≤ min(68, 22)',
      559,
      464,
      20,
      C.brassInk,
      'left',
      'Serif',
    );
}
function batchState(count, drop) {
  const large = count === 20;
  const rows = large
    ? freshAuditFixture(0).arms.map((row) => row.full)
    : auditSelectionState(0).rows.map((r) => r.tickets);
  const arms = rows.map((tickets, i) => {
    const admitted = tickets.filter((t) => !(drop === i && t.resolved));
    const success = admitted.filter((t) => t.resolved).length;
    return { tickets, admitted, success, rate: success / admitted.length };
  });
  return { arms, difference: arms[0].rate - arms[1].rate };
}
function auditPlate(ctx, x, y, w, batch, heading, copy = false) {
  stock(ctx, x, y, w, 326, copy ? '#e0e3d5' : C.ivory);
  stamp(ctx, heading, x + 18, y + 32, copy ? C.blueInk : C.brassInk);
  for (const [i, arm] of batch.arms.entries()) {
    const yy = y + 74 + i * 115;
    text(ctx, i ? 'Human control' : 'Assistant', x + 18, yy, 19, C.ink, 'left', 'Serif');
    text(
      ctx,
      arm.success + '/' + arm.admitted.length + ' = ' + pct(arm.rate),
      x + w - 16,
      yy,
      18,
      C.ink,
      'right',
      'Mono',
    );
    const big = arm.tickets.length === 20,
      cols = big ? 10 : 4,
      step = (w - 35) / cols;
    const ids = new Set(arm.admitted.map((t) => t.id));
    arm.tickets.forEach((t, j) => {
      const xx = x + 18 + (j % cols) * step,
        top = yy + 12 + Math.floor(j / cols) * 30;
      if (ids.has(t.id)) slug(ctx, xx, top, step - 3, 26, t.resolved ? '#9ecdab' : '#dda28e', t.id);
      else {
        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = '#86948b';
        ctx.strokeRect(xx + 1, top + 1, step - 5, 23);
        ctx.restore();
      }
    });
  }
  rule(ctx, x + 16, y + 271, w - 32, '#9da790');
  labelValue(
    ctx,
    x + 18,
    y + 304,
    'Assistant − control',
    sign(100 * batch.difference) + ' pp',
    w - 37,
  );
}
export function audit(ctx, k) {
  const fresh = k.beat.chapterId === 'c28';
  let drop = -1,
    heading = 'Audit copy';
  if (fresh) {
    if (cue(k, 3, 'The eight control successes') && !cue(k, 4, 'Put the missing tickets back'))
      drop = 1;
    if (cue(k, 5, 'Run that filter') && !cue(k, 7, 'Recover assistant tickets')) drop = 0;
    if (drop >= 0)
      heading =
        drop === 1 ? 'COPY  /  ALL ASSISTANT + FAILURES' : 'COPY  /  ALL CONTROL + FAILURES';
    else if (cue(k, 7, 'Recover assistant tickets')) heading = 'COPY  /  RECONCILED';
  } else if (cue(k, 1, 'Audit every assistant')) {
    drop = 1;
    heading = 'COPY  /  ALL ASSISTANT + FAILURES';
  }
  const size = fresh ? 20 : 4;
  title(
    ctx,
    fresh ? 'Should this audit trigger a rollback?' : 'Select an audit from equal-rate workflows',
  );
  auditPlate(ctx, 32, 101, 432, batchState(size, -1), 'FULL LOG  /  24-HOUR OUTCOMES');
  auditPlate(ctx, 496, 101, 432, batchState(size, drop), heading, true);
  let prompt = fresh
    ? 'Toy batch assumption: routing changes no ticket outcome.'
    : 'Each workflow closes two of its four tickets.';
  if (fresh) {
    if (k.beat.beatIndex === 1)
      prompt = 'Keep every assistant ticket and every failure. Which IDs will vanish?';
    if (k.beat.beatIndex === 2) prompt = 'C1 through C8 are absent from the audit.';
    if (k.beat.beatIndex === 3)
      prompt = 'Keep every control ticket and every failure. Predict the new gap.';
    if (k.beat.beatIndex === 4) prompt = 'All eight control successes remain in both logs.';
    if (k.beat.beatIndex === 5)
      prompt = 'Which missing IDs would you request before changing the route?';
    if (k.beat.beatIndex === 6) prompt = 'A1 through A8 return with their original outcomes.';
    if (k.beat.beatIndex >= 7) prompt = 'Reconcile the full log before making a routing decision.';
  } else if (k.beat.beatIndex > 0) prompt = 'Routing → Audited ← Outcome';
  text(ctx, prompt, 480, 480, 21, C.cream, 'center', 'Serif');
}
export function checkPairingAudit() {
  assert.equal(outage.arm, 'assistant');
  assert.equal(outage.resolved, true);
  for (let shift = 0; shift <= 22; shift++) {
    const state = pairing(shift);
    assert.deepEqual(state.counts, responseTypePairing(shift).counts);
    assert.deepEqual([state.assistantSuccess, state.controlSuccess], [78, 68]);
  }
  for (const n of [4, 20])
    for (const drop of [-1, 0, 1]) {
      const { arms, difference } = batchState(n, drop),
        good = n === 4 ? 2 : 8;
      assert.equal(difference, drop === -1 ? 0 : ((drop ? 1 : -1) * good) / n);
      arms.forEach((a, i) => {
        assert.equal(a.admitted.length, i === drop ? n - good : n);
        assert.equal(a.success, i === drop ? 0 : good);
        assert.deepEqual(
          a.admitted.map((t) => t.id),
          a.tickets.filter((t) => i !== drop || !t.resolved).map((t) => t.id),
        );
      });
    }
}
