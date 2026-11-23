import { CANDIDATE, STABLE, freshDecision, recoveryReady, registry, route } from '../model.mjs';
import { canaryConversation } from '../fixtures.mjs';
import { capacityRuler, countStrip } from '../receipts.mjs';

const attempt = 'R73';
const inventory = { requests: 1200, reviewed: 900, unsafe: 0, latencyComplete: true };
const oldReview = { release: CANDIDATE, attempt: 'R72', request: 901, unsafe: true };
const currentReview = { release: CANDIDATE, attempt, request: 901, unsafe: true };
const saved = { version: 2, shipId: 'SHIP-4412' };
// This drill has an approved one-field migration and a separate post-migration serving observation.
const migrated = { version: 1, ship: saved.shipId };
const returnTrace = { thread: canaryConversation, observedRelease: STABLE, ship: 'SHIP-4412' };
const matches = (review) => review.release === CANDIDATE && review.attempt === attempt;

export function finalWindow(reviews) {
  const accepted = reviews.filter(matches);
  const summary = {
    ...inventory,
    reviewed: inventory.reviewed + accepted.length,
    unsafe: inventory.unsafe + accepted.filter((r) => r.unsafe).length,
  };
  return {
    ...summary,
    decision: freshDecision({ ...summary, releaseMatches: true, attemptMatches: true }),
  };
}

export function returnReadiness(capacity, state) {
  return {
    release: STABLE,
    healthy: true,
    demand: 150,
    capacity,
    compatible: state.version === 1 && typeof state.ship === 'string',
  };
}

export function drawFreshRelease(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.cue(id)?.phase === 'after';
  const started = (id) => ['during', 'after'].includes(focus.cue(id)?.phase);
  const pastAbort = state.beat >= 2;
  const unsafe = pastAbort || done('mv-fresh-release-unsafe');
  const otherAttempt = started('older-receipt');
  const aborted = pastAbort || done('mv-fresh-release-abort');
  const held = done('mv-fresh-release-hold');
  const incoming = started('current-slip') && !unsafe;
  const review = unsafe || incoming ? currentReview : otherAttempt ? oldReview : null;
  const window = finalWindow(unsafe ? [oldReview, currentReview] : otherAttempt ? [oldReview] : []);
  const aliases = registry();
  const stopTraffic =
    window.decision === 'ABORT' && (pastAbort || done('mv-fresh-release-abort-now'));
  const assignment = new Map([[canaryConversation, CANDIDATE]]);
  const selectedForThread = stopTraffic
    ? route(canaryConversation, 0, assignment, new Set([CANDIDATE]))
    : assignment.get(canaryConversation);
  if (aborted && window.decision === 'ABORT')
    aliases.move('canary', STABLE, aliases.aliases.get('canary'));
  const selected = (name) => (aliases.aliases.get(name).target === STABLE ? 'STABLE' : 'CANDIDATE');
  const write = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);

  focus.target('attempt-receipt', () => {
    write('R73', 120, 264, 54, C.ink);
    write('Production', 410, 222, 33, C.blue);
    write('Canary', 410, 293, 33, C.cyan);
    const stableY = 210,
      candidateY = 282;
    const move = selected('canary') === 'STABLE' ? 1 : focus.progress('mv-fresh-release-abort', 0);
    const outletY = candidateY + (stableY - candidateY) * move;
    api.line(ctx, 680, stableY, 1240, stableY, C.blue, 4);
    api.line(ctx, 680, candidateY, 1240, outletY, C.cyan, 5);
    api.circle(ctx, 1240, stableY, 8, C.blue);
    api.circle(ctx, 1240, candidateY, 8, aborted ? C.muted : C.cyan);
    write(selected('production'), 1300, 222, 33, C.blue);
    write('CANDIDATE', 1300, 293, 33, aborted ? C.muted : C.cyan);
    api.line(ctx, 120, 315, 1795, 315, C.muted, 2);
    if (!pastAbort) {
      write('Support reviews', 140, 427, 52);
      countStrip(ctx, api, {
        x: 150,
        y: 545,
        width: 875,
        label: 'Candidate requests',
        reading: window.reviewed + ' / ' + window.requests,
        value: window.reviewed,
        maximum: window.requests,
        color: C.cyan,
      });
      const pending = window.requests - window.reviewed;
      write(pending + ' still pending', 150, 693, 37, C.yellow);
      if (done('mv-fresh-release-fraction') && !unsafe)
        write(
          (100 * window.reviewed) / window.requests + '% reviewed',
          1025,
          693,
          33,
          C.cyan,
          'right',
        );
      write('Latency and transport within limits', 150, 805, 32, C.muted);
      api.line(ctx, 1105, 385, 1105, 840, C.muted, 2);
      if (review) {
        write('Review slip   ' + review.attempt + ' / ' + review.request, 1160, 451, 36, C.ink);
        if (incoming) {
          write('Reading the support review…', 1160, 552, 33, C.muted);
        } else {
          write('Candidate served an approval', 1160, 552, 33);
          write('Approval record absent', 1160, 620, 33, C.pink);
          write(
            matches(review) ? 'Counted in R73' : 'Filed with R72',
            1160,
            718,
            35,
            matches(review) ? C.pink : C.yellow,
          );
        }
        write('R73 confirmed failures   ' + window.unsafe, 1160, 803, 33, C.ink);
      } else {
        write('Confirmed unsupported serves', 1160, 486, 32, C.muted);
        write(String(window.unsafe), 1160, 623, 88);
      }
      const message = aborted
        ? 'Canary abort · failed assignments blocked'
        : done('mv-fresh-release-abort-now')
          ? 'ABORT traffic · recovery in progress'
          : unsafe
            ? 'What happens to candidate traffic now?'
            : held && window.decision === 'HOLD'
              ? 'HOLD exposure · repair coverage'
              : 'Widen, hold here, or stop the canary?';
      write(message, 960, 947, 45, aborted || unsafe ? C.pink : C.yellow, 'center');
      return;
    }

    const second =
      started('return-headroom') || started('mv-fresh-release-capacity') || state.beat > 3;
    const inspectState =
      started('inspect-thread') || started('mv-fresh-release-capacity') || state.beat > 3;
    const repaired = done('migrate-thread');
    const thread = repaired ? migrated : saved;
    const receipt = returnReadiness(second ? 160 : 134, thread);
    const ready = recoveryReady(receipt);
    write('Returning load on stable', 150, 411, 45);
    capacityRuler(
      ctx,
      api,
      receipt,
      180,
      496,
      134,
      second && !inspectState ? focus.progress('return-headroom', 1) : 1,
    );
    if (inspectState) {
      write(canaryConversation + '   ·   saved state', 150, 740, 30, C.muted);
      write('Stable worker accepts', 1165, 740, 30, C.muted);
      write(
        repaired ? 'v1   ship = ' + thread.ship : 'v2   shipId = ' + thread.shipId,
        150,
        812,
        35,
        repaired ? C.green : C.yellow,
      );
      write('v1   ship', 1165, 812, 37, C.blue);
      api.line(ctx, 735, 799, 1100, 799, C.muted, 3);
      const p = focus.progress(repaired ? 'verify-return' : 'migrate-thread', 0);
      api.circle(
        ctx,
        repaired ? 930 + 140 * p : 770 + 160 * p,
        799,
        13,
        repaired ? C.green : C.yellow,
      );
      if (!repaired) api.line(ctx, 950, 775, 950, 823, C.pink, 6);
    }
    let message = 'How many requests per second are we short?';
    if (inspectState) {
      message = done('mv-fresh-release-capacity')
        ? 'state incompatible · capacity alone cannot recover'
        : 'Can this conversation resume on stable?';
      if (repaired) message = 'Migration checked · verify the resumed request';
      if (
        ready &&
        done('verify-return') &&
        returnTrace.observedRelease === selectedForThread &&
        returnTrace.ship === thread.ship
      )
        message =
          returnTrace.thread +
          ' served by STABLE ' +
          returnTrace.observedRelease.slice(0, 12) +
          '   ·   ' +
          thread.ship;
    } else if (second) {
      message = 'Check the returning conversation';
    } else if (done('mv-fresh-release-gap')) {
      message =
        receipt.demand +
        ' − ' +
        receipt.capacity +
        ' = ' +
        (receipt.demand - receipt.capacity) +
        ' requests/s short';
    }
    write(message, 960, 961, 39, repaired ? C.green : C.yellow, 'center');
  });
}
export default {
  id: 'fresh-release',
  draw: drawFreshRelease,
  cues: [
    'mv-fresh-release-premise',
    'mv-fresh-release-hold',
    'mv-fresh-release-fraction',
    'older-receipt',
    'current-slip',
    'mv-fresh-release-unsafe',
    'mv-fresh-release-abort-now',
    'mv-fresh-release-abort',
    'mv-fresh-release-gap',
    'return-headroom',
    'inspect-thread',
    'mv-fresh-release-capacity',
    'migrate-thread',
    'verify-return',
  ],
};
