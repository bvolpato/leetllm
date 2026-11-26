// Scene 3: Following stored links (Greedy graph walk E -> C -> A misses B; local-minimum trap E=1 -> M=2 -> H=0.1)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function greedyHops(s, c) {
  const phase = s.value(0);
  const showEntry = s.value(0);
  const showHopC = s.value(0);
  const showHopA = s.value(0);
  const showTrap = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Following', 'Stored Links'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'GREEDY GRAPH SEARCH · LOCAL DESCENT & THE UPHILL BRIDGE TRAP',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const se = showEntry.value;
    const hc = showHopC.value;
    const ha = showHopA.value;
    const st = showTrap.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    // Left: 6-node greedy walk diagram
    const ePos = [-745, 165];
    const cPos = [-525, 35];
    const aPos = [-315, -75];
    const bPos = [-135, -35];
    const dPos = [-105, -135];
    const fPos = [-70, 145];

    // Right: 3-node uphill trap E(1.0) -- M(2.0) -- H(0.1)
    const tePos = [215, 35];
    const tmPos = [495, -55];
    const thPos = [775, 85];

    const nodes = [
      // Left panel: 6-passage graph walk E -> C -> A
      glassCell(-425, 22, 860, 446, se > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#0e182e',
        glow: 4,
      }),
      txt(
        'GREEDY WALK: E (20.56) -> C (1.25) -> A (0.08)',
        -825,
        -166,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // Background edges
      line(ePos, cPos, {
        stroke: hc > 0.3 ? COSMOS.cyan : COSMOS.muted,
        width: hc > 0.3 ? 4.5 : 2,
      }).glow(hc > 0.3 ? 9 : 0, COSMOS.cyan),
      line(cPos, aPos, {
        stroke: ha > 0.3 ? COSMOS.emerald : COSMOS.muted,
        width: ha > 0.3 ? 4.5 : 2,
      }).glow(ha > 0.3 ? 9 : 0, COSMOS.emerald),
      line(bPos, dPos, { stroke: COSMOS.muted, width: 2, dash: [8, 6] }),
      line(dPos, fPos, { stroke: COSMOS.muted, width: 2, dash: [8, 6] }),

      glowDot(ePos[0], ePos[1], { radius: 11, color: COSMOS.amber }),
      txt('E 20.56', ePos[0] + 76, ePos[1] + 20, 26, COSMOS.amber, 'mono'),

      glowDot(cPos[0], cPos[1], { radius: 11, color: hc > 0.3 ? COSMOS.cyan : COSMOS.muted }),
      txt('C 1.25', cPos[0] + 18, cPos[1] + 44, 26, COSMOS.cyan, 'mono'),

      glowDot(aPos[0], aPos[1], { radius: 12, color: ha > 0.3 ? COSMOS.emerald : COSMOS.muted }),
      txt('A 0.08', aPos[0], aPos[1] - 34, 26, COSMOS.emerald, 'mono'),

      glowDot(bPos[0], bPos[1], { radius: 11, color: COSMOS.rose }),
      txt('B (unseen!)', bPos[0] - 58, bPos[1] + 40, 26, COSMOS.rose, 'mono'),

      glowDot(dPos[0], dPos[1], { radius: 8, color: COSMOS.muted }),
      txt('D', dPos[0] + 24, dPos[1] + 4, 26, COSMOS.muted, 'mono'),
      glowDot(fPos[0], fPos[1], { radius: 8, color: COSMOS.muted }),
      txt('F', fPos[0] - 26, fPos[1] + 4, 26, COSMOS.muted, 'mono'),

      txt(
        '3 nodes scored (E, C, A); B never compared',
        -825,
        206,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      // Right panel: Local minimum trap E(1.0) -- M(2.0) -- H(0.1)
      glassCell(495, 22, 810, 446, st > 0.3 ? COSMOS.rose : COSMOS.gold, {
        fill: st > 0.3 ? '#24121c' : '#12182d',
        glow: st > 0.3 ? 9 * pulse : 3,
      }),
      txt('LOCAL MINIMUM TRAP (UPHILL BRIDGE)', 120, -166, 26, COSMOS.rose, 'mono', 'left'),

      line(tePos, tmPos, { stroke: COSMOS.rose, width: 4.0 }).glow(7, COSMOS.rose),
      line(tmPos, thPos, { stroke: COSMOS.emerald, width: 4.0, dash: [10, 8] }),

      glowDot(tePos[0], tePos[1], { radius: 13, color: COSMOS.gold }),
      txt('E  d=1.0', tePos[0], tePos[1] + 44, 26, COSMOS.gold, 'mono'),
      txt('STOPS HERE', tePos[0] - 12, tePos[1] - 52, 26, COSMOS.rose, 'mono'),

      glowDot(tmPos[0], tmPos[1], { radius: 12, color: COSMOS.rose }),
      txt('M  d=2.0 (uphill)', tmPos[0], tmPos[1] - 46, 26, COSMOS.rose, 'mono'),

      glowDot(thPos[0], thPos[1], { radius: 13, color: COSMOS.emerald }),
      txt('H  d=?', thPos[0], thPos[1] + 44, 26, COSMOS.emerald, 'mono'),
      txt('Hidden past M', thPos[0] + 10, thPos[1] - 74, 26, COSMOS.muted, 'sans'),

      txt('How can search ever discover H past M?', 120, 206, 26, COSMOS.gold, 'sans', 'left'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.rose }),
      txt(
        'Pure greedy descent halts whenever every immediate neighbor sits slightly farther away',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('greedy-hops-b1-1', () => s.play(showEntry.to(1, { duration: 0.4 })));
  c.on('hop-to-c', () => s.play(showHopC.to(1, { duration: 0.4 })));
  c.on('hop-to-a', () => s.play(showHopA.to(1, { duration: 0.4 })));
  c.on('greedy-hops-b3-1', () =>
    s.play(showTrap.to(1, { duration: remainDuration(c, 'greedy-hops-b3-1', 0.45) })),
  );
}
