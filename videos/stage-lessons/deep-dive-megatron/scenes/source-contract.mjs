// Scene 03: Where does Megatron build the rank map? Core (layers/groups/schedules) vs Reference Trainer (tokenizer/data/launch) vs Bridge (checkpoint conversion).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function sourceContract(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#5ce1e618');
  const title = heroTitle(['Where Megatron Builds', 'the Rank Map'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.tp,
    eyebrow: 'MEGATRON CORE · REFERENCE TRAINER · BRIDGE',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const pkgs = [
      {
        k: 'MEGATRON CORE',
        f: 'parallel_state.py',
        d1: 'Rank generator & groups',
        d2: 'Layers & pipeline schedules',
        col: ROLE.tp,
        x: -560,
      },
      {
        k: 'REFERENCE TRAINER',
        f: 'pretrain_gpt.py',
        d1: 'Tokenizer & data loaders',
        d2: 'CLI launch arguments',
        col: ROLE.cp,
        x: 0,
      },
      {
        k: 'MEGATRON BRIDGE',
        f: 'checkpoint / energon',
        d1: 'Checkpoint conversion',
        d2: 'Weight & state migration',
        col: ROLE.good,
        x: 560,
      },
    ];

    const nodes = [
      txt(
        'PINNED COMMIT: 8971d19d · 4 DENSE AXES (TP, CP, DP, PP)',
        0,
        -225,
        28,
        COSMOS.gold,
        'mono',
      ),
    ];
    pkgs.forEach((pk, idx) => {
      const hi = (st < 0.5 && idx === 0) || st >= 0.5;
      nodes.push(
        glassCell(pk.x, 10, 510, 300, hi ? pk.col : COSMOS.dim, {
          fill: hi ? '#111b31' : '#0a0f1c',
          glow: hi ? 9 : 2,
        }),
        txt(pk.k, pk.x, -92, 28, hi ? pk.col : COSMOS.muted, 'mono'),
        txt(pk.f, pk.x, -30, 26, COSMOS.gold, 'mono'),
        txt(pk.d1, pk.x, 36, 26, hi ? COSMOS.ink : COSMOS.dim, 'sans'),
        txt(pk.d2, pk.x, 96, 26, COSMOS.muted, 'sans'),
      );
    });

    nodes.push(
      txt(
        'Record Core, Trainer, and Bridge commit versions with every run to reconstruct exact peer maps',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-source-contract-b0', 0],
    ['mg-source-contract-b1', 1],
  ]);
}
