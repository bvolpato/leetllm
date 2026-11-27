// Scene 14: A mixture changes what the model repeatedly practices: 80/20 length bias, 300-token truncation shift, Llama 3 mix & 7-pass repeat budget.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  EXP_SHARE_80,
  LLAMA3_MIX,
  aura,
  documentSample,
  glassCell,
  glowBar,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function exposureSchedule(s, c) {
  const showPart1 = s.value(1);
  const massP = s.value(0);
  const shareOn = s.value(0);

  const showPart2a = s.value(0);
  const invOn = s.value(0);

  const showPart2b = s.value(0);
  const capOn = s.value(0);
  const trimP = s.value(0);
  const delivOn = s.value(0);

  const showPart3 = s.value(0);
  const mixOn = s.value(0);
  const repeatP = s.value(0);

  const bgAura = aura(0, 0, 650, '#16284f2a', '#ffd16614');

  const eqShare = glowTex(
    String.raw`\text{code share} = \frac{0.8 \times 100}{0.8 \times 100 + 0.2 \times 900} = \frac{80}{260} \approx 30.8\%`,
    { x: 0, y: 270, size: 40, color: COSMOS.gold },
  );

  const eqInv = glowTex(String.raw`w_i \propto \frac{q_i}{L_i}`, {
    x: 0,
    y: -150,
    size: 54,
    color: COSMOS.cyan,
  });

  // Part 1: 80% code doc draws -> 80 vs 180 expected tokens -> 30.8%
  const part1Live = guardedDynamic(showPart1, (a) => {
    const mp = massP.value;
    const sh = shareOn.value;
    const nodes = [
      heroTitle(['Whole-Document', 'Length Bias'], {
        x: -855,
        y: -430,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.violet,
        eyebrow: 'EXPOSURE ARITHMETIC · 80% CODE / 20% PROSE DRAWS',
      }).opacity(a),

      txt(
        'CODE EXPECTED TOKENS / DRAW: 0.80 x 100',
        -740,
        -145,
        28,
        COSMOS.violet,
        'mono',
        'left',
      ).opacity(a),
      txt(`${Math.round(80 * mp)} tok`, 740, -145, 36, COSMOS.violet, 'mono', 'right')
        .glow(6, COSMOS.violet)
        .opacity(a),
      ...glowBar(-740, -85, 1480, (80 / 260) * mp, {
        height: 46,
        color: COSMOS.violet,
        opacity: a,
      }),

      txt(
        'PROSE EXPECTED TOKENS / DRAW: 0.20 x 900',
        -740,
        28,
        28,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),
      txt(`${Math.round(180 * mp)} tok`, 740, 28, 36, COSMOS.blue, 'mono', 'right')
        .glow(6, COSMOS.blue)
        .opacity(a),
      ...glowBar(-740, 88, 1480, (180 / 260) * mp, {
        height: 46,
        color: COSMOS.blue,
        opacity: a,
      }),

      txt(
        sh > 0.5
          ? `Delivered code share: ${(EXP_SHARE_80[0] * 100).toFixed(1)}% (far below 80% document draw rate)`
          : 'Expected tokens per draw = draw probability x mean retained length',
        0,
        405,
        30,
        sh > 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Part 2a: Inverse-length reweighting -> 90% code draws
  const part2aLive = guardedDynamic(showPart2a, (a) => {
    const iv = invOn.value;
    const nodes = [
      txt(
        'INVERSE-LENGTH REWEIGHTING · TARGET 50 / 50 TOKENS',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Divide Target Share by Mean Length',
        -855,
        -350,
        52,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),

      glassCell(-390, 45, 620, 145, COSMOS.violet, { fill: '#15122c', glow: 8, opacity: a }),
      txt('CODE WEIGHT', -390, 8, 26, COSMOS.muted, 'mono').opacity(a),
      txt('0.50 / 100 = 0.00500', -390, 62, 34, COSMOS.violet, 'mono').opacity(a),

      glassCell(390, 45, 620, 145, COSMOS.blue, { fill: '#0f1a32', glow: 8, opacity: a }),
      txt('PROSE WEIGHT', 390, 8, 26, COSMOS.muted, 'mono').opacity(a),
      txt('0.50 / 900 = 0.00056', 390, 62, 34, COSMOS.blue, 'mono').opacity(a),
    ];

    if (iv > 0.02) {
      nodes.push(
        txt('Normalize -> 90% code draws', 0, 265, 38, COSMOS.gold, 'mono')
          .glow(8, COSMOS.gold)
          .opacity(iv * a),
      );
    }
    return group(...nodes);
  });

  // Part 2b: Truncation cap at 300 tokens shifts 50/50 -> 75% code (900 / 1200)
  const part2bLive = guardedDynamic(showPart2b, (a) => {
    const cp = capOn.value;
    const tr = trimP.value;
    const dl = delivOn.value;

    const trimmedTiles = Math.round(tr * 6);
    const sample = documentSample(0.9, [100, 900 - trimmedTiles * 100]);
    const leftX = -480;
    const pitch = 114;

    const nodes = [
      txt(
        'TRUNCATION AFTER SAMPLING · 1 TILE = 100 TOKENS',
        -855,
        -425,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ).opacity(a),
      txt('Length Caps Shift Delivered Mix', -855, -350, 52, COSMOS.ink, 'serif', 'left').opacity(
        a,
      ),

      // Row 0: 9 programs (9 tiles)
      txt('9 programs', leftX - 45, -95, 34, COSMOS.violet, 'mono', 'right').opacity(a),
      txt(
        `${sample.tokens[0]} tok`,
        leftX + 9 * pitch + 25,
        -95,
        34,
        COSMOS.violet,
        'mono',
        'left',
      ).opacity(a),
      // Row 1: 1 page (9 tiles -> trimmed to 3)
      txt('1 page', leftX - 45, 95, 34, COSMOS.blue, 'mono', 'right').opacity(a),
      txt(
        `${sample.tokens[1]} tok`,
        leftX + 9 * pitch + 25,
        95,
        34,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),
    ];

    for (let i = 0; i < 9; i++) {
      const tx = leftX + i * pitch + 50;
      nodes.push(
        rect(96, 102, { fill: '#2a1d54', stroke: COSMOS.violet, width: 2.2, radius: 7 })
          .at(tx, -95)
          .glow(6, COSMOS.violet)
          .opacity(a),
      );
      const kept = i < 9 - trimmedTiles;
      nodes.push(
        rect(104, 102, {
          fill: kept ? '#11294f' : '#14101c',
          stroke: kept ? COSMOS.blue : COSMOS.rose,
          width: 2.0,
          radius: 5,
          dash: kept ? undefined : [6, 5],
        })
          .at(tx, 95)
          .opacity((kept ? 0.96 : 0.38) * a),
      );
    }

    if (cp > 0.02) {
      const capX = leftX + 3 * pitch;
      nodes.push(
        glowingTrail(
          [
            [capX, -18],
            [capX, 200],
          ],
          { color: COSMOS.gold, width: 5, glow: 12, opacity: cp * a },
        ),
        txt('CAP: 300 TOKENS', capX, 238, 30, COSMOS.gold, 'mono')
          .glow(6, COSMOS.gold)
          .opacity(cp * a),
      );
    }

    if (dl > 0.02) {
      nodes.push(
        txt(
          `Delivered: 900 / 1,200 = ${Math.round(sample.shares[0] * 100)}% code tokens · recount after packing`,
          0,
          370,
          36,
          COSMOS.gold,
          'mono',
        )
          .glow(8, COSMOS.gold)
          .opacity(dl * a),
      );
    }

    return group(...nodes);
  });

  // Part 3: Llama 3 reported token mix + 700B / 100B = 7 token-weighted passes
  const part3Live = guardedDynamic(showPart3, (a) => {
    const mx = mixOn.value;
    const rp = repeatP.value;
    const nodes = [
      txt(
        'REPORTED LLAMA 3 TOKEN MIX & REPETITION BUDGET',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Domain Mix & Multi-Epoch Passes', -855, -350, 52, COSMOS.ink, 'serif', 'left').opacity(
        a,
      ),
    ];

    LLAMA3_MIX.forEach((row, i) => {
      const y = -215 + i * 74;
      nodes.push(
        txt(row.label, -340, y + 2, 30, row.color, 'sans', 'right').opacity(a),
        ...glowBar(-300, y, 920, (row.pct / 50) * Math.max(0.15, mx), {
          height: 36,
          color: row.color,
          opacity: a,
        }),
        txt(`${row.pct}%`, 655, y + 2, 32, row.color, 'mono', 'left').opacity(a),
      );
    });

    // 7 passes ribbon (7 x 100B = 700B presentations)
    const shownPasses = Math.round(rp * 7);
    nodes.push(
      txt(
        'CODE REPETITION BUDGET: 100B UNIQUE INVENTORY -> 700B PRESENTATIONS',
        0,
        130,
        28,
        COSMOS.violet,
        'mono',
      ).opacity((0.3 + 0.7 * rp) * a),
    );
    for (let k = 0; k < 7; k++) {
      const px = -660 + k * 220;
      const active = k < shownPasses;
      nodes.push(
        glassCell(px, 230, 190, 88, active ? COSMOS.violet : '#293454', {
          fill: active ? '#211642' : '#0c101d',
          glow: active ? 8 : 0,
          opacity: (active ? 0.96 : 0.35) * a,
        }),
        txt(`Pass ${k + 1}`, px, 212, 26, active ? COSMOS.muted : COSMOS.dim, 'mono').opacity(a),
        txt('100B', px, 250, 28, active ? COSMOS.violet : COSMOS.dim, 'mono').opacity(a),
      );
    }

    if (rp > 0.85) {
      nodes.push(
        txt(
          '700B / 100B = 7 token-weighted passes on average · test held-out quality',
          0,
          380,
          32,
          COSMOS.gold,
          'sans',
        )
          .glow(6, COSMOS.gold)
          .opacity(rp * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2aLive, part2bLive, part3Live);

  c.on('pt-exposure-schedule-mass', () =>
    s.play(massP.to(1, { duration: remainDuration(c, 'pt-exposure-schedule-mass', 0.9) })),
  );
  c.on('pt-exposure-schedule-share', () =>
    s.play(shareOn.to(1, { duration: remainDuration(c, 'pt-exposure-schedule-share', 0.5) })),
  );
  c.show('pt-exposure-schedule-share', eqShare, { fade: 0.35 });

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2a.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide(1, [eqShare], { fade: 0.2 });
  c.show(1, eqInv, { lead: -0.22, fade: 0.25 });

  c.on('pt-exposure-schedule-inverse', () =>
    s.play(invOn.to(1, { duration: remainDuration(c, 'pt-exposure-schedule-inverse', 0.5) })),
  );
  c.on('pt-exposure-schedule-example', () => {
    s.play(
      par(showPart2a.to(0, { duration: 0.18 }), delay(showPart2b.to(1, { duration: 0.25 }), 0.2)),
    );
  });
  c.hide('pt-exposure-schedule-example', [eqInv], { fade: 0.18 });

  c.on('pt-exposure-schedule-cap', () =>
    s.play(capOn.to(1, { duration: remainDuration(c, 'pt-exposure-schedule-cap', 0.5) })),
  );
  c.on('pt-exposure-schedule-trim', () =>
    s.play(trimP.to(1, { duration: remainDuration(c, 'pt-exposure-schedule-trim', 0.8) })),
  );
  c.after('pt-exposure-schedule-delivered', () =>
    s.play(
      delivOn.to(1, { duration: remainAfterDuration(c, 'pt-exposure-schedule-delivered', 0.45) }),
    ),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2b.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-exposure-schedule-mix', () =>
    s.play(mixOn.to(1, { duration: remainDuration(c, 'pt-exposure-schedule-mix', 0.9) })),
  );
  c.on('pt-exposure-schedule-repeat', () =>
    s.play(repeatP.to(1, { duration: remainDuration(c, 'pt-exposure-schedule-repeat', 1.1) })),
  );
}
