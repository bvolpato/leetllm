// Scene 02: Where are the eight values? H2D transfer across PCIe into discrete GPU VRAM.
import {
  COSMOS,
  TOKEN_VALUES,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function residence(s, c) {
  const phase = s.value(0);
  const copyProg = s.value(0);
  const landed = s.value(0);
  const showCode = s.value(0);
  const showChecks = s.value(0);

  const bgAura = aura(0, 40, 560, '#5ce1e622', '#60a5fa16');

  const title = heroTitle(['Separate Host', 'and Device Memory'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'RESIDENCE · H2D TRANSFER',
  });

  const live = guardedDynamic(1, () => {
    const cp = copyProg.value;
    const ld = landed.value;
    const sc = showCode.value;
    const ch = showChecks.value;
    const pulse = 0.7 + 0.3 * Math.sin(phase.value * 3.5);

    const nodes = [
      txt('CPU HOST RAM · cpu_row', -855, -236, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        ld > 0.5 ? '8 / 8 copied to device' : '0 / 8 on device',
        855,
        -236,
        26,
        ld > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'right',
      ),
    ];

    const topY = -112;
    const botY = 235;
    const cellW = 160;
    const stepX = 216;
    const xStart = -756;

    TOKEN_VALUES.forEach((val, i) => {
      const cx = xStart + i * stepX;
      const isTok6 = i === 6;
      const hostStroke = isTok6 ? COSMOS.gold : COSMOS.blue;
      const devStroke = ld > 0.5 ? (isTok6 ? COSMOS.gold : COSMOS.cyan) : COSMOS.dim;

      // CPU host cell
      nodes.push(
        glassCell(cx, topY, cellW, 92, hostStroke, {
          fill: isTok6 ? '#1f1d14' : '#0f182e',
          glow: isTok6 ? 9 : 5,
        }),
        txt(`T${i}`, cx, topY - 72, 26, isTok6 ? COSMOS.gold : COSMOS.muted, 'mono'),
        txt(String(val), cx, topY + 4, 40, isTok6 ? COSMOS.gold : COSMOS.ink, 'mono'),
      );

      // PCIe conduit and moving payload during copy (hidden immediately once code block enters)
      if (sc < 0.01) {
        nodes.push(
          glowingArc([cx, topY + 52], [cx, botY - 52], 0, {
            color: cp > 0.02 ? COSMOS.cyan : '#2a3a5e',
            width: cp > 0.02 ? 3.2 : 1.8,
            opacity: cp > 0.02 ? 0.85 : 0.45,
          }),
        );
        if (cp > 0.02 && cp < 0.99) {
          const py = topY + 56 + cp * (botY - topY - 112);
          nodes.push(
            glowDot(cx, py, { radius: 8, color: isTok6 ? COSMOS.gold : COSMOS.cyan, glow: 12 }),
          );
        }
      }

      // GPU device cell
      nodes.push(
        glassCell(cx, botY, cellW, 92, devStroke, {
          fill: ld > 0.5 ? (isTok6 ? '#1d2219' : '#0d202e') : '#0b101d',
          glow: ld > 0.5 ? (isTok6 ? 10 * pulse : 7) : 0,
        }),
        txt(
          ld > 0.5 ? String(val) : '?',
          cx,
          botY + 4,
          40,
          ld > 0.5 ? (isTok6 ? COSMOS.gold : COSMOS.cyan) : COSMOS.dim,
          'mono',
        ),
        txt(`T${i}`, cx, botY + 72, 26, isTok6 ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    });

    nodes.push(
      txt(
        'CUDA DEVICE VRAM · x = cpu_row.to("cuda")',
        -855,
        botY + 122,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    );

    // Beat 1: code queue & process checks cleanly centered between host and device rows
    if (sc > 0.05) {
      const codeLines = [
        'cpu_row = torch.tensor(values, dtype=torch.float32)',
        'x = cpu_row.to("cuda")',
        'pooled = x.mean()  # queues CUDA kernel',
      ];
      nodes.push(
        glassCell(0, 62, 1340, 178, COSMOS.gold, {
          fill: '#0f1628',
          glow: 9,
          opacity: sc,
        }),
      );
      codeLines.forEach((ln, idx) => {
        const active = idx === 2;
        nodes.push(
          txt(
            ln,
            -630,
            8 + idx * 52,
            28,
            active ? COSMOS.gold : COSMOS.ink,
            'mono',
            'left',
          ).opacity(sc),
        );
      });
    }

    if (ch > 0.02) {
      nodes.push(
        glassCell(0, 420, 1480, 74, COSMOS.blue, {
          fill: '#101a32',
          glow: 8,
          opacity: ch,
        }),
        txt(
          'Verify in this process: torch.version.cuda  ·  torch.cuda.is_available()',
          0,
          422,
          28,
          COSMOS.blue,
          'mono',
        ).opacity(ch),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('copy-row', () => s.play(copyProg.to(1, { duration: 1.0 })));
  c.on('device-residence', () => s.play(landed.to(1, { duration: 0.45 })));
  c.on('queue-mean', () => s.play(showCode.to(1, { duration: 0.45 })));
  c.on('process-check', () =>
    s.play(showChecks.to(1, { duration: remainDuration(c, 'process-check', 0.45) })),
  );
}
