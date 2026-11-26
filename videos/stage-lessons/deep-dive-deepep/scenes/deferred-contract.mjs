// Scene 20: What does the next wait return?
// V2.5 deferred contract: 5-unpack raises TypeError (after dep-result-deferred-typeerror);
// 1st wait returns 4 results (after de-first-four); 2nd stream wait adds dep & returns None (after de-second-none).
import {
  COSMOS,
  DEFERRED_2,
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

export default function deferredContract(s, c) {
  const phase = s.value(0);
  const smSplit = s.value(0.45);
  const waitGate = s.value(0);
  const showTypeErr = s.value(0);
  const showFirstFour = s.value(0);
  const showStreamB = s.value(0);
  const showSecondNone = s.value(0);

  const bgAura = aura(470, 12, 500, '#a78bfa22', '#6ee7b71c');
  const { view: rig3d } = buildStreamOverlapRig3d(smSplit, waitGate, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['What Does the', 'Next Wait Return?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.meta,
    eyebrow: 'V2.5 DEFERRED CONTRACT · ONE-SHOT HOOK',
    subtitle: 'Every wait() adds a stream dependency; only the 1st runs the hook',
  });

  const savedItems = DEFERRED_2.results[0];

  const live = guardedDynamic(1, () => {
    const isErr = Math.round(showTypeErr.value) >= 1;
    const hasFirst = Math.round(showFirstFour.value) >= 1;
    const hasB = Math.round(showStreamB.value) >= 1;
    const hasNone = Math.round(showSecondNone.value) >= 1;

    const depCount = hasNone ? 2 : hasFirst ? 1 : 0;
    const hookCount = hasFirst ? 1 : 0;

    const nodes = [
      txt('3D DEFERRED EPILOGUE & STREAM GATE', 470, -415, 26, ROLE.meta, 'mono').glow(
        5,
        ROLE.meta,
      ),
      txt(
        `${depCount} stream deps  ·  ${hookCount} epilogue hook call`,
        470,
        435,
        26,
        ROLE.nvlink,
        'mono',
      ),

      // Stream A row
      glassCell(-440, -76, 820, 108, hasFirst ? ROLE.good : ROLE.token, {
        fill: hasFirst ? '#0d241c' : '#1b170e',
        glow: 7,
      }),
      txt(
        'Stream A · event.wait()',
        -825,
        -96,
        26,
        hasFirst ? ROLE.good : ROLE.token,
        'mono',
        'left',
      ),
      txt(
        hasFirst ? '-> (rows, indices, gates, handle)' : '-> runs epilogue hook once',
        -825,
        -52,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      // Stream B row
      glassCell(-440, 62, 820, 108, hasNone ? ROLE.bad : hasB ? ROLE.nvlink : COSMOS.dim, {
        fill: hasNone ? '#2a101b' : '#0f1628',
        glow: hasB ? 6 : 0,
      }),
      txt(
        'Stream B · event.wait()',
        -825,
        42,
        26,
        hasNone ? ROLE.bad : hasB ? ROLE.nvlink : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        hasNone
          ? '-> None  (dep added, hook already consumed!)'
          : hasB
            ? '-> adds GPU dependency · returns ?'
            : 'waiting for second consumer stream',
        -825,
        86,
        26,
        hasNone ? ROLE.bad : COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    if (hasFirst) {
      nodes.push(
        txt('CALLER-OWNED VARIABLES (KEEP ALIVE)', -860, 174, 26, ROLE.good, 'mono', 'left'),
      );
      savedItems.forEach((item, i) => {
        const cx = -755 + i * 210;
        nodes.push(
          rect(192, 72, { fill: '#0d261e', stroke: ROLE.good, width: 2.2, radius: 8 }).at(cx, 240),
          txt(item, cx, 240, 26, ROLE.good, 'mono'),
        );
      });
      nodes.push(
        txt(
          'Stream wait lets the host CPU carry on without blocking',
          -860,
          336,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      nodes.push(
        line([-440, 126], [-440, 170], { stroke: isErr ? ROLE.bad : COSMOS.dim, width: 3 }),
        glassCell(-440, 232, 820, 104, isErr ? ROLE.bad : ROLE.token, {
          fill: isErr ? '#2c101a' : '#1b170e',
          glow: 7,
        }),
        txt(
          isErr
            ? 'Old 5-value unpack on 1 event -> TypeError!'
            : 'V2.5 deferred dispatch returns 1 event object',
          -440,
          232,
          27,
          isErr ? ROLE.bad : ROLE.token,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.after('dep-result-deferred-typeerror', () =>
    s.play(
      showTypeErr.to(1, { duration: remainAfterDuration(c, 'dep-result-deferred-typeerror', 0.3) }),
    ),
  );
  c.after('de-first-four', () => {
    const dur = remainAfterDuration(c, 'de-first-four', 0.35);
    s.play(showFirstFour.to(1, { duration: dur }));
    s.play(waitGate.to(1, { duration: dur }));
  });
  c.on('de-deferred-contract-b1', () =>
    s.play(showStreamB.to(1, { duration: remainDuration(c, 'de-deferred-contract-b1', 0.5) })),
  );
  c.after('de-second-none', () =>
    s.play(showSecondNone.to(1, { duration: remainAfterDuration(c, 'de-second-none', 0.3) })),
  );
}
