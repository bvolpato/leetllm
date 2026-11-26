// Scene 06: A label belongs to the exact scored inputs: templates, truncation cancellation, 1024 length gate.
import {
  COSMOS,
  aura,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function formatLengthBoundary(s, c) {
  const phase = s.value(0);
  const showHistory = s.value(0.35);
  const showInputs = s.value(0);
  const showEqual = s.value(0);
  const showCancel = s.value(0);
  const showLimit = s.value(0);
  const showFilter = s.value(0);

  const bgAura = aura(120, 20, 560, '#fb923c1c', '#5ce1e614');
  const title = heroTitle(['Format & Length', 'Boundaries'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.amber,
    eyebrow: 'TEMPLATES · TRUNCATION · MAX_LENGTH = 1024',
  });

  const eqCancel = glowTex(
    String.raw`\Delta = 0 \;\Rightarrow\; \mathcal{L} = \log 2,\quad \nabla_\theta \Delta = 0`,
    { x: 350, y: -365, size: 36, color: COSMOS.rose },
  );

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sh = showHistory.value;
    const si = showInputs.value;
    const se = showEqual.value;
    const sc = showCancel.value;
    const sl = showLimit.value;
    const sf = showFilter.value;

    // Horizontal token ruler from x=-660 to x=780 representing 0..1200 tokens
    const x0 = -660;
    const x1 = 780;
    const mapTok = (n) => x0 + (n / 1200) * (x1 - x0);
    const gateX = mapTok(1024);

    const nodes = [
      // Top half: Two formatting pathways (generous margins above boxes)
      txt('EXPLICIT PROMPT', -855, -206, 26, COSMOS.cyan, 'mono', 'left'),
      tokenCell(-605, -135, 500, 74, COSMOS.cyan, {
        fill: '#0e1b2f',
        glow: 6,
        opacity: Math.max(0.5, si),
      }),
      txt('prompt + chosen / rejected', -605, -135, 26, COSMOS.ink, 'mono').opacity(
        Math.max(0.5, si),
      ),

      txt('CONVERSATIONAL TEMPLATE', 25, -206, 26, COSMOS.violet, 'mono', 'left'),
      tokenCell(410, -135, 760, 74, COSMOS.violet, {
        fill: '#16142e',
        glow: sh > 0.5 ? 8 : 3,
        opacity: Math.max(0.5, sh),
      }),
      txt('<sys> <user> ... branch at final <asst>', 410, -135, 26, COSMOS.violet, 'mono').opacity(
        Math.max(0.5, sh),
      ),

      // Middle: Token length timeline with 1024 boundary gate
      txt('TOKEN LENGTH RULER (BOUNDARY = 1,024)', x0, -12, 26, COSMOS.muted, 'mono', 'left'),
      line([x0, 38], [x1, 38], { stroke: '#3a4b73', width: 2.5 }),
      ...[0, 256, 512, 768, 1024, 1200].map((n) => {
        const tx = mapTok(n);
        return group(
          line([tx, 26], [tx, 50], { stroke: n === 1024 ? COSMOS.amber : '#495b85', width: 2.2 }),
          txt(String(n), tx, 72, 26, n === 1024 ? COSMOS.amber : COSMOS.muted, 'mono'),
        );
      }),

      // Vertical glowing gate at 1024 starting BELOW tick label "1024"
      line([gateX, 98], [gateX, 340], {
        stroke: COSMOS.amber,
        width: sl > 0.5 ? 4 : 2.5,
        dash: [10, 7],
      })
        .glow(sl > 0.5 ? 9 : 3, COSMOS.amber)
        .opacity(Math.max(0.45, sl)),

      // Row 1: Boundary-length pair (1024 tokens -> survives!)
      txt('1024 pair', -855, 148, 26, COSMOS.emerald, 'mono', 'left'),
      rect(mapTok(1024) - x0, 46, {
        fill: '#0f2826',
        stroke: COSMOS.emerald,
        width: 2.4,
        radius: 8,
      })
        .at((x0 + mapTok(1024)) * 0.5, 148)
        .glow(6, COSMOS.emerald),
      txt('Survives max_length = 1024', (x0 + mapTok(1024)) * 0.5, 148, 26, COSMOS.emerald, 'mono'),

      // Row 2: Oversized pair (1150 tokens) -> suffix carries the false statement!
      txt('1150 pair', -855, 245, 26, COSMOS.rose, 'mono', 'left'),
      rect(mapTok(1024) - x0, 46, {
        fill: '#15192e',
        stroke: se > 0.5 ? COSMOS.amber : COSMOS.cyan,
        width: 2.2,
        radius: 8,
      }).at((x0 + mapTok(1024)) * 0.5, 245),
      txt(
        se > 0.5 ? 'Identical prefix up to 1024 → Δ = 0' : 'Shared opening tokens...',
        (x0 + mapTok(1024)) * 0.5,
        245,
        26,
        se > 0.5 ? COSMOS.amber : COSMOS.ink,
        'mono',
      ),
      // Overflow suffix segment past 1024
      rect(mapTok(1175) - gateX, 46, {
        fill: '#2b1020',
        stroke: COSMOS.rose,
        width: 2.6,
        radius: 8,
        dash: sf > 0.5 ? [7, 5] : undefined,
      })
        .at((gateX + mapTok(1175)) * 0.5, 245)
        .glow(8, COSMOS.rose)
        .opacity(sf > 0.5 ? 0.55 : 0.95),
      txt('false suffix', gateX + 18, 300, 26, COSMOS.rose, 'mono', 'left'),
    ];

    // Opposing cancelling gradient vectors when truncated to identical IDs
    if (sc > 0.05) {
      const gx = -420;
      const gy = 375;
      nodes.push(
        glowingTrail(
          [
            [gx, gy],
            [gx - 190 * sc, gy],
          ],
          { color: COSMOS.emerald, width: 4.5, opacity: sc },
        ),
        glowingTrail(
          [
            [gx, gy],
            [gx + 190 * sc, gy],
          ],
          { color: COSMOS.rose, width: 4.5, opacity: sc },
        ),
        glowDot(gx, gy, { radius: 7, color: COSMOS.gold, opacity: sc }),
        txt('+∇r  +  (-∇r)  =  0', gx, gy + 44, 28, COSMOS.rose, 'mono')
          .glow(6, COSMOS.rose)
          .opacity(sc),
      );
    }

    // Filter policy readout on bottom right
    if (sf > 0.05) {
      nodes.push(
        txt('TRL DEFAULT: FILTER ENTIRE PAIR (>1024)', 360, 365, 28, COSMOS.amber, 'mono')
          .glow(6, COSMOS.amber)
          .opacity(sf),
        txt(
          'Report removed counts + domains (None disables)',
          360,
          410,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(sf),
      );
    } else {
      nodes.push(
        txt('Cutting the suffix erases the label reason', 360, 385, 28, COSMOS.muted, 'sans'),
      );
    }

    // Subtle moving token scanner
    const u = (p * 0.45) % 1;
    nodes.push(glowDot(x0 + u * (gateX - x0), 38, { radius: 5.5, color: COSMOS.amber }));

    return group(...nodes);
  });

  s.add(bgAura, title, eqCancel, live);
  runPhase(s, c, phase, 14);

  c.on('format-history', () => s.play(showHistory.to(1, { duration: 0.45 })));
  c.on('format-length-boundary-step-1', () => s.play(showInputs.to(1, { duration: 0.45 })));
  c.on('format-equal', () => s.play(showEqual.to(1, { duration: 0.45 })));
  c.on('format-length-boundary-step-2', () => s.play(showCancel.to(1, { duration: 0.45 })));
  c.on('format-length', () => s.play(showLimit.to(1, { duration: 0.45 })));
  c.on('format-length-boundary-step-3', () =>
    s.play(showFilter.to(1, { duration: remainDuration(c, 'format-length-boundary-step-3', 0.5) })),
  );
}
