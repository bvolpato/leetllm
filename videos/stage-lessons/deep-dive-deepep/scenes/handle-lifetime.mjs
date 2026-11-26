// Scene 06: What comes back to row a?
// Prediction scene: reveal 1.90 after de-handle-old, keep 3.30 concealed until c.after('de-handle-new')!
import {
  COSMOS,
  REPLAY_COMP,
  ROLE,
  aura,
  buildDualGpuNvlinkRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function handleLifetime(s, c) {
  const phase = s.value(0);
  const routeMode = s.value(0);
  const travel = s.value(0.6);
  const expand = s.value(0.5);
  const showOldVal = s.value(0); // c.after('de-handle-old')
  const showAsk = s.value(0); // c.on('de-handle-ask')
  const showFirst = s.value(0); // c.on('de-handle-first')
  const showNewVal = s.value(0); // STRICT: c.after('de-handle-new')
  const showStorage = s.value(0); // c.on('de-handle-storage')

  const bgAura = aura(470, 12, 500, '#ff6b8b20', '#5ce1e61a');
  const { view: rig3d } = buildDualGpuNvlinkRig3d(routeMode, travel, expand, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['What Comes Back', 'to Row a?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.token,
    eyebrow: 'EPHANDLE LIFETIME · STALE VS FRESH DISPATCH',
    subtitle: 'a = [1, 0] · Expert k scales by (k + 1) · gates 0.70, 0.30',
  });

  const oldA0 = REPLAY_COMP.cached.restored.a[0].toFixed(2);
  const newA0 = REPLAY_COMP.rebuilt.restored.a[0].toFixed(2);

  const live = guardedDynamic(1, () => {
    const oldKnown = Math.round(showOldVal.value) >= 1;
    const asking = Math.round(showAsk.value) >= 1;
    const firstKnown = Math.round(showFirst.value) >= 1;
    const newKnown = Math.round(showNewVal.value) >= 1;
    const storageMode = Math.round(showStorage.value) >= 1;

    const nodes = [
      txt('3D ROUTE HANDLE REPLAY VS REBUILD', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        storageMode
          ? 'V2 copies indices · V2.5 retains by reference'
          : 'Router wants E2 & E3 (both on GPU 1)',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    // Row 1: Stale cached handle (E0 + E3)
    nodes.push(
      glassCell(-440, -68, 820, 132, ROLE.bad, { fill: '#26101b', glow: 7 }),
      txt('REPLAY OLD HANDLE (E0 / E3)', -825, -104, 26, ROLE.bad, 'mono', 'left'),
      txt(
        `0.70 x 1  +  0.30 x 4  =  ${oldKnown ? oldA0 : '?'}`,
        -825,
        -42,
        32,
        oldKnown ? ROLE.bad : COSMOS.muted,
        'mono',
        'left',
      ),
    );

    // Row 2: Fresh dispatch (E2 + E3)
    const freshTerm = firstKnown ? '0.70 x 3 (2.10)' : '0.70 x ?';
    nodes.push(
      glassCell(-440, 108, 820, 132, newKnown ? ROLE.good : ROLE.nvlink, {
        fill: newKnown ? '#0d251d' : '#0c1d2b',
        glow: 7,
      }),
      txt('FRESH DISPATCH (E2 / E3)', -825, 72, 26, ROLE.nvlink, 'mono', 'left'),
      txt(
        `${freshTerm}  +  1.20  =  ${newKnown ? newA0 : '?'}`,
        -825,
        134,
        30,
        newKnown ? ROLE.good : COSMOS.ink,
        'mono',
        'left',
      ),
    );

    // Bottom block: prediction prompt -> verified contrast -> storage lifetime
    if (storageMode) {
      nodes.push(
        glassCell(-440, 290, 820, 112, ROLE.meta, { fill: '#1a1230', glow: 7 }),
        txt('V2: copies indices  ·  V2.5: keeps reference', -440, 266, 26, ROLE.meta, 'mono'),
        txt('Keep indices untouched until last consumer ends', -440, 316, 26, COSMOS.ink, 'sans'),
      );
    } else if (newKnown) {
      nodes.push(
        txt(
          'Same shape [2] hides stale 1.90 vs true 3.30!',
          -860,
          268,
          28,
          ROLE.good,
          'sans',
          'left',
        ),
        txt(
          'Reuse an EPHandle only when route & layout match',
          -860,
          330,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else if (asking) {
      nodes.push(
        txt(
          'Predict: what first coordinate should a get on E2 / E3?',
          -860,
          285,
          28,
          ROLE.token,
          'serif',
          'left',
        ).glow(5, ROLE.token),
      );
    } else {
      nodes.push(
        txt(
          'Compare cached E0/E3 replay against fresh E2/E3',
          -860,
          285,
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

  c.after('de-handle-old', () =>
    s.play(showOldVal.to(1, { duration: remainAfterDuration(c, 'de-handle-old', 0.3) })),
  );
  c.on('de-handle-ask', () =>
    s.play(showAsk.to(1, { duration: remainDuration(c, 'de-handle-ask', 0.45) })),
  );
  c.on('de-handle-first', () => {
    const dur = remainDuration(c, 'de-handle-first', 0.55);
    s.play(showFirst.to(1, { duration: dur }));
    s.play(routeMode.to(1, { duration: dur }));
  });
  c.after('de-handle-new', () => {
    const dur = remainAfterDuration(c, 'de-handle-new', 0.35);
    s.play(showNewVal.to(1, { duration: dur }));
    s.play(expand.to(1, { duration: dur }));
  });
  c.on('de-handle-storage', () =>
    s.play(showStorage.to(1, { duration: remainDuration(c, 'de-handle-storage', 0.5) })),
  );
}
