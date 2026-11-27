// Scene 14: Separate sequence-parallel activation work from remote attention (SP reuses TP peers, 0 new ranks; CP adds sequence-owning peers for >= 8k tokens).
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

export default function sequenceRole(s, c) {
  const step = s.value(0); // 0=overview, 1=SP no world factor, 2=CP remote KV, 3=TP+EP requires SP, CP >= 8k

  const bgAura = aura(0, 15, 620, '#60a5fa1a', '#5ce1e61a');
  const title = heroTitle(['Sequence Parallel vs', 'Context Parallel'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cp,
    eyebrow: 'ACTIVATION SHARDS ON TP PEERS VS REMOTE KV ON CP PEERS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    // Left panel: Sequence Parallelism (SP)
    const spHot = st === 1 || st === 3;
    nodes.push(
      glassCell(-440, -15, 760, 440, spHot ? ROLE.tp : ROLE.dim, {
        fill: spHot ? '#101f38' : '#0d1424',
        glow: spHot ? 10 : 4,
      }),
      txt('SEQUENCE PARALLELISM (SP)', -440, -182, 28, ROLE.tp, 'mono'),
      txt('Reuses existing TP peers', -440, -118, 28, COSMOS.ink, 'sans'),
      txt('Shards LayerNorm + Dropout along S', -440, -55, 26, COSMOS.muted, 'sans'),
      glassCell(-440, 35, 660, 82, ROLE.good, { fill: '#0e2422', glow: 5 }),
      txt('World-size factor: x1 (adds 0 ranks)', -440, 35, 26, ROLE.good, 'mono'),
      txt(
        st >= 3 ? 'Required when TP > 1 AND EP > 1' : 'Recommended whenever TP > 1',
        -440,
        140,
        26,
        st >= 3 ? COSMOS.gold : COSMOS.ink,
        'mono',
      ),
    );

    // Right panel: Context Parallelism (CP)
    const cpHot = st === 2 || st === 3;
    nodes.push(
      glassCell(440, -15, 760, 440, cpHot ? ROLE.cp : ROLE.dim, {
        fill: cpHot ? '#0e2430' : '#0d1424',
        glow: cpHot ? 10 : 4,
      }),
      txt('CONTEXT PARALLELISM (CP)', 440, -182, 28, ROLE.cp, 'mono'),
      txt('Adds sequence-owning CP peers', 440, -118, 28, COSMOS.ink, 'sans'),
      txt('Noncontiguous chunks balance causal work', 440, -55, 26, COSMOS.muted, 'sans'),
      glassCell(440, 35, 660, 82, ROLE.cp, { fill: '#102438', glow: 5 }),
      txt('Exchanges remote KV: P2P / AG / A2A', 440, 35, 26, ROLE.cp, 'mono'),
      txt(
        st >= 3 ? 'Try at >= 8,000 tokens; check shapes' : 'Attention consumes remote legal K, V',
        440,
        140,
        26,
        st >= 3 ? COSMOS.gold : COSMOS.ink,
        'mono',
      ),
    );

    nodes.push(
      txt(
        'Same token positions alternate between TP activation shards (SP) and CP sequence peers',
        0,
        345,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-sequence-role-b0', 0],
    ['mg-sp-chunks', 1],
    ['mg-cp-remote', 2],
    ['mg-sequence-role-b1', 3],
  ]);
}
