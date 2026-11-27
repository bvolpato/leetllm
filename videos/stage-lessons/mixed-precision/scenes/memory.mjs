// Scene 09: Memory for one training step (2 cinematic acts).
// Act 1 (Beats 0-2): Proportional glowing byte-inventory beams (4.8 GB -> 3.2 GB, 1/3 freed) with strict prediction withholding.
// Act 2 (Beat 3): Per-parameter static byte assembly (FP32 16 B, AMP 16 B, master-copy 16 B, optional staging 20 B).
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  fade,
  group,
  guardedDynamic,
  heroTitle,
  line,
  memoryInventory,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function memory(s, c) {
  // Act 1 values
  const showAct1 = s.value(1);
  const highlightStatic = s.value(0);
  const contractVal = s.value(0);
  const revealShare = s.value(0);
  const showCaveat = s.value(0);

  // Act 2 values
  const showAct2 = s.value(0);
  const fp32Parts = s.value(0);
  const fp32Total = s.value(0);
  const ampTotal = s.value(0);
  const masterParts = s.value(0);
  const masterTotal = s.value(0);
  const stagingParts = s.value(0);

  const bgAura = aura(0, -10, 680, '#5ce1e61e', '#a78bfa16');

  const title1 = heroTitle(['Memory for One', 'Training Step'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: '100M PARAMETERS · 800M SAVED ACTIVATIONS',
  });
  const title2 = heroTitle(['Static Bytes', 'Per Parameter'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'UNSHARDED ADAM INVENTORY',
  }).opacity(0);

  // Act 1: Full-width proportional glowing tensor bars
  const act1Live = guardedDynamic(showAct1, (a) => {
    const hs = highlightStatic.value;
    const cv = contractVal.value;
    const rs = revealShare.value;
    const sc = showCaveat.value;
    const inv = memoryInventory(cv);

    const barX = -760;
    const perGb = 316; // 4.8 GB = 1516.8 px
    const endX = barX + inv.original * perGb;
    const yBase = -150;
    const yCast = 95;
    const barH = 84;
    const segColors = [COSMOS.blue, COSMOS.rose, COSMOS.violet, COSMOS.cyan];
    const segNames = ['W', 'Grad', 'Adam m+v', 'Saved Activations'];

    const nodes = [];
    const drawRow = (label, y, parts, totalGb) => {
      nodes.push(
        txt(label, barX, y - 72, 30, COSMOS.ink, 'sans', 'left').opacity(a),
        txt(
          `${totalGb.toFixed(1)} GB`,
          barX + totalGb * perGb,
          y - 72,
          34,
          COSMOS.gold,
          'mono',
          'right',
        )
          .glow(6, COSMOS.gold)
          .opacity(a),
      );
      let cursor = barX;
      parts.forEach((gb, idx) => {
        const w = gb * perGb;
        const col = segColors[idx];
        const isStatic = idx < 3;
        const glowAmt = isStatic && hs > 0.3 ? 11 : idx === 3 ? 9 : 6;
        nodes.push(
          rect(Math.max(4, w - 4), barH, { fill: col, stroke: '#ffffff', width: 1.4, radius: 8 })
            .at(cursor + w * 0.5, y)
            .glow(glowAmt, col)
            .opacity(0.86 * a),
          txt(gb.toFixed(1), cursor + w * 0.5, y, 28, COSMOS.bg, 'mono').opacity(a),
        );
        cursor += w;
      });
    };

    drawRow('All 4 components in FP32', yBase, inv.baseline, inv.original);
    drawRow('Cast saved activations to 16-bit', yCast, inv.current, inv.total);

    // Component legend labels centered between the two bars
    let lx = barX;
    inv.baseline.forEach((gb, idx) => {
      const w = gb * perGb;
      nodes.push(txt(segNames[idx], lx + w * 0.5, -28, 26, segColors[idx], 'mono').opacity(a));
      lx += w;
    });

    // Cyan savings caliper bracket measuring the freed activation gap
    if (cv > 0.04) {
      const curEnd = barX + inv.total * perGb;
      const brY = yCast + 86;
      nodes.push(
        line([curEnd, brY], [endX, brY], { stroke: COSMOS.emerald, width: 4.5 })
          .glow(8, COSMOS.emerald)
          .opacity(a),
        line([curEnd, brY - 16], [curEnd, brY + 12], { stroke: COSMOS.emerald, width: 4 }).opacity(
          a,
        ),
        line([endX, brY - 16], [endX, brY + 12], { stroke: COSMOS.emerald, width: 4 }).opacity(a),
      );
      if (cv > 0.9) {
        nodes.push(
          txt(
            `${inv.saved.toFixed(1)} GB freed`,
            (curEnd + endX) * 0.5,
            brY + 46,
            34,
            COSMOS.emerald,
            'mono',
          )
            .glow(7, COSMOS.emerald)
            .opacity(a),
        );
      }
    }

    // Bottom prediction -> reveal -> caveat line
    let footer;
    let footerColor;
    if (sc > 0.4) {
      footer = 'Selected-tensor count only  ·  profile peak allocated & reserved memory on GPU';
      footerColor = COSMOS.muted;
    } else if (rs > 0.4) {
      footer = `Freed share:  ${inv.saved.toFixed(1)} / ${inv.original.toFixed(1)} = 1/3  (${(inv.fraction * 100).toFixed(1)}%), NOT 50%`;
      footerColor = COSMOS.emerald;
    } else if (cv > 0.85) {
      footer = `Freed share:  ${inv.saved.toFixed(1)} / ${inv.original.toFixed(1)} = ?`;
      footerColor = COSMOS.gold;
    } else {
      footer = 'Predict: what share of the 4.8 GB inventory is freed by 16-bit activations?';
      footerColor = COSMOS.gold;
    }
    nodes.push(txt(footer, 0, 415, 30, footerColor, 'sans').glow(5, footerColor).opacity(a));

    return group(...nodes);
  });

  // Act 2: Per-parameter static byte assembly (Beat 3)
  const act2Live = guardedDynamic(showAct2, (a) => {
    const f32p = fp32Parts.value;
    const f32t = fp32Total.value;
    const ampt = ampTotal.value;
    const mp = masterParts.value;
    const mt = masterTotal.value;
    const stg = stagingParts.value;

    const startX = -480;
    const pxPerByte = 58; // 20 bytes = 1160 px -> ends at +680
    const rowH = 74;

    const rows = [
      {
        name: 'FP32 / AMP',
        y: -150,
        parts: [
          ['w 4B', 4, COSMOS.blue],
          ['g 4B', 4, COSMOS.rose],
          ['m 4B', 4, COSMOS.gold],
          ['v 4B', 4, COSMOS.violet],
        ],
        progress: f32p * 4,
        totalReady: f32t > 0.5,
        totalLabel: '16 B',
      },
      {
        name: 'Master-copy',
        y: 35,
        parts: [
          ['w16', 2, COSMOS.blue],
          ['g16', 2, COSMOS.rose],
          ['master 4B', 4, COSMOS.cyan],
          ['m + v  8B', 8, COSMOS.violet],
        ],
        progress: mp * 4,
        totalReady: mt > 0.5,
        totalLabel: '16 B',
      },
      {
        name: '+ Staging buf',
        y: 220,
        parts: [
          ['w16', 2, COSMOS.blue],
          ['g16', 2, COSMOS.rose],
          ['master 4B', 4, COSMOS.cyan],
          ['m + v  8B', 8, COSMOS.violet],
          ['stage 4B', 4, COSMOS.emerald],
        ],
        progress: mt > 0.5 ? 4 + stg : 0,
        totalReady: stg > 0.85,
        totalLabel: '20 B',
      },
    ];

    const nodes = [
      txt(
        ampt > 0.5
          ? 'Ordinary FP32-model AMP keeps the exact same 16 static bytes/param'
          : 'True byte-width scale per parameter in unsharded Adam',
        820,
        -370,
        28,
        ampt > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'right',
      ).opacity(a),
    ];

    for (const row of rows) {
      nodes.push(txt(row.name, startX - 36, row.y, 30, COSMOS.ink, 'mono', 'right').opacity(a));
      let cursor = startX;
      row.parts.forEach(([label, bytes, col], idx) => {
        const w = bytes * pxPerByte;
        const lit = row.progress >= idx + 0.5;
        nodes.push(
          rect(w - 6, rowH, {
            fill: lit ? col : '#101628',
            stroke: lit ? '#ffffff' : '#2d3b5c',
            width: lit ? 1.5 : 1.5,
            radius: 7,
          })
            .at(cursor + w * 0.5, row.y)
            .opacity((lit ? 0.88 : 0.4) * a),
        );
        if (lit) {
          nodes.push(txt(label, cursor + w * 0.5, row.y, 26, COSMOS.bg, 'mono').opacity(a));
        }
        cursor += w;
      });
      if (row.totalReady) {
        nodes.push(
          txt(row.totalLabel, cursor + 34, row.y, 38, COSMOS.gold, 'mono', 'left')
            .glow(8, COSMOS.gold)
            .opacity(a),
        );
      }
    }

    nodes.push(
      txt(
        'Saved activations and temporary kernel workspace still sit on a separate line',
        0,
        410,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title1, title2, act1Live, act2Live);

  // Act 1 cues
  c.on('memory-b1-1', () => s.play(highlightStatic.to(1, { duration: 0.6 })));
  c.on('memory-contraction', () => s.play(contractVal.to(1, { duration: 1.4 })));
  c.after('memory-b2-1', () =>
    s.play(revealShare.to(1, { duration: remainDuration(c, 'memory-b2-1', 0.4, 0.35, true) })),
  );
  c.on('memory-b3-1', () => s.play(showCaveat.to(1, { duration: 0.5 })));

  // Act 2 transition & cues
  c.on('memory-extension-4', () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title2, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('memory-fp32-parts', () => s.play(fp32Parts.to(1, { duration: 0.9 })));
  c.on('memory-fp32-total', () => s.play(fp32Total.to(1, { duration: 0.4 })));
  c.on('memory-amp-total', () => s.play(ampTotal.to(1, { duration: 0.45 })));
  c.on('memory-master-parts', () => s.play(masterParts.to(1, { duration: 0.9 })));
  c.on('memory-master-total', () => s.play(masterTotal.to(1, { duration: 0.4 })));
  c.on('memory-staging', () =>
    s.play(stagingParts.to(1, { duration: remainDuration(c, 'memory-staging', 0.55) })),
  );
}
