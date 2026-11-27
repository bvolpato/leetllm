// Scene 24: What has to fit on one GPU? Finale transfer: 70B on 16/24/32 GPUs (+18GB -> 88/64.7/53), then 30B on 16 GPUs (Stage 2 86.25 vs Stage 3 48 GB) + LoRA bridge!
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  LEDGER_30_16_S2,
  LEDGER_30_16_S3,
  LEDGER_70_16,
  LEDGER_70_24,
  LEDGER_70_32,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function sizingTransfer(s, c) {
  const show70 = s.value(1);
  const rev16 = s.value(0);
  const rev24 = s.value(0);
  const rev32 = s.value(0);

  const show30 = s.value(0);
  const revS2 = s.value(0);
  const revS3 = s.value(0);
  const revS3Peak = s.value(0);
  const showProf = s.value(0);
  const showLora = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71e', '#ffd16618');
  const title = heroTitle(['What Has to Fit', 'on One GPU?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'FINALE SIZING TRANSFER · 70B & 30B ON 80 GB CARDS',
  });

  // Bar scale: x0 = -560, 1 GB = 11 px -> 80 GB limit at x = +320
  const x0 = -560;
  const px = 11;
  const capX = x0 + 80 * px; // +320

  const view70 = guardedDynamic(show70, (a) => {
    const r16 = rev16.value > 0.5;
    const r24 = rev24.value > 0.5;
    const r32 = rev32.value > 0.5;

    const nodes = [
      txt(
        '70B MODEL + 18 GB LIVE EXTRA PEAK ON 80 GB GPUS',
        0,
        -205,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      line([capX, -155], [capX, -132], { stroke: COSMOS.gold, width: 3.2, dash: [8, 6] })
        .glow(7, COSMOS.gold)
        .opacity(a),
      line([capX, -54], [capX, -18], { stroke: COSMOS.gold, width: 3.2, dash: [8, 6] })
        .glow(7, COSMOS.gold)
        .opacity(a),
      line([capX, 58], [capX, 96], { stroke: COSMOS.gold, width: 3.2, dash: [8, 6] })
        .glow(7, COSMOS.gold)
        .opacity(a),
      line([capX, 174], [capX, 205], { stroke: COSMOS.gold, width: 3.2, dash: [8, 6] })
        .glow(7, COSMOS.gold)
        .opacity(a),
      txt('80 GB', capX, -178, 26, COSMOS.gold, 'mono').opacity(a),
    ];

    const rows = [
      { label: '16 GPUs', state: LEDGER_70_16.total, extra: 18, rev: r16, y: -95 },
      { label: '24 GPUs', state: LEDGER_70_24.total, extra: 18, rev: r24, y: 20 },
      { label: '32 GPUs', state: LEDGER_70_32.total, extra: 18, rev: r32, y: 135 },
    ];
    rows.forEach((rw) => {
      const peak = rw.state + rw.extra;
      const fits = peak <= 80;
      const wState = rw.state * px;
      const wExtra = rw.extra * px;
      nodes.push(txt(rw.label, x0 - 115, rw.y, 28, COSMOS.ink, 'mono').opacity(a));
      if (rw.rev) {
        nodes.push(
          rect(wState, 66, { fill: '#12294a', stroke: ROLE.weights, width: 2.2, radius: 8 })
            .at(x0 + wState * 0.5, rw.y)
            .opacity(a),
          rect(wExtra, 66, {
            fill: fits ? '#0d2b24' : '#31101d',
            stroke: fits ? ROLE.good : ROLE.bad,
            width: 2.8,
            radius: 8,
          })
            .at(x0 + wState + wExtra * 0.5, rw.y)
            .glow(8, fits ? ROLE.good : ROLE.bad)
            .opacity(a),
          txt(
            `${rw.state.toFixed(1)} + 18 = ${peak.toFixed(1)} GB (${fits ? 'FITS' : 'OOM!'})`,
            Math.max(capX + 24, x0 + wState + wExtra + 24),
            rw.y,
            26,
            fits ? ROLE.good : ROLE.bad,
            'mono',
            'left',
          ).opacity(a),
        );
      } else {
        nodes.push(
          rect(wState, 66, { fill: '#12294a', stroke: ROLE.weights, width: 2.2, radius: 8 })
            .at(x0 + wState * 0.5, rw.y)
            .opacity(0.65 * a),
          txt(
            rw.label === '16 GPUs' ? '70 + 18 GB → fits 80 GB?' : 'pending...',
            capX + 24,
            rw.y,
            26,
            COSMOS.gold,
            'mono',
            'left',
          ).opacity(a),
        );
      }
    });

    nodes.push(
      txt(
        r32
          ? '24 GPUs (64.7 GB) is the smallest layout worth testing under +18 GB extra'
          : r24
            ? '24 GPUs fits at 64.7 GB (15.3 GB headroom) · next: check 32 GPUs'
            : r16
              ? '16 GPUs hits 88.0 GB (OOM past 80 GB!) · next: try 24 GPUs'
              : 'Predict: will 16 GPUs carry 70 GB state + 18 GB live extra?',
        0,
        295,
        28,
        r32 || r24 ? ROLE.good : r16 ? ROLE.bad : COSMOS.gold,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const view30 = guardedDynamic(show30, (a) => {
    const s2 = revS2.value > 0.5;
    const s3 = revS3.value > 0.5;
    const s3p = revS3Peak.value > 0.5;
    const pr = showProf.value;
    const lo = showLora.value;

    const nodes = [
      txt(
        'YOUR TURN: 30B MODEL · 16 GPUS (80 GB) · +18 GB EXTRA',
        0,
        -205,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      line([capX, -155], [capX, 130], { stroke: COSMOS.gold, width: 3.2, dash: [8, 6] })
        .glow(7, COSMOS.gold)
        .opacity(a),
      txt('80 GB', capX, -178, 26, COSMOS.gold, 'mono').opacity(a),

      // Stage 2 bar
      txt('STAGE 2', x0 - 115, -75, 28, s2 ? ROLE.bad : COSMOS.gold, 'mono').opacity(a),
    ];

    if (s2) {
      const wS2 = LEDGER_30_16_S2.total * px; // 86.25 * 11 = 948.75
      nodes.push(
        rect(wS2, 68, { fill: '#31101d', stroke: ROLE.bad, width: 2.8, radius: 8 })
          .at(x0 + wS2 * 0.5, -75)
          .glow(10, ROLE.bad)
          .opacity(a),
        txt(
          `60 W + 26.25 G/Opt = ${LEDGER_30_16_S2.total.toFixed(2)} GB (state alone > 80 GB!)`,
          x0 + 22,
          -75,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
      );
    } else {
      nodes.push(
        txt(
          'Stage 2 (weights replicated): fits?',
          x0 + 18,
          -75,
          28,
          COSMOS.gold,
          'mono',
          'left',
        ).opacity(a),
      );
    }

    // Stage 3 bar
    nodes.push(txt('STAGE 3', x0 - 115, 55, 28, s3 ? ROLE.good : COSMOS.gold, 'mono').opacity(a));
    if (s3) {
      const w30 = LEDGER_30_16_S3.total * px; // 330
      const w18 = 18 * px; // 198
      nodes.push(
        rect(w30, 68, { fill: '#12294a', stroke: ROLE.weights, width: 2.4, radius: 8 })
          .at(x0 + w30 * 0.5, 55)
          .opacity(a),
        txt('30 GB state', x0 + w30 * 0.5, 55, 26, ROLE.weights, 'mono').opacity(a),
      );
      if (s3p) {
        nodes.push(
          rect(w18, 68, { fill: '#0d2b24', stroke: ROLE.good, width: 2.8, radius: 8 })
            .at(x0 + w30 + w18 * 0.5, 55)
            .glow(10, ROLE.good)
            .opacity(a),
          txt('+18 = 48 GB (FITS!)', x0 + w30 + w18 + 24, 55, 28, ROLE.good, 'mono', 'left')
            .glow(6, ROLE.good)
            .opacity(a),
        );
      }
    } else {
      nodes.push(
        txt('Stage 3 (all sharded): fits?', x0 + 18, 55, 28, COSMOS.gold, 'mono', 'left').opacity(
          a,
        ),
      );
    }

    // Finale profiler & LoRA bridge
    if (pr > 0.02 || lo > 0.02) {
      nodes.push(
        glassCell(0, 238, 1520, 128, lo > 0.5 ? ROLE.comm : ROLE.good, {
          fill: '#0d2228',
          glow: 9,
          opacity: Math.max(pr, lo) * a,
        }),
        txt(
          lo > 0.5
            ? 'Next: LoRA changes the inventory itself · small adapter + frozen base weights!'
            : 'Take Stage 3 to the profiler: verify peak across ranks, tokens/s & checkpoint resume',
          0,
          238,
          28,
          lo > 0.5 ? ROLE.comm : ROLE.good,
          'mono',
        ).opacity(Math.max(pr, lo) * a),
      );
    }

    nodes.push();

    return group(...nodes);
  });

  s.add(bgAura, title, view70, view30);

  c.after('price-sixteen', () => s.play(rev16.to(1, { duration: 0.4 })));
  c.after('try-twenty-four', () => s.play(rev24.to(1, { duration: 0.4 })));
  c.after('try-thirty-two', () => s.play(rev32.to(1, { duration: 0.4 })));
  c.onBeat(2, () => {
    s.play(par(show70.to(0, { duration: 0.2 }), delay(show30.to(1, { duration: 0.25 }), 0.22)));
  });
  c.after('try-stage-two', () => s.play(revS2.to(1, { duration: 0.4 })));
  c.after('try-stage-three', () => s.play(revS3.to(1, { duration: 0.4 })));
  c.after('price-stage-three', () => s.play(revS3Peak.to(1, { duration: 0.4 })));
  c.after('profile-trial', () => s.play(showProf.to(1, { duration: 0.45 })));
  c.on('lora-inventory', () => s.play(showLora.to(1, { duration: 0.45 })));
}
