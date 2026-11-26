// Scene 32: Another token comes home.
// Double prediction scene!
// Prediction 1 (Beat 0): z = [2, -1], old E0/E3 -> new E1/E2, gates [0.2, 0.8]. Asks handle & return row!
//   Reveals rebuilt handle (de-fresh-route), raw/weighted E1 & E2, and [5.60, -2.80] strictly after c.after(...) cues.
// Beat 2: stale [6.80, -3.40] (after de-stale-result), reverse arrival E2 first then E1.
// Prediction 2 (Beat 3): removes wait before first activation read (de-fresh-remove-wait), asks which event to wait for!
//   Beat 4 restores dispatch event wait strictly after c.after('de-fresh-wait').
import {
  COSMOS,
  FINAL_REBUILT,
  FINAL_RECEIPT,
  FINAL_STALE,
  ROLE,
  aura,
  buildDualGpuNvlinkRig3d,
  finalToken,
  fmtVec,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function earnedReturn(s, c) {
  const phase = s.value(0);
  const routeMode = s.value(0);
  const travel = s.value(0.6);
  const expand = s.value(0.5);

  const stageMode = s.value(0); // 0: compute z, 1: stale & reverse arrival, 2: async stream wait
  const changed = s.value(0);
  const ask1 = s.value(0);
  const rebuilt = s.value(0);
  const raw1 = s.value(0);
  const w1 = s.value(0);
  const raw2 = s.value(0);
  const w2 = s.value(0);
  const sumDone = s.value(0);

  const staleDone = s.value(0);
  const arr1 = s.value(0);
  const arr2 = s.value(0);

  const waitPresent = s.value(1); // drops to 0 on de-fresh-remove-wait, restores to 1 after de-fresh-wait
  const waitVerdict = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c24', '#6ee7b71e');
  const { view: rig3d } = buildDualGpuNvlinkRig3d(routeMode, travel, expand, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Another Token', 'Comes Home'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'END-TO-END VERIFICATION · TOKEN z = [2, -1]',
    subtitle: 'Trace token z through dispatch, combine, and async streams',
  });

  const rebuiltOut = fmtVec(FINAL_REBUILT.output, 2); // [5.60, -2.80]
  const staleOut = fmtVec(FINAL_STALE.output, 2); // [6.80, -3.40]
  const rawE1 = fmtVec(FINAL_REBUILT.raw[0], 1); // [4.0, -2.0]
  const rawE2 = fmtVec(FINAL_REBUILT.raw[1], 1); // [6.0, -3.0]
  const contribE1 = fmtVec(FINAL_REBUILT.contributions[0], 2); // [0.80, -0.40]
  const contribE2 = fmtVec(FINAL_REBUILT.contributions[1], 2); // [4.80, -2.40]
  const revTrace = FINAL_RECEIPT.trace;

  const live = guardedDynamic(1, () => {
    const mode = Math.round(stageMode.value);
    const isChanged = Math.round(changed.value) >= 1;
    const isAsk1 = Math.round(ask1.value) >= 1;
    const isRebuilt = Math.round(rebuilt.value) >= 1;
    const hasR1 = Math.round(raw1.value) >= 1;
    const hasW1 = Math.round(w1.value) >= 1;
    const hasR2 = Math.round(raw2.value) >= 1;
    const hasW2 = Math.round(w2.value) >= 1;
    const hasSum = Math.round(sumDone.value) >= 1;

    const hasStale = Math.round(staleDone.value) >= 1;
    const hasArr1 = Math.round(arr1.value) >= 1;
    const hasArr2 = Math.round(arr2.value) >= 1;
    const isWait = waitPresent.value > 0.5;
    const hasWaitVerdict = Math.round(waitVerdict.value) >= 1;

    const nodes = [
      txt('3D FULL-LAYER DISPATCH -> COMBINE', 470, -415, 26, ROLE.good, 'mono').glow(5, ROLE.good),
      txt(
        mode === 2
          ? hasWaitVerdict
            ? 'Verify z vs CPU ref + inspect stream dependency'
            : 'Async streams: Comm writes while Expert runs'
          : mode === 1
            ? 'Reverse arrivals preserve exact z via saved slot IDs'
            : `Token z = [${finalToken.input.join(', ')}]  ·  gates [0.20, 0.80]`,
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (mode === 0) {
      nodes.push(
        glassCell(-655, -108, 390, 74, ROLE.token, { fill: '#1e190e', glow: 6 }),
        txt(`Router: ${isChanged ? 'E1 / E2' : 'E0 / E3'}`, -655, -108, 27, ROLE.token, 'mono'),
        glassCell(-225, -108, 390, 74, isRebuilt ? ROLE.good : ROLE.nvlink, {
          fill: isRebuilt ? '#0d251d' : '#0c1f2e',
          glow: 6,
        }),
        txt(
          `Handle: ${isRebuilt ? 'E1 / E2 (fresh)' : 'E0 / E3 (saved)'}`,
          -225,
          -108,
          26,
          isRebuilt ? ROLE.good : ROLE.nvlink,
          'mono',
        ),

        // E1 row
        glassCell(-440, 2, 820, 88, hasW1 ? ROLE.nvlink : COSMOS.dim, { fill: '#0e172a', glow: 5 }),
        txt('E1 (x2)', -825, 2, 26, ROLE.rank0, 'mono', 'left'),
        txt(hasR1 ? rawE1 : '[?, ?]', -615, 2, 26, hasR1 ? COSMOS.ink : COSMOS.muted, 'mono'),
        txt('x 0.20 ->', -440, 2, 26, ROLE.token, 'mono'),
        txt(hasW1 ? contribE1 : '[?, ?]', -200, 2, 28, hasW1 ? ROLE.nvlink : COSMOS.muted, 'mono'),

        // E2 row
        glassCell(-440, 114, 820, 88, hasW2 ? ROLE.nvlink : COSMOS.dim, {
          fill: '#0e172a',
          glow: 5,
        }),
        txt('E2 (x3)', -825, 114, 26, ROLE.brand, 'mono', 'left'),
        txt(hasR2 ? rawE2 : '[?, ?]', -615, 114, 26, hasR2 ? COSMOS.ink : COSMOS.muted, 'mono'),
        txt('x 0.80 ->', -440, 114, 26, ROLE.token, 'mono'),
        txt(
          hasW2 ? contribE2 : '[?, ?]',
          -200,
          114,
          28,
          hasW2 ? ROLE.nvlink : COSMOS.muted,
          'mono',
        ),

        // Sum row
        glassCell(-440, 240, 820, 96, hasSum ? ROLE.good : ROLE.token, {
          fill: hasSum ? '#0d251d' : '#1b170e',
          glow: 7,
        }),
        txt(
          `Return to z:   ${hasSum ? rebuiltOut : '[?, ?]'}`,
          -440,
          240,
          34,
          hasSum ? ROLE.good : ROLE.token,
          'mono',
        ),
        txt(
          hasSum
            ? 'Fresh handle + exact weighted sum = [5.60, -2.80]'
            : isRebuilt
              ? 'Rebuilt E1 / E2 handle active · computing weighted rows for z'
              : isAsk1
                ? 'Predict: which handle, and what row returns to z?'
                : 'Both E0/E3 and E1/E2 touch both GPUs',
          -860,
          348,
          26,
          isAsk1 && !isRebuilt ? ROLE.token : COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else if (mode === 1) {
      nodes.push(
        glassCell(-440, -100, 840, 92, ROLE.bad, { fill: '#2a101b', glow: 7 }),
        txt(
          `Stale E0/E3: ${hasStale ? staleOut : '[?, ?]'} (2 GPUs missed it!)`,
          -440,
          -100,
          26,
          ROLE.bad,
          'mono',
        ),
        txt('REVERSE ARRIVALS ON REBUILT ROUTE', -860, -12, 26, ROLE.nvlink, 'mono', 'left'),

        glassCell(-440, 68, 820, 92, hasArr1 ? ROLE.nvlink : COSMOS.dim, {
          fill: '#0d1e2b',
          glow: hasArr1 ? 6 : 0,
        }),
        txt(
          `1st: E2 slot 0  ${fmtVec(revTrace[0].value, 2)}`,
          -820,
          68,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          hasArr1 ? `z = ${fmtVec(revTrace[0].accumulator, 2)}` : 'z = [?, ?]',
          -60,
          68,
          26,
          hasArr1 ? ROLE.nvlink : COSMOS.muted,
          'mono',
          'right',
        ),

        glassCell(-440, 190, 820, 92, hasArr2 ? ROLE.good : COSMOS.dim, {
          fill: hasArr2 ? '#0d251d' : '#0f1628',
          glow: hasArr2 ? 7 : 0,
        }),
        txt(
          `2nd: E1 slot 0  ${fmtVec(revTrace[1].value, 2)}`,
          -820,
          190,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          hasArr2 ? `z = ${fmtVec(revTrace[1].accumulator, 2)}` : 'z = [?, ?]',
          -60,
          190,
          26,
          hasArr2 ? ROLE.good : COSMOS.muted,
          'mono',
          'right',
        ),

        txt(
          'Reversing arrival order works because every slot keeps its ID',
          -860,
          310,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      // Beats 3 & 4: async stream wait prediction & resolution
      const readyX = -325;
      const readX = isWait ? -185 : -415;
      nodes.push(
        txt('HISTORICAL V2 ASYNC DISPATCH STREAMS', -860, -142, 26, ROLE.token, 'mono', 'left'),
        txt('Comm', -855, -26, 27, ROLE.rank0, 'mono', 'left'),
        rect(400, 70, { fill: '#122b4d', stroke: ROLE.rank0, width: 2.4, radius: 8 }).at(-525, -26),
        txt('Write recv rows', -525, -26, 26, ROLE.rank0, 'mono'),
        txt('ready', readyX, -92, 26, ROLE.nvlink, 'mono'),

        txt('Expert', -855, 108, 27, ROLE.good, 'mono', 'left'),
        rect(160, 70, { fill: '#121b2e', stroke: COSMOS.ink, width: 2.0, radius: 8 }).at(-645, 108),
        txt('Indep', -645, 108, 26, COSMOS.ink, 'mono'),

        rect(240, 70, {
          fill: isWait ? '#0d261e' : '#2d1a0d',
          stroke: isWait ? ROLE.good : ROLE.bad,
          width: 2.6,
          radius: 8,
        }).at(readX, 108),
        txt('1st act read', readX, 108, 26, isWait ? ROLE.good : ROLE.bad, 'mono'),
      );

      if (isWait) {
        nodes.push(
          line([readyX, 14], [readyX, 68], { stroke: ROLE.nvlink, width: 4.5 }).glow(
            8,
            ROLE.nvlink,
          ),
        );
      }

      const waitMsg = hasWaitVerdict
        ? 'Wait on dispatch event! Indep work still overlaps'
        : 'Predict: which event must expert stream wait for?';
      const waitCol = hasWaitVerdict ? ROLE.good : ROLE.bad;

      nodes.push(
        glassCell(-440, 245, 820, 96, waitCol, {
          fill: hasWaitVerdict ? '#0d251d' : '#261412',
          glow: 7,
        }),
        txt(waitMsg, -440, 245, 26, waitCol, 'mono'),
        txt(
          hasWaitVerdict
            ? 'Once z & trace pass, time the whole layer dispatch -> combine'
            : 'Without wait, activation read races against in-flight writes',
          -860,
          350,
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

  c.after('de-fresh-change', () =>
    s.play(changed.to(1, { duration: remainAfterDuration(c, 'de-fresh-change', 0.3) })),
  );
  c.on('de-earned-return-b0', () =>
    s.play(ask1.to(1, { duration: remainDuration(c, 'de-earned-return-b0', 0.45) })),
  );

  c.after('de-fresh-route', () => {
    const dur = remainAfterDuration(c, 'de-fresh-route', 0.3);
    s.play(rebuilt.to(1, { duration: dur }));
    s.play(routeMode.to(1, { duration: dur }));
  });
  c.after('de-fresh-raw-one', () =>
    s.play(raw1.to(1, { duration: remainAfterDuration(c, 'de-fresh-raw-one', 0.25) })),
  );
  c.after('de-fresh-first', () =>
    s.play(w1.to(1, { duration: remainAfterDuration(c, 'de-fresh-first', 0.25) })),
  );
  c.after('de-fresh-raw-two', () =>
    s.play(raw2.to(1, { duration: remainAfterDuration(c, 'de-fresh-raw-two', 0.25) })),
  );
  c.after('de-fresh-second', () =>
    s.play(w2.to(1, { duration: remainAfterDuration(c, 'de-fresh-second', 0.25) })),
  );
  c.after('de-fresh-result', () => {
    const dur = remainAfterDuration(c, 'de-fresh-result', 0.3);
    s.play(sumDone.to(1, { duration: dur }));
    s.play(expand.to(1, { duration: dur }));
  });

  c.on('de-stale-result', () => {
    s.play(stageMode.to(1, { duration: 0.2 }));
    s.play(routeMode.to(2, { duration: 0.35 }));
  });
  c.after('de-stale-result', () =>
    s.play(staleDone.to(1, { duration: remainAfterDuration(c, 'de-stale-result', 0.3) })),
  );
  c.on('de-fresh-arrive', () =>
    s.play(arr1.to(1, { duration: remainDuration(c, 'de-fresh-arrive', 0.55) })),
  );
  c.on('de-fresh-inverse', () =>
    s.play(arr2.to(1, { duration: remainDuration(c, 'de-fresh-inverse', 0.55) })),
  );

  c.on('de-fresh-remove-wait', () => {
    const dur = remainDuration(c, 'de-fresh-remove-wait', 0.45);
    s.play(stageMode.to(2, { duration: 0.2 }));
    s.play(waitPresent.to(0, { duration: dur }));
  });
  c.after('de-fresh-wait', () => {
    const dur = remainAfterDuration(c, 'de-fresh-wait', 0.35);
    s.play(waitPresent.to(1, { duration: dur }));
    s.play(waitVerdict.to(1, { duration: dur }));
  });
}
