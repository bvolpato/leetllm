// Scene 20: Transpose sequence ownership to head ownership and back (DeepSpeed Ulysses). Sequence slices S/4 <-> All-to-All #1 -> Head slices H/4 (full seq) -> All-to-All #2 -> Sequence slices + GQA head divisibility.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ulyssesLayout(s, c) {
  const phase = s.value(0);
  const p0 = s.value(0);
  const pProj = s.value(0);
  const pTrans = s.value(0);
  const pB1 = s.value(0);
  const pAttn = s.value(0);
  const pRet = s.value(0);
  const pB2 = s.value(0);
  const pHeads = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#5ce1e61c');
  const title = heroTitle(['Transpose Sequence Ownership', 'to Head Ownership and Back'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: ROLE.gpu1,
    eyebrow: 'DEEPSPEED ULYSSES · TWO ALL-TO-ALL TRANSPOSES',
  });

  const headCols = [ROLE.gpu0, ROLE.gpu1, ROLE.expert, COSMOS.gold];
  const headFills = ['#11284a', '#0e2d3b', '#22163c', '#2b220f'];

  const live = guardedDynamic(1, () => {
    const pr = pProj.value > 0.3 || p0.value > 0.3;
    const tr = pTrans.value;
    const at = pAttn.value > 0.4 || pB1.value > 0.4;
    const rt = pRet.value;
    const gqa = pHeads.value > 0.4 || pB2.value > 0.4;

    const nodes = [
      txt(
        '4 RANKS · 4 SEQUENCE CHUNKS (S/4) ↔ 4 FULL-SEQUENCE HEADS (H/4)',
        0,
        -210,
        26,
        COSMOS.gold,
        'mono',
      ),
      txt(
        rt > 0.4 ? 'OUTPUT SEQUENCE SLICES (S/4)' : 'LOCAL SEQUENCE SLICES (S/4)',
        -530,
        -155,
        26,
        ROLE.gpu0,
        'mono',
      ),
      txt('FULL-SEQUENCE HEAD SLICES (H/4)', 530, -155, 26, ROLE.gpu1, 'mono'),
    ];

    // Left 4x4 grid: row = rank (seq chunk s0..s3), col = head h0..h3
    // Right 4x4 grid: row = rank (head h0..h3), col = seq chunk s0..s3
    for (let r = 0; r < 4; r++) {
      const cy = -82 + r * 92;
      nodes.push(
        txt(`R${r}`, -828, cy, 26, COSMOS.muted, 'mono'),
        txt(`R${r}`, 828, cy, 26, COSMOS.muted, 'mono'),
      );
      for (let k = 0; k < 4; k++) {
        // Left cell (rank r owns seq chunk r, all 4 heads k)
        const lx = -720 + k * 128;
        const leftLit = pr && (tr < 0.7 || rt > 0.5);
        nodes.push(
          rect(112, 68, {
            fill: leftLit ? headFills[k] : '#0b1120',
            stroke: leftLit ? headCols[k] : '#263454',
            width: leftLit ? 2.4 : 1.5,
            radius: 8,
          })
            .at(lx, cy)
            .glow(leftLit ? 6 : 0, headCols[k]),
          txt(`S${r}H${k}`, lx, cy, 26, leftLit ? headCols[k] : COSMOS.dim, 'mono'),
        );

        // Right cell (rank r owns head r, all 4 seq chunks k)
        const rx = 338 + k * 128;
        const rightLit = tr > 0.45 && rt < 0.85;
        nodes.push(
          rect(112, 68, {
            fill: rightLit ? headFills[r] : '#0b1120',
            stroke: rightLit ? (at ? COSMOS.gold : headCols[r]) : '#263454',
            width: rightLit ? 2.6 : 1.5,
            radius: 8,
          })
            .at(rx, cy)
            .glow(rightLit ? 7 : 0, headCols[r]),
          txt(`S${k}H${r}`, rx, cy, 26, rightLit ? headCols[r] : COSMOS.dim, 'mono'),
        );
      }
    }

    // Center All-to-All bridge
    const fwdActive = tr > 0.1 && rt < 0.1;
    const revActive = rt > 0.1;
    nodes.push(
      glowingArc([-260, -40], [260, -40], -36, {
        color: fwdActive ? COSMOS.gold : ROLE.gpu0,
        width: fwdActive ? 4.0 : 2.2,
        opacity: fwdActive ? 0.95 : 0.4,
      }),
      txt('All-to-All #1 ->', 0, -96, 26, fwdActive ? COSMOS.gold : COSMOS.muted, 'mono'),

      glassCell(0, 56, 400, 108, at ? ROLE.good : COSMOS.dim, {
        fill: at ? '#0d2924' : '#0d1528',
        glow: at ? 9 : 3,
      }),
      txt(at ? 'LOCAL FLASHATTN' : 'TRANSPOSE', 0, 32, 26, at ? ROLE.good : COSMOS.ink, 'mono'),
      txt('full sequence / head', 0, 78, 26, COSMOS.muted, 'mono'),

      glowingArc([260, 152], [-260, 152], 36, {
        color: revActive ? COSMOS.gold : ROLE.gpu1,
        width: revActive ? 4.0 : 2.2,
        opacity: revActive ? 0.95 : 0.4,
      }),
      txt('<- All-to-All #2', 0, 206, 26, revActive ? COSMOS.gold : COSMOS.muted, 'mono'),
    );

    const foot = gqa
      ? 'Clean nonduplicating Ulysses requires ranks to divide both Q heads and smaller KV head count'
      : revActive
        ? 'Second All-to-All restores sequence ownership before the output projection'
        : at
          ? 'Each rank runs standard local attention across the full sequence for its heads'
          : 'First All-to-All exchanges Q, K, V slices from sequence shards into head shards';

    nodes.push(
      glassCell(0, 330, 1540, 76, gqa ? ROLE.warn : ROLE.gpu1, {
        fill: gqa ? '#291a0d' : '#0f1b30',
        glow: 8,
      }),
      txt(foot, 0, 330, 26, gqa ? ROLE.warn : COSMOS.ink, 'sans'),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 415, { radius: 6, color: ROLE.gpu1 }),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('mp-ulysses-layout-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-0', 0.35) })),
  );
  c.on('mp-ulysses-layout-project', () =>
    s.play(pProj.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-project', 0.45) })),
  );
  c.on('mp-ulysses-layout-transpose', () =>
    s.play(pTrans.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-transpose', 0.85) })),
  );
  c.on('mp-ulysses-layout-1', () =>
    s.play(pB1.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-1', 0.35) })),
  );
  c.on('mp-ulysses-layout-attend', () =>
    s.play(pAttn.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-attend', 0.45) })),
  );
  c.on('mp-ulysses-layout-return', () =>
    s.play(pRet.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-return', 0.85) })),
  );
  c.on('mp-ulysses-layout-2', () =>
    s.play(pB2.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-2', 0.35) })),
  );
  c.on('mp-ulysses-layout-heads', () =>
    s.play(pHeads.to(1, { duration: remainDuration(c, 'mp-ulysses-layout-heads', 0.45) })),
  );
}
