// Scene 21: ready-recovery: Per-modality idempotent retry (I17 fails while T17 stays ready), policy split, and canary rollback.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function readyRecovery(s, c) {
  const showRetry = s.value(0);
  const showPolicy = s.value(0);
  const showCanary = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#2a163024');
  const title = heroTitle(['Retry One Failed Modality', 'Without Inventing Evidence'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rt = showRetry.value;
    const pl = showPolicy.value;
    const cn = showCanary.value;

    const nodes = [
      // Top section: Per-modality state machine
      txt(
        '1. INDEPENDENT MODALITY STAGE KEYS',
        -855,
        -245,
        26,
        ROLE.vision,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('I17 Image: FAILED -> RETRY (same key)', -430, -160, {
        w: 820,
        h: 72,
        color: rt > 0.3 ? ROLE.warn : '#384c76',
        fill: rt > 0.3 ? '#2c1422' : '#10182d',
        size: 26,
        glow: rt > 0.3 ? 12 : 4,
        opacity: alpha,
      }),
      chipPill('T17 Transcript: READY (preserved!)', 455, -160, {
        w: 790,
        h: 72,
        color: rt > 0.3 ? ROLE.ok : '#384c76',
        fill: rt > 0.3 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: rt > 0.3 ? 12 : 4,
        opacity: alpha,
      }),

      // Middle section: Question-scoped policy split
      txt('2. QUESTION-SCOPED EVIDENCE POLICY', -855, -45, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.55 + 0.45 * pl),
      ),
      chipPill('Q: "What did operator say?"', -555, 38, {
        w: 580,
        h: 66,
        color: ROLE.text,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * pl),
      }),
      arrow([-245, 38], [-115, 38], { stroke: ROLE.gold, width: 3, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * pl),
      ),
      chipPill('Partial Answer (name missing chart)', 355, 38, {
        w: 910,
        h: 66,
        color: pl > 0.3 ? ROLE.gold : '#384c76',
        fill: pl > 0.3 ? '#2c2210' : '#10182d',
        size: 26,
        glow: pl > 0.3 ? 10 : 4,
        opacity: alpha * (0.55 + 0.45 * pl),
      }),

      chipPill('Q: "Did chart latency rise?"', -555, 126, {
        w: 580,
        h: 66,
        color: ROLE.vision,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * pl),
      }),
      arrow([-245, 126], [-115, 126], { stroke: ROLE.warn, width: 3, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * pl),
      ),
      chipPill('Wait / Review / Abstain (never guess!)', 355, 126, {
        w: 910,
        h: 66,
        color: pl > 0.3 ? ROLE.warn : '#384c76',
        fill: pl > 0.3 ? '#2c1422' : '#10182d',
        size: 26,
        glow: pl > 0.3 ? 10 : 4,
        opacity: alpha * (0.55 + 0.45 * pl),
      }),

      // Bottom section: Staged rollout with dual feature generations
      txt(
        '3. STAGED ROLLOUT & VERSIONED FEATURE ROLLBACK',
        -855,
        220,
        26,
        cn > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * cn)),
      chipPill('Frozen Eval', -715, 298, {
        w: 270,
        h: 64,
        color: cn > 0.3 ? ROLE.vision : '#384c76',
        size: 26,
        opacity: alpha * (0.55 + 0.45 * cn),
      }),
      arrow([-565, 298], [-485, 298], { stroke: ROLE.vision, width: 2.8, head: 10 }).opacity(
        alpha * (0.5 + 0.5 * cn),
      ),
      chipPill('Shadow', -355, 298, {
        w: 230,
        h: 64,
        color: cn > 0.3 ? ROLE.bridge : '#384c76',
        size: 26,
        opacity: alpha * (0.55 + 0.45 * cn),
      }),
      arrow([-225, 298], [-145, 298], { stroke: ROLE.bridge, width: 2.8, head: 10 }).opacity(
        alpha * (0.5 + 0.5 * cn),
      ),
      chipPill('Tenant Canary', 25, 298, {
        w: 310,
        h: 64,
        color: cn > 0.3 ? ROLE.gold : '#384c76',
        size: 26,
        opacity: alpha * (0.55 + 0.45 * cn),
      }),
      arrow([195, 298], [275, 298], { stroke: ROLE.ok, width: 2.8, head: 10 }).opacity(
        alpha * (0.5 + 0.5 * cn),
      ),
      chipPill('Old/New Pointer Rollback', 570, 298, {
        w: 560,
        h: 64,
        color: cn > 0.3 ? ROLE.ok : '#384c76',
        fill: cn > 0.3 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: cn > 0.3 ? 10 : 4,
        opacity: alpha * (0.55 + 0.45 * cn),
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-ready-recovery-0', (d) => s.play(showRetry.to(1, { duration: d })));
  playCue(s, c, 'mm-ready-recovery-1', (d) => s.play(showPolicy.to(1, { duration: d })));
  playCue(s, c, 'mm-ready-recovery-2', (d) => s.play(showCanary.to(1, { duration: d })));
}
