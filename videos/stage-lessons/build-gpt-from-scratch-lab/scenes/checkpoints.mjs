// Scene 12: What improved after 240 more updates? (Validation loss curve vs real generated samples)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  logged,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function checkpoints(s, c) {
  const phase = s.value(0);
  const earlyVisible = s.value(0);
  const curveProg = s.value(0); // 0 -> step 81 (index 2), 1 -> step 321 (index 5)
  const revealLater = s.value(0);
  const highlightBug = s.value(0);

  const bgAura = aura(-120, -40, 620, '#18326826', '#3d1e5414');
  const title = heroTitle(['What Improved After', '240 More Updates?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'REAL CPU VALIDATION RUN · LOSS vs SAMPLES',
  });

  // Chart coordinate mapping for the 6 exact logged checkpoints
  const plotLeft = -760;
  const plotRight = 140;
  const plotTop = -170;
  const plotBottom = 260;
  const mapX = (step) => plotLeft + ((step - 1) / 320) * (plotRight - plotLeft);
  const mapY = (lossVal) => plotBottom - ((lossVal - 5.0) / 5.0) * (plotBottom - plotTop);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ev = earlyVisible.value;
    const cp = curveProg.value;
    const rl = revealLater.value;
    const hb = highlightBug.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Axes & subtle horizontal reference lines
      line([plotLeft, plotBottom], [plotRight + 24, plotBottom], {
        stroke: COSMOS.rule,
        width: 2.2,
      }),
      line([plotLeft, plotBottom], [plotLeft, plotTop - 20], { stroke: COSMOS.rule, width: 2.2 }),
      txt('VALIDATION LOSS (NATS)', plotLeft, plotTop - 52, 26, COSMOS.muted, 'mono', 'left'),
      txt('UPDATE STEP', (plotLeft + plotRight) * 0.5, plotBottom + 62, 26, COSMOS.muted, 'mono'),
    ];

    [6, 7, 8, 9].forEach((lv) => {
      const yy = mapY(lv);
      nodes.push(
        line([plotLeft, yy], [plotRight, yy], {
          stroke: COSMOS.rule,
          width: 1,
          dash: [6, 8],
        }).opacity(0.45),
        txt(`${lv}.0`, plotLeft - 24, yy + 2, 26, COSMOS.dim, 'mono', 'right'),
      );
    });

    // Determine visible portion of logged curve: up to index 2 initially, then 2 -> 5 as cp grows
    const maxIdx = Math.min(logged.length - 1, Math.floor(2 + cp * 3.01));
    const pts = logged.slice(0, maxIdx + 1).map((pt) => [mapX(pt.x), mapY(pt.y)]);
    if (pts.length >= 2) {
      nodes.push(
        glowingTrail(pts, {
          gradientColors: [COSMOS.cyan, COSMOS.emerald],
          width: 4.8,
          glow: 10,
        }),
      );
    }

    logged.slice(0, maxIdx + 1).forEach((pt, idx) => {
      const px = mapX(pt.x);
      const py = mapY(pt.y);
      const is81 = idx === 2;
      const is321 = idx === 5;
      const col = is321 ? COSMOS.emerald : is81 ? COSMOS.gold : COSMOS.cyan;
      nodes.push(
        glowDot(px, py, { radius: is81 || is321 ? 9 : 6, color: col }),
        txt(String(pt.x), px, plotBottom + 28, 26, col, 'mono'),
      );
      if (is81) {
        nodes.push(txt(`${pt.y.toFixed(2)}`, px + 14, py - 34, 28, COSMOS.gold, 'mono', 'left'));
      }
      if (is321) {
        nodes.push(
          txt(
            `${pt.y.toFixed(2)} (-0.50)`,
            px - 14,
            py - 38,
            28,
            COSMOS.emerald,
            'mono',
            'right',
          ).glow(6, COSMOS.emerald),
        );
      }
    });

    // Right side: Fixed-prompt generated excerpts (strictly withholding update-321 sample until revealLater!)
    const sx = 545;
    nodes.push(
      txt('FIXED PROMPT (SEED 17)', sx, -245, 26, COSMOS.muted, 'mono'),
      txt('"Good sir, ↵ Speak plain."', sx, -198, 28, COSMOS.cyan, 'serif'),
    );

    if (ev > 0.05) {
      nodes.push(
        glassCell(sx, -68, 560, 146, COSMOS.gold, { fill: '#1b1810', glow: 6, opacity: ev }),
        txt('UPDATE 81  ·  val = 6.05', sx, -106, 26, COSMOS.gold, 'mono').opacity(ev),
        txt('"And the I the"', sx, -42, 38, COSMOS.ink, 'serif').opacity(ev),
      );
    }

    if (cp > 0.6) {
      const boxCol = hb > 0.5 ? COSMOS.rose : rl > 0.5 ? COSMOS.emerald : COSMOS.dim;
      nodes.push(
        glassCell(sx, 148, 560, 178, boxCol, {
          fill: hb > 0.5 ? '#26111a' : '#0e2124',
          dash: rl > 0.5 ? undefined : [9, 6],
          glow: rl > 0.5 ? 9 * pulse : 3,
        }),
        txt('UPDATE 321  ·  val = 5.55', sx, 94, 26, COSMOS.emerald, 'mono'),
      );
      if (rl > 0.5) {
        nodes.push(
          txt(`"I'll do..."`, sx, 146, 36, COSMOS.emerald, 'serif').glow(5, COSMOS.emerald),
          txt(
            hb > 0.5 ? '"I is the king"  <- verb disagrees!' : '"..."',
            sx,
            202,
            32,
            hb > 0.5 ? COSMOS.rose : COSMOS.muted,
            'serif',
          ).glow(hb > 0.5 ? 8 : 0, COSMOS.rose),
        );
      } else {
        nodes.push(
          txt('Lower loss -> subject-verb agreement?', sx, 162, 28, COSMOS.gold, 'serif').glow(
            5,
            COSMOS.gold,
          ),
        );
      }
    }

    if (hb > 0.2) {
      nodes.push(
        txt(
          'Loss alone cannot certify grammar or detect memorization: inspect prompts & seeds',
          0,
          388,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(hb),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('early-point', () => s.play(earlyVisible.to(1, { duration: 0.5 })));
  c.on('continue-training', () =>
    s.play(curveProg.to(1, { duration: remainDuration(c, 'continue-training', 1.1) })),
  );
  c.after('later-sample', () =>
    s.play(revealLater.to(1, { duration: remainDuration(c, 'later-sample', 0.45) })),
  );
  c.after('later-grammar', () =>
    s.play(highlightBug.to(1, { duration: remainDuration(c, 'later-grammar', 0.45) })),
  );
}
