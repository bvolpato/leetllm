// Scene 05: What can a final field tell us? (10x12 + 4x12 = 168 rack + outcome tie prediction)
import {
  COSMOS,
  EVAL_DATA,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function check(s, c) {
  const phase = s.value(0);
  const showTen = s.value(0);
  const showFour = s.value(0);
  const gatherProg = s.value(0);
  const showTotal = s.value(0);
  const showAns = s.value(0);
  const showWorked = s.value(0);
  const revealTie = s.value(0);

  const bgAura = aura(-220, 20, 620, '#14385c26', '#2a1e5214');
  const title = heroTitle(['What Can a Final', 'Field Tell Us?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'OUTCOME-ONLY VERIFIER · 14 WORKERS x 12 SLOTS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const t10 = Math.max(0.55, showTen.value);
    const t4 = Math.max(0.45, showFour.value);
    const gp = gatherProg.value;
    const tot = showTotal.value;
    const ans = showAns.value;
    const wrk = showWorked.value;
    const tie = revealTie.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('14 x 12 WORKER RACK CAPACITY', -855, -192, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    // Visual rack grid: 10 cyan rows + 4 gold rows, 12 slots per row
    const gx0 = -830;
    const gy0 = -138;
    const cw = 36;
    const ch = 22;
    const gapX = 6;
    const gapY = 6;
    const splitGap = 24 * (1 - gp);

    for (let r = 0; r < 14; r++) {
      const isTop = r < 10;
      const ry = gy0 + r * (ch + gapY) + (isTop ? 0 : splitGap);
      const col = isTop ? COSMOS.cyan : COSMOS.gold;
      const op = isTop ? t10 : t4;
      for (let colIdx = 0; colIdx < 12; colIdx++) {
        const rx = gx0 + colIdx * (cw + gapX);
        nodes.push(
          rect(cw, ch, { fill: isTop ? '#143952' : '#3a2b10', stroke: col, width: 1.3, radius: 4 })
            .at(rx + cw * 0.5, ry + ch * 0.5)
            .opacity(op),
        );
      }
    }

    // Subtotals beside the two rack bands
    nodes.push(
      txt('10 x 12 = 120', -290, -10, 30, COSMOS.cyan, 'mono', 'left').opacity(t10),
      txt('4 x 12 = 48', -290, 210 + splitGap, 30, COSMOS.gold, 'mono', 'left').opacity(t4),
    );

    if (tot > 0.05) {
      nodes.push(
        txt(
          `120 + 48 = ${EVAL_DATA.training.expected} slots`,
          -830,
          358,
          42,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(8, COSMOS.emerald)
          .opacity(tot),
      );
    }

    // Right side: Two fresh responses (strictly withholding "tie / 1.0 = 1.0" until check-tie!)
    const rx = 435;
    nodes.push(
      txt('TWO FRESH RESPONSES', rx, -192, 26, COSMOS.gold, 'mono'),
      glassCell(rx, -78, 690, 146, ans > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#141a2e',
        glow: ans > 0.3 ? 7 : 2,
        opacity: Math.max(0.55, ans),
      }),
      txt('RESPONSE 1: BARE ANSWER ONLY', rx - 310, -118, 26, COSMOS.amber, 'mono', 'left').opacity(
        Math.max(0.55, ans),
      ),
      txt('\\boxed{168}', rx - 310, -56, 36, COSMOS.ink, 'mono', 'left').opacity(
        Math.max(0.55, ans),
      ),
      txt(
        tie > 0.5 ? `r = ${EVAL_DATA.checkerChallenge.unsupportedGuess.reward}` : 'r = ?',
        rx + 250,
        -56,
        36,
        tie > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(7, tie > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(Math.max(0.55, ans)),

      glassCell(rx, 118, 690, 166, wrk > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#102226',
        glow: wrk > 0.3 ? 8 : 2,
        opacity: Math.max(0.55, wrk),
      }),
      txt(
        'RESPONSE 2: WORKED DERIVATION',
        rx - 310,
        68,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(Math.max(0.55, wrk)),
      txt(
        '10x12=120, 4x12=48 -> \\boxed{168}',
        rx - 310,
        124,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(Math.max(0.55, wrk)),
      txt(
        tie > 0.5 ? `r = ${EVAL_DATA.checkerChallenge.worked.reward}` : 'r = ?',
        rx + 250,
        156,
        36,
        tie > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(7, tie > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(Math.max(0.55, wrk)),
    );

    if (tie > 0.3) {
      nodes.push(
        glowingArc([rx + 250, -18], [rx + 250, 114], 0, {
          color: COSMOS.emerald,
          width: 3.4,
          opacity: tie,
        }),
        glowDot(rx + 250, 48, { radius: 6, color: COSMOS.emerald, opacity: tie }),
        txt(
          'THEY TIE (1 = 1) · inspect steps separately for sound reasoning',
          rx,
          268,
          26,
          COSMOS.emerald,
          'sans',
        )
          .glow(6, COSMOS.emerald)
          .opacity(tie),
      );
    } else if (wrk > 0.5) {
      nodes.push(
        txt('Which response earns more?', rx, 268, 30, COSMOS.gold, 'serif')
          .glow(6 * pulse, COSMOS.gold)
          .opacity(wrk),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('check-ten', () => s.play(showTen.to(1, { duration: 0.5 })));
  c.on('check-four', () => s.play(showFour.to(1, { duration: 0.5 })));
  c.on('check-gather', () => s.play(gatherProg.to(1, { duration: 0.6 })));
  c.on('check-total', () => s.play(showTotal.to(1, { duration: 0.5 })));
  c.on('check-answer', () => s.play(showAns.to(1, { duration: 0.5 })));
  c.on('check-worked', () => s.play(showWorked.to(1, { duration: 0.5 })));
  c.after('check-tie', () =>
    s.play(revealTie.to(1, { duration: remainDuration(c, 'check-tie', 0.45) })),
  );
}
