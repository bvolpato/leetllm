// Scene 21: An in-place shard starts at its rank offset (Rank 2 in-place view at elem 2 = byte 8; write 3333; base ptr reads 100 vs offset +8 reads 3333!).
import {
  COSMOS,
  ROLE,
  aura,
  byteOffset,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function inplaceOffset(s, c) {
  const phase = s.value(0);
  // step: 0..3=in-place contract (rank*count*bytes), 4=R2 view, 5=byte 8, 6=write 3333, 7=wrong base ptr (100), 8=correct byte 8 (3333)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#6ee7b718');
  const title = heroTitle(['In-Place Shards Start', 'at Rank Offset'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.r2,
    eyebrow: 'RANK × COUNT × ITEMSIZE · BASE PTR TRAP',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    const vals = [100, 200, st >= 6 ? 3333 : 300, 400];
    const offBytes = byteOffset(2, 1, 4); // 8

    const nodes = [
      txt('FLOAT32 SHARED ARRAY ON RANK 2 (4 BYTES / ELEMENT)', 0, -225, 28, COSMOS.gold, 'mono'),
    ];

    vals.forEach((v, i) => {
      const cx = -495 + i * 330;
      const isR2 = i === 2;
      const isWrong = i === 0 && st === 7;
      const col = isWrong
        ? ROLE.bad
        : isR2 && st >= 4
          ? st >= 8
            ? ROLE.good
            : COSMOS.gold
          : ROLE.r0;
      nodes.push(
        txt(`elem ${i}  (byte ${i * 4})`, cx, -152, 26, isR2 ? COSMOS.gold : COSMOS.muted, 'mono'),
        glassCell(cx, -70, 280, 108, col, {
          fill: isWrong ? '#2d1222' : isR2 && st >= 4 ? '#261e0e' : '#0f1d36',
          glow: isR2 || isWrong ? 10 : 3,
        }),
        txt(String(v), cx, -70, 42, isWrong ? ROLE.bad : isR2 ? col : COSMOS.ink, 'mono'),
      );
    });

    nodes.push(
      glassCell(-420, 145, 760, 180, st === 7 ? ROLE.bad : COSMOS.dim, {
        fill: st === 7 ? '#2d1222' : '#0a0f1c',
        glow: st === 7 ? 10 : 2,
      }),
      txt(
        'WRONG: PASS BASE POINTER data',
        -420,
        92,
        28,
        st === 7 ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
      txt(
        'AllGather reads slot 0 -> 100 (NOT Rank 2!)',
        -420,
        152,
        26,
        st === 7 ? ROLE.bad : COSMOS.dim,
        'mono',
      ),
      txt('Silent wrong-shard corruption!', -420, 202, 26, COSMOS.muted, 'sans'),

      glassCell(420, 145, 760, 180, st >= 8 ? ROLE.good : COSMOS.dim, {
        fill: st >= 8 ? '#0d2924' : '#0a0f1c',
        glow: st >= 8 ? 10 : 2,
      }),
      txt(
        `CORRECT: data + rank × count (+${offBytes} B)`,
        420,
        92,
        28,
        st >= 8 ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      txt(
        'AllGather reads slot 2 -> 3333 (Rank 2 shard)',
        420,
        152,
        26,
        st >= 8 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt('Matches NCCL ReduceScatter / AllGather contract', 420, 202, 26, COSMOS.muted, 'sans'),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 290, { radius: 6, color: st >= 8 ? ROLE.good : COSMOS.gold }),
      txt(
        'In-place AllReduce uses sendBuff == recvBuff; ReduceScatter & AllGather index at rank * count',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['nc-inplace-offset-b0-s0', 0],
    ['nc-inplace-offset-b0-s1', 1],
    ['nc-inplace-offset-b0-s2', 2],
    ['nc-inplace-offset-b0-s3', 3],
    ['nc-inplace-offset-b1-s0', 4],
    ['nc-inplace-offset-b1-s1', 5],
    ['nc-inplace-offset-b1-s2', 6],
    ['nc-inplace-offset-b1-s3', 7],
    ['nc-inplace-offset-b1-s4', 8],
  ]);
}
