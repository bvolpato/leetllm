// Scene 14: promotion-policy - May this promotion go through?
// Signature Orbiting 3D 5-Gate Promotion Rig standing strictly IN FRONT of the saved op-A Ledger!
// Strict prediction withholding on Beat 2 -> Beat 3: when live release gate flips to FAILED,
// can the host return the saved op-A success? Withheld until AFTER `policy-block` and `policy-replayed`!
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  energyRail,
  fadeInNodes,
  fadeOutNodes,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function promotionPolicy(s, c) {
  const pulse = s.value(0);
  const roleOn = s.value(0);
  const projOn = s.value(0);
  const polOn = s.value(0);
  const apprOn = s.value(0);
  const beforeLedgerOn = s.value(0);
  const forgeTryOn = s.value(0);
  const forgeRejectOn = s.value(0);
  const recordOn = s.value(0);
  const gateFlipFail = s.value(0);
  const askRetryOn = s.value(0);
  const blockReveal = s.value(0);
  const restoreOn = s.value(0);
  const travelOn = s.value(0);
  const replayReveal = s.value(0);

  const header = cinemaHeader('ORDERED PROMOTION GUARDRAILS', 'May this promotion', 'go through?', {
    accent: ROLE.focus,
    size: 48,
  });

  const stageAura = aura(300, 30, 620, '#ffd1661f', '#a78bfa1a');

  // 3D Orbiting 5-Gate Gauntlet leading to the op-A Ledger Prism
  const rig3d = cinematic3d({
    theta: -0.82,
    phi: 0.98,
    distance: 15.6,
    unit: 112,
    focus: [0, 0, 0.72],
  }).at(310, 25);

  rig3d.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.45,
    }),
  );

  // 5 Gates in sequence along X: Shape (-3.2), Role (-2.0), Scope (-0.8), Release Gate (+0.4), Approval (+1.6)
  // Saved Ledger Prism at far right (+2.8)
  addBox3D(rig3d, -3.4, -0.75, 0.04, 0.55, 1.5, 1.15, ROLE.proposal, ROLE.proposal);
  addBox3D(rig3d, -2.2, -0.75, 0.04, 0.55, 1.5, 1.15, ROLE.session, ROLE.session);
  addBox3D(rig3d, -1.0, -0.75, 0.04, 0.55, 1.5, 1.15, ROLE.runtime, ROLE.runtime);
  const liveGateGreen = addBox3D(rig3d, 0.2, -0.75, 0.04, 0.55, 1.5, 1.35, ROLE.ok, ROLE.ok, {
    edgeGlow: 9,
  });
  const liveGateRed = hideNodes(
    addBox3D(rig3d, 0.2, -0.75, 0.04, 0.55, 1.5, 1.35, ROLE.denied, ROLE.denied, {
      edgeGlow: 11,
    }),
  );
  addBox3D(rig3d, 1.4, -0.75, 0.04, 0.55, 1.5, 1.15, ROLE.approval, ROLE.approval);
  addBox3D(rig3d, 2.6, -0.85, 0.04, 0.95, 1.7, 1.4, ROLE.key, ROLE.key, {
    faceOpacity: 0.84,
    edgeGlow: 9,
  });

  // 3D Path to Ledger when gate passes
  const fullPassArc = hideNodes([
    ...addArc3D(rig3d, [-3.1, 0, 1.22], [3.05, 0, 1.48], ROLE.ok, {
      lift: 0.95,
      pulseVal: pulse,
      phaseOffset: 0.1,
      width: 3.8,
    }),
  ]);

  // 3D Blocked Arc stopping strictly AT the failed Release Gate (+0.45)
  const blockedArc = hideNodes([
    ...addArc3D(rig3d, [-3.1, 0, 1.22], [0.45, 0, 1.42], ROLE.denied, {
      lift: 0.75,
      pulseVal: pulse,
      phaseOffset: 0.4,
      width: 3.8,
    }),
  ]);

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const rl = roleOn.value;
      const pj = projOn.value;
      const pl = polOn.value;
      const ap = apprOn.value;
      const bl = beforeLedgerOn.value;
      const ft = forgeTryOn.value;
      const fr = forgeRejectOn.value;
      const rc = recordOn.value;
      const gf = gateFlipFail.value;
      const aq = askRetryOn.value;
      const bk = blockReveal.value;
      const rs = restoreOn.value;
      const tr = travelOn.value;
      const rp = replayReveal.value;
      const nodes = [];

      const gateFailedNow = gf > 0.35 && rs < 0.35;

      nodes.push(
        txt(
          'SHAPE -> ROLE -> SCOPE -> LIVE GATE -> APPROVAL -> LEDGER',
          310,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          gateFailedNow
            ? 'LIVE RELEASE GATE: FAILED  (CHECKS RUN BEFORE LEDGER!)'
            : rp > 0.5
              ? 'SAVED RECEIPT REPLAYED  ·  TOTAL PROMOTIONS = 1'
              : 'SAVED RECEIPT KEY: (search, promote, op-A)',
          310,
          435,
          26,
          gateFailedNow ? ROLE.denied : rp > 0.5 ? ROLE.ok : ROLE.key,
          'mono',
          'center',
        ),
      );

      // Left column: 5 Ordered Checks
      const checks = [
        [
          '1. SHAPE',
          'only {release_id: "v17"}',
          fr > 0.35 && rc < 0.35 ? ROLE.denied : ROLE.proposal,
        ],
        ['2. ROLE', 'alice · can_promote=true', rl > 0.3 ? ROLE.session : COSMOS.dim],
        ['3. PROJECT', 'v17 belongs to "search"', pj > 0.3 ? ROLE.runtime : COSMOS.dim],
        [
          '4. LIVE GATE',
          gateFailedNow ? 'FAILED (flipped!)' : 'current policy PASSED',
          gateFailedNow ? ROLE.denied : pl > 0.3 ? ROLE.ok : COSMOS.dim,
        ],
        ['5. APPROVAL', 'binds alice+v17+P7+op-A', ap > 0.3 ? ROLE.approval : COSMOS.dim],
      ];

      checks.forEach(([k, v, col], i) => {
        const y = -200 + i * 64;
        nodes.push(
          energyRail(-855, y - 16, y + 18, col, { width: 4.5 }),
          txt(k, -825, y, 26, col, 'mono', 'left'),
          txt(v, -600, y, 26, i === 3 && gateFailedNow ? ROLE.denied : COSMOS.ink, 'mono', 'left'),
        );
      });

      nodes.push(line([-855, 112], [-250, 112], { stroke: '#25355a', width: 2 }));

      // Bottom-left Dynamic State Readout (switches cleanly across Beat 1 forgery, Beat 2 question, Beat 3 reveal!)
      if (rc < 0.35) {
        if (ft > 0.35) {
          nodes.push(
            energyRail(-855, 145, 295, ROLE.denied),
            txt('FORGED EXTRA APPROVAL FIELD', -825, 165, 26, ROLE.denied, 'mono', 'left'),
            txt(
              fr > 0.35 ? 'STOPPED AT GATE 1 (SHAPE)' : 'Model injects approved=true...',
              -825,
              220,
              28,
              ROLE.denied,
              'mono',
              'left',
            ).glow(6, ROLE.denied),
            txt('Prevents confused-deputy misuse', -825, 272, 26, COSMOS.muted, 'sans', 'left'),
          );
        } else {
          nodes.push(
            energyRail(-855, 145, 295, bl > 0.35 ? ROLE.focus : ROLE.runtime),
            txt('ORDERING RULE', -825, 165, 26, ROLE.focus, 'mono', 'left'),
            txt(
              bl > 0.35
                ? 'ALL 5 CHECKS RUN BEFORE LEDGER LOOKUP'
                : 'Host binds approval + op-A outside args',
              -825,
              225,
              26,
              COSMOS.ink,
              'mono',
              'left',
            ),
          );
        }
      } else {
        // Beats 2 & 3: op-A saved, gate flips, prediction withheld, then block -> restore -> replay!
        let headline = 'op-A SAVED · REPLY LOST';
        let detail = 'Retry arrives with matching key + approval';
        let col = ROLE.key;
        if (rp > 0.5) {
          headline = 'REPLAYED SAVED RECEIPT (1 PROMOTION)';
          detail = 'Gate restored -> checks reach op-A ledger';
          col = ROLE.ok;
        } else if (tr > 0.35) {
          headline = 'CHECKS PASS -> REACHING LEDGER';
          detail = 'Looking up saved receipt for op-A';
          col = ROLE.runtime;
        } else if (rs > 0.35) {
          headline = 'LIVE GATE RESTORED -> PASSING';
          detail = 'Alice retries with same key & approval';
          col = ROLE.proposal;
        } else if (bk > 0.5) {
          headline = 'BLOCKED AT FAILED LIVE GATE';
          detail = 'First promotion stays saved, no replay yet';
          col = ROLE.denied;
        } else if (aq > 0.35 || gf > 0.35) {
          headline = 'CAN HOST RETURN SAVED SUCCESS?  ?';
          detail = 'Approval & op-A match, but live gate FAILED';
          col = ROLE.focus;
        }

        nodes.push(
          energyRail(-855, 145, 315, col),
          txt('RETRY COUNTERFACTUAL', -825, 165, 26, col, 'mono', 'left'),
          txt(headline, -825, 224, 28, col, 'mono', 'left').glow(7, col),
          txt(detail, -825, 282, 26, COSMOS.ink, 'sans', 'left'),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.25, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-promotion-policy-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('tu-promotion-policy-1').start, 0.25) }));
  });
  c.on('tu-promote-role', () => {
    s.play(roleOn.to(1, { duration: clampDur(c, c.cue('tu-promote-role').start, 0.3) }));
  });
  c.on('tu-promote-project', () => {
    s.play(projOn.to(1, { duration: clampDur(c, c.cue('tu-promote-project').start, 0.3) }));
  });
  c.on('tu-promote-policy', () => {
    s.play(polOn.to(1, { duration: clampDur(c, c.cue('tu-promote-policy').start, 0.3) }));
  });
  c.on('tu-promote-approval', () => {
    s.play(apprOn.to(1, { duration: clampDur(c, c.cue('tu-promote-approval').start, 0.3) }));
  });
  c.on('tu-promote-before-ledger', () => {
    s.play(
      beforeLedgerOn.to(1, {
        duration: clampDur(c, c.cue('tu-promote-before-ledger').start, 0.3),
      }),
    );
  });
  c.on('tu-promotion-policy-2', () => {
    s.play(forgeTryOn.to(1, { duration: clampDur(c, c.cue('tu-promotion-policy-2').start, 0.3) }));
  });
  c.on('tu-promote-forgery', () => {
    s.play(forgeRejectOn.to(1, { duration: clampDur(c, c.cue('tu-promote-forgery').start, 0.3) }));
  });
  c.on('policy-record', () => {
    s.play(recordOn.to(1, { duration: clampDur(c, c.cue('policy-record').start, 0.3) }));
  });
  c.on('policy-flips', () => {
    const t = c.cue('policy-flips').start;
    s.play(gateFlipFail.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeOutNodes(s, c, t, liveGateGreen, 0.25);
    fadeInNodes(s, c, t, liveGateRed, 0.25);
  });
  c.on('policy-retry-question', () => {
    s.play(askRetryOn.to(1, { duration: clampDur(c, c.cue('policy-retry-question').start, 0.3) }));
  });
  // Strict prediction withholding #1: reveal retry block AFTER policy-block!
  c.after('policy-block', () => {
    const t = c.cue('policy-block').end;
    s.play(blockReveal.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, blockedArc, 0.3);
  });
  c.on('policy-restore', () => {
    const t = c.cue('policy-restore').start;
    s.play(restoreOn.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeOutNodes(s, c, t, [...liveGateRed, ...blockedArc], 0.25);
    fadeInNodes(s, c, t, liveGateGreen, 0.25);
  });
  c.on('policy-travel', () => {
    const t = c.cue('policy-travel').start;
    s.play(travelOn.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, fullPassArc, 0.35);
  });
  // Strict prediction withholding #2: reveal saved replay AFTER policy-replayed!
  c.after('policy-replayed', () => {
    s.play(replayReveal.to(1, { duration: clampDur(c, c.cue('policy-replayed').end, 0.3) }));
  });
}
