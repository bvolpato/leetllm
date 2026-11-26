// Scene 02 (three-paths): "One policy on three paths"
// Orbiting 3D triple-ring architecture (Ingestion / Request / Release) linked by the governing
// EU key policy spine, with live floating policy rules and Luna's readings.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  REVIEWED_PARENT,
  ROLE,
  RULE,
  buildTripleOrbit3d,
  callerTag,
  cinemaAtmosphere,
  glowDot,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  runPhase,
  textLines,
  tweenCue,
  txt,
  wrapLines,
} from '../parts.mjs';

export default function threePaths(s, c) {
  const phase = s.value(0);
  const highlightRule = s.value(0);
  const showInputs = s.value(0);
  const ingestLit = s.value(0);
  const requestLit = s.value(0);
  const releaseLit = s.value(0);
  const memoryLit = s.value(0);

  const { view: orbit3d } = buildTripleOrbit3d(phase, { x: 430, y: 25 });

  const title = heroTitle(['One Policy on', 'Three Paths'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.policy,
    eyebrow: 'THREE LIFETIMES · ONE EVIDENCE PROMISE',
  });

  const ruleLines = wrapLines(REVIEWED_PARENT, 50);

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const hr = highlightRule.value;
    const si = showInputs.value;
    const ing = ingestLit.value;
    const req = requestLit.value;
    const rel = releaseLit.value;
    const mem = memoryLit.value;

    const nodes = [callerTag(1)];

    // Floating governing policy excerpt (left upper band)
    nodes.push(
      lumBar(-435, -125, 840, 232, {
        color: mem > 0.3 ? ROLE.focus : ROLE.policy,
        fillAlpha: 0.08 + Math.max(hr, mem) * 0.07,
        strokeWidth: 2.2 + mem * 1.4,
        glow: 7 + Math.max(hr, mem) * 6,
        radius: 14,
      }),
      txt('GOVERNING POLICY  ·  eu-access/2026-04-01', -830, -210, 26, ROLE.policy, 'mono', 'left'),
      ...textLines(ruleLines, -830, -162, {
        size: 28,
        lineHeight: 40,
        color: COSMOS.ink,
      }),
    );

    // Three explicit pathway tracks on lower-left (clean optical bars, zero bullet boxes)
    const tracks = [
      {
        y: 65,
        name: '1. INGESTION',
        stages: 'Parse  ->  Version  ->  Index',
        color: ROLE.policy,
        lit: ing,
      },
      {
        y: 175,
        name: '2. REQUEST',
        stages: 'Scope  ->  Evidence  ->  Answer',
        color: ROLE.request,
        lit: req,
      },
      {
        y: 285,
        name: '3. RELEASE',
        stages: 'Replay  ->  Evaluate  ->  Promote',
        color: ROLE.admitted,
        lit: rel,
      },
    ];

    tracks.forEach(({ y, name, stages, color, lit }) => {
      const op = 0.36 + 0.64 * lit;
      nodes.push(
        line([-850, y], [-45, y], { stroke: color, width: 2.6 + lit * 2 }).opacity(op * 0.6),
        glowDot(-850 + lit * 795, y, {
          radius: 7 + lit * 3,
          color: lit > 0.4 ? ROLE.focus : color,
          glow: 10 * lit * pulse,
          opacity: op,
        }),
        txt(name, -830, y - 34, 26, color, 'mono', 'left').opacity(op),
        txt(stages, -560, y - 34, 28, COSMOS.ink, 'sans', 'left').opacity(op),
      );
    });

    // Right 3D ring legend labels cleanly outside the 3D sphere
    nodes.push(
      txt('3D LIFETIME ORBITS', 430, -355, 26, ROLE.policy, 'mono', 'center').glow(5, ROLE.policy),
      txt(
        'Index updates change knowledge with frozen weights',
        430,
        352,
        26,
        mem > 0.3 ? ROLE.focus : COSMOS.muted,
        'sans',
        'center',
      ).glow(mem > 0.3 ? 8 : 0, ROLE.focus),
    );

    // Bottom readout: non-overlapping swap between fixture disclaimer and Luna's readings
    const discOp = Math.max(0, 1 - si * 2.6);
    const inpOp = Math.max(0, (si - 0.45) / 0.55);
    if (discOp > 0.02) {
      nodes.push(
        txt(
          'Invented policy limits (14d / 48h) and timings for this worked example',
          -855,
          415,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(discOp),
      );
    }
    if (inpOp > 0.02) {
      nodes.push(
        txt(
          `Luna's request:  ${RULE.requestDays} days stale   /   ${RULE.requestHours}-hour risk signal`,
          -855,
          415,
          34,
          ROLE.focus,
          'mono',
          'left',
        )
          .glow(7, ROLE.focus)
          .opacity(inpOp),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.admitted), orbit3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, orbit3d, { theta: 0.48, phi: 0.96 });

  tweenCue(s, c, 'pr-rule', highlightRule, 1, { dur: 0.55 });
  tweenCue(s, c, 'pr-inputs', showInputs, 1, { dur: 0.65 });
  tweenCue(s, c, 'pr-lifetimes', ingestLit, 1, { dur: 0.9 });
  tweenCue(s, c, 'pr-request', requestLit, 1, { dur: 0.9 });
  tweenCue(s, c, 'pr-release', releaseLit, 1, { dur: 0.9 });
  tweenCue(s, c, 'pr-memory', memoryLit, 1, { dur: 0.6 });
}
