// Scene 23: Construct the destination before filling it (DCP in-place load, resharding elements 4..7 across ranks 0 & 1, single-process CPU round-trip exact match).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function dcpLoad(s, c) {
  const phase = s.value(0);
  const stage = s.value(0); // 0=construct first, 1=planner resharding [4..7] -> R0:[4,5] & R1:[6,7], 2=CPU round-trip, 3=exact match

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#6ee7b718');
  const title = heroTitle(['Construct Destination', 'Before Filling It'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.copy,
    eyebrow: 'DISTRIBUTED CHECKPOINT (DCP) · LOAD PLANNER',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const p = phase.value;

    const nodes = [
      // Top: Checkpoint shard files on storage
      txt('CHECKPOINT SHARD FILES (CANONICAL PARAMETER IDS)', 0, -225, 26, COSMOS.gold, 'mono'),
      glassCell(-540, -125, 420, 120, COSMOS.dim, { fill: '#10182b', glow: 2 }),
      txt('File 0: elems [0..3]', -540, -125, 28, COSMOS.muted, 'mono'),

      glassCell(0, -125, 460, 120, st >= 1 ? ROLE.trans : ROLE.orig, {
        fill: st >= 1 ? '#261e0e' : '#0f1d36',
        glow: st >= 1 ? 10 : 4,
      }),
      txt('File 1: elems [4, 5, 6, 7]', 0, -125, 28, st >= 1 ? ROLE.trans : COSMOS.ink, 'mono'),

      glassCell(540, -125, 420, 120, COSMOS.dim, { fill: '#10182b', glow: 2 }),
      txt('File 2: elems [8..11]', 540, -125, 28, COSMOS.muted, 'mono'),

      // Routing lines from File 1 to Rank 0 & Rank 1
      line([-90, -60], [-360, 42], { stroke: st >= 1 ? ROLE.copy : COSMOS.dim, width: 3.4 }),
      line([90, -60], [360, 42], { stroke: st >= 1 ? ROLE.good : COSMOS.dim, width: 3.4 }),

      // Middle: Pre-constructed destination ranks
      glassCell(-410, 108, 720, 128, st >= 1 ? ROLE.copy : ROLE.orig, { fill: '#0d222e', glow: 8 }),
      txt('NEW RANK 0 DESTINATION (in-place)', -410, 74, 26, ROLE.copy, 'mono'),
      txt('Range [0..5] (4, 5 from File 1)', -410, 130, 26, COSMOS.ink, 'mono'),

      glassCell(410, 108, 720, 128, st >= 1 ? ROLE.good : ROLE.orig, { fill: '#0e2624', glow: 8 }),
      txt('NEW RANK 1 DESTINATION (in-place)', 410, 74, 26, ROLE.good, 'mono'),
      txt('Range [6..11] (6, 7 from File 1)', 410, 130, 26, COSMOS.ink, 'mono'),

      // Bottom: Receipt bar
      glassCell(0, 268, 1480, 104, st >= 3 ? ROLE.good : st >= 2 ? ROLE.orig : COSMOS.dim, {
        fill: st >= 3 ? '#0d2924' : '#10182b',
        glow: st >= 3 ? 10 : 3,
      }),
      txt(
        st >= 3
          ? 'CPU ROUND-TRIP PASS: next loss, weights, Adam moments & step counters match EXACTLY!'
          : st >= 2
            ? 'Save Linear + Adam after step 1 -> load via get/set_state_dict -> run step 2'
            : 'Build model, optimizer, and ProcessGroups FIRST; DCP fills storage in place',
        0,
        268,
        26,
        st >= 3 ? ROLE.good : COSMOS.ink,
        'mono',
      ),
    ];

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-740 + u * 1480, 355, { radius: 6, color: st >= 3 ? ROLE.good : ROLE.copy }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pt-dcp-load-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-dcp-load-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-dcp-load-1', 0.45) })),
  );
  c.on('pt-dcp-load-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-dcp-load-2', 0.45) })),
  );
  c.on('pt-dcp-match', () =>
    s.play(stage.to(3, { duration: remainDuration(c, 'pt-dcp-match', 0.4) })),
  );
}
