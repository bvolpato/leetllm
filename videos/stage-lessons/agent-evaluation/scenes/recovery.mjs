// Scene 5: recovery - The reply goes missing
// Mode 0 (Beat 0): Safe read retry vs uncertain lost write reply.
// Mode 1 (Beats 1-3): Twin post-commit accounts testing idempotent key reuse (op-17)
// against minting a new key (op-18), strictly withholding outcomes until after
// `reconcile-id`, `new-key-risk`, and `recovery-contract`.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  LENA_NEW,
  LENA_SAME,
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

export default function recovery(s, c) {
  const pulse = s.value(0);
  const readRetry = s.value(0);
  const readBack = s.value(0);
  const writeLost = s.value(0);
  const writeUnc = s.value(0);

  const twinMode = s.value(0); // 0 = Beat 0 read/write timing, 1 = Beats 1-3 twin key comparison
  const newKeyHi = s.value(0);
  const chooseHi = s.value(0);
  const sendSame = s.value(0);
  const sameReplay = s.value(0);
  const sendNew = s.value(0);
  const newDup = s.value(0);
  const inspectBoth = s.value(0);
  const verdictOn = s.value(0);
  const probesOn = s.value(0);

  const header = cinemaHeader('TIMEOUT RECOVERY', 'The reply goes', 'missing', {
    accent: ROLE.retry,
    size: 50,
  });

  const stageAura = aura(0, 50, 660, '#fb923c1a', '#5ce1e618');

  // Mode 0: Bounded read retry vs lost write reply
  const mode0 = guardedDynamic(
    () => fadeOutHalf(twinMode.value),
    (a) => {
      const p = 0;
      const rr = readRetry.value;
      const rb = readBack.value;
      const wl = writeLost.value;
      const wu = writeUnc.value;
      const nodes = [];

      // Upper track: Catalog Read Retry (idempotent read)
      const rY = -95;
      const rCli = [-680, rY];
      const rSrv = [560, rY];
      const nRCli = autoNode(rCli[0], rCli[1], 'AGENT', {
        radius: 56,
        color: ROLE.read,
        glow: 8,
        opacity: a,
      });
      const nRSrv = autoNode(rSrv[0], rSrv[1], 'CATALOG', {
        radius: 62,
        color: ROLE.read,
        glow: 8,
        opacity: a,
      });
      const [ra0, ra1] = trimSeg([rCli[0], rY - 18], [rSrv[0], rY - 18], nRCli.r, nRSrv.r);
      const [rb0, rb1] = trimSeg([rCli[0], rY + 22], [rSrv[0], rY + 22], nRCli.r, nRSrv.r);

      nodes.push(
        txt('READ PATH (SAFE TO RETRY)', -840, rY - 96, 26, ROLE.read, 'mono', 'left').opacity(a),
        nRCli.node,
        nRSrv.node,
        line(ra0, [60, rY - 18], { stroke: ROLE.retry, width: 3, dash: [8, 8] }).opacity(a * 0.9),
        txt('Attempt 1: timeout', -280, rY - 48, 26, ROLE.retry, 'mono', 'center').opacity(a),
        glowDot(60, rY - 18, { radius: 8, color: ROLE.retry, glow: 10, opacity: a }),
      );

      if (rr > 0.1) {
        nodes.push(
          segmentWithPhoton(rb0, rb1, rb > 0.4 ? ROLE.pass : ROLE.read, p, {
            width: 3.4,
            glow: 9,
            alpha: a * rr,
          }),
          txt(
            rb > 0.4 ? 'Attempt 2: B7 returned (2 dispatches)' : 'Attempt 2: permitted read retry',
            -60,
            rY + 58,
            26,
            rb > 0.4 ? ROLE.pass : ROLE.read,
            'mono',
            'center',
          ).opacity(a * rr),
        );
      }

      // Lower track: Write Reply Lost (uncertain commit!)
      const wY = 200;
      const wCli = [-680, wY];
      const wSrv = [560, wY];
      const nWCli = autoNode(wCli[0], wCli[1], wu > 0.4 ? 'STATE?' : 'AGENT', {
        radius: 58,
        color: wu > 0.4 ? ROLE.warn : ROLE.host,
        glow: 9,
        opacity: a,
      });
      const nWSrv = autoNode(wSrv[0], wSrv[1], wl > 0.35 ? 'DB v3' : 'LIB', {
        radius: 58,
        color: wl > 0.35 ? ROLE.read : ROLE.host,
        glow: 9,
        opacity: a,
      });
      const [wa0, wa1] = trimSeg([wCli[0], wY - 18], [wSrv[0], wY - 18], nWCli.r, nWSrv.r);
      const [wb0, wb1] = trimSeg([wSrv[0], wY + 22], [wCli[0], wY + 22], nWSrv.r, nWCli.r);
      const lostX = -40;

      nodes.push(
        txt('WRITE PATH (OP-17 REPLY LOST)', -840, wY - 134, 26, ROLE.warn, 'mono', 'left').opacity(
          a,
        ),
        nWCli.node,
        nWSrv.node,
        segmentWithPhoton(wa0, wa1, ROLE.host, p + 0.3, {
          width: 3.2,
          glow: 8,
          alpha: a * (0.4 + 0.6 * wl),
        }),
        txt('op-17 reached library once', -60, wY - 48, 26, ROLE.host, 'mono', 'center').opacity(
          a * (0.3 + 0.7 * wl),
        ),
      );

      if (wl > 0.1) {
        nodes.push(
          line(wb0, [lostX, wY + 22], { stroke: ROLE.fail, width: 3.4, dash: [10, 8] })
            .glow(8, ROLE.fail)
            .opacity(a * wl),
          glowDot(lostX, wY + 22, { radius: 9, color: ROLE.fail, glow: 12, opacity: a * wl }),
          txt('REPLY DROPPED', lostX, wY + 62, 26, ROLE.fail, 'mono', 'center')
            .glow(8, ROLE.fail)
            .opacity(a * wl),
          txt(
            wu > 0.35 ? 'Committed on server · unknown to agent' : 'Return packet never arrived',
            0,
            390,
            28,
            wu > 0.35 ? ROLE.warn : COSMOS.muted,
            'mono',
            'center',
          ).opacity(a * wl),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: Side-by-side twin accounts comparing op-17 reuse vs op-18 new key
  const mode1 = guardedDynamic(
    () => fadeInHalf(twinMode.value),
    (a) => {
      const p = 0;
      const nk = newKeyHi.value;
      const ch = chooseHi.value;
      const ss = sendSame.value;
      const sr = sameReplay.value;
      const sn = sendNew.value;
      const nd = newDup.value;
      const ib = inspectBoth.value;
      const vd = verdictOn.value;
      const pr = probesOn.value;
      const nodes = [];

      // Left twin: Reuse key op-17
      const lCol = vd > 0.35 ? ROLE.pass : sr > 0.35 ? ROLE.read : ROLE.host;
      nodes.push(
        railBar(-840, -175, 225, lCol, { width: 5, glow: 9, opacity: a }),
        txt('LEFT RETRY: REUSE KEY op-17', -810, -155, 26, lCol, 'mono', 'left').opacity(a),
        txt('Lena’s Account (copy A)', -810, -96, 36, COSMOS.ink, 'serif', 'left').opacity(a),
        txt(`version ${LENA_SAME.account.version}`, -110, -96, 30, lCol, 'mono', 'right').opacity(
          a,
        ),
        line([-810, -48], [-110, -48], { stroke: '#29385f', width: 2 }).opacity(a),
        txt('hold-17', -810, 14, 32, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('key: op-17', -460, 14, 28, ROLE.read, 'mono', 'center').opacity(a),
        txt('B7', -110, 14, 32, COSMOS.ink, 'mono', 'right').opacity(a),
        line([-810, 52], [-110, 52], { stroke: '#243154', width: 2 }).opacity(a),
      );

      if (sr > 0.1) {
        nodes.push(
          txt('Saved receipt replayed (no 2nd row)', -810, 114, 28, ROLE.read, 'mono', 'left')
            .glow(8, ROLE.read)
            .opacity(a * sr),
          txt(
            'B7 holds: 1 · version stays 3',
            -810,
            182,
            30,
            vd > 0.35 ? ROLE.pass : ROLE.read,
            'mono',
            'left',
          ).opacity(a * sr),
        );
      } else {
        nodes.push(
          txt(
            ss > 0.2 ? 'Sending retry with key op-17...' : 'Starts at v3 with hold-17',
            -810,
            114,
            26,
            ss > 0.2 ? ROLE.read : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
        );
      }

      // Right twin: New key op-18
      const rCol = vd > 0.35 || nd > 0.35 ? ROLE.fail : nk > 0.3 ? ROLE.warn : COSMOS.muted;
      nodes.push(
        railBar(110, -175, 225, rCol, { width: 5, glow: 9, opacity: a }),
        txt('RIGHT RETRY: NEW KEY op-18', 140, -155, 26, rCol, 'mono', 'left').opacity(a),
        txt('Lena’s Account (copy B)', 140, -96, 36, COSMOS.ink, 'serif', 'left').opacity(a),
        txt(
          `version ${nd > 0.35 ? LENA_NEW.account.version : 3}`,
          845,
          -96,
          30,
          nd > 0.35 ? ROLE.fail : ROLE.read,
          'mono',
          'right',
        ).opacity(a),
        line([140, -48], [845, -48], { stroke: '#29385f', width: 2 }).opacity(a),
        txt('hold-17', 140, 14, 32, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('key: op-17', 490, 14, 28, ROLE.read, 'mono', 'center').opacity(a),
        txt('B7', 845, 14, 32, COSMOS.ink, 'mono', 'right').opacity(a),
        line([140, 52], [845, 52], { stroke: '#243154', width: 2 }).opacity(a),
      );

      if (nd > 0.1) {
        nodes.push(
          txt('hold-18', 140, 114, 32, ROLE.fail, 'mono', 'left')
            .glow(10, ROLE.fail)
            .opacity(a * nd),
          txt('key: op-18', 490, 114, 28, ROLE.warn, 'mono', 'center').opacity(a * nd),
          txt('B7', 845, 114, 32, ROLE.fail, 'mono', 'right').opacity(a * nd),
          txt('B7 holds: 2 · duplicate created at v4!', 140, 182, 30, ROLE.fail, 'mono', 'left')
            .glow(8, ROLE.fail)
            .opacity(a * nd),
        );
      } else {
        nodes.push(
          txt(
            sn > 0.2 ? 'Sending retry with new key op-18...' : 'Starts at v3 with hold-17',
            140,
            114,
            26,
            sn > 0.2 ? ROLE.warn : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
        );
      }

      // Center optical divider beacon
      const midNode = autoNode(0, 20, vd > 0.35 ? 'LEFT OK' : ib > 0.3 ? 'READ' : 'VS', {
        radius: 52,
        color: vd > 0.35 ? ROLE.pass : ROLE.focus,
        glow: 9,
        opacity: a,
      });
      nodes.push(midNode.node);

      // Next-test probes row (appears on `recovery-probes`)
      if (pr > 0.1) {
        nodes.push(
          txt(
            'NEXT FAILURE PROBES:  expired permit  ·  stale read  ·  malformed call  ·  budget loop',
            0,
            306,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).opacity(a * pr),
        );
      }

      // Dynamic verdict banner (withheld during Beat 1 question!)
      const statusText =
        vd > 0.35
          ? 'BOTH MADE 2 ATTEMPTS · ONLY op-17 REUSE PASSES EXACTLY-ONE CHECK'
          : ib > 0.3
            ? 'Read both accounts independently to compare hold counts'
            : ch > 0.3
              ? 'Which retry key leaves exactly one B7 hold?'
              : 'Both accounts already committed hold-17 at v3';
      const statusCol = vd > 0.35 ? ROLE.pass : ch > 0.3 ? ROLE.focus : COSMOS.muted;
      nodes.push(
        txt(statusText, 0, 392, 28, statusCol, 'mono', 'center')
          .glow(vd > 0.35 ? 9 : 0, ROLE.pass)
          .opacity(a),
      );

      // Subtle traveling pulse indicator on active retry side
      if (ss > 0.2 && sr < 0.8) {
        nodes.push(
          segmentWithPhoton([-810, 224], [-120, 224], ROLE.read, p, { width: 3, alpha: a * ss }),
        );
      }
      if (sn > 0.2 && nd < 0.8) {
        nodes.push(
          segmentWithPhoton([140, 224], [840, 224], ROLE.warn, p, { width: 3, alpha: a * sn }),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);

  c.on('retry-read', () => {
    s.play(readRetry.to(1, { duration: clampDur(c, c.cue('retry-read').start, 0.4) }));
  });
  c.on('read-observation', () => {
    s.play(readBack.to(1, { duration: clampDur(c, c.cue('read-observation').start, 0.4) }));
  });
  c.on('lost-reply', () => {
    s.play(writeLost.to(1, { duration: clampDur(c, c.cue('lost-reply').start, 0.4) }));
  });
  c.on('uncertain-write', () => {
    s.play(writeUnc.to(1, { duration: clampDur(c, c.cue('uncertain-write').start, 0.4) }));
  });

  // Transition cleanly to twin accounts at Beat 1 start
  c.onBeat(1, () => {
    s.play(twinMode.to(1, { duration: clampDur(c, c.beats[1].start, 0.65) }));
  });
  c.on('offer-new-key', () => {
    s.play(newKeyHi.to(1, { duration: clampDur(c, c.cue('offer-new-key').start, 0.35) }));
  });
  c.on('choose-keys', () => {
    s.play(chooseHi.to(1, { duration: clampDur(c, c.cue('choose-keys').start, 0.35) }));
  });
  c.on('send-same', () => {
    s.play(sendSame.to(1, { duration: clampDur(c, c.cue('send-same').start, 0.35) }));
  });
  c.after('reconcile-id', () => {
    s.play(sameReplay.to(1, { duration: clampDur(c, c.cue('reconcile-id').end, 0.3) }));
  });
  c.on('send-new', () => {
    s.play(sendNew.to(1, { duration: clampDur(c, c.cue('send-new').start, 0.35) }));
  });
  c.after('new-key-risk', () => {
    s.play(newDup.to(1, { duration: clampDur(c, c.cue('new-key-risk').end, 0.3) }));
  });
  c.on('inspect-retries', () => {
    s.play(inspectBoth.to(1, { duration: clampDur(c, c.cue('inspect-retries').start, 0.35) }));
  });
  c.after('recovery-contract', () => {
    s.play(verdictOn.to(1, { duration: clampDur(c, c.cue('recovery-contract').end, 0.35) }));
  });
  c.on('recovery-probes', () => {
    s.play(probesOn.to(1, { duration: clampDur(c, c.cue('recovery-probes').start, 0.35) }));
  });
}
