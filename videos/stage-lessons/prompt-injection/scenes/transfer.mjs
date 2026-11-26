// Scene 27: transfer - Let evidence inform the model safely
// Orbiting 3D Defense-in-Depth End-to-End Architecture (`cinematic3d`): traces one
// untrusted report through Quarantined Reader -> Typed Proposal -> Host Policy Engine,
// branching cleanly into (1) Useful Summary, (2) Denied Unauthorized Attempt & Blocked
// Disclosure Sink, and (3) Approved Receipted Production Change (25% / rev 4).
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
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pulse = s.value(0);
  const summaryHi = s.value(0);
  const twoExecHi = s.value(0);
  const workflowHi = s.value(0);
  const sinksHi = s.value(0);

  const header = cinemaHeader(
    'DEFENSE-IN-DEPTH SYNTHESIS',
    'Let evidence inform',
    'the model safely',
    { accent: ROLE.ok, size: 50 },
  );

  const stageAura = aura(300, 20, 640, '#6ee7b71e', '#5ce1e61a');

  const rig3d = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 15.6,
    unit: 112,
    focus: [0, 0, 0.65],
  }).at(300, 30);

  rig3d.add(
    gridPlane3d({
      x: [-3.5, 3.5],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Stage 1 (Left): Untrusted Report + Quarantined Reader
  addBox3D(rig3d, -3.15, -0.65, 0.05, 1.2, 1.3, 1.0, ROLE.source, ROLE.source);

  // Stage 2 (Center): Host Policy & Approval Engine
  addBox3D(rig3d, -0.65, -0.75, 0.05, 1.3, 1.5, 1.35, ROLE.host, ROLE.host, {
    faceOpacity: 0.86,
    edgeGlow: 9,
  });
  addArc3D(rig3d, [-1.95, 0, 0.95], [-0.65, 0, 1.2], ROLE.proposal, {
    lift: 0.65,
    pulseVal: pulse,
    phaseOffset: 0,
  });

  // Stage 3a (Back-right): Useful Summary (Emerald)
  addBox3D(rig3d, 1.85, -2.35, 0.05, 1.35, 1.0, 0.95, ROLE.ok, ROLE.ok);
  addArc3D(rig3d, [0.65, -0.45, 1.2], [1.85, -1.85, 0.98], ROLE.ok, {
    lift: 0.7,
    pulseVal: pulse,
    phaseOffset: 0.25,
  });

  // Stage 3b (Mid-right): Denied Attempt / Disclosure Sink Blocked (Rose)
  addBox3D(rig3d, 1.85, -0.5, 0.05, 1.35, 1.0, 0.95, ROLE.denied, ROLE.denied);
  const deniedArc = hideNodes(
    addArc3D(rig3d, [0.65, 0, 1.2], [1.85, 0, 0.98], ROLE.denied, {
      lift: 0.6,
      pulseVal: pulse,
      phaseOffset: 0.5,
    }),
  );

  // Stage 3c (Front-right): Approved Release + Linked Receipt (Gold/Emerald)
  addBox3D(rig3d, 1.85, 1.35, 0.05, 1.35, 1.0, 1.15, ROLE.focus, ROLE.ok);
  const approvedArc = hideNodes(
    addArc3D(rig3d, [0.65, 0.45, 1.2], [1.85, 1.85, 1.15], ROLE.ok, {
      lift: 0.78,
      pulseVal: pulse,
      phaseOffset: 0.75,
      width: 3.4,
    }),
  );

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const sh = summaryHi.value;
      const te = twoExecHi.value;
      const wf = workflowHi.value;
      const sk = sinksHi.value;
      const nodes = [];

      nodes.push(
        txt(
          'BLUE: REPORT  ·  CYAN: HOST POLICY  ·  GREEN: SUMMARY/RECEIPT  ·  ROSE: DENIED',
          300,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'CALLER · OPERATION · APPROVAL · RESULTING STATE STAY LINKED END TO END',
          300,
          435,
          26,
          ROLE.ok,
          'mono',
          'center',
        ),
      );

      // Left diagnostic checklist (your own workflow playbook)
      nodes.push(
        energyRail(-855, -200, 12, ROLE.ok, { width: 6, glow: 8 + sh * 5 }),
        txt('1. USEFUL WORK + BOUNDED PROPOSALS', -825, -176, 26, ROLE.ok, 'mono', 'left'),
        txt('Report informs summary or typed proposal', -825, -120, 26, COSMOS.ink, 'sans', 'left'),
        txt(
          'Denied attempt -> 0% shadow + audit record',
          -825,
          -66,
          26,
          ROLE.denied,
          'mono',
          'left',
        ),
        txt(
          'Approved write -> 25% rev 4 + linked receipt',
          -825,
          -12,
          26,
          te > 0.3 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      const wAlpha = 0.45 + Math.max(wf, sk) * 0.55;
      nodes.push(
        line([-855, 42], [-275, 42], { stroke: '#28385f', width: 2 }),
        energyRail(-855, 76, 388, ROLE.host, { width: 6, opacity: wAlpha }),
        txt('2. TEST YOUR OWN WORKFLOW', -825, 100, 26, ROLE.host, 'mono', 'left').opacity(wAlpha),
        txt(
          'Trace ONE hostile input to EVERY protected sink',
          -825,
          158,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(wAlpha),
        txt(
          '  · Disclosure endpoints (notes, URLs, logs)',
          -825,
          212,
          26,
          ROLE.approval,
          'mono',
          'left',
        ).opacity(wAlpha),
        txt(
          '  · Deployment & state-change endpoints',
          -825,
          264,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(wAlpha),
        txt(
          'Run the approved case too -> verify receipts',
          -825,
          322,
          26,
          ROLE.ok,
          'sans',
          'left',
        ).opacity(wAlpha),
        txt('Repair the exact failing layer', -825, 372, 26, ROLE.host, 'mono', 'left').opacity(
          wAlpha,
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.26, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('transfer-beat-1-focus-1', () => {
    s.play(
      summaryHi.to(1, { duration: clampDur(c, c.cue('transfer-beat-1-focus-1').start, 0.35) }),
    );
  });
  c.on('transfer-beat-1-focus-2', () => {
    const t = c.cue('transfer-beat-1-focus-2').start;
    s.play(twoExecHi.to(1, { duration: clampDur(c, t, 0.4) }));
    fadeInNodes(s, c, t, [...deniedArc, ...approvedArc], 0.45);
  });
  c.on('transfer-protected-endpoints', () => {
    s.play(
      sinksHi.to(1, { duration: clampDur(c, c.cue('transfer-protected-endpoints').start, 0.35) }),
    );
  });
  c.on('transfer-beat-2-focus-1', () => {
    s.play(
      workflowHi.to(1, { duration: clampDur(c, c.cue('transfer-beat-2-focus-1').start, 0.35) }),
    );
  });
}
