// Scene 1: subject-intro - Is River Walk available today?
// Orbiting 3D Model -> Runtime -> Library Catalog prism rig with glowing call-ID beam.
// Strict prediction withholding on BOTH copy count (Beat 0 -> Beat 1) and hold status (Beat 2 -> Beat 3).
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
  guardedDynamic,
  hideNodes,
  observationTrace,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const trace = observationTrace();
  const pulse = s.value(0);
  const reqOn = s.value(0);
  const qCountOn = s.value(0);
  const dispOn = s.value(0);
  const copiesReveal = s.value(0);
  const retOn = s.value(0);
  const linkReveal = s.value(0);
  const qHoldOn = s.value(0);
  const holdReveal = s.value(0);

  const header = cinemaHeader('FUNCTION CALLING & TOOL USE', 'Is River Walk', 'available today?', {
    accent: ROLE.runtime,
    size: 50,
  });

  const stageAura = aura(300, 30, 620, '#5ce1e622', '#60a5fa1a');

  // 3D Orbiting Rig: Model Prism (left), Host Gate (center), Library Catalog (right)
  const rig3d = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 14.8,
    unit: 114,
    focus: [0, 0, 0.65],
  }).at(310, 20);

  rig3d.add(
    gridPlane3d({
      x: [-3.6, 3.6],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Model proposal prism (blue), Host app gate (cyan), Library catalog (emerald)
  addBox3D(rig3d, -3.1, -0.7, 0.04, 1.35, 1.4, 1.05, ROLE.proposal, ROLE.proposal);
  addBox3D(rig3d, -0.7, -0.7, 0.04, 1.4, 1.4, 1.25, ROLE.runtime, ROLE.runtime);
  addBox3D(rig3d, 1.75, -0.7, 0.04, 1.45, 1.4, 1.15, ROLE.server, ROLE.server);

  // Outbound dispatch arc (Model -> Host -> Library)
  const dispatchArc = hideNodes([
    ...addArc3D(rig3d, [-1.75, 0, 1.08], [0.0, 0, 1.32], ROLE.proposal, {
      lift: 0.65,
      pulseVal: pulse,
      phaseOffset: 0.0,
    }),
    ...addArc3D(rig3d, [0.7, 0, 1.3], [2.45, 0, 1.22], ROLE.runtime, {
      lift: 0.7,
      pulseVal: pulse,
      phaseOffset: 0.3,
    }),
  ]);

  // 3 glowing copy cubes atop the Library prism (revealed AFTER intro-copies!)
  const copyCubes = hideNodes([
    ...addBox3D(rig3d, 1.82, -0.55, 1.28, 0.36, 1.1, 0.52, ROLE.ok, ROLE.ok, {
      faceOpacity: 0.88,
      edgeGlow: 9,
    }),
    ...addBox3D(rig3d, 2.28, -0.55, 1.28, 0.36, 1.1, 0.52, ROLE.ok, ROLE.ok, {
      faceOpacity: 0.88,
      edgeGlow: 9,
    }),
    ...addBox3D(rig3d, 2.74, -0.55, 1.28, 0.36, 1.1, 0.52, ROLE.ok, ROLE.ok, {
      faceOpacity: 0.88,
      edgeGlow: 9,
    }),
  ]);

  // Return observation arc carrying call_id read-7
  const returnArc = hideNodes([
    ...addArc3D(rig3d, [2.45, 0.45, 1.25], [-2.4, 0.45, 1.12], ROLE.key, {
      lift: 1.25,
      pulseVal: pulse,
      phaseOffset: 0.55,
      width: 3.6,
    }),
  ]);

  // Separate reservation write slot prism (wireframe until hold reveal)
  const holdPrism = hideNodes([
    ...addWireBox3D(rig3d, -0.7, 1.25, 0.04, 1.4, 0.9, 0.78, ROLE.focus, {
      width: 2.4,
      glow: 8,
    }),
  ]);

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const rq = reqOn.value;
      const qc = qCountOn.value;
      const dp = dispOn.value;
      const cp = copiesReveal.value;
      const rt = retOn.value;
      const lk = linkReveal.value;
      const qh = qHoldOn.value;
      const hr = holdReveal.value;
      const nodes = [];

      // 3D Rig Legend (top & bottom of right half)
      nodes.push(
        txt(
          'MODEL (BLUE)  ->  HOST APP (CYAN)  ->  CATALOG (GREEN)',
          310,
          -420,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          hr > 0.4
            ? 'WRITE TOOL: place_hold(B7) REQUIRES SEPARATE PERMISSION'
            : 'READ TOOL: lookup_book(book_id="B7")',
          310,
          435,
          26,
          hr > 0.4 ? ROLE.focus : ROLE.runtime,
          'mono',
          'center',
        ),
      );

      // Left Optical Telemetry Rails (zero box cards)
      nodes.push(
        energyRail(-855, -210, 80, rq > 0.3 ? ROLE.proposal : '#2b3b64'),
        txt('MODEL PROPOSAL', -825, -195, 26, ROLE.proposal, 'mono', 'left'),
        txt(
          `tool: ${trace.call.tool}  ·  book_id: "${trace.call.arguments.book_id}"`,
          -825,
          -142,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(`call_id: "${trace.call.call_id}"`, -825, -90, 28, ROLE.key, 'mono', 'left').glow(
          rq > 0.4 ? 7 : 0,
          ROLE.key,
        ),
        txt(
          dp > 0.4 ? 'HOST: checked book_id + read scope -> dispatched' : 'HOST: awaiting dispatch',
          -825,
          -34,
          26,
          dp > 0.4 ? ROLE.runtime : COSMOS.dim,
          'sans',
          'left',
        ),
        txt(
          rt > 0.4 ? `REPLY: call_id "${trace.serviceResult.call_id}" returned` : 'REPLY: none yet',
          -825,
          20,
          26,
          rt > 0.4 ? ROLE.key : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Divider rule
      nodes.push(line([-855, 108], [-250, 108], { stroke: '#25355a', width: 2 }));

      // Available copies field (strictly withheld until intro-copies!)
      nodes.push(
        energyRail(-855, 138, 255, lk > 0.4 ? ROLE.ok : ROLE.focus),
        txt('AVAILABLE COPIES', -825, 152, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          cp > 0.5
            ? lk > 0.5
              ? `${trace.serviceResult.available_copies} copies  (read-7 == read-7)`
              : `${trace.serviceResult.available_copies} copies in catalog`
            : qc > 0.3
              ? '?   Can Lena tell yet?'
              : '?',
          -825,
          212,
          34,
          cp > 0.5 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        ).glow(8, cp > 0.5 ? ROLE.ok : ROLE.focus),
      );

      // Reservation field (separate, strictly withheld until intro-hold!)
      nodes.push(
        energyRail(-855, 290, 415, hr > 0.4 ? ROLE.focus : '#33456f'),
        txt('RESERVATION FIELD', -825, 306, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          hr > 0.5
            ? 'Separate write tool + write permission'
            : qh > 0.3
              ? '?   Did lookup set a copy aside?'
              : 'unreserved  (read-only lookup)',
          -825,
          366,
          30,
          hr > 0.5 || qh > 0.3 ? ROLE.focus : COSMOS.dim,
          hr > 0.5 ? 'mono' : 'serif',
          'left',
        ).glow(qh > 0.3 || hr > 0.5 ? 7 : 0, ROLE.focus),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('intro-request', () => {
    s.play(reqOn.to(1, { duration: clampDur(c, c.cue('intro-request').start, 0.35) }));
  });
  c.on('intro-count-question', () => {
    s.play(qCountOn.to(1, { duration: clampDur(c, c.cue('intro-count-question').start, 0.3) }));
  });
  c.on('intro-dispatch', () => {
    const t = c.cue('intro-dispatch').start;
    s.play(dispOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, dispatchArc, 0.35);
  });
  // Strict prediction withholding #1: reveal 3 copies AFTER intro-copies!
  c.after('intro-copies', () => {
    const t = c.cue('intro-copies').end;
    s.play(copiesReveal.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, copyCubes, 0.35);
  });
  c.on('intro-return', () => {
    const t = c.cue('intro-return').start;
    s.play(retOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, returnArc, 0.35);
  });
  c.after('intro-link', () => {
    s.play(linkReveal.to(1, { duration: clampDur(c, c.cue('intro-link').end, 0.3) }));
  });
  c.on('intro-hold-question', () => {
    const t = c.cue('intro-hold-question').start;
    s.play(qHoldOn.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, holdPrism, 0.35);
  });
  // Strict prediction withholding #2: reveal separate write tool AFTER intro-hold!
  c.after('intro-hold', () => {
    s.play(holdReveal.to(1, { duration: clampDur(c, c.cue('intro-hold').end, 0.35) }));
  });
}
