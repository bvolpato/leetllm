// Scene 03: Two reviewers read the same replies: split ballots, rubric strict label vs soft rate q = 0.5.
import {
  COSMOS,
  aura,
  circle,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  remainDuration,
  runPhase,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function humanComparisons(s, c) {
  const phase = s.value(0);
  const vote1 = s.value(0.3);
  const vote2 = s.value(0.15);
  const splitShown = s.value(0);
  const rubricOn = s.value(0);
  const keepBoth = s.value(0);

  const bgAura = aura(150, 20, 560, '#a78bfa20', '#6ee7b714');
  const title = heroTitle(['Split Ballots,', 'Two Targets'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.violet,
    eyebrow: 'ANNOTATOR DISAGREEMENT · RUBRIC VS FREQUENCY',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const v1 = vote1.value;
    const v2 = vote2.value;
    const sp = splitShown.value;
    const rb = rubricOn.value;
    const kb = keepBoth.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.2);

    const nodes = [
      // Reviewer 1 orbital node (clean label above/below glowing orb)
      txt('REVIEWER 1', -660, -172, 26, COSMOS.muted, 'mono').opacity(Math.max(0.45, v1)),
      circle(72, { fill: '#0e2226', stroke: COSMOS.emerald, width: 3 })
        .at(-660, -72)
        .glow(8, COSMOS.emerald)
        .opacity(Math.max(0.45, v1)),
      txt('Marks A', -660, -70, 30, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.45, v1)),
      txt('waits for approval', -660, 26, 26, COSMOS.ink, 'sans').opacity(Math.max(0.45, v1)),

      // Reviewer 2 orbital node
      txt('REVIEWER 2', -660, 108, 26, COSMOS.muted, 'mono').opacity(Math.max(0.45, v2)),
      circle(72, { fill: '#221120', stroke: COSMOS.rose, width: 3 })
        .at(-660, 208)
        .glow(8, COSMOS.rose)
        .opacity(Math.max(0.45, v2)),
      txt('Marks B', -660, 210, 30, COSMOS.rose, 'mono')
        .glow(6, COSMOS.rose)
        .opacity(Math.max(0.45, v2)),
      txt('migration is urgent', -660, 306, 26, COSMOS.ink, 'sans').opacity(Math.max(0.45, v2)),

      // Center vote split balance dial (generous radius 158 so text has wide clearance)
      radialDial(-135, 75, 158, 0.5, {
        color: COSMOS.emerald,
        trackColor: COSMOS.rose,
        startDeg: -90,
        sweepDeg: 360,
        width: 12,
        glow: 10 * Math.max(0.4, sp),
        opacity: Math.max(0.55, sp),
      }),
      txt('SPLIT VOTE', -135, 22, 26, COSMOS.muted, 'mono'),
      txt('1 A : 1 B', -135, 76, 36, COSMOS.gold, 'mono').glow(7, COSMOS.gold),
      txt('50% / 50%', -135, 128, 26, COSMOS.ink, 'mono').opacity(Math.max(0.45, sp)),

      // Connecting glowing arcs from reviewers to split dial
      glowingArc([-584, -72], [-298, 40], -35, {
        color: COSMOS.emerald,
        width: 3.4,
        opacity: 0.85 * Math.max(0.35, v1),
      }),
      glowingArc([-584, 208], [-298, 110], 35, {
        color: COSMOS.rose,
        width: 3.4,
        opacity: 0.85 * Math.max(0.35, v2),
      }),

      // Right branch 1: Strict Rubric Label
      glowingArc([28, 30], [235, -135], -40, {
        color: COSMOS.emerald,
        width: 3.6,
        opacity: Math.max(0.35, rb),
      }),
      tokenCell(535, -135, 570, 152, COSMOS.emerald, {
        fill: '#0d2022',
        glow: rb > 0.5 ? 10 : 3,
        opacity: Math.max(0.4, rb),
      }),
      txt('STRICT TRAINING LABEL', 535, -182, 26, COSMOS.emerald, 'mono').opacity(
        Math.max(0.4, rb),
      ),
      txt('Rubric: Approval First → A ≻ B', 535, -130, 28, COSMOS.ink, 'sans').opacity(
        Math.max(0.4, rb),
      ),
      txt('Binary target y = 1', 535, -84, 26, COSMOS.gold, 'mono').opacity(Math.max(0.4, rb)),

      // Right branch 2: Retained Votes -> Soft Target q = 0.5 + Explicit Tie channel
      glowingArc([28, 120], [235, 195], 40, {
        color: COSMOS.violet,
        width: 3.6,
        opacity: Math.max(0.35, kb),
      }),
      tokenCell(535, 195, 570, 172, COSMOS.violet, {
        fill: '#17132c',
        glow: kb > 0.5 ? 10 : 3,
        opacity: Math.max(0.4, kb),
      }),
      txt('RETAINED VOTE RECORD', 535, 138, 26, COSMOS.violet, 'mono').opacity(Math.max(0.4, kb)),
      txt('Soft target: q = 1 / 2', 535, 192, 30, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(Math.max(0.4, kb)),
      txt('Explicit tie / abstention ≠ split', 535, 246, 26, COSMOS.muted, 'sans').opacity(
        Math.max(0.4, kb),
      ),

      // Bottom axis legend for separate label classes
      line([-855, 385], [810, 385], { stroke: '#253355', width: 2 }),
      txt('STRICT WIN', -650, 425, 26, COSMOS.emerald, 'mono'),
      txt('SOFT VOTE q', -110, 425, 26, COSMOS.violet, 'mono'),
      txt('EXPLICIT TIE / ABSTAIN', 540, 425, 26, COSMOS.amber, 'mono'),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('first-vote', () => s.play(vote1.to(1, { duration: 0.45 })));
  c.on('collect-votes', () => s.play(vote2.to(1, { duration: 0.45 })));
  c.on('compare-votes', () => s.play(splitShown.to(1, { duration: 0.45 })));
  c.on('resolve-rubric', () => s.play(rubricOn.to(1, { duration: 0.5 })));
  c.on('retain-votes', () =>
    s.play(keepBoth.to(1, { duration: remainDuration(c, 'retain-votes', 0.55) })),
  );
}
