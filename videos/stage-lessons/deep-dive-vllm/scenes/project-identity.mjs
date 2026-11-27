// Scene 28: Keep source stewardship and loaded artifacts separate (UC Berkeley Sky Computing Lab + Kwon/Li/Zhuang/Sheng + individual committers; Apache-2.0 source vs loaded weights/tokenizers/data; 4-axis architectural tradeoff summary).
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

export default function projectIdentity(s, c) {
  // step: 0=origin & individual committer governance, 1=Apache-2.0 source vs loaded artifact licenses, 2=4 architectural tradeoff boundaries
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1a', '#6ee7b716');
  const title = heroTitle(['Source Stewardship &', 'Loaded Artifact Boundaries'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'PROJECT IDENTITY · GOVERNANCE · LICENSING · SYSTEM TRADEOFFS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st === 0) {
      const items = [
        [
          'RESEARCH ORIGIN',
          'UC Berkeley Sky Computing Lab',
          '2023 PagedAttention paper: Kwon, Li, Zhuang, Sheng & collaborators',
          ROLE.r0,
        ],
        [
          'COMMUNITY ENGINE',
          'Block Memory + Scheduler + Runners',
          'Unites KV paging, V1 scheduling, attention backends & serving APIs',
          ROLE.kv,
        ],
        [
          'GOVERNANCE MODEL',
          'Individual Committer Authority',
          'Companies fund & operate; individuals earn review rights via sustained work',
          COSMOS.gold,
        ],
      ];
      items.forEach(([k, val, desc, col], i) => {
        const cy = -140 + i * 165;
        nodes.push(
          glassCell(0, cy, 1680, 138, col, { fill: '#101b2e', glow: 8 }),
          txt(k, -800, cy - 30, 26, col, 'mono', 'left'),
          txt(val, 800, cy - 30, 28, COSMOS.ink, 'mono', 'right'),
          txt(desc, -800, cy + 26, 26, COSMOS.muted, 'sans', 'left'),
        );
      });
    } else if (st === 1) {
      nodes.push(
        glassCell(-430, -25, 800, 320, ROLE.r0, { fill: '#101f38', glow: 9 }),
        txt('PINNED REPOSITORY', -430, -120, 26, ROLE.r0, 'mono'),
        txt('Apache 2.0 License', -430, -52, 38, COSMOS.ink, 'mono'),
        txt('Covers the vLLM source tree under its terms', -430, 20, 26, COSMOS.muted, 'sans'),
        txt('Pin exact release tag & git commit', -430, 74, 26, ROLE.kv, 'mono'),

        glassCell(430, -25, 800, 320, COSMOS.gold, { fill: '#231c0e', glow: 9 }),
        txt('LOADED ARTIFACTS', 430, -120, 26, COSMOS.gold, 'mono'),
        txt('Weights · Tokenizers · Data', 430, -52, 34, COSMOS.ink, 'mono'),
        txt(
          'Plus remote code retain separate licenses & trust rules',
          430,
          20,
          26,
          COSMOS.muted,
          'sans',
        ),
        txt('Review rights & behavior independently!', 430, 74, 26, ROLE.good, 'mono'),

        glassCell(0, 228, 1680, 96, ROLE.kv, { fill: '#0e222e', glow: 7 }),
        txt(
          'A compatible server can load an artifact whose rights or trust still need separate review',
          0,
          228,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      const tradeoffs = [
        ['KV BLOCKS', 'Less fragmentation waste', 'Adds block-table & pool metadata work', ROLE.kv],
        [
          'SCHEDULING',
          'Mixes decode & chunked prefill',
          'Trades TTFT vs ITL under pressure',
          ROLE.r1,
        ],
        [
          'BACKENDS',
          'Broadens model & HW support',
          'Creates a strict compatibility matrix',
          ROLE.r0,
        ],
        [
          'PARALLELISM',
          'Improves per-GPU memory fit',
          'Adds collective communication cost',
          COSMOS.gold,
        ],
      ];
      tradeoffs.forEach(([k, gain, cost, col], i) => {
        const cy = -180 + i * 130;
        nodes.push(
          glassCell(0, cy, 1680, 110, col, { fill: '#101a2e', glow: 7 }),
          txt(k, -800, cy, 26, col, 'mono', 'left'),
          txt(`+ ${gain}`, -420, cy, 26, ROLE.good, 'sans', 'left'),
          txt(`- ${cost}`, 800, cy, 26, COSMOS.gold, 'sans', 'right'),
        );
      });
    }

    nodes.push(
      txt(
        st === 2
          ? 'Judge the combined system by correct useful completions under real workload & resource limits'
          : 'Preserve release version, committer scope, and artifact licenses together',
        0,
        382,
        26,
        st === 2 ? ROLE.good : COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-project-identity-op-0', 0],
    ['vv-project-identity-op-1', 1],
    ['vv-project-identity-op-2', 2],
  ]);
}
