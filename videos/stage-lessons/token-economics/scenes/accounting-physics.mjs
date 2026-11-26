// Scene 6: accounting-physics - Separate the machine work from the bill
// Mode 0: Parallel prefill wave vs sequential autoregressive decode chain.
// Mode 1: Execution-to-Billing energy conduits separating 4 invoice columns.
// Mode 2: Local timeout hold -> `match-timeout` resolves Receipt A1 ($0.00720).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  coldMicro,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowBar,
  guardedDynamic,
  quadArcPts,
  txt,
  usd,
} from '../parts.mjs';

export default function accountingPhysics(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = prefill/decode, 1 = billing conduits, 2 = timeout/match
  const decProg = s.value(0); // 0..1 on te-accounting-physics-0
  const flowProg = s.value(0); // 0..1 on te-accounting-physics-1
  const timeoutProg = s.value(0); // 0..1 on te-accounting-physics-2
  const matchedVal = s.value(0); // 0..1 on match-timeout

  const header = cinemaHeader('COMPUTE VS. BILLING', 'Machine work', 'is not the invoice', {
    x: -860,
    y: -415,
    accent: ROLE.input,
    size: 52,
  });

  const sceneAura = aura(0, 60, 700, '#5ce1e622', '#ff6b8b1a');

  // Mode 0: Parallel Prefill vs Sequential Autoregressive Decode
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const u = decProg.value;
      const nodes = [
        txt('PREFILL  ·  PARALLEL WITHIN EACH LAYER', -450, -175, 26, ROLE.input, 'mono').opacity(
          a,
        ),
        txt('DECODE  ·  SEQUENTIAL TOKEN BY TOKEN', 430, -175, 26, ROLE.output, 'mono').opacity(a),
      ];

      // 8 parallel cyan input columns lighting simultaneously
      for (let i = 0; i < 8; i++) {
        const cx = -780 + i * 94;
        const fillH = 0.35 + 0.65 * Math.min(1, u * 1.4);
        nodes.push(
          rect(66, 130, { fill: '#0e2838', stroke: ROLE.input, width: 2.2, radius: 10 })
            .at(cx, -30)
            .glow(6 * fillH, ROLE.input)
            .opacity(a),
          rect(54, Math.max(12, 114 * fillH), { fill: ROLE.input, stroke: null, radius: 6 })
            .at(cx, 35 - 57 * fillH)
            .opacity(0.72 * a),
          txt(String(i + 1), cx, 78, 26, ROLE.input, 'mono').opacity(a),
        );
      }

      // 8 sequential rose decode blocks chained left-to-right
      for (let i = 0; i < 8; i++) {
        const cx = 100 + i * 94;
        const v = Math.max(0, Math.min(1, u * 8 - i));
        nodes.push(
          rect(66, 130, {
            fill: v > 0.1 ? '#361325' : '#12182b',
            stroke: v > 0.1 ? ROLE.output : '#39486b',
            width: 2.2,
            radius: 10,
          })
            .at(cx, -30)
            .glow(v > 0.2 ? 8 : 0, ROLE.output)
            .opacity(a),
          txt(`t${i + 1}`, cx, 78, 26, v > 0.1 ? ROLE.output : COSMOS.muted, 'mono').opacity(a),
        );
        if (v > 0.05) {
          nodes.push(
            rect(54, Math.max(10, 114 * v), { fill: ROLE.output, stroke: null, radius: 6 })
              .at(cx, 35 - 57 * v)
              .opacity(0.8 * a),
          );
        }
        if (i < 7 && v > 0.5) {
          const link = quadArcPts([cx + 34, -30], [cx + 60, -30], -18, 10);
          nodes.push(beamWithPhotons(link, ROLE.output, null, { width: 2.6, glow: 6, alpha: a }));
        }
      }

      nodes.push(
        txt(
          'Large prefill -> saturates arithmetic units',
          -450,
          175,
          28,
          ROLE.input,
          'sans',
        ).opacity(a),
        txt('Small-batch decode -> waits on memory', 430, 175, 28, ROLE.output, 'sans').opacity(a),
        txt(
          'Measure prefill and decode latency on your actual workload',
          0,
          355,
          32,
          ROLE.cached,
          'sans',
        )
          .glow(6, ROLE.cached)
          .opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1: Execution -> 4 Billing Categories
  const mode1 = guardedDynamic(
    () => Math.min(fadeInHalf(mode.value), fadeOutHalf(Math.max(0, mode.value - 1))),
    (a) => {
      const u = flowProg.value;
      const p = pulseT.value;
      const nodes = [
        txt('EXECUTION', -580, -195, 26, ROLE.input, 'mono').opacity(a),
        txt('INVOICE CATEGORIES', 430, -195, 26, ROLE.cached, 'mono').opacity(a),
        rect(340, 86, { fill: '#0e2838', stroke: ROLE.input, width: 2.4, radius: 14 })
          .at(-580, -55)
          .glow(8, ROLE.input)
          .opacity(a),
        txt('Prefill', -580, -55, 34, ROLE.input, 'mono').opacity(a),
        rect(340, 86, { fill: '#351324', stroke: ROLE.output, width: 2.4, radius: 14 })
          .at(-580, 155)
          .glow(8, ROLE.output)
          .opacity(a),
        txt('Decode', -580, 155, 34, ROLE.output, 'mono').opacity(a),
      ];

      const cats = [
        { name: 'Ordinary input', y: -125, color: ROLE.input, fromY: -55 },
        { name: 'Cache read', y: -15, color: ROLE.cached, fromY: -55 },
        { name: 'Cache write', y: 95, color: ROLE.write, fromY: -55 },
        { name: 'Output', y: 205, color: ROLE.output, fromY: 155 },
      ];

      cats.forEach((cat, idx) => {
        const seg = Math.max(0, Math.min(1, u * 4 - idx * 0.6));
        const pts = quadArcPts([-400, cat.fromY], [185, cat.y], idx % 2 === 0 ? -25 : 25);
        if (seg > 0.05) {
          nodes.push(
            beamWithPhotons(pts, cat.color, (p + idx * 0.25) % 1, {
              width: 3.6,
              glow: 9,
              photonCount: 2,
              alpha: seg * a,
            }),
          );
        }
        nodes.push(
          rect(480, 76, { fill: '#11182c', stroke: cat.color, width: 2.4, radius: 12 })
            .at(430, cat.y)
            .glow(7, cat.color)
            .opacity(a),
          txt(cat.name, 430, cat.y, 30, cat.color, 'mono').opacity(a),
        );
      });

      nodes.push(
        txt(
          'Keep lookup, embeddings, tools, storage & serving in separate cost columns',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 2: Local Timeout & Delayed Receipt Reconciliation
  const mode2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, mode.value - 1)),
    (a) => {
      const u = timeoutProg.value;
      const m = matchedVal.value;
      const p = pulseT.value;
      const isMatched = m > 0.5;
      const ledgerColor = isMatched ? ROLE.ok : ROLE.cached;

      const beamPts = quadArcPts([-340, -100], [340, -100], -50);
      const nodes = [
        rect(430, 88, { fill: '#10243d', stroke: ROLE.batch, width: 2.4, radius: 14 })
          .at(-560, -100)
          .glow(8, ROLE.batch)
          .opacity(a),
        txt('Attempt A1 · dispatched', -560, -100, 30, ROLE.batch, 'mono').opacity(a),

        rect(430, 88, { fill: '#351324', stroke: ROLE.output, width: 2.4, radius: 14 })
          .at(560, -100)
          .glow(8, ROLE.output)
          .opacity(a),
        txt('Local timeout', 560, -100, 30, ROLE.output, 'mono').opacity(a),

        beamWithPhotons(beamPts, ROLE.output, p, {
          width: 4.0,
          glow: 10,
          photonCount: 2,
          alpha: (0.4 + 0.6 * u) * a,
        }),

        // Open ledger record -> matched receipt
        rect(760, 175, {
          fill: isMatched ? '#0e2820' : '#2a220f',
          stroke: ledgerColor,
          width: 2.8,
          radius: 16,
          ...(isMatched ? {} : { dash: [8, 6] }),
        })
          .at(0, 145)
          .glow(10, ledgerColor)
          .opacity(a),
        txt(
          isMatched ? 'RECEIPT A1 MATCHED' : 'ATTEMPT A1  ·  CHARGE OPEN',
          0,
          95,
          32,
          ledgerColor,
          'mono',
        )
          .glow(6, ledgerColor)
          .opacity(a),
        txt(
          isMatched ? `Generation charge: ${usd(coldMicro, 5)}` : 'Awaiting provider usage receipt',
          0,
          160,
          36,
          COSMOS.ink,
          'mono',
        ).opacity(a),
        glowBar(-330, 208, 660, 16, isMatched ? 1 : 0.45, {
          fill: ledgerColor,
          glow: 8,
          opacity: a,
        }),

        txt(
          isMatched
            ? '1,800 ordinary input + 180 output reconciled to request ID'
            : 'Provider may still be generating  ·  keep the charge open',
          0,
          360,
          30,
          ledgerColor,
          'sans',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1, mode2);
  driftValue(s, c, pulseT, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-accounting-physics-0', () => {
    const t = c.cue('te-accounting-physics-0').start;
    s.play(decProg.to(1, { duration: clampDur(c, t, 1.4) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-accounting-physics-1', () => {
    const t = c.cue('te-accounting-physics-1').start;
    s.play(flowProg.to(1, { duration: clampDur(c, t, 1.0) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-accounting-physics-2', () => {
    const t = c.cue('te-accounting-physics-2').start;
    s.play(timeoutProg.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.on('match-timeout', () => {
    const t = c.cue('match-timeout').start;
    s.play(matchedVal.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
