// Scene 18: Deferred results and stream readiness have separate lifetimes.
// V2.5 EPBuffer deferred EventOverlap: 1st wait returns 4 results & adds stream dep; 2nd wait returns None.
import {
  COSMOS,
  ROLE,
  aura,
  buildStreamOverlapRig3d,
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

export default function events(s, c) {
  const phase = s.value(0);
  const smSplit = s.value(0.35);
  const waitGate = s.value(0);
  const timeVal = s.value(0); // 0 -> 6
  const waitCalls = s.value(0); // 0 -> 1 -> 2
  const revealSecond = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#ffd1661c');
  const { view: rig3d } = buildStreamOverlapRig3d(smSplit, waitGate, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Deferred Results vs.', 'Stream Readiness'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.nvlink,
    eyebrow: 'V2.5 EVENTOVERLAP · ASYNC STREAM DEPENDENCY',
    subtitle: 'GPU wait orders streams without stalling the host CPU',
  });

  const live = guardedDynamic(1, () => {
    const calls = Math.round(waitCalls.value);
    const secondDone = Math.round(revealSecond.value) >= 1;
    const t = Math.max(0, Math.min(6, timeVal.value));

    const trackL = -600;
    const trackW = 540;
    const toX = (v) => trackL + (v / 6) * trackW;

    const lanes = [
      { label: 'Dispatch', y: -88, start: 0, end: 4, col: ROLE.brand },
      { label: 'Independent', y: 4, start: 1, end: 3, col: ROLE.nvlink },
      { label: 'Expert read', y: 96, start: 4, end: 6, col: ROLE.good },
    ];

    const nodes = [
      txt('3D MULTI-STREAM EVENTOVERLAP GATE', 470, -415, 26, ROLE.nvlink, 'mono').glow(
        5,
        ROLE.nvlink,
      ),
      txt(
        secondDone
          ? '2nd wait() adds dep, returns None (save 1st results)'
          : 'Independent compute overlaps dispatch; expert waits for t=4',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
      line([trackL, -138], [trackL + trackW, -138], { stroke: COSMOS.dim, width: 2 }),
    ];

    for (const tick of [0, 1, 3, 4, 6]) {
      const tx = toX(tick);
      nodes.push(
        line([tx, -146], [tx, -130], { stroke: COSMOS.dim, width: 2 }),
        txt(`t=${tick}`, tx, -166, 26, COSMOS.muted, 'mono'),
      );
    }

    for (const ln of lanes) {
      const x0 = toX(ln.start);
      const w = toX(ln.end) - x0;
      nodes.push(
        txt(ln.label, -855, ln.y, 26, COSMOS.ink, 'mono', 'left'),
        rect(trackW, 48, { fill: '#0e1424', stroke: COSMOS.rule, width: 1.5, radius: 6 }).at(
          trackL + trackW * 0.5,
          ln.y,
        ),
        rect(w, 48, { fill: '#102433', stroke: ln.col, width: 2.4, radius: 6 })
          .at(x0 + w * 0.5, ln.y)
          .glow(6, ln.col),
      );
    }

    // Dependency arrow at t = 4
    const gx = toX(4);
    nodes.push(line([gx, -62], [gx, 70], { stroke: ROLE.token, width: 3.5 }).glow(8, ROLE.token));
    // Playhead cursor
    const cx = toX(t);
    nodes.push(line([cx, -135], [cx, 128], { stroke: COSMOS.ink, width: 2.5 }).opacity(0.75));

    // Readout cards
    nodes.push(
      glassCell(-655, 224, 390, 96, calls >= 1 ? ROLE.good : COSMOS.dim, {
        fill: '#0d221c',
        glow: calls >= 1 ? 6 : 0,
      }),
      txt(
        calls >= 1 ? '1st wait() -> 4 results' : '1st wait() -> pending',
        -655,
        224,
        26,
        calls >= 1 ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      glassCell(-225, 224, 390, 96, secondDone ? ROLE.bad : COSMOS.dim, {
        fill: secondDone ? '#28101a' : '#101524',
        glow: secondDone ? 6 : 0,
      }),
      txt(
        secondDone ? '2nd wait() -> None' : '2nd wait() -> ?',
        -225,
        224,
        26,
        secondDone ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
      txt(
        secondDone
          ? 'Retain tensors & EPHandle from 1st wait through all consumers'
          : 'Host wait() records GPU dependency; CPU does not block',
        -860,
        340,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('events-beat-1-focus-1', () => {
    const dur = remainDuration(c, 'events-beat-1-focus-1', 0.8);
    s.play(waitCalls.to(1, { duration: 0.35 }));
    s.play(timeVal.to(2.5, { duration: dur }));
  });
  c.on('events-beat-2-focus-1', () => {
    const dur = remainDuration(c, 'events-beat-2-focus-1', 0.9);
    s.play(waitGate.to(1, { duration: 0.5 }));
    s.play(timeVal.to(6, { duration: dur }));
  });
  c.on('events-beat-3-focus-1', () =>
    s.play(waitCalls.to(2, { duration: remainDuration(c, 'events-beat-3-focus-1', 0.45) })),
  );
  c.after('dep-result-events-second', () =>
    s.play(
      revealSecond.to(1, { duration: remainAfterDuration(c, 'dep-result-events-second', 0.3) }),
    ),
  );
}
