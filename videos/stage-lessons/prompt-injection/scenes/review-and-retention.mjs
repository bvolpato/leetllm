// Scene 26: review-and-retention - Protect the reviewer and the incident record
// Mode 0 (Beats 0-1): Split-pane Human Review Packet isolating escaped untrusted claims
// from host-derived action fields, beside the minimized 7-field incident record schema.
// Mode 1 (Beat 2): 4-node NIST GenAI Profile ring (Govern / Map / Measure / Manage)
// linked to the 3 concrete verification levers (Release Gate, Tool Trace, Release Receipt).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PROPOSAL,
  ROLE,
  aura,
  autoNodeRadius,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  gateNode,
  guardedDynamic,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function reviewAndRetention(s, c) {
  const pulse = s.value(0);
  const reviewHi = s.value(0);
  const retentionHi = s.value(0);
  const nistMode = s.value(0); // 0 = review & retention, 1 = NIST + 3 operational checks
  const gateLever = s.value(0);
  const traceLever = s.value(0);
  const receiptLever = s.value(0);

  const header = cinemaHeader(
    'HUMAN REVIEW & INCIDENT GOVERNANCE',
    'Protect the reviewer',
    'and the incident record',
    { accent: ROLE.host, size: 48 },
  );

  const stageAura = aura(150, 30, 620, '#5ce1e61a', '#a78bfa1a');

  // Mode 0: Human Review Packet + Minimized Incident Record
  const mode0 = guardedDynamic(
    () => fadeOutHalf(nistMode.value),
    (a) => {
      const rv = reviewHi.value;
      const rt = retentionHi.value;
      const nodes = [];

      // Left: Human Review Packet (strict visual separation!)
      nodes.push(
        txt(
          'HUMAN REVIEW PACKET (ESCAPED + SEPARATED)',
          -855,
          -212,
          26,
          ROLE.approval,
          'mono',
          'left',
        ).opacity(a),
        energyRail(-855, -168, 25, ROLE.untrusted, { width: 6, glow: 8 + rv * 5, opacity: a }),
        txt(
          'EXTERNAL UNTRUSTED TEXT (ESCAPED)',
          -825,
          -144,
          26,
          ROLE.untrusted,
          'mono',
          'left',
        ).opacity(a),
        txt('“Urgent: click Approve now!”', -825, -88, 28, ROLE.attack, 'serif', 'left').opacity(a),
        txt(
          'Plain text still persuades · Display ≠ lookup',
          -825,
          -34,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),

        energyRail(-855, 65, 340, ROLE.host, { width: 6, glow: 8, opacity: a }),
        txt(
          'HOST-DERIVED ACTION FIELDS (TRUSTED)',
          -825,
          92,
          26,
          ROLE.host,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `Effect: ${PROPOSAL.candidate} -> ${PROPOSAL.stage} (${PROPOSAL.traffic}%)`,
          -825,
          152,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt('Policy evidence: suite R42 · rev 3', -825, 210, 26, ROLE.ok, 'mono', 'left').opacity(
          a,
        ),
        txt('Approval store lookup: MISSING', -825, 268, 26, ROLE.denied, 'mono', 'left').opacity(
          a,
        ),
        txt(
          'Escape active markup before rendering',
          -825,
          322,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      // Right: Minimized Incident Record Schema + Retention Controls
      const rAlpha = a * (0.45 + rt * 0.55);
      const rx = 50;
      const fields = [
        '1. source reference (or redacted payload)',
        '2. model proposal & arguments',
        '3. authenticated principal',
        '4. policy version evaluated',
        '5. authorization decision',
        '6. approval state & lookup result',
        '7. execution receipt / final state',
      ];
      nodes.push(
        energyRail(rx, -168, 232, ROLE.source, { width: 6, opacity: rAlpha }),
        txt('MINIMIZED INCIDENT RECORD', rx + 28, -144, 26, ROLE.source, 'mono', 'left').opacity(
          rAlpha,
        ),
      );
      fields.forEach((f, i) => {
        nodes.push(txt(f, rx + 28, -88 + i * 48, 26, COSMOS.ink, 'mono', 'left').opacity(rAlpha));
      });

      nodes.push(
        rect(780, 122, { fill: '#1a1220', stroke: ROLE.attack, width: 2.4, radius: 10 })
          .at(rx + 400, 325)
          .opacity(rAlpha),
        txt(
          'RETENTION & ACCESS CONTROLS',
          rx + 400,
          296,
          26,
          ROLE.attack,
          'mono',
          'center',
        ).opacity(rAlpha),
        txt(
          'Limit raw prompt storage · Public hash ≠ anonymization',
          rx + 400,
          348,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(rAlpha),
      );

      return group(...nodes);
    },
  );

  // Mode 1: NIST GenAI Profile (Govern / Map / Measure / Manage) + 3 Verification Levers
  const mode1 = guardedDynamic(
    () => fadeInHalf(nistMode.value),
    (a) => {
      const p = 0;
      const gl = gateLever.value;
      const tl = traceLever.value;
      const rl = receiptLever.value;
      const nodes = [];

      // Left: 4-Node NIST Ring (clean clearance below title!)
      const cx = -450;
      const cy = 110;
      const R = 185;
      const nistNodes = [
        { label: 'GOVERN', col: ROLE.approval, pos: [cx, cy - R] },
        { label: 'MAP', col: ROLE.source, pos: [cx + R + 45, cy] },
        { label: 'MEASURE', col: ROLE.focus, pos: [cx, cy + R] },
        { label: 'MANAGE', col: ROLE.ok, pos: [cx - R - 45, cy] },
      ];

      nodes.push(
        txt('NIST GENERATIVE AI PROFILE', cx, -225, 26, ROLE.host, 'mono', 'center').opacity(a),
      );

      for (let i = 0; i < 4; i++) {
        const cur = nistNodes[i];
        const nxt = nistNodes[(i + 1) % 4];
        const rA = autoNodeRadius(cur.label, 48);
        const rB = autoNodeRadius(nxt.label, 48);
        const seg = trimSeg(cur.pos, nxt.pos, rA + 12, rB + 12);
        nodes.push(
          beamWithPhotons(seg, cur.col, p * 0.8 + i * 0.25, {
            width: 3.2,
            alpha: a,
            photonCount: 1,
          }),
        );
      }
      for (const n of nistNodes) {
        nodes.push(gateNode(n.pos[0], n.pos[1], n.label, n.col, { radius: 48, opacity: a }));
      }
      nodes.push(
        txt('ONE OWNER', cx, cy - 16, 26, COSMOS.ink, 'mono', 'center').opacity(a),
        txt('PER BOUNDARY', cx, cy + 20, 26, ROLE.host, 'mono', 'center').opacity(a),
      );

      // Right: 3 Operational Verification Levers
      const levers = [
        {
          y: -120,
          title: '1. CHECK THE RELEASE GATE',
          desc: 'Hand the host a proposal -> read its decision',
          col: ROLE.host,
          hi: gl,
        },
        {
          y: 65,
          title: '2. SEE WHAT THE MODEL REQUESTED',
          desc: 'Open its tool trace & proposed arguments',
          col: ROLE.untrusted,
          hi: tl,
        },
        {
          y: 250,
          title: '3. VERIFY PRODUCTION CHANGES',
          desc: 'Match the committed release receipt to the op',
          col: ROLE.ok,
          hi: rl,
        },
      ];
      for (const lv of levers) {
        const la = a * (0.45 + lv.hi * 0.55);
        nodes.push(
          energyRail(60, lv.y - 54, lv.y + 54, lv.col, {
            width: 6,
            glow: 6 + lv.hi * 8,
            opacity: la,
          }),
          txt(lv.title, 90, lv.y - 22, 28, lv.col, 'mono', 'left')
            .glow(lv.hi > 0.3 ? 6 : 0, lv.col)
            .opacity(la),
          txt(lv.desc, 90, lv.y + 28, 28, COSMOS.ink, 'sans', 'left').opacity(la),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);

  c.on('pi-review-and-retention-0', () => {
    s.play(
      reviewHi.to(1, { duration: clampDur(c, c.cue('pi-review-and-retention-0').start, 0.4) }),
    );
  });
  c.on('pi-review-and-retention-1', () => {
    s.play(
      retentionHi.to(1, { duration: clampDur(c, c.cue('pi-review-and-retention-1').start, 0.45) }),
    );
  });
  c.on('pi-review-and-retention-2', () => {
    s.play(
      nistMode.to(1, { duration: clampDur(c, c.cue('pi-review-and-retention-2').start, 0.45) }),
    );
  });
  c.on('review-gate', () => {
    s.play(gateLever.to(1, { duration: clampDur(c, c.cue('review-gate').start, 0.35) }));
  });
  c.on('review-trace', () => {
    s.play(traceLever.to(1, { duration: clampDur(c, c.cue('review-trace').start, 0.35) }));
  });
  c.on('review-receipt', () => {
    s.play(receiptLever.to(1, { duration: clampDur(c, c.cue('review-receipt').start, 0.35) }));
  });
}
