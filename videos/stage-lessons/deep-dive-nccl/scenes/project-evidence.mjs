// Scene 24: Bind source claims and performance claims to their evidence (Apache-2 + BSD notices, DCO, historical paper models vs measured GPU hardware receipts).
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

export default function projectEvidence(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#ffd16618');
  const title = heroTitle(['Bind Source & Speed', 'Claims to Evidence'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.r0,
    eyebrow: 'GOVERNANCE · MIXED LICENSES · BENCHMARK RECEIPTS',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const inPerf = st >= 4;

    const nodes = [
      glassCell(-420, 0, 760, 320, !inPerf ? ROLE.r0 : COSMOS.dim, {
        fill: !inPerf ? '#0f1d36' : '#0b101d',
        glow: !inPerf ? 10 : 2,
      }),
      txt('PROJECT & LICENSE BOUNDARY', -420, -110, 28, !inPerf ? ROLE.r0 : COSMOS.muted, 'mono'),
      txt('NVIDIA-led public-source + community PRs (DCO)', -420, -40, 26, COSMOS.ink, 'sans'),
      txt('Mostly Apache-2.0 · some BSD & borrowed notices', -420, 24, 26, COSMOS.gold, 'mono'),
      txt('Check per-file license & dependency notices', -420, 92, 26, COSMOS.muted, 'sans'),

      glassCell(420, 0, 760, 320, inPerf ? ROLE.good : COSMOS.dim, {
        fill: inPerf ? '#0d2624' : '#0b101d',
        glow: inPerf ? 10 : 2,
      }),
      txt('MODEL vs HARDWARE EVIDENCE', 420, -110, 28, inPerf ? ROLE.good : COSMOS.muted, 'mono'),
      txt(
        'Ring & double-tree papers != switch in-net reduce',
        420,
        -40,
        26,
        inPerf ? COSMOS.ink : COSMOS.dim,
        'sans',
      ),
      txt(
        'Record HW, SW, dtype, route, baseline & checks',
        420,
        24,
        26,
        inPerf ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt('3 CPU proofs (ring, offset, log) + supplied GPU', 420, 92, 26, COSMOS.muted, 'sans'),
    ];

    nodes.push(
      txt(
        'Keep immutable source pins, license notices, analytical models, and live GPU measurements distinct',
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
    ['nc-project-evidence-b0-s0', 0],
    ['nc-project-evidence-b0-s1', 1],
    ['nc-project-evidence-b0-s2', 2],
    ['nc-project-evidence-b0-s3', 3],
    ['nc-project-evidence-b1-s0', 4],
    ['nc-project-evidence-b1-s1', 5],
    ['nc-project-evidence-b1-s2', 6],
    ['nc-project-evidence-b1-s3', 7],
  ]);
}
