// Scene 07: What does combine receive?
// Prediction scene: Beat 0 shows raw 1 & 4 -> 5, asks what caller sends to combine.
// Beat 1 weights by 0.70 & 0.30 -> 1.90 (after dep-result-combine-once), double-gate 0.85 (after dep-result-combine-twice).
// Beat 2 reverse arrivals, missing & duplicate rejection.
import {
  COSMOS,
  DOUBLE_GATE_A0,
  LAYER_RECEIPT_BASE,
  ROLE,
  aura,
  buildDualGpuNvlinkRig3d,
  fmtVec,
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

export default function combine(s, c) {
  const phase = s.value(0);
  const routeMode = s.value(0);
  const travel = s.value(1);
  const expand = s.value(0.8);
  const showFive = s.value(0);
  const scaleE0 = s.value(0);
  const scaleE3 = s.value(0);
  const showOnce = s.value(0);
  const showTwice = s.value(0);
  const reverseMode = s.value(0);
  const reverseCount = s.value(0);
  const showMissing = s.value(0);
  const showDup = s.value(0);

  const bgAura = aura(470, 12, 500, '#6ee7b720', '#fb923c1a');
  const { view: rig3d } = buildDualGpuNvlinkRig3d(routeMode, travel, expand, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['What Does', 'Combine Receive?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'INVERSE COMBINE · EXPERT OUTPUTS TO SOURCE',
    subtitle: 'Original E0 / E3 route · raw outputs 1 and 4',
  });

  const live = guardedDynamic(1, () => {
    const isReverse = Math.round(reverseMode.value) >= 1;
    const isFive = Math.round(showFive.value) >= 1;
    const isOnce = Math.round(showOnce.value) >= 1;
    const isTwice = Math.round(showTwice.value) >= 1;
    const isMissing = Math.round(showMissing.value) >= 1;
    const isDup = Math.round(showDup.value) >= 1;
    const isWeighted = scaleE0.value > 0.5 || scaleE3.value > 0.5;

    const nodes = [
      txt('3D REVERSE COMBINE REDUCTION', 470, -415, 26, ROLE.good, 'mono').glow(5, ROLE.good),
      txt(
        isReverse
          ? 'Reverse arrival order still restores exact rows'
          : isWeighted
            ? 'Caller applies router gate weights once before combine'
            : 'Original route: E0 (raw 1) & E3 (raw 4)',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (!isReverse) {
      const v0 = 1 * (1 - 0.3 * scaleE0.value);
      const v3 = 4 * (1 - 0.7 * scaleE3.value);
      const barMaxW = 460;
      const w0 = (v0 / 4) * barMaxW;
      const w3 = (v3 / 4) * barMaxW;

      // E0 bar
      nodes.push(
        txt('E0 (slot 0:0) · gate 0.70', -860, -110, 26, ROLE.nvlink, 'mono', 'left'),
        rect(barMaxW * 0.25, 44, { fill: '#11192e', stroke: COSMOS.dim, width: 1.8, radius: 5 }).at(
          -860 + barMaxW * 0.125,
          -60,
        ),
        rect(Math.max(4, w0), 44, {
          fill: scaleE0.value > 0.5 ? '#12543d' : '#134466',
          stroke: scaleE0.value > 0.5 ? ROLE.good : ROLE.nvlink,
          width: 2.2,
          radius: 5,
        }).at(-860 + Math.max(4, w0) * 0.5, -60),
        txt(
          scaleE0.value > 0.5 ? '0.70' : '1.00',
          -365,
          -60,
          28,
          scaleE0.value > 0.5 ? ROLE.good : ROLE.nvlink,
          'mono',
          'left',
        ),
      );

      // E3 bar
      nodes.push(
        txt('E3 (slot 3:0) · gate 0.30', -860, 25, 26, ROLE.brand, 'mono', 'left'),
        rect(barMaxW, 44, { fill: '#11192e', stroke: COSMOS.dim, width: 1.8, radius: 5 }).at(
          -860 + barMaxW * 0.5,
          75,
        ),
        rect(Math.max(4, w3), 44, {
          fill: scaleE3.value > 0.5 ? '#12543d' : '#4d2b16',
          stroke: scaleE3.value > 0.5 ? ROLE.good : ROLE.brand,
          width: 2.2,
          radius: 5,
        }).at(-860 + Math.max(4, w3) * 0.5, 75),
        txt(
          scaleE3.value > 0.5 ? '1.20' : '4.00',
          -365,
          75,
          28,
          scaleE3.value > 0.5 ? ROLE.good : ROLE.brand,
          'mono',
          'left',
        ),
      );

      // Summary readout card
      let sumText = 'Predict: what weighted values enter combine?';
      let sumCol = ROLE.token;
      if (isTwice) {
        sumText = `Double-gated bug: 0.7²(1) + 0.3²(4) = ${DOUBLE_GATE_A0.toFixed(2)}`;
        sumCol = ROLE.bad;
      } else if (isOnce) {
        sumText = 'Weighted sum: 0.70 + 1.20 = 1.90';
        sumCol = ROLE.good;
      } else if (isWeighted) {
        sumText = 'Scaling raw outputs by gates once...';
        sumCol = ROLE.nvlink;
      } else if (isFive) {
        sumText = 'Raw sum: 1 + 4 = 5.00 (unweighted!)';
        sumCol = ROLE.token;
      }

      nodes.push(
        glassCell(-440, 215, 820, 92, sumCol, {
          fill: isTwice ? '#2c101a' : '#0e1e26',
          glow: 7,
        }),
        txt(sumText, -440, 215, 28, sumCol, 'mono'),
        txt(
          isTwice
            ? 'Same shape hides double-weighting (0.85 vs 1.90)'
            : isOnce
              ? 'Combine sums already-weighted slots back to a'
              : isWeighted
                ? 'Caller multiplies expert outputs by router gates once'
                : 'Predict: what should the caller send into combine?',
          -860,
          335,
          26,
          isTwice ? ROLE.bad : COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      const arrived = Math.min(8, Math.round(reverseCount.value));
      const tokens = ['a', 'b', 'c', 'd'];
      nodes.push(
        txt(
          `Reverse arrivals: ${arrived} / 8 slots matched by saved key`,
          -860,
          -125,
          26,
          ROLE.nvlink,
          'mono',
          'left',
        ),
      );

      tokens.forEach((tok, i) => {
        const cx = -752 + i * 216;
        const val = LAYER_RECEIPT_BASE.restored[tok];
        const done = arrived >= 8 || i > 0;
        nodes.push(
          glassCell(cx, 15, 208, 152, done ? ROLE.good : ROLE.token, {
            fill: '#0d1e24',
            glow: 6,
          }),
          txt(`Row ${tok}`, cx, -28, 28, COSMOS.ink, 'mono'),
          txt(done ? fmtVec(val, 2) : '[..., ...]', cx, 32, 26, ROLE.good, 'mono'),
        );
      });

      const guardText = isDup
        ? 'Duplicate slot 0:0 -> REJECTED by reference'
        : isMissing
          ? 'Omit slot 0:0 -> REJECTED (missing return)'
          : 'Token a arrives last, still restores [1.90, 0.00]';
      const guardCol = isDup || isMissing ? ROLE.bad : ROLE.good;
      nodes.push(
        glassCell(-440, 220, 820, 92, guardCol, {
          fill: isDup || isMissing ? '#2c101a' : '#0e241b',
          glow: 7,
        }),
        txt(guardText, -440, 220, 27, guardCol, 'mono'),
        txt(
          'Compare restored GPU rows against this exact reference',
          -860,
          340,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('combine-beat-1-focus-1', () =>
    s.play(expand.to(1, { duration: remainDuration(c, 'combine-beat-1-focus-1', 0.5) })),
  );
  c.after('dep-result-combine-five', () =>
    s.play(showFive.to(1, { duration: remainAfterDuration(c, 'dep-result-combine-five', 0.3) })),
  );
  c.on('de-combine-e0', () =>
    s.play(scaleE0.to(1, { duration: remainDuration(c, 'de-combine-e0', 0.35) })),
  );
  c.on('de-combine-e3', () =>
    s.play(scaleE3.to(1, { duration: remainDuration(c, 'de-combine-e3', 0.35) })),
  );
  c.after('dep-result-combine-once', () =>
    s.play(showOnce.to(1, { duration: remainAfterDuration(c, 'dep-result-combine-once', 0.3) })),
  );
  c.after('dep-result-combine-twice', () =>
    s.play(showTwice.to(1, { duration: remainAfterDuration(c, 'dep-result-combine-twice', 0.3) })),
  );
  c.on('de-combine-reverse', () => {
    const dur = remainDuration(c, 'de-combine-reverse', 1.2);
    s.play(reverseMode.to(1, { duration: 0.25 }));
    s.play(routeMode.to(2, { duration: 0.3 }));
    s.play(reverseCount.to(8, { duration: dur }));
  });
  c.after('dep-result-combine-missing', () =>
    s.play(
      showMissing.to(1, { duration: remainAfterDuration(c, 'dep-result-combine-missing', 0.3) }),
    ),
  );
  c.after('dep-result-combine-duplicate', () =>
    s.play(
      showDup.to(1, { duration: remainAfterDuration(c, 'dep-result-combine-duplicate', 0.3) }),
    ),
  );
}
