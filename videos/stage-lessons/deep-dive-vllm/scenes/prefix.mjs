// Scene 07: Exact full blocks carry reusable prompt work (R0 & R1 share 6 words -> only full Block 0 (4 words) reuses physical slot 12, refcount 2; adapter A->B breaks match).
import {
  COSMOS,
  R0_WORDS,
  R1_WORDS,
  ROLE,
  SHARED_PREFIX,
  aura,
  buildPagedKvRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  reuse,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function prefix(s, c) {
  const phase = s.value(0);
  // step: 0=shared vs divergent, 1=partial block not reusable, 2=R1 computes suffix + tail, 3=slot 12 refcount 2, 4=cache identity context, 5=adapter B mismatch -> ref 1, R1 [101,102,103]
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#6ee7b71c', '#a78bfa18');
  const rig3d = buildPagedKvRig3d(step, phase, { x: 475, y: 20, unit: 90, shareMode: true });

  const title = heroTitle(['Exact Full Blocks', 'Carry Reusable Work'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'COPY-ON-WRITE PREFIX SHARING · BLOCK REFCOUNTS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const compatible = st < 5;
    const reused = compatible ? reuse(SHARED_PREFIX, R1_WORDS.length, 4) : 0;
    const compute = R1_WORDS.length - reused;
    const r1Table = compatible ? [12, 73, 90] : [101, 102, 103];
    const ref12 = compatible ? 2 : 1;

    const nodes = [
      txt(
        '3D COW PREFIX SHARING (SLOT 12)',
        475,
        -395,
        26,
        compatible ? ROLE.good : ROLE.bad,
        'mono',
      ).glow(5, compatible ? ROLE.good : ROLE.bad),
      txt(
        compatible ? 'Slot 12 refcount = 2 (R0 + R1)' : 'Adapter B mismatch: Slot 12 refcount = 1',
        475,
        400,
        26,
        compatible ? ROLE.good : ROLE.bad,
        'mono',
      ),
    ];

    // R0 (8 tokens in 2 blocks) and R1 (9 tokens in 3 blocks) stacked on left
    const renderSeq = (label, words, yTop, accentCol, isR1) => {
      nodes.push(txt(label, -855, yTop - 48, 26, accentCol, 'mono', 'left'));
      const cw = 94;
      const cg = 6;
      words.forEach((word, i) => {
        const blockGap = Math.floor(i / 4) * 10;
        const cx = -855 + cw * 0.5 + i * (cw + cg) + blockGap;
        const isReused = i < reused;
        const isPartialMatch = i >= 4 && i < SHARED_PREFIX;
        const stroke = isReused
          ? ROLE.good
          : isPartialMatch && isR1
            ? COSMOS.gold
            : isR1
              ? ROLE.r1
              : ROLE.r0;
        const fill = isReused ? '#0d2b24' : isPartialMatch && isR1 ? '#261f0e' : '#101a2e';
        nodes.push(
          glassCell(cx, yTop + 18, cw, 74, stroke, { fill, glow: isReused ? 9 : 3 }),
          txt(word, cx, yTop + 18, 26, isReused ? ROLE.good : COSMOS.ink, 'sans'),
        );
      });
    };

    renderSeq('R0 (ADAPTER A · TABLE [12, 41])', R0_WORDS, -190, ROLE.r0, false);
    renderSeq(
      `R1 (ADAPTER ${compatible ? 'A' : 'B'} · TABLE [${r1Table.join(', ')}])`,
      R1_WORDS,
      -42,
      compatible ? ROLE.r1 : ROLE.bad,
      true,
    );

    // Metric & Cache Identity panel
    nodes.push(
      glassCell(-420, 118, 860, 124, compatible ? ROLE.good : ROLE.bad, {
        fill: compatible ? '#0d2620' : '#2b121f',
        glow: 9,
      }),
      txt(
        `Shared: ${SHARED_PREFIX}  |  Reused: ${reused}  |  R1 computes: ${compute}`,
        -420,
        88,
        26,
        COSMOS.ink,
        'mono',
      ),
      txt(
        `Slot 12 live refs: ${ref12} (${compatible ? 'R0 + R1 shared' : 'R0 only'})`,
        -420,
        144,
        26,
        compatible ? ROLE.good : ROLE.bad,
        'mono',
      ),

      glassCell(-420, 262, 860, 102, st >= 4 ? COSMOS.gold : ROLE.kv, {
        fill: st >= 4 ? '#221c0e' : '#0d1d2b',
        glow: 7,
      }),
      txt(
        st >= 5
          ? 'CACHE KEY: Adapter B != A -> MISS (recompute all 9)'
          : st >= 4
            ? 'CACHE KEY: parent + tokens + adapter + namespace'
            : 'REUSE UNIT: Complete 4-token blocks (partial blocks recompute)',
        -420,
        262,
        26,
        st >= 5 ? ROLE.bad : COSMOS.gold,
        'sans',
      ),

      txt(
        'Prefix reuse saves prompt prefill only; every generated token still runs decode',
        -855,
        368,
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
  orbitScene(s, c, rig3d.view, { theta: -0.22, phi: 0.88 });
  wireStepCues(s, c, step, [
    ['prefix-beat-1-focus-1', 0],
    ['prefix-beat-1-focus-2', 1],
    ['prefix-beat-2-focus-1', 2],
    ['prefix-shared-references', 3, true],
    ['prefix-beat-3-focus-1', 4],
    ['prefix-config-change', 5, true],
  ]);
}
