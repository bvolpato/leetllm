// Scene 02: One stored value, two scales: stale scale vs measured scale on the exact same 0x7e byte.
import {
  COSMOS,
  CURRENT_RT,
  STALE_RT,
  afterDuration,
  aura,
  bitStrip8,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  hexByte,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function staleScale(s, c) {
  const phase = s.value(0);
  const showOldDiv = s.value(0);
  const showCurrent = s.value(0);
  const reveal500 = s.value(0);

  const bgAura = aura(160, 40, 580, '#ffd16622', '#5ce1e61a');
  const title = heroTitle(['One Byte,', 'Two Scales'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.cyan,
    eyebrow: 'SCALE MEANING · SAME 0x7E CODE',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const oldD = showOldDiv.value;
    const cur = showCurrent.value;
    const rev = reveal500.value;

    // Shared activation ruler across the top-right
    const rx0 = -160;
    const rx1 = 830;
    const ry = -275;
    const mapX = (v) => rx0 + (v / 500) * (rx1 - rx0);
    const intervalEnd = mapX(10 + 490 * cur);

    const nodes = [
      txt(
        'ENCODABLE ACTIVATION INTERVAL (ORIGINAL UNITS)',
        rx0,
        ry - 92,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      line([rx0, ry], [rx1, ry], { stroke: '#35476d', width: 3 }),
      // Active encodable interval glow bar
      rect(Math.max(20, intervalEnd - rx0), 22, {
        fill: cur > 0.5 ? COSMOS.emerald : COSMOS.amber,
        stroke: '#ffffff',
        width: 1.2,
        radius: 6,
      })
        .at(rx0 + Math.max(10, (intervalEnd - rx0) * 0.5), ry)
        .glow(10, cur > 0.5 ? COSMOS.emerald : COSMOS.amber)
        .opacity(0.88),
      glowDot(mapX(500), ry, { radius: 8, color: COSMOS.blue }),
      txt('0', rx0, ry + 52, 26, COSMOS.muted, 'mono', 'left'),
      txt('10', mapX(10) + 16, ry + 52, 26, COSMOS.amber, 'mono', 'left'),
      txt('500', rx1, ry + 52, 26, COSMOS.blue, 'mono', 'right'),
      txt(
        cur > 0.5 ? 'Current scale spans [0, 500]' : 'Stale scale spans only [0, 10]',
        (rx0 + rx1) * 0.5,
        ry - 48,
        28,
        cur > 0.5 ? COSMOS.emerald : COSMOS.amber,
        'mono',
      ),
    ];

    // Lane 1: Stale scale (S = 10/448)
    const y1 = -40;
    nodes.push(
      txt('STALE SCALE · S = 10 / 448', -855, y1 - 82, 26, COSMOS.rose, 'mono', 'left'),
      glassCell(-685, y1, 330, 108, COSMOS.blue, { fill: '#10192e', glow: 6 }),
      txt('PRE-CAST  x / S', -685, y1 - 28, 26, COSMOS.muted, 'mono'),
      txt(
        oldD > 0.5 ? '22,400' : '500 / S',
        -685,
        y1 + 20,
        34,
        oldD > 0.5 ? COSMOS.rose : COSMOS.ink,
        'mono',
      ),
      glowingArc([-516, y1], [-245, y1], -32, { color: COSMOS.rose, width: 3.4, opacity: 0.85 }),
      txt('clips > 448', -380, y1 - 48, 26, COSMOS.rose, 'mono'),
      bitStrip8(STALE_RT.code, 20, y1, {
        cellW: 54,
        cellH: 54,
        gap: 6,
        mode: 'e4m3',
        highlightIndices: [1, 2, 3, 4, 5, 6],
        showFieldLabels: false,
      }),
      txt(`${hexByte(STALE_RT.code)} (448)`, 20, y1 + 52, 26, COSMOS.gold, 'mono'),
      glowingArc([280, y1], [485, y1], -28, { color: COSMOS.rose, width: 3.4, opacity: 0.85 }),
      txt('× 10/448', 382, y1 - 44, 26, COSMOS.muted, 'mono'),
      glassCell(665, y1, 340, 108, COSMOS.rose, { fill: '#201020', glow: 8 }),
      txt('RECONSTRUCTED', 665, y1 - 28, 26, COSMOS.muted, 'mono'),
      txt(`${STALE_RT.reconstructed} (clipped)`, 665, y1 + 20, 34, COSMOS.rose, 'mono').glow(
        6,
        COSMOS.rose,
      ),
    );

    // Lane 2: Current measured scale (S = 500/448) -- STRICT PREDICTION WITHHOLDING!
    const y2 = 225;
    const lane2Col = rev > 0.5 ? COSMOS.emerald : COSMOS.gold;
    nodes.push(
      txt('MEASURED SCALE · S = 500 / 448', -855, y2 - 82, 26, COSMOS.cyan, 'mono', 'left').opacity(
        0.25 + 0.75 * cur,
      ),
      glassCell(-685, y2, 330, 108, COSMOS.cyan, {
        fill: '#0e1d2e',
        glow: 7,
        opacity: 0.25 + 0.75 * cur,
      }),
      txt('PRE-CAST  x / S', -685, y2 - 28, 26, COSMOS.muted, 'mono').opacity(0.25 + 0.75 * cur),
      txt(
        cur > 0.5 ? '448.0 (exact)' : '500 / S_new',
        -685,
        y2 + 20,
        32,
        COSMOS.cyan,
        'mono',
      ).opacity(0.25 + 0.75 * cur),
      glowingArc([-516, y2], [-245, y2], 32, {
        color: COSMOS.cyan,
        width: 3.4,
        opacity: 0.85 * cur,
      }),
      txt('exact fit', -380, y2 + 48, 26, COSMOS.cyan, 'mono').opacity(cur),
      bitStrip8(CURRENT_RT.code, 20, y2, {
        cellW: 54,
        cellH: 54,
        gap: 6,
        mode: 'e4m3',
        highlightIndices: cur > 0.5 ? [1, 2, 3, 4, 5, 6] : [],
        opacity: 0.25 + 0.75 * cur,
        showFieldLabels: false,
      }),
      txt(
        `IDENTICAL BYTE ${hexByte(CURRENT_RT.code)}`,
        20,
        y2 + 52,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(0.25 + 0.75 * cur),
      glowingArc([280, y2], [485, y2], 28, { color: lane2Col, width: 3.4, opacity: 0.85 * cur }),
      txt('× 500/448', 382, y2 + 44, 26, COSMOS.muted, 'mono').opacity(cur),
      glassCell(665, y2, 340, 108, lane2Col, {
        fill: rev > 0.5 ? '#0d2224' : '#181726',
        glow: 9,
        opacity: 0.25 + 0.75 * cur,
      }),
      txt('RECONSTRUCTED', 665, y2 - 28, 26, COSMOS.muted, 'mono').opacity(0.25 + 0.75 * cur),
      txt(
        rev > 0.5 ? `${CURRENT_RT.reconstructed} (exact)` : '?',
        665,
        y2 + 20,
        rev > 0.5 ? 36 : 46,
        lane2Col,
        'mono',
      )
        .glow(8, lane2Col)
        .opacity(0.25 + 0.75 * cur),
    );

    // Animated traveling signal photon along the open gap between the two conversion lanes
    const u = (p * 0.45) % 1;
    const px = -516 + u * 1000;
    nodes.push(glowDot(px, 86, { radius: 6, color: cur > 0.5 ? COSMOS.cyan : COSMOS.rose }));

    // Bottom takeaway once revealed
    if (rev > 0.02) {
      nodes.push(
        txt(
          'Same 0x7e byte: keep pre-cast value + scale to tell exact fit from clipping',
          0,
          422,
          28,
          COSMOS.emerald,
          'sans',
        )
          .glow(5, COSMOS.emerald)
          .opacity(rev),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('stale-divide', () =>
    s.play(showOldDiv.to(1, { duration: remainDuration(c, 'stale-divide', 0.45) })),
  );
  c.on('stale-measure', () =>
    s.play(showCurrent.to(1, { duration: remainDuration(c, 'stale-measure', 0.55) })),
  );
  c.after('stale-restored', () =>
    s.play(reveal500.to(1, { duration: afterDuration(c, 'stale-restored', 0.45) })),
  );
}
