// Scene 07: synthesis: Prefill allocation trace: 10.0 GB live -> ~14 GB free -> 15 GB buffer OOMs -> smaller chunk drops to 6 GB (fits!).
import {
  COSMOS,
  PREFILL_15,
  PREFILL_6,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const revealOom = s.value(0); // strictly withheld until AFTER large-request!
  const showSmall = s.value(0);
  const showRecord = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['What Failed During Prefill?', 'Workspace Spike vs Smaller Chunks'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.work,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const oom = revealOom.value;
    const sm = showSmall.value;
    const rec = showRecord.value;

    const barX = -780;
    const maxW = 1440;
    const maxGb = 26;
    const px = maxW / maxGb;
    const cap24X = barX + 24 * px;
    const liveW = PREFILL_15.liveGB * px;
    const req15W = 15 * px;
    const req6W = 6 * px;

    const nodes = [
      txt(
        `LIVE ON CARD: ${PREFILL_15.liveGB.toFixed(2)} GB (WEIGHTS + CAPPED KV)  |  FREE: ${PREFILL_15.freeGB.toFixed(2)} GB`,
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      lumBar(cap24X - 2, 0, 4, 230, ROLE.work, { opacity: alpha, glow: 8 }),
      txt('24 GB PHYSICAL LIMIT', cap24X, -155, 26, ROLE.work, 'mono', 'center').opacity(alpha),

      // Row 1: Original 15 GB prefill workspace request
      txt('Original Chunk (+15 GB temp)', -855, -110, 28, ROLE.work, 'mono', 'left').opacity(alpha),
      rect(liveW, 50, { fill: ROLE.weights, stroke: null, radius: 6 })
        .at(barX + liveW * 0.5, -55)
        .opacity(alpha),
      rect(oom > 0.35 ? req15W : 22, 50, {
        fill: oom > 0.35 ? '#4a182c' : '#261e10',
        stroke: oom > 0.35 ? ROLE.work : ROLE.gold,
        width: 3,
        radius: 6,
      })
        .at(barX + liveW + (oom > 0.35 ? req15W * 0.5 : 11), -55)
        .opacity(alpha),
      txt(
        oom > 0.35 ? '25.0 GB -> OOM!' : '? fits in 13.98 GB?',
        oom > 0.35 ? barX + liveW + req15W * 0.5 : barX + liveW + 46,
        -55,
        28,
        oom > 0.35 ? ROLE.work : ROLE.gold,
        'mono',
        oom > 0.35 ? 'center' : 'left',
      ).opacity(alpha),

      // Row 2: Smaller chunk (+6 GB temp -> 16.0 GB -> SUCCEEDS!)
      txt(
        'Smaller Chunk (+6 GB temp)',
        -855,
        45,
        28,
        sm > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.4 + 0.6 * sm)),
      rect(liveW, 50, { fill: ROLE.weights, stroke: null, radius: 6 })
        .at(barX + liveW * 0.5, 100)
        .opacity(alpha * (0.4 + 0.6 * sm)),
      rect(req6W, 50, { fill: '#103528', stroke: ROLE.ok, width: 3, radius: 6 })
        .at(barX + liveW + req6W * 0.5, 100)
        .glow(sm > 0.3 ? 10 : 0, ROLE.ok)
        .opacity(alpha * (0.35 + 0.65 * sm)),
      txt(
        `${(PREFILL_6.liveGB + 6).toFixed(1)} GB (OK!)`,
        barX + liveW + req6W + 24,
        100,
        28,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.35 + 0.65 * sm)),

      txt(
        rec > 0.3
          ? 'Keep artifact, runtime, placement & request ID with both traces; log peak VRAM + latency change'
          : sm > 0.3
            ? 'Same weights, same logs, same KV cache: smaller prefill chunk drops temp buffer to 6 GB!'
            : 'Can the allocator grant a 15 GB temporary buffer with 13.98 GB free?',
        0,
        255,
        28,
        sm > 0.3 ? ROLE.ok : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'same-logs', (d) => s.play(revealOom.to(0, { duration: d })));
  playCue(s, c, 'ask-allocation', (d) => s.play(revealOom.to(0, { duration: d })));
  // Strict prediction withholding: reveal 25.0 GB OOM only after large-request!
  playCue(s, c, 'large-request', (d) => s.play(revealOom.to(1, { duration: d })), { after: true });
  playCue(s, c, 'small-request', (d) => s.play(showSmall.to(1, { duration: d })));
  playCue(s, c, 'save-replay', (d) => s.play(showRecord.to(1, { duration: d })));
}
