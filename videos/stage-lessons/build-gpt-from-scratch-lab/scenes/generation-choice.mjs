// Scene 13: Which piece does the sampler append? (Top-k, temperature, CDF draw & inverse map)
import { delay, par } from 'vizmatic/stage';
import {
  CAT_DRAW,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function generationChoice(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const retainTop8 = s.value(0);
  const scaleTemp = s.value(0);

  const showPart2 = s.value(0);
  const scaledFour = s.value(0);
  const showDrawNeedle = s.value(0);
  const revealChoice = s.value(0);

  const showPart3 = s.value(0);
  const showReverse = s.value(0);
  const showReject = s.value(0);

  const bgAura = aura(0, 20, 620, '#18336624', '#391d5814');

  // Beat 1: Lab top-8 and T=0.9 logit distribution
  const part1 = guardedDynamic(showPart1, (a) => {
    const r8 = retainTop8.value;
    const st = scaleTemp.value;
    const sampleLogits = [3.6, 3.1, 2.7, 2.4, 2.0, 1.8, 1.5, 1.3, 0.9, 0.6, 0.4, 0.2];
    const bx0 = -730;
    const baseY = 230;
    const barW = 92;
    const gap = 28;

    const nodes = [
      heroTitle(['Top-k Filtering', '& Temperature'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'AUTOREGRESSIVE GENERATION · LAST POSITION <= 48 IDS',
      }).opacity(a),
      txt(
        st > 0.5
          ? 'TOP-8 LOGITS DIVIDED BY T = 0.9 (SHARPER MASS, SAME RANKING)'
          : r8 > 0.5
            ? 'KEEP TOP 8 SCORES · DROP THE LONG TAIL'
            : 'LAST POSITION SCORES ALL 17,485 ACTIVE PIECES',
        -830,
        -172,
        26,
        st > 0.5 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      line([-780, baseY], [780, baseY], { stroke: COSMOS.rule, width: 2 }).opacity(a),
    ];

    sampleLogits.forEach((z, idx) => {
      const cx = bx0 + idx * (barW + gap);
      const kept = idx < 8;
      const mult = st > 0.5 ? 1 / 0.9 : 1;
      const h = (kept ? z * mult : z) * 76;
      const col = !kept && r8 > 0.5 ? COSMOS.dim : st > 0.5 ? COSMOS.gold : COSMOS.cyan;
      const barAlpha = !kept && r8 > 0.5 ? 0.18 : 0.92;
      nodes.push(
        rect(barW, h, { fill: col, stroke: null, radius: 6 })
          .at(cx, baseY - h * 0.5)
          .glow(kept ? 7 : 0, col)
          .opacity(barAlpha * a),
        txt(`#${idx + 1}`, cx, baseY + 34, 26, col, 'mono').opacity((kept ? 1 : 0.4) * a),
      );
    });

    if (st > 0.3) {
      nodes.push(
        txt(
          'Colder T concentrates mass on top scores · T -> 0 greedy argmax (ties share mass)',
          0,
          345,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(st * a),
      );
    }

    return group(...nodes);
  });

  // Beat 2 & 3: 4 supplied scores -> keep top 2 -> T=0.5 -> CDF strip + draw at 0.90 (strict prediction hold!)
  const part2 = guardedDynamic(showPart2, (a) => {
    const sf = scaledFour.value;
    const dn = showDrawNeedle.value;
    const rc = revealChoice.value;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const p0 = CAT_DRAW.probabilities[0]; // ~0.8808
    const p1 = CAT_DRAW.probabilities[1]; // ~0.1192
    const stripW = 1480;
    const sx0 = -740;
    const sy = 128;
    const barH = 92;

    const nodes = [
      heroTitle(['Which Piece Does', 'the Sampler Append?'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.gold,
        eyebrow: 'TOP-2 AT T = 0.5 · CUMULATIVE PROBABILITY DRAW',
      }).opacity(a),
      txt('4 SUPPLIED LOGITS  [2, 1, 0, -1]', -830, -182, 26, COSMOS.muted, 'mono', 'left').opacity(
        a,
      ),
    ];

    CAT_DRAW.logits.forEach((z, idx) => {
      const cx = -610 + idx * 405;
      const kept = idx < 2;
      const scaledVal = kept ? (sf > 0.5 ? CAT_DRAW.scaled[idx] : z) : z;
      const col = !kept ? COSMOS.dim : idx === 0 ? COSMOS.blue : COSMOS.gold;
      nodes.push(
        glassCell(cx, -92, 340, 102, col, {
          fill: kept ? '#101f36' : '#0e111b',
          glow: kept ? 7 : 0,
          opacity: (kept ? 0.96 : 0.35) * a,
        }),
        txt(
          kept
            ? sf > 0.5
              ? `ID ${idx}:  ${z} / 0.5 = ${scaledVal}`
              : `ID ${idx}:  z = ${z}`
            : `ID ${idx}:  z = ${z} (dropped)`,
          cx,
          -90,
          28,
          col,
          'mono',
        ).opacity((kept ? 1 : 0.45) * a),
      );
    });

    // Always draw the unit-interval frame immediately on part2 so lower canvas stays balanced
    const sfOp = Math.max(0.35, sf);
    nodes.push(
      txt(
        'UNIT INTERVAL CDF [0.00 -> 1.00]',
        sx0,
        sy - 76,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(sfOp * a),
      rect(stripW, barH, { fill: '#111626', stroke: COSMOS.rule, width: 2, radius: 10 })
        .at(0, sy)
        .opacity(sfOp * a),
      txt('0.00', sx0, sy + 72, 26, COSMOS.muted, 'mono').opacity(sfOp * a),
      txt('1.00', sx0 + stripW, sy + 72, 26, COSMOS.muted, 'mono').opacity(sfOp * a),
    );
    if (sf > 0.05) {
      const w0 = p0 * stripW;
      const w1 = p1 * stripW;
      nodes.push(
        rect(w0 - 4, barH - 4, { fill: COSMOS.blue, stroke: COSMOS.bg, width: 2, radius: 8 })
          .at(sx0 + w0 * 0.5, sy)
          .glow(6, COSMOS.blue)
          .opacity(sf * a),
        txt(
          `local ID 0  (${(p0 * 100).toFixed(1)}%)`,
          sx0 + w0 * 0.5,
          sy + 2,
          32,
          COSMOS.bg,
          'mono',
        ).opacity(sf * a),
        rect(w1 - 4, barH - 4, { fill: COSMOS.gold, stroke: COSMOS.bg, width: 2, radius: 8 })
          .at(sx0 + w0 + w1 * 0.5, sy)
          .glow(rc > 0.5 ? 11 * pulse : 5, COSMOS.gold)
          .opacity(sf * a),
        txt('ID 1', sx0 + w0 + w1 * 0.5, sy + 2, 28, COSMOS.bg, 'mono').opacity(sf * a),
        txt(p0.toFixed(3), sx0 + w0, sy + 72, 26, COSMOS.cyan, 'mono').opacity(sf * a),
      );
    }

    if (dn > 0.05) {
      const drawX = sx0 + CAT_DRAW.uniform * stripW;
      nodes.push(
        line([drawX, sy - 92], [drawX, sy + 52], { stroke: COSMOS.rose, width: 4.5 })
          .glow(9, COSMOS.rose)
          .opacity(dn * a),
        glowDot(drawX, sy - 92, { radius: 8, color: COSMOS.rose, opacity: dn * a }),
        txt(`u = ${CAT_DRAW.uniform.toFixed(2)}`, drawX, sy - 122, 30, COSMOS.rose, 'mono')
          .glow(6, COSMOS.rose)
          .opacity(dn * a),
      );
    }

    // Strict withholding of "local ID 1" until categorical-choice cue!
    nodes.push(
      txt(
        rc > 0.5
          ? `Chosen bin: LOCAL ID ${CAT_DRAW.localId} (crossed 0.881 boundary · torch.multinomial)`
          : dn > 0.5
            ? 'Draw lands at 0.90 -> which local ID will you append?'
            : '',
        0,
        305,
        32,
        rc > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(7, rc > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(dn * a),
    );

    return group(...nodes);
  });

  // Beat 4: Append local 1 -> reverse map to GPT-2 ID 461 -> "ak"
  const part3 = guardedDynamic(showPart3, (a) => {
    const rv = showReverse.value;
    const rj = showReject.value;

    const nodes = [
      heroTitle(['Append, Reverse-Map', '& Decode Bytes'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.emerald,
        eyebrow: 'SAVED INVERSE MAP · ISOLATED TEXT GENERATOR SEED 17',
      }).opacity(a),

      glassCell(-600, -10, 340, 124, COSMOS.gold, { fill: '#251e0e', glow: 8, opacity: a }),
      txt('APPENDED LOCAL', -600, -40, 26, COSMOS.muted, 'mono').opacity(a),
      txt(`ID ${CAT_DRAW.localId}`, -600, 14, 44, COSMOS.gold, 'mono')
        .glow(7, COSMOS.gold)
        .opacity(a),

      glassCell(0, -10, 390, 124, rv > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: rv > 0.3 ? '#102138' : '#12182b',
        glow: rv > 0.3 ? 8 : 3,
        opacity: Math.max(0.75, rv) * a,
      }),
      txt('INVERSE MAP -> GPT-2', 0, -40, 26, COSMOS.muted, 'mono').opacity(Math.max(0.75, rv) * a),
      txt(rv > 0.3 ? `ID ${CAT_DRAW.originalId}` : 'saved map', 0, 14, 40, COSMOS.cyan, 'mono')
        .glow(rv > 0.3 ? 7 : 3, COSMOS.cyan)
        .opacity(Math.max(0.75, rv) * a),

      glassCell(600, -10, 350, 124, rv > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: rv > 0.3 ? '#0e2624' : '#12182b',
        glow: rv > 0.3 ? 9 : 3,
        opacity: Math.max(0.75, rv) * a,
      }),
      txt('UTF-8 DECODE', 600, -40, 26, COSMOS.muted, 'mono').opacity(Math.max(0.75, rv) * a),
      txt(rv > 0.3 ? '"ak"' : 'bytes', 600, 14, 44, COSMOS.emerald, 'mono')
        .glow(rv > 0.3 ? 8 : 3, COSMOS.emerald)
        .opacity(Math.max(0.75, rv) * a),

      txt(
        'Reject unsupported prompt pieces before lookup · separate generator seed (17) keeps train/val streams untouched',
        0,
        215,
        28,
        rj > 0.3 ? COSMOS.rose : COSMOS.muted,
        'sans',
      ).opacity(Math.max(0.78, rj) * a),
      txt('Note: top-k sampling can still repeat itself', 0, 276, 26, COSMOS.muted, 'mono').opacity(
        Math.max(0.78, rj) * a,
      ),
    ];

    if (rv > 0.05) {
      nodes.push(
        glowingArc([-424, -10], [-200, -10], -42, {
          color: COSMOS.cyan,
          width: 3.8,
          opacity: rv * a,
        }),
        glowingArc([200, -10], [420, -10], -42, {
          color: COSMOS.emerald,
          width: 3.8,
          opacity: rv * a,
        }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1, part2, part3);
  runPhase(s, c, phase, 16);

  c.on('generation-choice-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('retain-eight', () => s.play(retainTop8.to(1, { duration: 0.5 })));
  c.on('sampling-temperature', () => s.play(scaleTemp.to(1, { duration: 0.5 })));

  c.on('generation-choice-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('retained-scale', () => s.play(scaledFour.to(1, { duration: 0.55 })));
  c.on('draw-location', () => s.play(showDrawNeedle.to(1, { duration: 0.55 })));
  c.after('categorical-choice', () =>
    s.play(revealChoice.to(1, { duration: remainDuration(c, 'categorical-choice', 0.45) })),
  );

  c.on('generation-choice-3', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('reverse-map-choice', () =>
    s.play(showReverse.to(1, { duration: remainDuration(c, 'reverse-map-choice', 0.6) })),
  );
  c.on('unsupported-prompt', () =>
    s.play(showReject.to(1, { duration: remainDuration(c, 'unsupported-prompt', 0.5) })),
  );
}
