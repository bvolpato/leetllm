// Scene 06: select: "Expose the tools for the current phase"
// Five catalog tools on left, live phase allowlist filter in middle, exposed prompt schemas on right.
// Shifts Investigate -> Propose -> Unknown, plus backend execution-authorization boundary.
import {
  COSMOS,
  ROLE,
  aura,
  chip,
  cornerBrackets,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  selectTools,
  tools,
  txt,
} from '../parts.mjs';

export default function select(s, c) {
  const phaseState = s.value(0); // 0 = investigate, 1 = propose, 2 = unknown
  const promptGlow = s.value(0);
  const authGate = s.value(0);

  const bgAura = aura(0, 0, 800, '#1e164028', '#14335a26');
  const title = heroTitle(['Expose the tools', 'for the current phase'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.tool,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ps = phaseState.value;
    const pg = ease(promptGlow.value);
    const ag = ease(authGate.value);

    const phase = ps < 0.5 ? 'investigate' : ps < 1.5 ? 'propose' : 'unknown';
    const eligible = selectTools(phase);
    const phaseColor =
      phase === 'investigate' ? ROLE.evidence : phase === 'propose' ? ROLE.note : ROLE.poison;

    const nodes = [
      txt('AVAILABLE TOOL CATALOG (5)', -855, -240, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
      txt('ACTIVE PHASE POLICY', 0, -240, 26, phaseColor, 'mono', 'center').opacity(alpha),
      txt('EXPOSED IN PROMPT', 560, -240, 26, ROLE.tool, 'mono', 'center').opacity(alpha),

      // Center phase dial
      cornerBrackets(0, -40, 390, 220, phaseColor, { arm: 28, width: 3.2, opacity: alpha }),
      txt('phase:', 0, -90, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(phase, 0, -20, 46, phaseColor, 'mono', 'center').glow(9, phaseColor).opacity(alpha),
      txt(
        `${eligible.length} of ${tools.length} eligible`,
        0,
        42,
        28,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),

      glowArrow([-370, -40], [-225, -40], phaseColor, { opacity: alpha }),
      glowArrow([225, -40], [340, -40], phaseColor, { opacity: alpha }),

      // Right prompt bracket
      cornerBrackets(590, 10, 460, 440, pg > 0.2 ? phaseColor : ROLE.tool, {
        arm: 30,
        width: 3,
        opacity: alpha,
      }),
    ];

    // Left 5 tools
    tools.forEach((toolName, i) => {
      const y = -150 + i * 98;
      const on = eligible.includes(toolName);
      nodes.push(
        chip(toolName, -620, y, {
          color: on ? phaseColor : ROLE.dim,
          fill: on ? '#122038' : '#0b1020',
          size: 27,
          h: 60,
          minW: 410,
          glow: on ? 10 : 0,
          textColor: on ? COSMOS.ink : COSMOS.dim,
          opacity: alpha * (on ? 1 : 0.55),
        }),
      );
    });

    // Right exposed schemas
    if (eligible.length > 0) {
      eligible.forEach((toolName, i) => {
        const y = -80 + i * 118;
        nodes.push(
          chip(toolName, 590, y, {
            color: phaseColor,
            fill: '#13243e',
            size: 28,
            h: 66,
            minW: 380,
            glow: 11,
            opacity: alpha * (0.65 + 0.35 * pg),
          }),
        );
      });
    } else {
      nodes.push(
        txt('Empty tool set (0)', 590, -10, 34, ROLE.poison, 'mono', 'center').opacity(alpha),
        txt('Unknown phase exposes nothing', 590, 50, 26, COSMOS.muted, 'sans', 'center').opacity(
          alpha,
        ),
      );
    }

    // Bottom execution-authorization boundary
    nodes.push(
      cornerBrackets(0, 290, 440, 118, ag > 0.3 ? ROLE.units : ROLE.rule, {
        arm: 22,
        width: 2.6,
        opacity: alpha * (0.5 + 0.5 * ag),
      }),
      txt(
        'BACKEND AUTH GATE',
        0,
        266,
        26,
        ag > 0.3 ? ROLE.units : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * ag)),
      txt('Identity + permission check', 0, 314, 26, COSMOS.ink, 'sans', 'center').opacity(
        alpha * (0.5 + 0.5 * ag),
      ),
      txt(
        ag > 0.3
          ? 'Hiding a schema organizes context; backend enforces authorization on every call.'
          : 'Progressive disclosure cuts irrelevant tool choices and schema tokens.',
        0,
        420,
        30,
        ag > 0.3 ? ROLE.units : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'select-beat-1-focus-1', (d) => s.play(phaseState.to(0, { duration: d })));
  playCue(s, c, 'ce-core-read-tools', (d) => s.play(promptGlow.to(1, { duration: d })));
  playCue(s, c, 'select-proposal', (d) => s.play(phaseState.to(1, { duration: d })));
  playCue(s, c, 'select-beat-2-focus-1', (d) => s.play(promptGlow.to(1, { duration: d })));
  playCue(s, c, 'select-beat-3-focus-1', (d) => {
    s.play(phaseState.to(2, { duration: d }));
    s.play(authGate.to(1, { duration: d }));
  });
}
