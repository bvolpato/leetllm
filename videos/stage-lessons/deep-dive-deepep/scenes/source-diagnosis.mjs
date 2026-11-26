// Scene 31: Two returns from expert three.
// Prediction scene: Beat 0 reverses paired slots -> a gets [1.90, 0.00] (after de-paired-result).
// Beat 1 swaps ONLY values (leaving slot labels in place) -> asks what lands in a's 2nd coord (de-detached-ask) with [?, ?]!
// Beat 2 reveals [2.50, 1.80] strictly after c.after('de-detached-result'), repairs pairs, and steps through 4 triage rules.
import {
  COSMOS,
  EXPERT3_REPLAY,
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

export default function sourceDiagnosis(s, c) {
  const phase = s.value(0);
  const routeMode = s.value(2);
  const travel = s.value(0.8);
  const expand = s.value(0.9);

  const pairSwap = s.value(0); // 0 -> 1 on de-swap-pairs
  const showPairedRes = s.value(0); // c.after('de-paired-result')
  const detachSwap = s.value(0); // 0 -> 1 on de-swap-values, back to 0 on de-repair-pair
  const showAsk = s.value(0); // de-detached-ask
  const showDetachedRes = s.value(0); // STRICT: c.after('de-detached-result')
  const repaired = s.value(0); // de-repair-pair
  const triageStep = s.value(0); // 0..4 (count, gin, jit, device)

  const bgAura = aura(470, 12, 500, '#ff6b8b20', '#5ce1e61c');
  const { view: rig3d } = buildDualGpuNvlinkRig3d(routeMode, travel, expand, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Two Returns From', 'Expert Three'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.bad,
    eyebrow: 'FAILURE TRIAGE · DETACHED SLOT IDENTITY',
    subtitle: 'E3 holds slot 0 -> a [1.20, 0.00] and slot 1 -> c [1.80, 1.80]',
  });

  const valA = fmtVec(EXPERT3_REPLAY.pair[0].value, 2); // [1.20, 0.00]
  const valC = fmtVec(EXPERT3_REPLAY.pair[1].value, 2); // [1.80, 1.80]
  const baseA = fmtVec(EXPERT3_REPLAY.base, 2); // [0.70, 0.00]
  const pairedA = fmtVec(EXPERT3_REPLAY.paired.a, 2); // [1.90, 0.00]
  const detachedA = fmtVec(EXPERT3_REPLAY.detached.a, 2); // [2.50, 1.80]

  const live = guardedDynamic(1, () => {
    const isPairedSwap = pairSwap.value;
    const isDetached = detachSwap.value;
    const pairedKnown = Math.round(showPairedRes.value) >= 1;
    const asking = Math.round(showAsk.value) >= 1;
    const wrongKnown = Math.round(showDetachedRes.value) >= 1 && Math.round(repaired.value) < 1;
    const isRepaired = Math.round(repaired.value) >= 1;
    const tri = Math.round(triageStep.value);

    const leftX = -655;
    const rightX = -225;
    const span = rightX - leftX;

    // Tag positions swap during Beat 0 and stay swapped
    const tag0X = leftX + isPairedSwap * span;
    const tag1X = rightX - isPairedSwap * span;
    // Value positions move back (detaching from tags) when detachSwap -> 1
    const valProg = Math.max(0, Math.min(1, isPairedSwap - isDetached));
    const val0X = leftX + valProg * span;
    const val1X = rightX - valProg * span;

    const nodes = [
      txt('3D EXPERT-3 RETURN SLOT MAPPING', 470, -415, 26, ROLE.bad, 'mono').glow(5, ROLE.bad),
      txt(
        'Slot labels must travel WITH their returned values',
        470,
        435,
        26,
        wrongKnown ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
      // 4 separated horizontal lanes so pairs and values never collide mid-motion
      txt('Slot 0 -> a', tag0X, -110, 28, ROLE.nvlink, 'mono'),
      rect(340, 62, { fill: '#0e2430', stroke: ROLE.nvlink, width: 2.4, radius: 9 }).at(val0X, -42),
      txt(valA, val0X, -42, 28, ROLE.nvlink, 'mono'),

      rect(340, 62, { fill: '#2a111e', stroke: ROLE.bad, width: 2.4, radius: 9 }).at(val1X, 42),
      txt(valC, val1X, 42, 28, ROLE.bad, 'mono'),
      txt('Slot 1 -> c', tag1X, 106, 28, ROLE.bad, 'mono'),

      txt(`a's other return (E0):  ${baseA}`, -860, 160, 26, COSMOS.ink, 'mono', 'left'),
    ];

    // Restored row a display (strictly withholds [2.50, 1.80] during Beat 1 prediction!)
    let displayVec = '[?, ?]';
    let resCol = ROLE.token;
    if (wrongKnown) {
      displayVec = detachedA;
      resCol = ROLE.bad;
    } else if (isRepaired || (pairedKnown && isDetached < 0.05)) {
      displayVec = pairedA;
      resCol = ROLE.good;
    }

    nodes.push(
      glassCell(-440, 244, 820, 92, resCol, {
        fill: wrongKnown ? '#2c101a' : '#0e1e26',
        glow: 7,
      }),
      txt(`Restored row a:   ${displayVec}`, -440, 244, 34, resCol, 'mono'),
    );

    // Bottom prompt / triage footer
    const triageLines = [
      'Wrong row -> check source-to-slot permutation',
      'Wrong count -> inspect valid expert ranges',
      'Gin init error -> inspect comm & topology',
      '1st-use compile fail -> check target, compiler, cache',
      'On GPU -> verify stream waits & physical links',
    ];
    let footer = 'Slot numbers map each return via the saved EPHandle';
    let footCol = COSMOS.muted;
    if (isRepaired) {
      footer = triageLines[Math.min(4, tri)];
      footCol = ROLE.nvlink;
    } else if (wrongKnown) {
      footer = '1.80 came from c!';
      footCol = ROLE.bad;
    } else if (asking) {
      footer = 'Predict: what lands in the 2nd coordinate of a?';
      footCol = ROLE.token;
    }

    nodes.push(txt(footer, -860, 354, 27, footCol, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-swap-pairs', () =>
    s.play(pairSwap.to(1, { duration: remainDuration(c, 'de-swap-pairs', 0.85) })),
  );
  c.after('de-paired-result', () =>
    s.play(showPairedRes.to(1, { duration: remainAfterDuration(c, 'de-paired-result', 0.3) })),
  );
  c.on('de-swap-values', () =>
    s.play(detachSwap.to(1, { duration: remainDuration(c, 'de-swap-values', 0.8) })),
  );
  c.on('de-detached-ask', () =>
    s.play(showAsk.to(1, { duration: remainDuration(c, 'de-detached-ask', 0.45) })),
  );
  c.after('de-detached-result', () =>
    s.play(showDetachedRes.to(1, { duration: remainAfterDuration(c, 'de-detached-result', 0.3) })),
  );
  c.on('de-repair-pair', () => {
    const dur = remainDuration(c, 'de-repair-pair', 0.7);
    s.play(detachSwap.to(0, { duration: dur }));
  });
  c.after('de-repair-pair', () =>
    s.play(repaired.to(1, { duration: remainAfterDuration(c, 'de-repair-pair', 0.3) })),
  );
  c.on('de-diagnose-count', () =>
    s.play(triageStep.to(1, { duration: remainDuration(c, 'de-diagnose-count', 0.3) })),
  );
  c.on('de-diagnose-gin', () =>
    s.play(triageStep.to(2, { duration: remainDuration(c, 'de-diagnose-gin', 0.3) })),
  );
  c.on('de-diagnose-jit', () =>
    s.play(triageStep.to(3, { duration: remainDuration(c, 'de-diagnose-jit', 0.3) })),
  );
  c.on('de-diagnose-device', () =>
    s.play(triageStep.to(4, { duration: remainDuration(c, 'de-diagnose-device', 0.3) })),
  );
}
