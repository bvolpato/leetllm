// Scene 20: inventory-evidence: /api/tags (present) vs /api/ps (loaded digest/VRAM/ctx) vs controlled inference + mutable tag warning.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function inventoryEvidence(s, c) {
  const showDigest = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Which Record Proves', 'the Worker Can Answer?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const dg = showDigest.value;

    const nodes = [
      txt(
        'THREE LEVELS OF WORKER READINESS EVIDENCE',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('1. /tags (installed)', -615, -100, {
        w: 440,
        h: 82,
        color: ROLE.weights,
        size: 28,
        opacity: alpha,
      }),
      arrow([-385, -100], [-255, -100], { stroke: ROLE.vram, width: 3.5, head: 12 }).opacity(alpha),
      chipPill('2. /ps (loaded + VRAM)', -15, -100, {
        w: 450,
        h: 82,
        color: ROLE.vram,
        size: 28,
        opacity: alpha,
      }),
      arrow([220, -100], [350, -100], { stroke: ROLE.ok, width: 3.5, head: 12 }).opacity(alpha),
      chipPill('3. Controlled Inference', 600, -100, {
        w: 470,
        h: 82,
        color: ROLE.ok,
        fill: '#0f2d24',
        size: 28,
        glow: 10,
        opacity: alpha,
      }),

      txt('ARTIFACT PINNING & MUTABLE TAG DRIFT', -855, 45, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * dg),
      ),
      chipPill(
        'Restart alone keeps bytes; re-pulling a mutable tag can silently swap the model!',
        0,
        145,
        {
          w: 1580,
          h: 78,
          color: dg > 0.3 ? ROLE.work : COSMOS.rule,
          fill: dg > 0.3 ? '#321420' : '#10182d',
          size: 26,
          glow: dg > 0.3 ? 10 : 0,
          opacity: alpha * (0.45 + 0.55 * dg),
        },
      ),
      txt(
        'Record container digest + verified model manifest + tokenizer + template + runtime options',
        0,
        280,
        28,
        dg > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-inventory-evidence-1-0', (d) => s.play(showDigest.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-inventory-evidence-0-0',
    'pl-inventory-evidence-0-1',
    'pl-inventory-evidence-0-2',
    'pl-inventory-evidence-0-3',
    'pl-inventory-evidence-1-1',
    'pl-inventory-evidence-1-2',
    'pl-inventory-evidence-1-3',
  ]);
}
