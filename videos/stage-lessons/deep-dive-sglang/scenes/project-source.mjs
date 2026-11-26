// Scene 31: Read paper, release guide and source as different evidence (Authors/LMSYS/Apache-2.0 + pinned commit f8e62a9 code-reading route).
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

export default function projectSource(s, c) {
  const phase = s.value(0);
  // step: 0=paper / LMSYS / Apache-2.0 provenance, 1=pinned commit f8e62a9 module reading map
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e618', '#60a5fa1a');
  const title = heroTitle(['Paper, Release Guide', 'and Installed Source'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'PROVENANCE · APACHE-2.0 · PINNED COMMIT CODE ROUTE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st === 0) {
      nodes.push(
        glassCell(-415, -55, 740, 260, ROLE.prefill, { fill: '#10213d', glow: 9 }),
        txt('FOUNDING PAPER & LMSYS', -415, -138, 28, ROLE.prefill, 'mono'),
        txt('Lianmin Zheng, Liangsheng Yin,', -415, -70, 28, COSMOS.ink, 'sans'),
        txt('Zhiqiang Xie, Ying Sheng & collaborators', -415, -20, 28, COSMOS.ink, 'sans'),
        txt('UC Berkeley · Stanford · LMSYS Org', -415, 36, 26, COSMOS.gold, 'mono'),

        glassCell(415, -55, 740, 260, ROLE.radix, { fill: '#0e2436', glow: 9 }),
        txt('OPEN SOURCE BOUNDARIES', 415, -138, 28, ROLE.radix, 'mono'),
        txt('sgl-project/sglang · Apache-2.0 core', 415, -70, 28, COSMOS.ink, 'mono'),
        txt('Checkpoints, tokenizers, datasets &', 415, -12, 26, COSMOS.muted, 'sans'),
        txt('3rd-party kernels carry separate terms', 415, 34, 26, COSMOS.muted, 'sans'),

        glassCell(0, 175, 1560, 108, COSMOS.gold, { fill: '#1e1a10', glow: 8 }),
        txt(
          'MAINTAINER.md and CODEOWNERS document module review responsibilities',
          0,
          175,
          28,
          COSMOS.gold,
          'mono',
        ),
      );
    } else {
      nodes.push(
        glassCell(0, -198, 1540, 82, ROLE.radix, { fill: '#0e2436', glow: 9 }),
        txt(
          'PINNED REVISION:  f8e62a9224815cc9c6fc56b940eb7fde791a8870',
          0,
          -198,
          28,
          ROLE.radix,
          'mono',
        ),
      );

      const modules = [
        {
          k: 'lang/ (api, ir, interpreter)',
          v: 'Named variables, select/gen, fork/join dependencies',
          col: ROLE.prefill,
        },
        {
          k: 'managers/scheduler & radix_cache',
          v: 'Admission budgets, PrefillAdder, RadixKey & locks',
          col: ROLE.radix,
        },
        {
          k: 'constrained/ & speculative/',
          v: 'Grammar manager masks & speculative draft registry',
          col: ROLE.grammar,
        },
        {
          k: 'disaggregation/ (prefill, decode)',
          v: 'KV reservation policies & transfer handoff lifecycle',
          col: ROLE.decode,
        },
      ];
      modules.forEach((m, i) => {
        const y = -90 + i * 104;
        nodes.push(
          glassCell(0, y, 1540, 86, m.col, { fill: '#0f1c32', glow: 7 }),
          txt(m.k, -730, y, 26, m.col, 'mono', 'left'),
          txt(m.v, -95, y, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 298, { radius: 6, color: ROLE.radix }),
      txt(
        st >= 1
          ? 'To trace a deployed worker, open these modules at the exact revision installed on that host.'
          : 'Keep the 2024 paper, live docs, and installed commit distinct as separate forms of evidence.',
        0,
        355,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['sg-project-source-beat-0', 0],
    ['sg-project-source-beat-1', 1],
  ]);
}
