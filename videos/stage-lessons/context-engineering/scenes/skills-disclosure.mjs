// Scene 19: skills-disclosure: "Load metadata, one procedure and only the needed resource"
// Sequential 3-tier Agent Skills disclosure via swapVis:
// B0: Directory layout (SKILL.md frontmatter + optional references/, scripts/, assets/)
// B1: Activation transfers chosen body, one reference, and script output (script source stays out!)
// B2: Accounting rail: 6 x 80 = 480 metadata + 2,200 body + 400 ref + 120 output = 3,200 units.
import {
  COSMOS,
  ROLE,
  SKILL_METADATA,
  SKILL_TOTAL,
  SKILL_UNITS,
  aura,
  chip,
  cornerBrackets,
  ease,
  fmt,
  glowArrow,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  tokenRail,
  txt,
} from '../parts.mjs';

export default function skillsDisclosure(s, c) {
  const vDir = s.value(1);
  const vFlow = s.value(0);
  const vMath = s.value(0);
  const dirPulse = s.value(0.35);
  const loadBody = s.value(0);
  const loadRef = s.value(0);
  const loadOut = s.value(0);
  const showMeta = s.value(0);
  const showTotal = s.value(0);

  const bgAura = aura(0, 0, 820, '#1e16402a', '#14335c26');
  const title = heroTitle(['Progressive disclosure', 'for Agent Skills'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tool,
  });

  const eq = glowTex(String.raw`6 \times 80 + 2{,}200 + 400 + 120 = 3{,}200\text{ units}`, {
    x: 0,
    y: 215,
    size: 42,
    color: ROLE.note,
    glow: 8,
  });

  // B0: Skill directory package
  const dirLayer = guardedDynamic(vDir, (alpha) => {
    const dp = ease(dirPulse.value);
    const items = [
      ['SKILL.md', 'Required: name + trigger description; body loaded on match', ROLE.evidence],
      ['references/', 'Optional: detailed specs read only when needed', ROLE.cache],
      ['scripts/', 'Optional: executable helpers (run outside context)', ROLE.note],
      ['assets/', 'Optional: templates or non-executable files', ROLE.tool],
    ];
    const nodes = [
      txt(
        'AGENT SKILL PACKAGE: incident-skill/',
        -855,
        -230,
        30,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
    ];
    items.forEach(([name, desc, col], i) => {
      const y = -125 + i * 102;
      nodes.push(
        chip(name, -660, y, {
          color: col,
          size: 28,
          h: 60,
          minW: 340,
          opacity: alpha * (0.65 + 0.35 * dp),
        }),
        txt(desc, -445, y, 29, COSMOS.ink, 'sans', 'left').opacity(alpha),
      );
    });
    nodes.push(
      txt(
        'Spec guidance (~100 metadata tokens, <5,000 body) != measured counts for every runtime.',
        0,
        355,
        29,
        ROLE.units,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // B1: Activation flow into model working set (script source stays with executor)
  const flowLayer = guardedDynamic(vFlow, (alpha) => {
    const bd = ease(loadBody.value);
    const rf = ease(loadRef.value);
    const ot = ease(loadOut.value);

    const nodes = [
      txt('INSTALLED SKILL ON DISK', -560, -235, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('MODEL WORKING SET', 520, -235, 26, ROLE.evidence, 'mono', 'center').opacity(alpha),
      cornerBrackets(520, 45, 680, 470, ROLE.evidence, { arm: 32, width: 3, opacity: alpha }),

      // Row 1: Body
      chip('SKILL.md body', -560, -110, { color: ROLE.cache, size: 28, minW: 440, opacity: alpha }),
      glowArrow([-320, -110], [150, -110], ROLE.cache, { opacity: alpha * (0.4 + 0.6 * bd) }),
      chip('Active procedure body', 520, -110, {
        color: ROLE.cache,
        size: 28,
        minW: 520,
        opacity: alpha * (0.4 + 0.6 * bd),
      }),

      // Row 2: Needed reference
      chip('references/handoff.md', -560, 20, {
        color: ROLE.evidence,
        size: 28,
        minW: 440,
        opacity: alpha,
      }),
      glowArrow([-320, 20], [150, 20], ROLE.evidence, { opacity: alpha * (0.4 + 0.6 * rf) }),
      chip('1 needed reference', 520, 20, {
        color: ROLE.evidence,
        size: 28,
        minW: 520,
        opacity: alpha * (0.4 + 0.6 * rf),
      }),

      // Row 3: Script executes -> only output enters
      chip('scripts/check.py (source stays)', -560, 150, {
        color: ROLE.units,
        size: 26,
        minW: 480,
        opacity: alpha,
      }),
      glowArrow([-300, 150], [150, 150], ROLE.note, { opacity: alpha * (0.4 + 0.6 * ot) }),
      chip('Returned script output', 520, 150, {
        color: ROLE.note,
        size: 28,
        minW: 520,
        opacity: alpha * (0.4 + 0.6 * ot),
      }),

      txt(
        'Script source stays outside context in the documented runtime; returned output still counts.',
        0,
        380,
        29,
        ROLE.units,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  // B2: Assigned accounting rail (480 + 2,200 + 400 + 120 = 3,200)
  const mathLayer = guardedDynamic(vMath, (alpha) => {
    const mt = ease(showMeta.value);
    const tt = ease(showTotal.value);

    const x0 = -855;
    const railW = 1710;
    const nodes = [
      txt(
        'ACTIVE SKILL ACCOUNTING (6 INSTALLED SKILLS, 1 ACTIVATED)',
        x0,
        -230,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      tokenRail({
        x0,
        y: -130,
        width: railW,
        total: SKILL_TOTAL,
        height: 76,
        segments: [
          { units: SKILL_METADATA, color: ROLE.units, alpha: 0.5 + 0.5 * mt },
          { units: SKILL_UNITS.body, color: ROLE.cache, alpha: 0.45 + 0.55 * tt },
          { units: SKILL_UNITS.reference, color: ROLE.evidence, alpha: 0.45 + 0.55 * tt },
          { units: SKILL_UNITS.output, color: ROLE.note, alpha: 0.45 + 0.55 * tt },
        ],
        opacity: alpha,
      }),

      chip(`Metadata 6x80 = ${SKILL_METADATA}`, -640, 25, {
        color: ROLE.units,
        size: 26,
        minW: 390,
        opacity: alpha,
      }),
      chip(`Body = ${fmt(SKILL_UNITS.body)}`, -195, 25, {
        color: ROLE.cache,
        size: 26,
        minW: 320,
        opacity: alpha,
      }),
      chip(`Ref = ${SKILL_UNITS.reference}`, 205, 25, {
        color: ROLE.evidence,
        size: 26,
        minW: 260,
        opacity: alpha,
      }),
      chip(`Output = ${SKILL_UNITS.output}`, 595, 25, {
        color: ROLE.note,
        size: 26,
        minW: 280,
        opacity: alpha,
      }),

      eq.opacity(alpha * (0.4 + 0.6 * tt)),

      txt(
        tt > 0.4
          ? `Active total: ${fmt(SKILL_TOTAL)} units (5 unselected skill bodies stay out).`
          : `Six skill metadata headers total ${SKILL_METADATA} units.`,
        0,
        365,
        32,
        tt > 0.4 ? ROLE.note : ROLE.units,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, dirLayer, flowLayer, mathLayer);

  playCue(s, c, 'ce-skills-disclosure-1', (d) => s.play(dirPulse.to(1, { duration: d })));
  playCue(s, c, 'ce-skills-disclosure-2', (d) => s.play(swapVis(vDir, vFlow, d)));
  playCue(s, c, 'ce-skill-body', (d) => s.play(loadBody.to(1, { duration: d })));
  playCue(s, c, 'ce-skill-reference', (d) => s.play(loadRef.to(1, { duration: d })));
  playCue(s, c, 'ce-skill-script-output', (d) => s.play(loadOut.to(1, { duration: d })));
  playCue(s, c, 'ce-skills-disclosure-3', (d) => s.play(swapVis(vFlow, vMath, d)));
  playCue(s, c, 'ce-skill-metadata', (d) => s.play(showMeta.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'ce-skill-total', (d) => s.play(showTotal.to(1, { duration: d })), { after: true });
}
