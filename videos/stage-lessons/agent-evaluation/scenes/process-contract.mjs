// Scene 10: process-contract - What did the host permit?
// 3-mode non-overlapping optical stage:
//   Mode 0 (Beat 0): Exact-once vs bounded-retry sequence automata (`autoNode` + `trimSeg`).
//   Mode 1 (Beat 1): Permit-to-write binding comparator mutating candidate (`cand-999`),
//     call ID (`call-prev`), and permit time (`t=13 > started_at=12`).
//   Mode 2 (Beat 2): Second write after verification + 3 failing read probes
//     (wrong book B8, stale version v2, newer version with 0 holds).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  guardedDynamic,
  railBar,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function processContract(s, c) {
  const pulse = s.value(0);
  // Beat 0
  const strictOn = s.value(0);
  const rejectOn = s.value(0);
  const retryOn = s.value(0);
  // Mode transitions: 0 -> 1 (Beat 1), 1 -> 2 (Beat 2)
  const mode1T = s.value(0);
  const mode2T = s.value(0);
  // Beat 1 permit binding probes
  const bindOk = s.value(0);
  const mutCand = s.value(0);
  const mutCall = s.value(0);
  const mutLate = s.value(0);
  // Beat 2 second-write & bad reads
  const w2On = s.value(0);
  const missRead = s.value(0);
  const badRes = s.value(0);
  const badVer = s.value(0);
  const badOut = s.value(0);

  const header = cinemaHeader('PROCESS CONTRACT', 'What did the', 'host permit?', {
    accent: ROLE.host,
    size: 50,
  });

  const stageAura = aura(0, 40, 680, '#60a5fa1a', '#ff6b8b14');

  // Mode 0 (Beat 0): Exact-once vs recovery sequence automata
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode1T.value),
    (a) => {
      const p = 0;
      const st = strictOn.value;
      const rj = rejectOn.value;
      const rt = retryOn.value;
      const nodes = [];

      // Top lane: Strict exact-once sequence
      const y1 = -65;
      const n1 = autoNode(-650, y1, 'LOOKUP', {
        radius: 56,
        color: ROLE.pass,
        glow: 9,
        opacity: a,
      });
      const n2 = autoNode(-250, y1, 'WRITE', { radius: 56, color: ROLE.pass, glow: 9, opacity: a });
      const n3 = autoNode(150, y1, 'VERIFY', { radius: 56, color: ROLE.pass, glow: 9, opacity: a });
      const [e1a, e1b] = trimSeg([-650, y1], [-250, y1], n1.r, n2.r);
      const [e2a, e2b] = trimSeg([-250, y1], [150, y1], n2.r, n3.r);

      nodes.push(
        txt(
          'STRICT CONTRACT (EXACTLY ONCE, IN ORDER)',
          -840,
          -190,
          26,
          ROLE.pass,
          'mono',
          'left',
        ).opacity(a),
        segmentWithPhoton(e1a, e1b, ROLE.pass, p, { width: 3.4, alpha: a }),
        segmentWithPhoton(e2a, e2b, ROLE.pass, p + 0.4, { width: 3.4, alpha: a }),
        n1.node,
        n2.node,
        n3.node,
        txt(
          rj > 0.35 ? 'Reversed / dup -> FAIL' : '3 dispatches -> PASS',
          305,
          y1,
          28,
          rj > 0.35 ? ROLE.fail : ROLE.pass,
          'mono',
          'left',
        )
          .glow(rj > 0.35 ? 9 : 6, rj > 0.35 ? ROLE.fail : ROLE.pass)
          .opacity(a * Math.max(0.55, st)),
      );

      // Bottom lane: Recovery sequence (timeout + retry + write + verify = 4 dispatches)
      const y2 = 210;
      const rCol = rt > 0.3 ? ROLE.trace : COSMOS.dim;
      const r0 = autoNode(-700, y2, 'TIMEOUT', {
        radius: 56,
        color: ROLE.retry,
        glow: 9,
        opacity: a * (0.4 + 0.6 * rt),
      });
      const r1 = autoNode(-370, y2, 'LOOKUP', {
        radius: 56,
        color: rCol,
        glow: 8,
        opacity: a * (0.4 + 0.6 * rt),
      });
      const r2 = autoNode(-40, y2, 'WRITE', {
        radius: 56,
        color: rCol,
        glow: 8,
        opacity: a * (0.4 + 0.6 * rt),
      });
      const r3 = autoNode(290, y2, 'VERIFY', {
        radius: 56,
        color: ROLE.pass,
        glow: 8,
        opacity: a * (0.4 + 0.6 * rt),
      });
      const [re0a, re0b] = trimSeg([-700, y2], [-370, y2], r0.r, r1.r);
      const [re1a, re1b] = trimSeg([-370, y2], [-40, y2], r1.r, r2.r);
      const [re2a, re2b] = trimSeg([-40, y2], [290, y2], r2.r, r3.r);

      nodes.push(
        txt(
          'RECOVERY CONTRACT (1 READ TIMEOUT ALLOWED)',
          -840,
          72,
          26,
          ROLE.retry,
          'mono',
          'left',
        ).opacity(a),
        segmentWithPhoton(re0a, re0b, ROLE.retry, p, { width: 3, alpha: a * (0.35 + 0.65 * rt) }),
        segmentWithPhoton(re1a, re1b, rCol, p + 0.3, { width: 3, alpha: a * (0.35 + 0.65 * rt) }),
        segmentWithPhoton(re2a, re2b, ROLE.pass, p + 0.6, {
          width: 3,
          alpha: a * (0.35 + 0.65 * rt),
        }),
        r0.node,
        r1.node,
        r2.node,
        r3.node,
        txt('4 dispatches counted', 435, y2, 28, ROLE.focus, 'mono', 'left').opacity(
          a * (0.4 + 0.6 * rt),
        ),
      );

      nodes.push(
        txt(
          'Declare strict vs recovery sequence contract BEFORE scoring the run',
          0,
          392,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1 (Beat 1): Permit-to-write 5-field binding comparator
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode1T.value) * fadeOutHalf(mode2T.value),
    (a) => {
      const p = 0;
      const bo = bindOk.value;
      const mc = mutCand.value;
      const mk = mutCall.value;
      const ml = mutLate.value;
      const nodes = [];

      const wrongCand = mc > 0.4 && mk < 0.4 && ml < 0.4;
      const wrongCall = mk > 0.4 && ml < 0.4;
      const latePerm = ml > 0.4;

      const fields = [
        {
          k: 'CALL ID',
          left: wrongCall ? 'call-prev' : 'call-221',
          right: 'call-221',
          ok: !wrongCall,
        },
        { k: 'OPERATION', left: 'create_promo', right: 'create_promo', ok: true },
        {
          k: 'CANDIDATE',
          left: 'cand-221',
          right: wrongCand ? 'cand-999' : 'cand-221',
          ok: !wrongCand,
        },
        { k: 'TARGET', left: 'prod-10pct', right: 'prod-10pct', ok: true },
        {
          k: 'TIME ORDER',
          left: latePerm ? 'decided t=13' : 'decided t=11',
          right: 'started t=12',
          ok: !latePerm,
        },
      ];

      nodes.push(
        railBar(-840, -180, 285, ROLE.host, { width: 5, glow: 9, opacity: a }),
        txt('HOST PERMIT RECORD', -810, -160, 26, ROLE.host, 'mono', 'left').opacity(a),
        railBar(250, -180, 285, wrongCand || wrongCall || latePerm ? ROLE.fail : ROLE.pass, {
          width: 5,
          glow: 9,
          opacity: a,
        }),
        txt(
          'WRITE DISPATCH',
          280,
          -160,
          26,
          wrongCand || wrongCall || latePerm ? ROLE.fail : ROLE.pass,
          'mono',
          'left',
        ).opacity(a),
      );

      fields.forEach((f, i) => {
        const y = -88 + i * 84;
        const bCol = !f.ok ? ROLE.fail : bo > 0.3 ? ROLE.pass : ROLE.trace;
        nodes.push(
          txt(f.k, -810, y, 26, COSMOS.dim, 'mono', 'left').opacity(a),
          txt(f.left, -365, y, 28, f.ok ? COSMOS.ink : ROLE.fail, 'mono', 'right')
            .glow(!f.ok ? 9 : 0, ROLE.fail)
            .opacity(a),
          segmentWithPhoton([-325, y], [215, y], bCol, p + i * 0.18, {
            width: f.ok ? 3 : 4.2,
            glow: 8,
            photon: f.ok,
            alpha: a,
          }),
          txt(f.ok ? 'MATCH' : 'BROKEN', -55, y - 24, 26, bCol, 'mono', 'center').opacity(a),
          txt(f.right, 280, y, 28, f.ok ? COSMOS.ink : ROLE.fail, 'mono', 'left')
            .glow(!f.ok ? 9 : 0, ROLE.fail)
            .opacity(a),
          glowDot(810, y, { radius: 8.5, color: bCol, glow: 10, opacity: a }),
        );
      });

      const status = latePerm
        ? 'PERMIT AT t=13 > WRITE t=12 -> PERMISSION CAME TOO LATE (FAIL)'
        : wrongCall
          ? 'DIFFERENT CALL ID (call-prev != call-221) -> REUSED PERMIT REJECTED'
          : wrongCand
            ? 'WRONG CANDIDATE (cand-999 != cand-221) -> PERMIT BOUND TO ANOTHER MODEL'
            : 'Bind call, operation, candidate, target & t_permit <= t_start (check expiry/revocation)';
      nodes.push(
        txt(
          status,
          0,
          395,
          28,
          latePerm || wrongCall || wrongCand ? ROLE.fail : ROLE.pass,
          'mono',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 2 (Beat 2): Second write after verification + 3 failing read probes
  const mode2 = guardedDynamic(
    () => fadeInHalf(mode2T.value),
    (a) => {
      const p = 0;
      const w2 = w2On.value;
      const mr = missRead.value;
      const br = badRes.value;
      const bv = badVer.value;
      const bo = badOut.value;
      const nodes = [];

      // Upper timeline: W1 -> Verify1(ok) -> W2 -> ???
      const ty = -55;
      const nW1 = autoNode(-680, ty, 'W1', {
        radius: 58,
        color: ROLE.host,
        glow: 8,
        opacity: a,
      });
      const nV1 = autoNode(-260, ty, 'READ 1', {
        radius: 58,
        color: ROLE.pass,
        glow: 9,
        opacity: a,
      });
      const nW2 = autoNode(180, ty, 'W2', {
        radius: 58,
        color: w2 > 0.3 ? ROLE.warn : COSMOS.dim,
        glow: w2 > 0.3 ? 11 : 4,
        opacity: a * (0.4 + 0.6 * w2),
      });
      const nV2 = autoNode(620, ty, mr > 0.3 ? 'NO READ' : 'READ 2?', {
        radius: 58,
        color: mr > 0.3 ? ROLE.fail : ROLE.focus,
        glow: mr > 0.3 ? 12 : 6,
        opacity: a * (0.4 + 0.6 * Math.max(w2, mr)),
      });

      const [a0, a1] = trimSeg([-680, ty], [-260, ty], nW1.r, nV1.r);
      const [b0, b1] = trimSeg([-260, ty], [180, ty], nV1.r, nW2.r);
      const [c0, c1] = trimSeg([180, ty], [620, ty], nW2.r, nV2.r);

      nodes.push(
        txt(
          'EVERY WRITE NEEDS ITS OWN LATER SUCCESSFUL READ (MAX 2 TIMEOUTS)',
          -840,
          -192,
          26,
          ROLE.trace,
          'mono',
          'left',
        ).opacity(a),
        segmentWithPhoton(a0, a1, ROLE.pass, p, { width: 3.2, alpha: a }),
        segmentWithPhoton(b0, b1, ROLE.warn, p + 0.3, { width: 3.2, alpha: a * (0.4 + 0.6 * w2) }),
        line(c0, c1, { stroke: ROLE.fail, width: 3.2, dash: [8, 8] }).opacity(
          a * (0.4 + 0.6 * Math.max(w2, mr)),
        ),
        nW1.node,
        nV1.node,
        nW2.node,
        nV2.node,
      );

      // Lower three failing read counterfactual columns (zero boxed cards)
      const probes = [
        {
          x: -820,
          title: '1. WRONG BOOK',
          detail: 'Read returns B8 (not B7)',
          rule: 'Need: same resource',
          on: br,
        },
        {
          x: -240,
          title: '2. STALE VERSION',
          detail: 'Right B7 at older v2',
          rule: 'Need: version >= commit',
          on: bv,
        },
        {
          x: 340,
          title: '3. EMPTY OUTCOME',
          detail: 'Newer v4 with 0 holds',
          rule: 'Need: intended outcome',
          on: bo,
        },
      ];
      probes.forEach((pr) => {
        const col = pr.on > 0.3 ? ROLE.fail : COSMOS.dim;
        nodes.push(
          railBar(pr.x, 95, 275, col, { width: 5, glow: pr.on > 0.3 ? 10 : 3, opacity: a }),
          txt(pr.title, pr.x + 26, 115, 26, col, 'mono', 'left').opacity(a),
          txt(
            pr.detail,
            pr.x + 26,
            178,
            28,
            pr.on > 0.3 ? COSMOS.ink : COSMOS.dim,
            'sans',
            'left',
          ).opacity(a),
          txt(
            pr.rule,
            pr.x + 26,
            240,
            26,
            pr.on > 0.3 ? ROLE.pass : COSMOS.dim,
            'mono',
            'left',
          ).opacity(a),
        );
      });

      nodes.push(
        txt(
          'BIND VERIFICATION: SAME RESOURCE + VERSION >= COMMIT + INTENDED OUTCOME',
          0,
          395,
          28,
          bo > 0.3 ? ROLE.pass : ROLE.focus,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1, mode2);

  c.on('strict-once', () => {
    s.play(strictOn.to(1, { duration: clampDur(c, c.cue('strict-once').start, 0.35) }));
  });
  c.on('strict-reject', () => {
    s.play(rejectOn.to(1, { duration: clampDur(c, c.cue('strict-reject').start, 0.35) }));
  });
  c.on('retry-contract', () => {
    s.play(retryOn.to(1, { duration: clampDur(c, c.cue('retry-contract').start, 0.4) }));
  });

  c.onBeat(1, () => {
    s.play(mode1T.to(1, { duration: clampDur(c, c.beats[1].start, 0.6) }));
  });
  c.on('permit-bind', () => {
    s.play(bindOk.to(1, { duration: clampDur(c, c.cue('permit-bind').start, 0.35) }));
  });
  c.on('permit-mutate', () => {
    s.play(mutCand.to(1, { duration: clampDur(c, c.cue('permit-mutate').start, 0.35) }));
  });
  c.on('permit-call', () => {
    s.play(mutCall.to(1, { duration: clampDur(c, c.cue('permit-call').start, 0.35) }));
  });
  c.on('permit-late', () => {
    s.play(mutLate.to(1, { duration: clampDur(c, c.cue('permit-late').start, 0.35) }));
  });

  c.onBeat(2, () => {
    s.play(mode2T.to(1, { duration: clampDur(c, c.beats[2].start, 0.6) }));
  });
  c.on('write-again', () => {
    s.play(w2On.to(1, { duration: clampDur(c, c.cue('write-again').start, 0.35) }));
  });
  c.on('missing-read', () => {
    s.play(missRead.to(1, { duration: clampDur(c, c.cue('missing-read').start, 0.35) }));
  });
  c.on('resource-bind', () => {
    s.play(badRes.to(1, { duration: clampDur(c, c.cue('resource-bind').start, 0.35) }));
  });
  c.on('version-bind', () => {
    s.play(badVer.to(1, { duration: clampDur(c, c.cue('version-bind').start, 0.35) }));
  });
  c.on('outcome-bind', () => {
    s.play(badOut.to(1, { duration: clampDur(c, c.cue('outcome-bind').start, 0.35) }));
  });
}
