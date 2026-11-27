// Scene 06: Did the cast overflow? Round-before-overflow check (449 vs 465), sat vs non-sat E4M3/E5M2, CPU cast vs clamp.
import {
  COSMOS,
  OVF_449,
  OVF_465_SAT,
  afterDuration,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function overflowMode(s, c) {
  const showGrid = s.value(0.35);
  const show449 = s.value(0);
  const show465 = s.value(0);
  const showSecond = s.value(0);
  const showModes = s.value(0);
  const showE5 = s.value(0);
  const showCPUStart = s.value(0);
  const showCPUResult = s.value(0);

  const bgAura = aura(150, 20, 580, '#ff6b8b20', '#ffd16618');
  const title = heroTitle(['Did the Cast', 'Overflow?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.rose,
    eyebrow: 'OCP ROUND-BEFORE-OVERFLOW · SATURATION VS NaN',
  });

  const live = guardedDynamic(1, () => {
    const gr = showGrid.value;
    const s449 = show449.value;
    const s465 = show465.value;
    const sec = showSecond.value;
    const md = showModes.value;
    const e5 = showE5.value;
    const cpu0 = showCPUStart.value;
    const cpu1 = showCPUResult.value;

    // Precision grid around 448: [408, 492], step = 32 (416, 448, 480)
    const rx0 = -810;
    const rx1 = 810;
    const ry = -130;
    const mapX = (v) => rx0 + ((v - 408) / (492 - 408)) * (rx1 - rx0);
    const x416 = mapX(416);
    const x448 = mapX(448);
    const x464 = mapX(464);
    const x480 = mapX(480);

    const nodes = [
      txt(
        'OCP E4M3 PRECISION GRID NEAR CEILING 448 (STEP = 32)',
        0,
        ry - 92,
        26,
        COSMOS.cyan,
        'mono',
      ),
      // Shaded overflow region past 448
      rect(rx1 - x448, 86, { fill: '#2a1020', stroke: null, radius: 6 })
        .at((x448 + rx1) * 0.5, ry)
        .opacity(0.65 * gr),
      line([rx0, ry], [rx1, ry], { stroke: '#465885', width: 3.4 }),
      // Ticks
      line([x416, ry - 26], [x416, ry + 26], { stroke: COSMOS.cyan, width: 3 }),
      txt('416', x416, ry + 62, 28, COSMOS.muted, 'mono'),
      line([x448, ry - 38], [x448, ry + 32], { stroke: COSMOS.gold, width: 4.2 }).glow(
        6,
        COSMOS.gold,
      ),
      txt('448 (max finite)', x448, ry + 64, 28, COSMOS.gold, 'mono'),
      line([x464, ry - 18], [x464, ry + 18], { stroke: COSMOS.dim, width: 2, dash: [6, 5] }),
      txt('464 mid', x464, ry + 62, 26, COSMOS.dim, 'mono'),
      line([x480, ry - 26], [x480, ry + 26], { stroke: COSMOS.rose, width: 3, dash: [6, 4] }),
      txt('480 (beyond finite)', x480, ry + 62, 26, COSMOS.rose, 'mono'),
    ];

    // 449 probe (rounds back to 448 -> NO overflow)
    const p449X = mapX(449 - 1 * s449);
    nodes.push(
      glowDot(p449X, ry - 18, { radius: 9, color: COSMOS.emerald, opacity: 0.35 + 0.65 * s449 }),
      txt(
        s449 > 0.5 ? `449 → ${OVF_449.rounded} (finite, no overflow)` : '449',
        mapX(432),
        ry - 56,
        26,
        COSMOS.emerald,
        'mono',
      ).opacity(0.35 + 0.65 * s449),
    );

    // 465 probe (rounds to 480 > 448 -> OVERFLOW!)
    const p465X = mapX(465 + 15 * s465);
    nodes.push(
      glowDot(p465X, ry - 18, { radius: 9, color: COSMOS.rose, opacity: 0.25 + 0.75 * s465 }),
      txt(
        s465 > 0.5 ? `465 → ${OVF_465_SAT.rounded} (overflow!)` : '465',
        mapX(476),
        ry - 56,
        26,
        COSMOS.rose,
        'mono',
      ).opacity(0.25 + 0.75 * s465),
    );

    // Middle row: Saturating vs Non-Saturating E4M3 and E5M2 contracts
    const midY = 128;
    const opMid = 0.22 + 0.78 * Math.max(sec, md);
    nodes.push(
      glassCell(-575, midY, 520, 168, COSMOS.gold, { fill: '#1a1812', glow: 8, opacity: opMid }),
      txt('SATURATING E4M3 (x = 465)', -575, midY - 46, 26, COSMOS.muted, 'mono').opacity(opMid),
      txt(`480 → ${OVF_465_SAT.result}`, -575, midY + 8, 42, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(opMid),
      txt('Clamps to max finite 448', -575, midY + 56, 26, COSMOS.ink, 'sans').opacity(opMid),

      glassCell(0, midY, 520, 168, COSMOS.rose, {
        fill: '#221020',
        glow: 9,
        opacity: 0.2 + 0.8 * md,
      }),
      txt('NON-SATURATING E4M3 (x = 465)', 0, midY - 46, 26, COSMOS.muted, 'mono').opacity(
        0.2 + 0.8 * md,
      ),
      txt('480 → NaN', 0, midY + 8, 42, COSMOS.rose, 'mono')
        .glow(7, COSMOS.rose)
        .opacity(0.2 + 0.8 * md),
      txt('2 NaN codes, no infinity', 0, midY + 56, 26, COSMOS.ink, 'sans').opacity(0.2 + 0.8 * md),

      glassCell(575, midY, 520, 168, COSMOS.violet, {
        fill: '#19122b',
        glow: 9,
        opacity: 0.2 + 0.8 * e5,
      }),
      txt('NON-SATURATING E5M2 (65,536)', 575, midY - 46, 26, COSMOS.muted, 'mono').opacity(
        0.2 + 0.8 * e5,
      ),
      txt('→ +Infinity', 575, midY + 8, 40, COSMOS.violet, 'mono')
        .glow(7, COSMOS.violet)
        .opacity(e5),
      txt('E5M2 ceiling 57,344 · encodes ±Inf', 575, midY + 56, 26, COSMOS.ink, 'sans').opacity(
        0.2 + 0.8 * e5,
      ),
    );

    // Bottom bar: PyTorch 2.15 CPU comparison (plain cast vs clamp before cast)
    const opCpu = 0.18 + 0.82 * cpu0;
    nodes.push(
      glassCell(0, 365, 1660, 134, cpu1 > 0.5 ? COSMOS.cyan : COSMOS.dim, {
        fill: '#0e1829',
        glow: cpu1 > 0.5 ? 8 : 3,
        opacity: opCpu,
      }),
      txt('PYTORCH 2.15 CPU CHECK ON x = 500', -780, 330, 26, COSMOS.cyan, 'mono', 'left').opacity(
        opCpu,
      ),
      txt(
        cpu1 > 0.5
          ? 'plain cast(500) = 448 · clamp.cast(500) = 448 → log pre-cast value'
          : 'plain cast(500)  vs  explicit finite clamp(-448, 448) before cast',
        -780,
        388,
        26,
        cpu1 > 0.5 ? COSMOS.gold : COSMOS.ink,
        'mono',
        'left',
      ).opacity(opCpu),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('lp-overflow-mode-build-0', () =>
    s.play(showGrid.to(1, { duration: remainDuration(c, 'lp-overflow-mode-build-0', 0.45) })),
  );
  c.on('lp-overflow-mode-449', () =>
    s.play(show449.to(1, { duration: remainDuration(c, 'lp-overflow-mode-449', 0.45) })),
  );
  c.on('lp-overflow-mode-465', () =>
    s.play(show465.to(1, { duration: remainDuration(c, 'lp-overflow-mode-465', 0.45) })),
  );
  c.on('lp-overflow-mode-build-1', () =>
    s.play(showSecond.to(1, { duration: remainDuration(c, 'lp-overflow-mode-build-1', 0.45) })),
  );
  c.on('lp-overflow-mode-modes', () =>
    s.play(showModes.to(1, { duration: remainDuration(c, 'lp-overflow-mode-modes', 0.45) })),
  );
  c.after('lp-overflow-mode-e5', () =>
    s.play(showE5.to(1, { duration: afterDuration(c, 'lp-overflow-mode-e5', 0.45) })),
  );
  c.on('lp-overflow-mode-build-2', () =>
    s.play(showCPUStart.to(1, { duration: remainDuration(c, 'lp-overflow-mode-build-2', 0.45) })),
  );
  c.on('lp-overflow-mode-cpu', () =>
    s.play(showCPUResult.to(1, { duration: remainDuration(c, 'lp-overflow-mode-cpu', 0.45) })),
  );
}
