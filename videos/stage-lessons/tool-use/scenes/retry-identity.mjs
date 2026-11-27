// Scene 15: retry-identity - What happened to Lena's hold?
// 4-Act Idempotency Ledger Fork & Reconciliation Showcase:
//   Act 0 (Beat 0): op-17 commits hold-1, return beam snaps mid-flight -> timeout (UNKNOWN)
//   Act 1 (Beats 1-2): Twin Ledger Fork (Left reuses op-17 vs Right uses fresh op-18).
//                      Strict prediction withholding on hold counts until AFTER hold-replay & hold-duplicate!
//   Act 2 (Beat 3): Key conflict (op-17 + B8) rejected + atomic claim-and-save
//   Act 3 (Beat 4): Non-idempotent library reconciled by submission status read -> hold-1 found
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  gateNode,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function retryIdentity(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = lost reply, 1 = twin fork, 2 = conflict, 3 = status read
  const fileOn = s.value(0);
  const lostOn = s.value(0);
  const timeoutOn = s.value(0);
  const sameKeyOn = s.value(0);
  const newKeyOn = s.value(0);
  const askForkOn = s.value(0);
  const matchOn = s.value(0);
  const replayReveal = s.value(0);
  const missOn = s.value(0);
  const dupReveal = s.value(0);
  const conflictInOn = s.value(0);
  const conflictResOn = s.value(0);
  const atomicOn = s.value(0);
  const statusReadOn = s.value(0);
  const statusFoundOn = s.value(0);

  const header = cinemaHeader('IDEMPOTENT RETRY LEDGER', 'What happened to', 'Lena’s hold?', {
    accent: ROLE.key,
    size: 48,
  });

  const stageAura = aura(100, 40, 620, '#ffd1661c', '#5ce1e61a');

  // Act 0: Lost Reply & Timeout Ambiguity
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = 0;
      const fl = fileOn.value;
      const ls = lostOn.value;
      const to = timeoutOn.value;
      const nodes = [];

      const lPt = [-540, -10];
      const rPt = [540, -10];

      nodes.push(
        gateNode(lPt[0], lPt[1], 'LENA', to > 0.35 ? ROLE.caution : ROLE.proposal, {
          radius: 64,
          sub: to > 0.35 ? 'TIMED OUT · ?' : 'op-17 (B7)',
          opacity: a,
        }),
        gateNode(rPt[0], rPt[1], 'LIBRARY', fl > 0.35 ? ROLE.ok : ROLE.server, {
          radius: 64,
          sub: fl > 0.35 ? 'hold-1 saved (op-17)' : 'catalog',
          opacity: a,
          glow: 12,
        }),
        // Outbound request arc (succeeded)
        beamWithPhotons(
          quadArcPts([lPt[0] + 66, lPt[1] - 32], [rPt[0] - 66, rPt[1] - 32], -80),
          ROLE.ok,
          p * 1.1,
          {
            alpha: a,
            width: 3.6,
          },
        ),
        txt('POST hold(book_id="B7", key="op-17")', 0, -148, 28, ROLE.ok, 'mono', 'center').opacity(
          a,
        ),
      );

      // Broken return arc when reply drops!
      const dropOp = 0.3 + ls * 0.7;
      nodes.push(
        beamWithPhotons(
          quadArcPts([rPt[0] - 54, rPt[1] + 6], [66, 105], -16),
          ROLE.caution,
          p * 1.3,
          {
            alpha: a * dropOp,
            width: 3.4,
          },
        ),
        circuitBreaker(0, 105, 110, ls > 0.35 ? 1 : 0, ROLE.ok, { opacity: a * dropOp }),
        txt(
          ls > 0.35 ? 'CONNECTION DROPPED · RECEIPT LOST' : 'RECEIPT RETURNING...',
          0,
          178,
          28,
          ls > 0.35 ? ROLE.denied : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(ls > 0.35 ? 7 : 0, ROLE.denied)
          .opacity(a * dropOp),
        txt(
          to > 0.35
            ? 'Can Lena’s app tell whether the library saved hold-1?   ?'
            : 'Library already committed hold-1 under op-17',
          0,
          315,
          34,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: Twin Ledger Fork (op-17 reuse vs fresh op-18) with strict prediction withholding!
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = 0;
      const sk = sameKeyOn.value;
      const nk = newKeyOn.value;
      const aq = askForkOn.value;
      const mt = matchOn.value;
      const rp = replayReveal.value;
      const ms = missOn.value;
      const dp = dupReveal.value;
      const nodes = [];

      // Center vertical divider
      nodes.push(line([0, -205], [0, 340], { stroke: '#25355a', width: 2 }).opacity(a));

      // LEFT FORK: Reuse op-17
      const lx = -840;
      nodes.push(
        energyRail(lx, -195, 290, rp > 0.5 ? ROLE.ok : ROLE.proposal, { opacity: a }),
        txt('LEFT: REUSE KEY op-17', lx + 30, -175, 28, ROLE.proposal, 'mono', 'left').opacity(a),
        txt(
          'Ledger starts: [op-17 -> B7, hold-1]',
          lx + 30,
          -118,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt('Retry sends:   key=op-17, book=B7', lx + 30, -64, 26, ROLE.key, 'mono', 'left')
          .glow(sk > 0.35 ? 6 : 0, ROLE.key)
          .opacity(a),
        beamWithPhotons(
          [
            [lx + 30, 2],
            [-110, 2],
          ],
          mt > 0.35 ? ROLE.ok : ROLE.proposal,
          p * 1.1,
          { alpha: a, width: 3.4 },
        ),
        txt(
          rp > 0.5
            ? 'REPLAYS hold-1  ->  1 HOLD TOTAL'
            : mt > 0.35
              ? 'op-17 + B7 MATCH -> ?'
              : 'LEDGER HOLDS: ?',
          lx + 30,
          82,
          32,
          rp > 0.5 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        )
          .glow(7, rp > 0.5 ? ROLE.ok : ROLE.focus)
          .opacity(a),
        txt(
          rp > 0.5 ? '2 requests · 1 logical hold (idempotent!)' : 'Same key + same book',
          lx + 30,
          150,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
      );

      // RIGHT FORK: Fresh key op-18
      const rx = 55;
      const rOp = 0.35 + nk * 0.65;
      nodes.push(
        energyRail(rx, -195, 290, dp > 0.5 ? ROLE.denied : ROLE.caution, { opacity: a * rOp }),
        txt('RIGHT: FRESH KEY op-18', rx + 30, -175, 28, ROLE.caution, 'mono', 'left').opacity(
          a * rOp,
        ),
        txt(
          'Ledger starts: [op-17 -> B7, hold-1]',
          rx + 30,
          -118,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a * rOp),
        txt('Retry sends:   key=op-18, book=B7', rx + 30, -64, 26, ROLE.caution, 'mono', 'left')
          .glow(nk > 0.35 ? 6 : 0, ROLE.caution)
          .opacity(a * rOp),
        beamWithPhotons(
          [
            [rx + 30, 2],
            [790, 2],
          ],
          ms > 0.35 ? ROLE.denied : ROLE.caution,
          p * 1.1 + 0.5,
          { alpha: a * rOp, width: 3.4 },
        ),
        txt(
          dp > 0.5
            ? 'CREATES hold-2  ->  2 HOLDS TOTAL'
            : ms > 0.35
              ? 'op-18 NOT FOUND -> ?'
              : 'LEDGER HOLDS: ?',
          rx + 30,
          82,
          32,
          dp > 0.5 ? ROLE.denied : ROLE.focus,
          'mono',
          'left',
        )
          .glow(7, dp > 0.5 ? ROLE.denied : ROLE.focus)
          .opacity(a * rOp),
        txt(
          dp > 0.5 ? '2 requests · DUPLICATE hold placed!' : 'Fresh key hides prior commit',
          rx + 30,
          150,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a * rOp),
      );

      nodes.push(
        txt(
          dp > 0.5
            ? 'Reuse the same key for the same intended write to make retries idempotent'
            : aq > 0.35
              ? 'How many holds will each ledger contain?'
              : 'Both ledgers start at the exact same timeout',
          0,
          375,
          30,
          dp > 0.5 ? ROLE.ok : ROLE.focus,
          'serif',
          'center',
        )
          .glow(6, dp > 0.5 ? ROLE.ok : ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: Key Collision (op-17 + B8) Rejected & Atomic Claim-and-Save
  const act2 = guardedDynamic(
    () =>
      fadeInHalf(Math.max(0, Math.min(1, act.value - 1))) * fadeOutHalf(Math.max(0, act.value - 2)),
    (a) => {
      const p = 0;
      const ci = conflictInOn.value;
      const cr = conflictResOn.value;
      const at = atomicOn.value;
      const nodes = [];

      nodes.push(
        energyRail(-855, -180, 35, ROLE.denied, { opacity: a }),
        txt(
          'COLLISION TEST: SAME KEY, DIFFERENT BOOK',
          -825,
          -160,
          26,
          ROLE.denied,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Incoming: key = "op-17"  ·  book_id = "B8"',
          -825,
          -96,
          30,
          ROLE.caution,
          'mono',
          'left',
        )
          .glow(ci > 0.35 ? 6 : 0, ROLE.caution)
          .opacity(a),
        txt(
          'Saved:    key = "op-17"  ·  book_id = "B7" (hold-1)',
          -825,
          -34,
          28,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [60, -65],
            [270, -65],
          ],
          ROLE.denied,
          p * 1.2,
          { alpha: a, width: 3.6 },
        ),
        circuitBreaker(360, -65, 115, cr > 0.35 ? 1 : 0.4, ROLE.ok, { opacity: a }),
        txt(
          cr > 0.35 ? 'MISMATCH REJECTED' : 'CHECKING PAYLOAD',
          570,
          -85,
          28,
          ROLE.denied,
          'mono',
          'left',
        )
          .glow(cr > 0.35 ? 8 : 0, ROLE.denied)
          .opacity(a),
        txt('hold-1 (B7) UNCHANGED', 570, -30, 26, ROLE.ok, 'mono', 'left').opacity(a),
        line([-855, 130], [840, 130], { stroke: '#25355a', width: 2 }).opacity(a),
        energyRail(-855, 175, 330, at > 0.35 ? ROLE.runtime : '#2b3b64', { opacity: a }),
        txt('ATOMIC CLAIM + SAVE', -825, 195, 28, ROLE.runtime, 'mono', 'left')
          .glow(at > 0.35 ? 6 : 0, ROLE.runtime)
          .opacity(a),
        txt(
          'Let only one concurrent request claim op-17 and save hold-1 as one atomic change',
          -825,
          255,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'Retries reuse that entry only while the service retains the key',
          -825,
          305,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 3: Non-Idempotent Service Reconciled via Status Read
  const act3 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 2)),
    (a) => {
      const p = 0;
      const sr = statusReadOn.value;
      const sf = statusFoundOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'NO IDEMPOTENCY GUARANTEE? RECONCILE BY SUBMISSION STATUS',
          -855,
          -205,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
        gateNode(-620, 20, 'LENA', ROLE.proposal, {
          radius: 58,
          sub: 'receipt missing',
          opacity: a,
        }),
        gateNode(0, 20, 'STATUS', ROLE.runtime, {
          radius: 62,
          sub: 'GET /submissions/17',
          opacity: a,
          glow: sr > 0.35 ? 12 : 6,
        }),
        gateNode(620, 20, 'VERIFIED', sf > 0.35 ? ROLE.ok : COSMOS.dim, {
          radius: 58,
          sub: sf > 0.35 ? 'hold-1 found!' : 'checking...',
          opacity: a,
          glow: sf > 0.35 ? 14 : 3,
        }),
        beamWithPhotons(
          [
            [-550, 20],
            [-74, 20],
          ],
          ROLE.runtime,
          p * 1.1,
          { alpha: a * (0.4 + sr * 0.6), width: 3.6 },
        ),
        beamWithPhotons(
          [
            [74, 20],
            [550, 20],
          ],
          sf > 0.35 ? ROLE.ok : ROLE.runtime,
          p * 1.1 + 0.5,
          { alpha: a * (0.35 + sf * 0.65), width: 3.6 },
        ),
        txt(
          sf > 0.35
            ? 'STATUS READ FINDS hold-1 -> SAFE TO REPORT TO LENA'
            : 'Query submission status instead of sending a blind repeat write',
          0,
          240,
          30,
          sf > 0.35 ? ROLE.ok : ROLE.focus,
          'mono',
          'center',
        )
          .glow(6, sf > 0.35 ? ROLE.ok : ROLE.focus)
          .opacity(a),
        txt(
          'If the status read leaves the outcome unclear, keep the request pending',
          0,
          325,
          28,
          COSMOS.muted,
          'serif',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2, act3);

  c.on('hold-file', () => {
    s.play(fileOn.to(1, { duration: clampDur(c, c.cue('hold-file').start, 0.3) }));
  });
  c.on('hold-lost', () => {
    s.play(lostOn.to(1, { duration: clampDur(c, c.cue('hold-lost').start, 0.3) }));
  });
  c.on('hold-timeout', () => {
    s.play(timeoutOn.to(1, { duration: clampDur(c, c.cue('hold-timeout').start, 0.3) }));
  });
  c.on('hold-same-key', () => {
    const t = c.cue('hold-same-key').start;
    s.play(act.to(1, { duration: clampDur(c, t, 0.35) }));
    s.play(sameKeyOn.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('hold-new-key', () => {
    s.play(newKeyOn.to(1, { duration: clampDur(c, c.cue('hold-new-key').start, 0.3) }));
  });
  c.on('hold-fork-question', () => {
    s.play(askForkOn.to(1, { duration: clampDur(c, c.cue('hold-fork-question').start, 0.3) }));
  });
  c.on('hold-match', () => {
    s.play(matchOn.to(1, { duration: clampDur(c, c.cue('hold-match').start, 0.3) }));
  });
  // Strict prediction withholding #1: reveal Left = 1 hold AFTER hold-replay!
  c.after('hold-replay', () => {
    s.play(replayReveal.to(1, { duration: clampDur(c, c.cue('hold-replay').end, 0.3) }));
  });
  c.on('hold-miss', () => {
    s.play(missOn.to(1, { duration: clampDur(c, c.cue('hold-miss').start, 0.3) }));
  });
  // Strict prediction withholding #2: reveal Right = 2 holds AFTER hold-duplicate!
  c.after('hold-duplicate', () => {
    s.play(dupReveal.to(1, { duration: clampDur(c, c.cue('hold-duplicate').end, 0.3) }));
  });
  c.on('hold-conflict-input', () => {
    const t = c.cue('hold-conflict-input').start;
    s.play(act.to(2, { duration: clampDur(c, t, 0.35) }));
    s.play(conflictInOn.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('hold-conflict-result', () => {
    s.play(conflictResOn.to(1, { duration: clampDur(c, c.cue('hold-conflict-result').end, 0.3) }));
  });
  c.on('hold-save-together', () => {
    s.play(atomicOn.to(1, { duration: clampDur(c, c.cue('hold-save-together').start, 0.3) }));
  });
  c.on('hold-status-read', () => {
    const t = c.cue('hold-status-read').start;
    s.play(act.to(3, { duration: clampDur(c, t, 0.35) }));
    s.play(statusReadOn.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('hold-status-found', () => {
    s.play(statusFoundOn.to(1, { duration: clampDur(c, c.cue('hold-status-found').end, 0.3) }));
  });
}
