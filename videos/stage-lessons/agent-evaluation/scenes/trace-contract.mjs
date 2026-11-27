// Scene 9: trace-contract - What goes in the trace?
// Mode 0 (Beat 0): Trajectory architecture tau = (s0, a0, o0, ..., sT) across 4 timeline
// nodes showing Tools, Harness, Scorer, and Delta-state = 0 on reads/denied writes.
// Mode 1 (Beat 1): Live Optical Allowlist & Redaction Gate scanning nested arguments
// (dropping `email`), redacting contact values inside observations, and exporting clean trace IDs.
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
  glowTex,
  guardedDynamic,
  railBar,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function traceContract(s, c) {
  const pulse = s.value(0);
  const worldOn = s.value(0);
  const obsOn = s.value(0);
  const readZero = s.value(0);

  const redactMode = s.value(0); // 0 = Beat 0 trajectory, 1 = Beat 1 redaction & allowlist
  const scanKeys = s.value(0);
  const dropEmail = s.value(0);
  const maskVal = s.value(0);
  const exportClean = s.value(0);

  const header = cinemaHeader('OBSERVABLE TRAJECTORY', 'What goes in', 'the trace?', {
    accent: ROLE.trace,
    size: 50,
  });

  const stageAura = aura(40, 40, 660, '#5ce1e61c', '#60a5fa14');

  const trajEq = glowTex(
    String.raw`\tau = (s_0,\; a_0,\; o_0,\; s_1,\; a_1,\; o_1,\; \dots,\; s_T)`,
    { x: 340, y: -335, size: 36, color: ROLE.trace, glow: 8 },
  );

  // Mode 0: Trajectory architecture & four timeline events
  const mode0 = guardedDynamic(
    () => fadeOutHalf(redactMode.value),
    (a) => {
      const p = 0;
      const wo = worldOn.value;
      const ob = obsOn.value;
      const rz = readZero.value;
      const nodes = [];

      // Upper architectural roles strip
      const roles = [
        { x: -660, label: 'LIBRARY', sub: 'Implements tools', col: ROLE.host },
        { x: -220, label: 'HARNESS', sub: 'Resets & caps budget', col: ROLE.trace },
        { x: 220, label: 'SCORER', sub: 'Grades evidence', col: ROLE.pass },
        { x: 660, label: 'TRUSTED STATE', sub: 'Hidden from agent', col: ROLE.focus },
      ];
      roles.forEach((r, i) => {
        nodes.push(
          txt(r.label, r.x, -165, 26, r.col, 'mono', 'center').opacity(a * (0.55 + 0.45 * wo)),
          txt(r.sub, r.x, -125, 26, COSMOS.muted, 'sans', 'center').opacity(a * (0.55 + 0.45 * wo)),
        );
        if (i < roles.length - 1) {
          nodes.push(
            line([r.x + 150, -145], [roles[i + 1].x - 150, -145], {
              stroke: '#2f416e',
              width: 2,
            }).opacity(a * 0.7),
          );
        }
      });

      // Center horizontal 4-node trajectory timeline
      const steps = [
        { x: -670, label: 't0 LOOKUP', sub: 'B7 found', col: ROLE.trace },
        { x: -225, label: 't1 PERMIT', sub: 'op-17 allow', col: ROLE.host },
        { x: 225, label: 't2 COMMIT', sub: 'hold-17 · v3', col: ROLE.pass },
        { x: 670, label: 't3 READ', sub: 'verify B7', col: ROLE.trace },
      ];
      const built = steps.map((st, idx) =>
        autoNode(st.x, 70, st.label, {
          radius: 66,
          color: st.col,
          glow: ob > idx * 0.22 ? 11 : 4,
          opacity: a * (0.4 + 0.6 * Math.min(1, ob * 2.5 - idx * 0.35 + 0.4)),
          sub: st.sub,
          subColor: COSMOS.ink,
        }),
      );

      for (let i = 0; i < built.length - 1; i++) {
        const [p0, p1] = trimSeg(
          [steps[i].x, 70],
          [steps[i + 1].x, 70],
          built[i].r,
          built[i + 1].r,
        );
        nodes.push(
          segmentWithPhoton(p0, p1, steps[i + 1].col, p + i * 0.28, {
            width: 3.2,
            glow: 8,
            alpha: a * (0.35 + 0.65 * ob),
          }),
        );
      }
      built.forEach((b) => nodes.push(b.node));

      // Lower delta-state = 0 callout
      if (rz > 0.1) {
        nodes.push(
          txt(
            'READ OR DENIED WRITE ->  Δstate = 0  (still logged in trajectory!)',
            0,
            290,
            28,
            ROLE.warn,
            'mono',
            'center',
          )
            .glow(8, ROLE.warn)
            .opacity(a * rz),
        );
      }

      nodes.push(
        txt(
          'Actions + returned observations form a trajectory through environment states',
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

  // Mode 1: Optical Redaction Laser & Allowlist Exporter
  const mode1 = guardedDynamic(
    () => fadeInHalf(redactMode.value),
    (a) => {
      const p = 0;
      const sk = scanKeys.value;
      const de = dropEmail.value;
      const mv = maskVal.value;
      const ex = exportClean.value;
      const nodes = [];

      // Left rail: Raw Runtime Event
      nodes.push(
        railBar(-840, -175, 255, ROLE.host, { width: 5, glow: 8, opacity: a }),
        txt('RAW RUNTIME EVENT', -810, -155, 26, ROLE.host, 'mono', 'left').opacity(a),
        txt('book_id: B7', -810, -85, 30, ROLE.pass, 'mono', 'left').opacity(a),
        txt('op_id: op-17', -810, -25, 30, ROLE.pass, 'mono', 'left').opacity(a),
        txt(
          'args.email: ana@example...',
          -810,
          45,
          28,
          de > 0.35 ? ROLE.fail : sk > 0.3 ? ROLE.warn : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(de > 0.35 ? 10 : 0, ROLE.fail)
          .opacity(a),
        txt(
          'obs.contact: 555-0192',
          -810,
          115,
          28,
          mv > 0.35 ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(mv > 0.35 ? 10 : 0, ROLE.fail)
          .opacity(a),
        txt('run · event · time · permit', -810, 195, 26, ROLE.trace, 'mono', 'left').opacity(a),
      );

      // Center: Optical Redaction & Allowlist Gate
      const gateNode = autoNode(0, 40, ex > 0.35 ? 'ALLOWLIST' : 'SCANNER', {
        radius: 78,
        color: ex > 0.35 ? ROLE.pass : ROLE.focus,
        glow: 11,
        opacity: a,
        sub: de > 0.35 && mv > 0.35 ? 'Keys + values scrubbed' : 'Inspect keys & values',
        subColor: ROLE.focus,
      });
      const [gL0, gL1] = trimSeg([-310, 40], [0, 40], 0, gateNode.r);
      const [gR0, gR1] = trimSeg([0, 40], [295, 40], gateNode.r, 0);
      nodes.push(
        segmentWithPhoton(gL0, gL1, ROLE.host, p, { width: 3.4, glow: 8, alpha: a }),
        segmentWithPhoton(gR0, gR1, ex > 0.35 ? ROLE.pass : ROLE.trace, p + 0.4, {
          width: 3.4,
          glow: 9,
          alpha: a,
        }),
        gateNode.node,
      );

      // Right rail: Exported Safe Trace
      const rCol = ex > 0.35 ? ROLE.pass : ROLE.trace;
      nodes.push(
        railBar(310, -175, 255, rCol, { width: 5, glow: 10, opacity: a }),
        txt('EXPORTED TRACE (ALLOWLIST)', 340, -155, 26, rCol, 'mono', 'left').opacity(a),
        txt('book_id: B7 · op-17', 340, -85, 30, ROLE.pass, 'mono', 'left').opacity(a),
        txt(
          de > 0.35 ? 'args.email -> DROPPED' : 'scanning argument keys...',
          340,
          -15,
          28,
          de > 0.35 ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),
        txt(
          mv > 0.35 ? 'obs.contact -> [REDACTED]' : 'scanning observation values...',
          340,
          55,
          28,
          mv > 0.35 ? ROLE.warn : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),
        txt('run_id · event_id · ts', 340, 130, 28, ROLE.trace, 'mono', 'left').opacity(a),
        txt(
          ex > 0.35 ? 'permit: ALLOW · retention TTL' : 'Same redaction on final text',
          340,
          198,
          26,
          ex > 0.35 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      nodes.push(
        txt(
          ex > 0.35
            ? 'ALLOWLIST EXPORT + VALUE REDACTION + RETENTION LIMIT = AUDITABLE TRACE'
            : 'Drop sensitive argument keys and redact private observation values before save',
          0,
          392,
          28,
          ex > 0.35 ? ROLE.pass : ROLE.focus,
          'mono',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, trajEq, mode0, mode1);

  c.on('trace-world', () => {
    s.play(worldOn.to(1, { duration: clampDur(c, c.cue('trace-world').start, 0.35) }));
  });
  c.on('trace-observations', () => {
    s.play(obsOn.to(1, { duration: clampDur(c, c.cue('trace-observations').start, 0.55) }));
  });
  c.on('trace-read', () => {
    s.play(readZero.to(1, { duration: clampDur(c, c.cue('trace-read').start, 0.4) }));
  });

  // Transition to Beat 1 redaction gate
  c.hide(1, trajEq);
  c.onBeat(1, () => {
    s.play(redactMode.to(1, { duration: clampDur(c, c.beats[1].start, 0.65) }));
  });
  c.on('trace-keys', () => {
    s.play(scanKeys.to(1, { duration: clampDur(c, c.cue('trace-keys').start, 0.35) }));
  });
  c.on('trace-leak', () => {
    s.play(dropEmail.to(1, { duration: clampDur(c, c.cue('trace-leak').start, 0.35) }));
  });
  c.on('trace-value', () => {
    s.play(maskVal.to(1, { duration: clampDur(c, c.cue('trace-value').start, 0.35) }));
  });
  c.on('trace-export', () => {
    s.play(exportClean.to(1, { duration: clampDur(c, c.cue('trace-export').start, 0.4) }));
  });
}
