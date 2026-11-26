// Scene 08: A compressed tree shares exact leading token paths (HERO 3D RadixAttention prefix splitting + namespace isolation).
import {
  COSMOS,
  RADIX_A,
  RADIX_OTHER,
  RADIX_Z,
  ROLE,
  aura,
  buildRadixTree3d,
  common,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function radix(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = cached A vs query Z (pending count)
  // 1 = 4 tokens match (Birds sing near the)
  // 2 = insert Z -> compressed edge splits into 2 suffix branches + KV 12..15 survive
  // 3 = tree stores paths & cache locations for attention kernel
  // 4 = query OTHER (Birds fly over the lake)
  // 5 = only 1 leading word matches
  // 6 = namespace/adapter change -> 0 reusable tokens
  const step = s.value(0);

  const bgAura = aura(460, 20, 580, '#5ce1e622', '#ff6b8b16');
  const { view: tree3d } = buildRadixTree3d(step, phase, { x: 475, y: 25, unit: 94 });

  const title = heroTitle(['RadixAttention Splits', 'at Exact Prefixes'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'RADIX TREE · EDGE SPLITTING & KV REUSE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const matchAZ = common(RADIX_A, RADIX_Z);
    const matchAO = common(RADIX_A, RADIX_OTHER);
    const isOther = st >= 4;
    const nsChanged = st >= 6;
    const isSplit = st >= 2;

    const nodes = [
      txt('3D RADIX PREFIX TREE & KV BEAMS', 475, -390, 26, ROLE.radix, 'mono').glow(5, ROLE.radix),
      txt(
        nsChanged ? 'Namespace B != A -> 0 reused' : 'KV slots [12, 13, 14, 15] survive split',
        475,
        405,
        26,
        nsChanged ? ROLE.fail : COSMOS.gold,
        'mono',
      ),
    ];

    // Query readout
    const queryStr = isOther ? RADIX_OTHER.join(' ') : RADIX_Z.join(' ');
    nodes.push(
      glassCell(-420, -185, 860, 82, COSMOS.gold, { fill: '#1e1a10', glow: 8 }),
      txt(`Query: "${queryStr}"`, -420, -185, 26, COSMOS.gold, 'mono'),
    );

    // Compressed prefix node + suffix branches
    nodes.push(
      glassCell(-420, -68, 860, 108, ROLE.radix, { fill: '#0e2436', glow: 9 }),
      txt(
        isSplit
          ? 'SHARED (4):  Birds · sing · near · the'
          : 'CACHED (7):  Birds sing near the lake at dawn',
        -420,
        -92,
        26,
        ROLE.radix,
        'mono',
      ),
      txt('KV slots:  KV12 · KV13 · KV14 · KV15', -420, -40, 26, ROLE.prefill, 'mono'),
    );

    if (isSplit) {
      nodes.push(
        glassCell(-640, 68, 410, 102, ROLE.prefill, { fill: '#10203a', glow: 7 }),
        txt('Suffix A (cached)', -640, 44, 26, ROLE.prefill, 'mono'),
        txt('lake · at · dawn', -640, 92, 28, COSMOS.ink, 'mono'),
        glassCell(-200, 68, 410, 102, ROLE.fail, { fill: '#281326', glow: 7 }),
        txt('Suffix B (inserted)', -200, 44, 26, ROLE.fail, 'mono'),
        txt('old · oak · tree', -200, 92, 28, COSMOS.ink, 'mono'),
      );
    }

    // Match count / namespace verdict box
    const verdictText = nsChanged
      ? 'Adapter B != A  ->  0 reusable tokens'
      : st >= 5
        ? `Match: ${matchAO} token ("Birds") · "lake" excluded`
        : st >= 4
          ? 'Comparing "Birds fly over the lake" from token 0'
          : st >= 1
            ? `Exact leading match: ${matchAZ} tokens reused`
            : 'Comparing query tokens from the root...';

    const verdictCol = nsChanged ? ROLE.fail : st >= 1 ? ROLE.decode : COSMOS.muted;
    nodes.push(
      glassCell(-420, 215, 860, 104, verdictCol, {
        fill: nsChanged ? '#2c1120' : st >= 1 ? '#0d2922' : '#0b101d',
        glow: 9,
      }),
      txt(verdictText, -420, 215, 26, verdictCol, 'mono'),
    );

    const caption =
      st >= 6
        ? 'Real reuse obeys both namespace isolation and backend page alignment.'
        : st >= 3
          ? 'The radix tree owns cache locations; the attention kernel reads them.'
          : 'A compressed edge splits cleanly after the exact common prefix.';

    nodes.push(txt(caption, -855, 355, 26, COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, tree3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, tree3d, { theta: -0.18, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['radix-beat-1-focus-1', 0],
    ['sg-radix-match-four', 1, true],
    ['radix-insert-path', 2],
    ['radix-beat-2-focus-2', 2, true],
    ['radix-beat-2-focus-1', 3],
    ['radix-beat-3-focus-1', 4],
    ['sg-radix-match-one', 5, true],
    ['radix-beat-3-focus-2', 6, true],
  ]);
}
