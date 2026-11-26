// Scene 07: phase-intersection: "Construct the complete article tool intersection"
// MathJax set intersection S_exposed = sort(A_phase \cap T_avail) contrasting the 2-tool miniature
// vs the 3-tool article investigation set, proposal mode, unknown empty set, and unavailable trace_lookup.
import {
  COMPLETE_TOOL_POLICY,
  COSMOS,
  ROLE,
  aura,
  chip,
  completeToolIntersection,
  cornerBrackets,
  crossMark,
  ease,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  selectTools,
  tools,
  txt,
} from '../parts.mjs';

export default function phaseIntersection(s, c) {
  const mode = s.value(0); // 0 = miniature vs full (3), 1 = propose (2), 2 = unknown (0), 3 = trace_lookup down (2), 4 = auth boundary
  const showFull = s.value(0);

  const bgAura = aura(0, 20, 820, '#1e164028', '#14345e26');
  const title = heroTitle(['Complete article', 'tool intersection'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tool,
  });

  const eq = glowTex(
    String.raw`T_{\mathrm{exposed}} = \operatorname{sort}\!\left(A_{\mathrm{phase}} \cap T_{\mathrm{avail}}\right)`,
    { x: 350, y: -395, size: 36, color: ROLE.units, glow: 7 },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const m = mode.value;
    const fl = ease(showFull.value);

    const step = m < 0.5 ? 0 : m < 1.5 ? 1 : m < 2.5 ? 2 : m < 3.5 ? 3 : 4;
    const avail = step === 3 ? tools.filter((t) => t !== 'trace_lookup') : tools;
    const phase = step === 1 ? 'propose' : step === 2 ? 'unknown' : 'investigate';
    const allowlist = COMPLETE_TOOL_POLICY[phase] ?? [];
    const result = completeToolIntersection(phase, avail);
    const mini = selectTools('investigate');

    const activeColor =
      step === 2 ? ROLE.poison : step === 3 ? ROLE.units : step === 4 ? ROLE.note : ROLE.evidence;

    const nodes = [
      eq.opacity(alpha),

      // Top comparison bar: 2-tool miniature vs current article policy
      txt('EARLIER 2-TOOL MINIATURE:', -855, -230, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(mini.join(', '), -395, -230, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),

      txt('COMPLETE ARTICLE PROGRAM', -855, -165, 28, activeColor, 'mono', 'left').opacity(alpha),
      txt(
        step === 0
          ? 'phase = investigate  (all 5 available)'
          : step === 1
            ? 'phase = propose  (all 5 available)'
            : step === 2
              ? 'phase = unknown  ->  empty set'
              : step === 3
                ? 'phase = investigate  (trace_lookup unavailable)'
                : 'Visibility vs backend permission boundary',
        -255,
        -165,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // 5 catalog tools laid in 2 clean columns with membership badges
    const colLeft = -560;
    const colRight = 560;

    nodes.push(
      txt('CATALOG & AVAILABILITY', colLeft, -90, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      txt('SORTED INTERSECTION', colRight, -90, 26, activeColor, 'mono', 'center').opacity(alpha),
      cornerBrackets(colRight, 115, 560, 340, activeColor, { arm: 30, width: 3, opacity: alpha }),
    );

    tools.forEach((toolName, i) => {
      const y = -15 + i * 82;
      const isAvail = avail.includes(toolName);
      const inAllow = allowlist.includes(toolName);
      const kept = result.includes(toolName);

      const chipCol = !isAvail ? ROLE.poison : kept ? activeColor : inAllow ? ROLE.units : ROLE.dim;

      nodes.push(
        chip(toolName, colLeft, y, {
          color: chipCol,
          size: 26,
          h: 54,
          minW: 360,
          glow: kept ? 9 : 0,
          textColor: kept ? COSMOS.ink : !isAvail ? ROLE.poison : COSMOS.dim,
          opacity: alpha * (kept ? 1 : 0.62),
        }),
        txt(
          !isAvail ? 'offline' : inAllow ? 'in policy' : 'off-phase',
          colLeft + 215,
          y,
          26,
          !isAvail ? ROLE.poison : inAllow ? ROLE.note : COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
      );
      if (!isAvail) nodes.push(crossMark(colLeft - 215, y, 22, ROLE.poison, alpha));
    });

    // Right sorted intersection output
    if (result.length === 0) {
      nodes.push(
        txt('{ }  (0 tools exposed)', colRight, 115, 34, ROLE.poison, 'mono', 'center').opacity(
          alpha,
        ),
      );
    } else {
      result.forEach((toolName, idx) => {
        const y = 20 + idx * 92;
        nodes.push(
          chip(`${idx + 1}. ${toolName}`, colRight, y, {
            color: activeColor,
            size: 27,
            h: 58,
            minW: 440,
            glow: 10,
            opacity: alpha * (0.65 + 0.35 * fl),
          }),
        );
      });
    }

    // Bottom takeaway
    const footer =
      step === 4
        ? 'Prompt visibility and execution permission are separate backend checks.'
        : step === 3
          ? 'Unavailable tool is dropped without silently substituting another tool.'
          : step === 2
            ? 'Unknown phase maps cleanly to the empty set.'
            : step === 1
              ? 'Proposal mode exposes runbook_search and rollback_advisor.'
              : 'Investigation exposes 3 sorted tools from the 5-tool catalog.';
    nodes.push(txt(footer, 0, 410, 30, activeColor, 'sans', 'center').opacity(alpha));

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-phase-intersection-1', (d) => s.play(showFull.to(0.5, { duration: d })));
  playCue(s, c, 'ce-three-tools', (d) => s.play(showFull.to(1, { duration: d })));
  playCue(s, c, 'ce-phase-intersection-2', (d) => s.play(mode.to(1, { duration: d })));
  playCue(s, c, 'ce-two-tools', (d) => s.play(mode.to(1, { duration: d })));
  playCue(s, c, 'ce-no-tools', (d) => s.play(mode.to(2, { duration: d })));
  playCue(s, c, 'ce-unavailable', (d) => s.play(mode.to(3, { duration: d })));
  playCue(s, c, 'ce-phase-intersection-3', (d) => s.play(mode.to(4, { duration: d })));
}
