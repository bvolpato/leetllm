// Scene 04: Logical neighbors can live in distant physical blocks (R0's 8 tokens -> L0:12, L1:41; orbiting 3D PagedAttention block-table rig; pos 0 -> 4 -> 6).
import {
  COSMOS,
  R0_WORDS,
  ROLE,
  aura,
  buildPagedKvRig3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function blocks(s, c) {
  const phase = s.value(0);
  // step: 0=beat1 fixed blocks (pos 0), 1=beat1 max-history note, 2=beat2 two slots (pos 4), 3=beat2 two 4-pos blocks, 4=beat3 div/mod (pos 6), 5=beat3 backend contract
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e61e', '#60a5fa18');
  const rig3d = buildPagedKvRig3d(step, phase, { x: 475, y: 20, unit: 92, shareMode: false });

  const title = heroTitle(['Logical Neighbors,', 'Distant Physical Slots'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kv,
    eyebrow: 'PAGEDATTENTION · VIRTUAL-TO-PHYSICAL KV BLOCK TABLE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const pos = st >= 4 ? 6 : st >= 2 ? 4 : 0;
    const logical = Math.floor(pos / 4);
    const offset = pos % 4;
    const phys = [12, 41][logical];

    const nodes = [
      txt('3D LOGICAL -> PHYSICAL KV MAPPING', 475, -395, 26, ROLE.kv, 'mono').glow(5, ROLE.kv),
      txt('L0 -> slot 12 (green)  |  L1 -> slot 41 (blue)', 475, 400, 26, COSMOS.gold, 'mono'),
      txt('R0 LOGICAL TOKENS (BLOCK SIZE = 4)', -855, -232, 26, ROLE.r0, 'mono', 'left'),
    ];

    // 2 rows of 4 tokens on left half (x in [-855, 20])
    const tw = 198;
    const tg = 16;
    R0_WORDS.forEach((word, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const cx = -855 + tw * 0.5 + col * (tw + tg);
      const cy = -165 + row * 102;
      const isSel = i === pos;
      const bCol = row === 0 ? ROLE.good : ROLE.r0;
      nodes.push(
        glassCell(cx, cy, tw, 82, isSel ? COSMOS.gold : bCol, {
          fill: isSel ? '#2b220e' : row === 0 ? '#0d2622' : '#101f38',
          glow: isSel ? 12 : 4,
        }),
        txt(`${i}: ${word}`, cx, cy, 26, isSel ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
    });

    // Request Block Table
    nodes.push(
      txt('R0 BLOCK TABLE', -855, 16, 26, COSMOS.muted, 'mono', 'left'),
      glassCell(-640, 88, 410, 92, logical === 0 ? COSMOS.gold : ROLE.good, {
        fill: logical === 0 ? '#241d0f' : '#0d2420',
        glow: logical === 0 ? 10 : 4,
      }),
      txt('L0  ->  Physical 12', -640, 88, 28, logical === 0 ? COSMOS.gold : COSMOS.ink, 'mono'),

      glassCell(-200, 88, 410, 92, logical === 1 ? COSMOS.gold : ROLE.r0, {
        fill: logical === 1 ? '#241d0f' : '#101f38',
        glow: logical === 1 ? 10 : 4,
      }),
      txt('L1  ->  Physical 41', -200, 88, 28, logical === 1 ? COSMOS.gold : COSMOS.ink, 'mono'),
    );

    // Live address calculation + MathJax formula
    nodes.push(
      glassCell(-420, 224, 850, 118, ROLE.kv, { fill: '#0d202e', glow: 8 }),
      txt(
        `SELECTED: pos ${pos} ("${R0_WORDS[pos]}")  ->  slot ${phys}, offset ${offset}`,
        -420,
        196,
        26,
        ROLE.kv,
        'mono',
      ),
      glowTex(String.raw`j = ${pos} = 4 \cdot ${logical} + ${offset}`, {
        x: -420,
        y: 250,
        size: 36,
        color: COSMOS.gold,
        glow: 5,
      }),
      txt(
        st >= 5
          ? 'PagedAttention is a memory contract; actual kernel depends on HW, dtype & backend'
          : 'Logical order lives in the block table; physical slots need not be adjacent',
        -855,
        365,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, rig3d.view, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { theta: -0.22, phi: 0.86 });
  wireStepCues(s, c, step, [
    ['blocks-beat-1-focus-2', 0],
    ['blocks-beat-1-focus-1', 1],
    ['blocks-beat-2-focus-2', 2],
    ['blocks-beat-2-focus-1', 3],
    ['blocks-beat-3-focus-1', 4],
    ['blocks-beat-3-focus-2', 5],
  ]);
}
