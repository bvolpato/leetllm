// Scene 7: kernel - The kernel has to follow the table
// Act 1: Physical block corridor [0..9] showing contiguous overrun into Block 8 vs paged gather [7 -> 2]
//        yielding exact (1.91, 1.53), then reading 1 slot past valid_len=6 hitting sentinel (999.00, 999.00).
// Act 2: +20-26% kernel cost vs 2-4x serving throughput, then vAttention continuous virtual row.
import { delay, group, line, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PAGED_READ,
  PAST_THE_END,
  ROLE,
  TABLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  glowBar,
  guardedDynamic,
  quadArcPts,
  showPair,
  txt,
} from '../parts.mjs';

export default function kernel(s, c) {
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Act 1 state
  const overrunVis = s.value(0);
  const copyVis = s.value(0);
  const pagedReadStep = s.value(0); // 1=finds, 2=load, 3=same
  const validStep = s.value(0); // 1=valid, 2=empty, 3=garbage, 4=two-inputs

  // Act 2 state
  const perfStep = s.value(0); // 1=not-free, 2=slower, 3=throughput, 4=together
  const vAttnStep = s.value(0); // 1=only-answer, 2=v-attention, 3=on-demand, 4=existing, 5=compare

  const act1Header = cinemaHeader(
    'PAGED ATTENTION KERNEL',
    'The kernel has to',
    'follow the table',
    {
      x: -860,
      y: -415,
      accent: ROLE.key,
      size: 54,
    },
  );

  const act1Aura = aura(0, 60, 660, '#5ce1e620', '#ff6b8b14');

  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const ov = overrunVis.value;
    const cp = copyVis.value;
    const pr = pagedReadStep.value;
    const vs = validStep.value;
    const nodes = [];

    // Request A's Block Table banner (left-middle, y = -170)
    nodes.push(
      txt(
        `A'S TABLE: [ Phys ${TABLE[0]}, Phys ${TABLE[1]} ]   ·   VALID LENGTH = 6`,
        -855,
        -182,
        26,
        ROLE.reqA,
        'mono',
        'left',
      ).opacity(a),
    );

    // Physical Memory Strip across middle (Blocks 0..9, each 164px wide, centered x = -740..+740)
    const blockY = -56;
    const blockW = 152;
    const blockGap = 166;
    const xStart = -748;
    const blockX = (id) => xStart + id * blockGap;

    for (let id = 0; id < 10; id++) {
      const cx = blockX(id);
      const isA7 = id === 7;
      const isA2 = id === 2;
      const isB8 = id === 8;
      let fill = '#0f1628';
      let stroke = '#2a385c';
      let label = `B${id}`;
      let labelCol = COSMOS.dim;

      if (isA7) {
        fill = '#102b38';
        stroke = ROLE.reqA;
        label = 'B7: 4/4';
        labelCol = ROLE.reqA;
      } else if (isA2) {
        fill = vs >= 2.5 ? '#2c1220' : '#102b38';
        stroke = vs >= 2.5 ? ROLE.waste : ROLE.reqA;
        label = 'B2: 2/4';
        labelCol = vs >= 2.5 ? ROLE.waste : ROLE.reqA;
      } else if (isB8) {
        fill = ov > 0.3 && pr < 0.5 ? '#331222' : '#1e1635';
        stroke = ov > 0.3 && pr < 0.5 ? ROLE.waste : ROLE.reqB;
        label = 'B8: B';
        labelCol = ov > 0.3 && pr < 0.5 ? ROLE.waste : ROLE.reqB;
      }

      nodes.push(
        rect(blockW, 86, { fill, stroke, width: isA7 || isA2 || isB8 ? 2.6 : 1.6, radius: 10 })
          .at(cx, blockY)
          .opacity(a),
        txt(label, cx, blockY, 26, labelCol, 'mono').opacity(a),
      );
    }

    // Contiguous overrun red laser from B7 straight into B8 (before paged read starts)
    if (ov > 0.05 && pr < 0.4) {
      const x7 = blockX(7);
      const x8 = blockX(8);
      nodes.push(
        beamWithPhotons(
          [
            [x7 - 40, blockY - 64],
            [x8 + 40, blockY - 64],
          ],
          ROLE.waste,
          0,
          { width: 4.5, glow: 12, photonCount: 2, alpha: a * ov },
        ),
        txt(
          cp > 0.3 && ov < 0.8
            ? 'Copying back into one buffer costs extra memory moves'
            : 'Contiguous kernel walks past B7 straight into B8 (wrong request!)',
          0,
          44,
          28,
          ROLE.waste,
          'sans',
        )
          .glow(6, ROLE.waste)
          .opacity(a * ov),
      );
    }

    // Paged gather arc jumping cleanly from B7 -> B2
    if (pr >= 0.5) {
      const pA = a * Math.min(1, pr);
      const arcPts = quadArcPts([blockX(7), blockY - 46], [blockX(2), blockY - 46], -105, 32);
      nodes.push(
        beamWithPhotons(arcPts, ROLE.fresh, 0, {
          width: 4.2,
          glow: 11,
          photonCount: 3,
          alpha: pA,
        }),
        txt(
          pr >= 1.5
            ? 'Paged gather: 4 pairs from B7 -> 2 pairs from B2'
            : 'Follow A’s block table: [7 -> 2]',
          0,
          44,
          28,
          ROLE.fresh,
          'mono',
        ).opacity(pA),
      );
    }

    // Zoomed 4-slot view of Physical Block 2 + Output Panel (skeleton visible from Act 1 start, values reveal strictly on cues!)
    const zActive = pr >= 2.5 || vs >= 0.5;
    const zA = a * (zActive ? 1 : 0.52);
    const slotX0 = -740;
    const slotY = 212;
    const slots = [
      { lbl: 'p4 ok', col: ROLE.reqA, fill: '#102b38' },
      { lbl: 'p5 ok', col: ROLE.reqA, fill: '#102b38' },
      {
        lbl: vs >= 1.5 ? '999!' : 'empty',
        col: vs >= 2.5 ? ROLE.waste : ROLE.link,
        fill: vs >= 2.5 ? '#361122' : '#241a12',
      },
      { lbl: 'empty', col: COSMOS.dim, fill: '#121829' },
    ];
    nodes.push(
      txt('BLOCK 2 SLOTS (POSITIONS 4..7)', -495, 140, 26, COSMOS.muted, 'mono').opacity(zA),
    );
    slots.forEach((sl, idx) => {
      const cx = slotX0 + idx * 165;
      nodes.push(
        rect(148, 72, {
          fill: sl.fill,
          stroke: sl.col,
          width: idx === 2 && vs >= 2.5 ? 3.2 : 2.0,
          radius: 10,
        })
          .at(cx, slotY)
          .opacity(zA),
        txt(sl.lbl, cx, slotY, 26, sl.col, 'mono').opacity(zA),
      );
    });

    // Right-hand output comparison readout (answers withheld until `same` / `garbage`!)
    nodes.push(
      txt('ATTENTION OUTPUT', 140, 140, 26, COSMOS.muted, 'mono', 'left').opacity(zA),
      txt(
        pr >= 2.5 ? `6 valid slots:   ${showPair(PAGED_READ)}` : '6 valid slots:   pending gather',
        140,
        198,
        pr >= 2.5 ? 32 : 28,
        pr >= 2.5 ? ROLE.fresh : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(pr >= 2.5 ? 7 : 0, ROLE.fresh)
        .opacity(pr >= 2.5 ? a : zA),
    );
    if (vs >= 2.5) {
      nodes.push(
        txt(`7 slots (+1):   ${showPair(PAST_THE_END)}`, 140, 260, 34, ROLE.waste, 'mono', 'left')
          .glow(10, ROLE.waste)
          .opacity(a),
      );
    } else {
      nodes.push(
        txt('Contiguous ref:  same 6 pairs', 140, 260, 26, COSMOS.dim, 'mono', 'left').opacity(zA),
      );
    }
    if (vs >= 3.5) {
      nodes.push(
        txt('Always pass BOTH inputs: block_table + valid_len = 6', 0, 384, 30, ROLE.focus, 'mono')
          .glow(7, ROLE.focus)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // ── Act 2: Kernel Overhead vs Serving Throughput + vAttention ──────────────
  const act2Header = cinemaHeader(
    'ALLOCATOR + KERNEL TOGETHER',
    'Throughput gain',
    'and vAttention',
    {
      x: -860,
      y: -415,
      accent: ROLE.fresh,
      size: 54,
    },
  );

  const act2Aura = group(aura(-420, 40, 420, '#fb923c1e'), aura(420, 40, 460, '#6ee7b722'));

  const act2Dyn = guardedDynamic(act2Vis, (a) => {
    const pf = perfStep.value;
    const va = vAttnStep.value;
    const nodes = [];

    // Left panel: Paged Kernel (+20-26% slower) vs Overall Serving Throughput (2-4x)
    nodes.push(
      txt('PAGED KERNEL LATENCY', -855, -162, 26, ROLE.link, 'mono', 'left').opacity(a),
      glowBar(-855, -110, 690, 38, pf >= 1.5 ? 0.42 : 0.16, {
        fill: ROLE.link,
        glow: 8,
        opacity: a,
      }),
      txt(
        pf >= 1.5 ? '+20–26% kernel time (table indirection)' : 'Table walk adds overhead',
        -855,
        -56,
        26,
        ROLE.link,
        'sans',
        'left',
      ).opacity(a),
    );

    if (pf >= 2.5) {
      nodes.push(
        txt(
          'SERVING THROUGHPUT (BIGGER BATCHES)',
          -855,
          36,
          26,
          ROLE.fresh,
          'mono',
          'left',
        ).opacity(a),
        glowBar(-855, 88, 690, 42, 0.94, { fill: ROLE.fresh, glow: 10, opacity: a }),
        txt('2–4× higher throughput vs Orca baseline', -855, 146, 28, ROLE.fresh, 'mono', 'left')
          .glow(6, ROLE.fresh)
          .opacity(a),
      );
    }
    if (pf >= 3.5) {
      nodes.push(
        txt('Measure allocator + kernel together', -855, 246, 28, ROLE.focus, 'sans', 'left')
          .glow(5, ROLE.focus)
          .opacity(a),
      );
    }

    // Right panel: vAttention skeleton always present in Act 2 (dim during Beat 3, vivid on Beat 4)
    const vA = a * (va >= 0.5 ? Math.min(1, va) : 0.44);
    nodes.push(
      dashedRule(-40, -180, -40, 360, '#283657', 0.65 * a),
      txt(
        va >= 1.5 ? 'vATTENTION: CONTINUOUS VIRTUAL ROW' : 'UPPER VIRTUAL ADDRESS ROW',
        430,
        -204,
        26,
        ROLE.prefill,
        'mono',
      )
        .glow(va >= 1.5 ? 5 : 0, ROLE.prefill)
        .opacity(vA),
    );

    // Continuous upper row of 4 virtual pages
    const vx0 = 135;
    const vY = -62;
    for (let i = 0; i < 4; i++) {
      const cx = vx0 + i * 195;
      nodes.push(
        rect(182, 66, { fill: '#132a47', stroke: ROLE.prefill, width: 2.2, radius: 8 })
          .at(cx, vY)
          .opacity(vA),
        txt(`Virt ${i}`, cx, vY, 26, ROLE.prefill, 'mono').opacity(vA),
      );
    }
    // Straight continuous kernel beam gliding cleanly ABOVE virtual row (y = -114), caption above it at y = -158!
    if (va >= 3.5) {
      nodes.push(
        beamWithPhotons(
          [
            [vx0 - 70, vY - 52],
            [vx0 + 3 * 195 + 70, vY - 52],
          ],
          ROLE.fresh,
          0,
          { width: 4.2, glow: 12, photonCount: 3, alpha: vA },
        ),
        txt(
          'Existing continuous kernels read straight ahead',
          430,
          -158,
          26,
          ROLE.fresh,
          'sans',
        ).opacity(vA),
      );
    }

    // Lower physical pages mapped on-demand via true permutation [2, 0, 3, 1] (zero overlap!)
    const physOrder = [7, 2, 11, 5];
    const physSlot = [2, 0, 3, 1];
    const pY = 176;
    const pA = a * (va >= 2.5 ? 1 : 0.42);
    physOrder.forEach((pid, i) => {
      const cx = vx0 + i * 195;
      const px = vx0 + physSlot[i] * 195;
      nodes.push(
        line([cx, vY + 38], [px, pY - 38], {
          stroke: ROLE.focus,
          width: 2.2,
          dash: [5, 5],
        })
          .glow(va >= 2.5 ? 5 : 0, ROLE.focus)
          .opacity(0.8 * pA),
        rect(164, 66, { fill: '#102935', stroke: ROLE.key, width: 2.2, radius: 8 })
          .at(px, pY)
          .opacity(pA),
        txt(`Phys ${pid}`, px, pY, 26, ROLE.key, 'mono').opacity(pA),
      );
    });
    if (va >= 4.5) {
      nodes.push(
        txt('Compare both designs on the same request mix', 430, 314, 26, COSMOS.ink, 'sans')
          .glow(5, ROLE.focus)
          .opacity(vA),
      );
    }

    return group(...nodes);
  });

  s.add(act1Aura, act1Header, act1Dyn, act2Dyn);

  // Beat 0 cues
  c.on('easy-miss', () => {
    s.play(act1Vis.to(1, { duration: 0.15 }));
  });
  c.on('must-change', () => {
    s.play(overrunVis.to(0.6, { duration: clampDur(c, c.cue('must-change').start, 0.3) }));
  });
  c.on('copy-back', () => {
    s.play(copyVis.to(1, { duration: clampDur(c, c.cue('copy-back').start, 0.3) }));
  });
  c.on('cant-point', () => {
    s.play(overrunVis.to(1, { duration: clampDur(c, c.cue('cant-point').start, 0.3) }));
  });

  // Beat 1 cues (Paged read matches contiguous -> (1.91, 1.53))
  c.on('finds', () => {
    s.play(pagedReadStep.to(1, { duration: clampDur(c, c.cue('finds').start, 0.3) }));
  });
  c.on('load', () => {
    s.play(pagedReadStep.to(2, { duration: clampDur(c, c.cue('load').start, 0.35) }));
  });
  c.after('same', () => {
    s.play(pagedReadStep.to(3, { duration: clampDur(c, c.cue('same').end, 0.3) }));
  });

  // Beat 2 cues (Valid length 6 -> sentinel 999 -> two inputs)
  c.on('valid', () => {
    s.play(validStep.to(1, { duration: clampDur(c, c.cue('valid').start, 0.25) }));
  });
  c.on('empty', () => {
    s.play(validStep.to(2, { duration: clampDur(c, c.cue('empty').start, 0.25) }));
  });
  c.after('garbage', () => {
    s.play(validStep.to(3, { duration: clampDur(c, c.cue('garbage').end, 0.3) }));
  });
  c.on('two-inputs', () => {
    s.play(validStep.to(4, { duration: clampDur(c, c.cue('two-inputs').start, 0.3) }));
  });

  // Swap to Act 2 at "Walking a table"
  c.swap('not-free', [act1Aura, act1Header], [act2Aura, act2Header]);
  c.on('not-free', () => {
    const t = c.cue('not-free').start;
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
        perfStep.to(1, { duration: clampDur(c, t, 0.3) }),
      ),
    );
  });
  c.on('slower', () => {
    s.play(perfStep.to(2, { duration: clampDur(c, c.cue('slower').start, 0.3) }));
  });
  c.on('throughput', () => {
    s.play(perfStep.to(3, { duration: clampDur(c, c.cue('throughput').start, 0.35) }));
  });
  c.on('together', () => {
    s.play(perfStep.to(4, { duration: clampDur(c, c.cue('together').start, 0.3) }));
  });

  // Beat 4 cues (vAttention)
  c.on('only-answer', () => {
    s.play(vAttnStep.to(1, { duration: clampDur(c, c.cue('only-answer').start, 0.3) }));
  });
  c.on('v-attention', () => {
    s.play(vAttnStep.to(2, { duration: clampDur(c, c.cue('v-attention').start, 0.3) }));
  });
  c.on('on-demand', () => {
    s.play(vAttnStep.to(3, { duration: clampDur(c, c.cue('on-demand').start, 0.35) }));
  });
  c.on('existing', () => {
    s.play(vAttnStep.to(4, { duration: clampDur(c, c.cue('existing').start, 0.3) }));
  });
  c.on('compare', () => {
    s.play(vAttnStep.to(5, { duration: clampDur(c, c.cue('compare').start, 0.3) }));
  });
}
