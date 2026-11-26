// Scene 24: Which setting finishes the layer sooner?
// Prediction scene: Beat 0 SM budget (15.2 -> 19 -> 20 -> 64); Beat 1 QP clamp (9 & 321->128).
// Beat 2 serial Setting A (1+4+1=6ms) vs Setting B (0.7, 4.5, 0.8), asks if B finishes sooner!
// Beat 3 lays B end-to-end (de-serial-six-again) & reveals "Both finish at 6 ms" strictly after c.after('de-serial-verdict').
import {
  BUDGET_NO_OVERLAP,
  BUDGET_OVERLAP,
  COSMOS,
  ROLE,
  SERIAL_A,
  SERIAL_B,
  aura,
  buildStreamOverlapRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function resourceBudget(s, c) {
  const phase = s.value(0);
  const smSplit = s.value(0.15);
  const waitGate = s.value(0.7);
  const modeVal = s.value(0); // 0: SM sizing, 1: QP clamp, 2: serial A vs B
  const smStep = s.value(0); // 0: 15.2, 1: 19, 2: 20, 3: 64
  const qpClamped = s.value(0);
  const showA = s.value(0);
  const progB = s.value(0);
  const showVerdict = s.value(0); // STRICT: c.after('de-serial-verdict')

  const bgAura = aura(470, 12, 500, '#fb923c24', '#6ee7b71a');
  const { view: rig3d } = buildStreamOverlapRig3d(smSplit, waitGate, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Which Setting Finishes', 'the Layer Sooner?'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.brand,
    eyebrow: 'SM & QP BUDGETING · WHOLE-LAYER LATENCY',
    subtitle: 'Compare communication SM budgets on end-to-end layer time',
  });

  const live = guardedDynamic(1, () => {
    const mode = Math.round(modeVal.value);
    const st = Math.round(smStep.value);
    const clamped = Math.round(qpClamped.value) >= 1;
    const aDone = Math.round(showA.value) >= 1;
    const verdict = Math.round(showVerdict.value) >= 1;

    const nodes = [
      txt('3D SM PARTITION & CRITICAL PATH', 470, -415, 26, ROLE.brand, 'mono').glow(5, ROLE.brand),
      txt(
        verdict
          ? 'Both finish at 6.0 ms (-0.5 ms comm, +0.5 ms experts)'
          : mode === 2
            ? 'Compare end-to-end warm layer time on the same axis'
            : mode === 1
              ? '20 comm SMs · 128 allocated queue pairs'
              : 'Raw SM estimate x 1.25 -> even -> floor -> device cap',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (mode === 0) {
      const vals = [15.2, BUDGET_OVERLAP.margin, BUDGET_OVERLAP.aligned, BUDGET_NO_OVERLAP.sms];
      const labels = [
        'Raw estimate: 15.2 SMs',
        'x 1.25 margin -> 19 SMs',
        'Round up even (overlap min 4) -> 20 SMs',
        'No overlap preference (min 64) -> 64 SMs',
      ];
      const cur = vals[Math.min(3, st)];
      const barW = 760;
      const fillW = Math.max(12, (cur / BUDGET_OVERLAP.deviceSMs) * barW);

      nodes.push(
        txt(
          `HISTORICAL V2 SM BUDGET (cap ${BUDGET_OVERLAP.deviceSMs} SMs)`,
          -855,
          -110,
          26,
          ROLE.token,
          'mono',
          'left',
        ),
        rect(barW, 74, { fill: '#101628', stroke: COSMOS.dim, width: 2.2, radius: 8 }).at(
          -855 + barW * 0.5,
          -20,
        ),
        rect(fillW, 74, { fill: '#134466', stroke: ROLE.nvlink, width: 2.6, radius: 8 })
          .at(-855 + fillW * 0.5, -20)
          .glow(7, ROLE.nvlink),
        txt(`${cur} / ${BUDGET_OVERLAP.deviceSMs} SMs`, -475, 76, 42, ROLE.nvlink, 'mono'),
        glassCell(-440, 200, 820, 96, st >= 3 ? ROLE.brand : ROLE.nvlink, {
          fill: '#0e1a2a',
          glow: 7,
        }),
        txt(labels[Math.min(3, st)], -440, 200, 26, st >= 3 ? ROLE.brand : ROLE.nvlink, 'mono'),
        txt(
          'Device total SM count always caps the final request',
          -860,
          320,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else if (mode === 1) {
      nodes.push(
        txt('20 COMM SMs · 128 ALLOCATED QPs', -855, -120, 26, ROLE.token, 'mono', 'left'),
        glassCell(-655, 30, 390, 210, ROLE.rank0, { fill: '#0d1b33', glow: 7 }),
        txt('DIRECT', -655, -35, 30, ROLE.rank0, 'mono'),
        txt(`min(20, 9) = ${BUDGET_OVERLAP.directRequest}`, -655, 25, 28, COSMOS.ink, 'mono'),
        txt(`Uses ${BUDGET_OVERLAP.direct} QPs`, -655, 85, 28, ROLE.good, 'mono'),

        glassCell(-225, 30, 390, 210, ROLE.brand, { fill: '#26170e', glow: 7 }),
        txt('HYBRID', -225, -35, 30, ROLE.brand, 'mono'),
        txt(`16 x 20 + 1 = ${BUDGET_OVERLAP.hybridRequest}`, -225, 25, 28, COSMOS.ink, 'mono'),
        txt(
          clamped ? `Capped -> ${BUDGET_OVERLAP.hybrid} QPs` : 'Capped -> ? QPs',
          -225,
          85,
          28,
          clamped ? ROLE.brand : COSMOS.muted,
          'mono',
        ),
        txt(
          'Now measure what extra comm SMs cost the expert GEMMs',
          -860,
          245,
          26,
          ROLE.token,
          'sans',
          'left',
        ),
      );
    } else {
      const leftX = -770;
      const barW = 600;
      const stageCols = [ROLE.rank0, ROLE.bad, ROLE.nvlink];

      const drawTrack = (y, label, times, frac, showTotal) => {
        nodes.push(
          txt(label, -840, y, 30, COSMOS.ink, 'mono', 'left'),
          rect(barW, 66, { fill: '#101628', stroke: COSMOS.dim, width: 2, radius: 6 }).at(
            leftX + barW * 0.5,
            y,
          ),
        );
        let acc = 0;
        const budget = frac * 6;
        times.forEach((val, idx) => {
          const painted = Math.max(0, Math.min(val, budget - acc));
          if (painted > 0.02) {
            const x0 = leftX + (acc / 6) * barW;
            const w = (painted / 6) * barW;
            nodes.push(
              rect(w, 60, { fill: '#14263b', stroke: stageCols[idx], width: 2.4, radius: 4 }).at(
                x0 + w * 0.5,
                y,
              ),
            );
          }
          acc += val;
        });
        nodes.push(
          txt(
            showTotal ? '6.0 ms' : '?',
            leftX + barW + 28,
            y,
            28,
            showTotal ? ROLE.good : ROLE.token,
            'mono',
            'left',
          ),
        );
      };

      nodes.push(
        txt(
          'Dispatch (blue) · Experts (rose) · Combine (cyan)',
          -855,
          -125,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          'A: 1.0 + 4.0 + 1.0 ms   ·   B: 0.7 + 4.5 + 0.8 ms',
          -855,
          -72,
          26,
          ROLE.token,
          'mono',
          'left',
        ),
      );

      drawTrack(24, 'A', SERIAL_A, aDone ? 1 : 0.35, aDone);
      drawTrack(132, 'B', SERIAL_B, progB.value, verdict);

      nodes.push(
        txt('0 ms', leftX, 198, 26, COSMOS.muted, 'mono', 'left'),
        txt('6 ms', leftX + barW, 198, 26, COSMOS.muted, 'mono', 'right'),
        glassCell(-440, 296, 820, 96, verdict ? ROLE.good : ROLE.token, {
          fill: verdict ? '#0d241c' : '#1e190e',
          glow: 7,
        }),
        txt(
          verdict
            ? 'Tie at 6.0 ms! Saved 0.5 ms comm went to experts'
            : 'Predict: does setting B finish the layer sooner?',
          -440,
          296,
          27,
          verdict ? ROLE.good : ROLE.token,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-resource-budget-b0', () =>
    s.play(smStep.to(1, { duration: remainDuration(c, 'de-resource-budget-b0', 0.45) })),
  );
  c.on('de-sm-cap', () => {
    const dur = remainDuration(c, 'de-sm-cap', 0.45);
    s.play(smStep.to(2, { duration: dur }));
    s.play(smSplit.to(0.24, { duration: dur }));
  });
  c.on('de-sm-floor', () => {
    const dur = remainDuration(c, 'de-sm-floor', 0.5);
    s.play(smStep.to(3, { duration: dur }));
    s.play(smSplit.to(0.62, { duration: dur }));
  });

  c.on('de-qp-clamp', () => {
    s.play(modeVal.to(1, { duration: 0.2 }));
    s.play(smSplit.to(0.24, { duration: 0.35 }));
  });
  c.after('de-qp-clamp', () =>
    s.play(qpClamped.to(1, { duration: remainAfterDuration(c, 'de-qp-clamp', 0.3) })),
  );

  c.on('de-serial-six', () => {
    s.play(modeVal.to(2, { duration: 0.25 }));
  });
  c.after('de-serial-six', () =>
    s.play(showA.to(1, { duration: remainAfterDuration(c, 'de-serial-six', 0.35) })),
  );

  c.on('de-serial-six-again', () => {
    const dur = remainDuration(c, 'de-serial-six-again', 0.8);
    s.play(progB.to(1, { duration: dur }));
    s.play(smSplit.to(0.5, { duration: dur }));
  });
  c.after('de-serial-verdict', () =>
    s.play(showVerdict.to(1, { duration: remainAfterDuration(c, 'de-serial-verdict', 0.35) })),
  );
}
