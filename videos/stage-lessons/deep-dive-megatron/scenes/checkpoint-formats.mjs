// Scene 23: Check each recovery component against the requested migration (DP-reshardable vs fully-reshardable optimizer, Energon pure-DP cursor, atomic publish & checksums).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function checkpointFormats(s, c) {
  const phase = s.value(0);
  // step: 0=optimizer API, 1=DP-reshardable vs fully-reshardable, 2=Energon cursor, 3=missing raises, 4=absent restarts, 5=3/4 busy, 6=atomic publish
  const step = s.value(0);

  const bgAura = aura(0, 15, 620, '#60a5fa1a', '#a78bfa1a');
  const title = heroTitle(['Check Every Recovery', 'Component'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.tp,
    eyebrow: 'OPTIMIZER FORMAT · ENERGON DATA CURSOR · ATOMIC PUBLISH',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    const rows = [
      {
        title: '1. OPTIMIZER FORMAT',
        left: 'DP-reshardable: DP axis only (no TP change)',
        right: 'Fully-reshardable: param-shaped migration',
        col: ROLE.tp,
        hot: st <= 1,
        y: -155,
      },
      {
        title: '2. ENERGON DATA CURSOR',
        left:
          st === 3
            ? 'Missing rank file -> RAISES error!'
            : 'Keyed by pure DP rank (CP shares file)',
        right:
          st === 4
            ? 'Absent state root -> restarts from 0'
            : 'Verify cursor, never guess from weights',
        col: ROLE.ep,
        hot: st >= 2 && st <= 4,
        y: 5,
      },
      {
        title: '3. SHARD PUBLISH GATE',
        left:
          st >= 6 ? '4/4 shards + metadata -> PUBLISH' : '3/4 shards written; writer 4 still busy',
        right: 'Checksums + saved config + trusted source',
        col: ROLE.good,
        hot: st >= 5,
        y: 165,
      },
    ];

    rows.forEach((r) => {
      nodes.push(
        glassCell(0, r.y, 1600, 132, r.hot ? r.col : ROLE.dim, {
          fill: r.hot ? '#101d32' : '#0b1120',
          glow: r.hot ? 9 : 2,
        }),
        txt(r.title, -760, r.y - 26, 26, r.hot ? r.col : COSMOS.muted, 'mono', 'left'),
        txt(r.left, -760, r.y + 24, 26, COSMOS.ink, 'sans', 'left'),
        txt(r.right, 60, r.y + 24, 26, r.hot ? COSMOS.gold : COSMOS.muted, 'sans', 'left'),
      );
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 295, { radius: 6, color: ROLE.tp }),
      txt(
        'Converting weights gives an inference model; continuing training needs optimizer + data cursor too',
        0,
        360,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['mg-checkpoint-formats-b0', 0],
    ['mg-format-dp', 1],
    ['mg-checkpoint-formats-b1', 2],
    ['mg-missing-cursor', 3],
    ['mg-absent-cursor', 4],
    ['mg-checkpoint-formats-b2', 5],
    ['mg-save-complete', 6],
  ]);
}
