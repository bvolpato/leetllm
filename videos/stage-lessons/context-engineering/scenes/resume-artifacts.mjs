// Scene 22: resume-artifacts: "Reconstruct five durable objects before choosing work"
// Five durable restart artifacts feeding a 3-node incident DAG (collect -> verify cause -> write report),
// distinguishing progress-log orientation from trusted work-receipt reuse.
import {
  COSMOS,
  ROLE,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function resumeArtifacts(s, c) {
  const showFive = s.value(0.35);
  const showSplit = s.value(0);
  const showGraph = s.value(0);
  const showNext = s.value(0);

  const bgAura = aura(0, 20, 820, '#14335c2a', '#14352822');
  const title = heroTitle(['Five durable objects', 'before choosing work'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.evidence,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fv = ease(showFive.value);
    const sp = ease(showSplit.value);
    const gr = ease(showGraph.value);
    const nx = ease(showNext.value);

    const artifacts = [
      ['1. Task manifest', 'IDs, deps, acceptance criteria', ROLE.evidence],
      ['2. Progress log', 'Attempts, errors, orientation', ROLE.cache],
      ['3. Bootstrap check', 'Verifies live environment', ROLE.tool],
      ['4. Work receipt', 'Hashes + evaluator + version', ROLE.note],
      ['5. Recovery rule', 'Timeouts, retries, escalation', ROLE.units],
    ];

    const nodes = [
      txt('FIVE RESTART ARTIFACTS', -855, -245, 26, ROLE.evidence, 'mono', 'left').opacity(alpha),
    ];

    // Left stack: 5 durable artifacts (compact, zero overlap)
    artifacts.forEach(([name, desc, col], i) => {
      const y = -165 + i * 96;
      const hi = sp > 0.3 && (i === 1 || i === 3);
      nodes.push(
        chip(name, -665, y, {
          color: col,
          size: 26,
          h: 56,
          minW: 360,
          glow: hi ? 12 : 6,
          opacity: alpha * (0.65 + 0.35 * fv),
        }),
        txt(desc, -455, y, 26, hi ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(
          alpha * (0.65 + 0.35 * fv),
        ),
      );
    });

    // Right top: Orientation vs Reuse split (illuminated in B1)
    const rx = 430;
    nodes.push(
      cornerBrackets(rx, -110, 760, 210, sp > 0.3 ? ROLE.units : ROLE.rule, {
        arm: 26,
        width: 2.8,
        opacity: alpha * (0.55 + 0.45 * sp),
      }),
      txt(
        'ORIENTATION VS REUSE (E.G. LANGGRAPH STORE)',
        rx - 345,
        -172,
        26,
        ROLE.units,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * sp)),
      txt(
        'Progress log -> tells where last shift stopped',
        rx - 345,
        -112,
        27,
        ROLE.cache,
        'sans',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * sp)),
      txt(
        'Work receipt -> proves which result is reusable',
        rx - 345,
        -52,
        27,
        ROLE.note,
        'sans',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * sp)),

      // Right bottom: 3-node Incident DAG (illuminated in B2)
      cornerBrackets(rx, 175, 760, 270, gr > 0.3 ? ROLE.note : ROLE.rule, {
        arm: 26,
        width: 2.8,
        opacity: alpha * (0.55 + 0.45 * gr),
      }),
      txt('INCIDENT WORKFLOW GRAPH', rx - 345, 85, 26, ROLE.evidence, 'mono', 'left').opacity(
        alpha * (0.55 + 0.45 * gr),
      ),
      chip('collect', 175, 175, {
        color: ROLE.note,
        size: 26,
        h: 56,
        minW: 170,
        opacity: alpha * (0.55 + 0.45 * gr),
      }),
      checkMark(175, 118, 22, ROLE.note, alpha * (0.5 + 0.5 * gr)),
      glowArrow([270, 175], [320, 175], ROLE.note, {
        width: 3,
        tip: 12,
        opacity: alpha * (0.5 + 0.5 * gr),
      }),
      chip('verify cause', 435, 175, {
        color: nx > 0.3 ? ROLE.units : ROLE.evidence,
        size: 26,
        h: 56,
        minW: 215,
        glow: nx > 0.3 ? 13 : 5,
        opacity: alpha * (0.55 + 0.45 * gr),
      }),
      glowArrow([552, 175], [602, 175], ROLE.dim, {
        width: 3,
        tip: 12,
        opacity: alpha * (0.5 + 0.5 * gr),
      }),
      chip('report', 695, 175, {
        color: ROLE.dim,
        size: 26,
        h: 56,
        minW: 165,
        opacity: alpha * (0.5 + 0.5 * gr),
      }),
      txt(
        nx > 0.3
          ? 'NEXT READY: verify cause (note "all done" cannot skip receipt)'
          : 'collect has valid receipt -> verify cause unlocks next',
        rx,
        265,
        26,
        nx > 0.3 ? ROLE.units : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * Math.max(gr, nx))),

      txt(
        'Recompute acceptance evidence before selecting the next dependent task.',
        0,
        405,
        30,
        nx > 0.3 ? ROLE.note : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-resume-artifacts-1', (d) => s.play(showFive.to(1, { duration: d })));
  playCue(s, c, 'ce-resume-artifacts-2', (d) => s.play(showSplit.to(1, { duration: d })));
  playCue(s, c, 'ce-resume-artifacts-3', (d) => s.play(showGraph.to(1, { duration: d })));
  playCue(s, c, 'ce-next-ready', (d) => s.play(showNext.to(1, { duration: d })));
}
