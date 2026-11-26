// Scene 3: separate-harms - Close each path to a protected effect
// Orbiting 3D Lethal Trifecta & Protected-Sink Lattice (`cinematic3d`): shows Willison's
// private-data + untrusted-content + external-egress disclosure triangle alongside an
// independent production-write conduit that survives removing private notes, then splits
// the toolless reader from the scoped executor.
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  addWireBox3D,
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

export default function separateHarms(s, c) {
  const pulse = s.value(0);
  const removeNotes = s.value(0);
  const sinksHi = s.value(0);
  const splitExec = s.value(0);

  const header = cinemaHeader(
    'LETHAL TRIFECTA & SINK ISOLATION',
    'Close each path to a',
    'protected effect',
    { accent: ROLE.attack, size: 48 },
  );

  const stageAura = aura(300, 20, 640, '#ff6b8b1e', '#a78bfa1c');

  const rig3d = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 0.65],
  }).at(300, 30);

  rig3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Center prism: Influenced Reader Model
  addBox3D(rig3d, -0.75, -0.65, 0.05, 1.5, 1.3, 1.15, ROLE.untrusted, ROLE.untrusted);

  // Left-front prism: Private Notes (removed in Beat 0 to close exfiltration leg)
  const privateSolid = addBox3D(
    rig3d,
    -2.9,
    -2.1,
    0.05,
    1.3,
    1.1,
    0.9,
    ROLE.approval,
    ROLE.approval,
  );
  const privateWire = hideNodes(
    addWireBox3D(rig3d, -2.9, -2.1, 0.05, 1.3, 1.1, 0.9, COSMOS.dim, { opacity: 0.55 }),
  );

  // Right-front prism: External Egress Sink (disclosure leg)
  addBox3D(rig3d, 1.6, -2.1, 0.05, 1.3, 1.1, 0.95, ROLE.attack, ROLE.attack);

  // Disclosure arcs (Private -> Model -> Egress), severed when notes removed
  const disclosureArcs = [
    ...addArc3D(rig3d, [-1.6, -1.55, 0.95], [-0.4, -0.4, 1.18], ROLE.approval, {
      lift: 0.65,
      pulseVal: pulse,
      phaseOffset: 0,
    }),
    ...addArc3D(rig3d, [0.4, -0.4, 1.18], [1.6, -1.55, 0.98], ROLE.attack, {
      lift: 0.75,
      pulseVal: pulse,
      phaseOffset: 0.35,
      width: 3.4,
    }),
  ];

  // Back-right prism: Independent Production Write Sink (SURVIVES removing private notes!)
  addBox3D(rig3d, 1.6, 1.1, 0.05, 1.4, 1.2, 1.1, ROLE.focus, ROLE.focus);
  const writeArc = addArc3D(rig3d, [0.4, 0.45, 1.18], [1.6, 1.7, 1.12], ROLE.attack, {
    lift: 0.85,
    pulseVal: pulse,
    phaseOffset: 0.6,
    width: 3.6,
  });

  // Back-left prism: Scoped Executor (illuminates on Beat 2 with narrow release credential)
  const executorPrism = hideNodes([
    ...addBox3D(rig3d, -2.9, 1.1, 0.05, 1.45, 1.15, 1.05, ROLE.ok, ROLE.ok, {
      faceOpacity: 0.86,
      edgeGlow: 9,
    }),
    ...addArc3D(rig3d, [-1.45, 1.68, 1.08], [1.6, 1.7, 1.12], ROLE.ok, {
      lift: 0.95,
      pulseVal: pulse,
      phaseOffset: 0.2,
      width: 3.4,
    }),
  ]);

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const rn = removeNotes.value;
      const sh = sinksHi.value;
      const sp = splitExec.value;
      const nodes = [];

      // 3D viewport legend
      nodes.push(
        txt(
          'VIOLET: PRIVATE NOTES  ·  AMBER: READER  ·  ROSE/GOLD: PROTECTED SINKS',
          300,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          sp > 0.4
            ? 'EMERALD EXECUTOR HOLDS SCOPED CREDENTIAL · READER HAS 0 WRITE TOOLS'
            : rn > 0.4
              ? 'DISCLOSURE LEG CLOSED · PRODUCTION WRITE PATH STILL CONNECTED'
              : 'WILLISON LETHAL TRIFECTA + INDEPENDENT WRITE PATH',
          300,
          435,
          26,
          sp > 0.4 ? ROLE.ok : rn > 0.4 ? ROLE.focus : ROLE.attack,
          'mono',
          'center',
        ),
      );

      // Left diagnostic narrative column (zero rectangular bullet cards)
      nodes.push(
        energyRail(-855, -185, 28, rn > 0.3 ? ROLE.ok : ROLE.attack, { width: 5 }),
        txt('1. DISCLOSURE PATH (TRIFECTA)', -825, -162, 26, ROLE.approval, 'mono', 'left'),
        txt('Private data + untrusted text + egress', -825, -108, 26, COSMOS.ink, 'sans', 'left'),
        txt(
          rn > 0.3
            ? 'Remove private notes -> direct leak closed'
            : 'Report redirects reader to send notes',
          -825,
          -56,
          26,
          rn > 0.3 ? ROLE.ok : ROLE.attack,
          'mono',
          'left',
        ),
        txt('Still enforce destination policy', -825, -6, 26, COSMOS.muted, 'sans', 'left'),
      );

      nodes.push(
        line([-855, 48], [-290, 48], { stroke: '#28385f', width: 2 }),
        energyRail(-855, 72, 232, sh > 0.3 ? ROLE.focus : '#334673', {
          width: 5,
          opacity: 0.45 + sh * 0.55,
        }),
        txt(
          '2. INDEPENDENT WRITE & SINKS',
          -825,
          95,
          26,
          sh > 0.3 ? ROLE.focus : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          'Bad deployment needs ZERO secrets',
          -825,
          145,
          26,
          sh > 0.3 ? ROLE.attack : COSMOS.dim,
          'sans',
          'left',
        ),
        txt(
          'Answers · URLs · tool args · memory · logs · HTTP',
          -825,
          196,
          26,
          sh > 0.3 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      nodes.push(
        energyRail(-855, 272, 412, sp > 0.3 ? ROLE.ok : '#334673', {
          width: 5,
          opacity: 0.45 + sp * 0.55,
        }),
        txt(
          '3. LEAST-PRIVILEGE SPLIT',
          -825,
          296,
          26,
          sp > 0.3 ? ROLE.ok : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          'Reader: report only · Executor: scoped credential',
          -825,
          348,
          26,
          sp > 0.3 ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ),
        txt(
          'Enforce OS file & network sandboxes on process',
          -825,
          394,
          26,
          sp > 0.3 ? ROLE.host : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.24, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on(
    'pi-separate-harms-0',
    () => {
      const t = c.cue('pi-separate-harms-0').start + 4.5;
      s.play(removeNotes.to(1, { duration: clampDur(c, t, 0.6) }));
      fadeOutNodes(s, c, t, [...privateSolid, ...disclosureArcs], 0.45);
      fadeInNodes(s, c, t, privateWire, 0.45);
    },
    4.5,
  );
  c.on('pi-separate-harms-1', () => {
    s.play(sinksHi.to(1, { duration: clampDur(c, c.cue('pi-separate-harms-1').start, 0.45) }));
  });
  c.on('pi-separate-harms-2', () => {
    const t = c.cue('pi-separate-harms-2').start;
    s.play(splitExec.to(1, { duration: clampDur(c, t, 0.5) }));
    fadeOutNodes(s, c, t, writeArc, 0.35);
    fadeInNodes(s, c, t, executorPrism, 0.5);
  });
}
