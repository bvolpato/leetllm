// Scene 21: Use the installed algorithm and its own compatibility rules (Built-ins vs UNO guide + compatibility constraints + controlled replay).
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

export default function methodRegistry(s, c) {
  const phase = s.value(0);
  // step: 0=pinned built-ins vs UNO guide, 1=UNO rules (CUDA/FA3/TP1/PP1/no grammar),
  // 2=n-gram disables overlap & mixed chunk, 3=EAGLE/standalone V2 overlap requires topk=1, 4=controlled replay
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#fb923c1a', '#60a5fa18');
  const title = heroTitle(['Installed Speculation', 'Registry & Flag Rules'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.spec,
    eyebrow: 'SPECULATIVE REGISTRY · COMPATIBILITY & REPLAY',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st === 0) {
      nodes.push(
        glassCell(-420, -25, 760, 310, ROLE.prefill, { fill: '#10213d', glow: 9 }),
        txt('PINNED REVISION BUILT-INS', -420, -130, 28, ROLE.prefill, 'mono'),
        txt('EAGLE  ·  EAGLE-3  ·  Standalone', -420, -52, 30, COSMOS.ink, 'mono'),
        txt('N-gram  ·  DFlash family  (+ plugins)', -420, 14, 30, ROLE.radix, 'mono'),
        txt('Registered in spec_registry.py', -420, 82, 26, COSMOS.muted, 'mono'),

        glassCell(420, -25, 760, 310, ROLE.fail, { fill: '#281326', glow: 9 }),
        txt('LATER LIVE GUIDE (NOT IN PIN)', 420, -130, 28, ROLE.fail, 'mono'),
        txt('UNO (LoRA draft + base verify)', 420, -52, 30, COSMOS.ink, 'mono'),
        txt('Same transformer weights verify draft', 420, 14, 28, COSMOS.gold, 'sans'),
        txt('Check installed worker version first', 420, 82, 26, COSMOS.muted, 'mono'),
      );
    } else if (st <= 3) {
      const rules = [
        {
          name: 'UNO (guide)',
          req: 'CUDA + FA3 · TP = 1, PP = 1 · NO grammar decoding',
          col: ROLE.fail,
          hi: st === 1,
        },
        {
          name: 'N-gram',
          req: 'Disables overlap scheduling & mixed chunked prefill',
          col: COSMOS.gold,
          hi: st === 2,
        },
        {
          name: 'EAGLE / V2 overlap',
          req: 'Requires branching top-k = 1 (larger explicit -> error)',
          col: ROLE.radix,
          hi: st === 3,
        },
      ];
      rules.forEach((r, i) => {
        const y = -145 + i * 155;
        nodes.push(
          glassCell(0, y, 1520, 122, r.hi ? r.col : COSMOS.dim, {
            fill: r.hi ? '#171d36' : '#0b101d',
            glow: r.hi ? 11 : 2,
          }),
          txt(r.name, -710, y, 30, r.hi ? r.col : COSMOS.muted, 'mono', 'left'),
          txt(r.req, -300, y, 28, r.hi ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
        );
      });
    } else {
      // Controlled replay table
      nodes.push(txt('CONTROLLED REPLAY: SPECULATION OFF VS ON', 0, -205, 28, ROLE.decode, 'mono'));
      const rows = [
        ['Fixed dimension', 'Baseline (OFF)', 'Candidate (ON)'],
        ['Model / backend / precision', 'same', 'same'],
        ['Concurrency / warmup / requests', 'same', 'same'],
        ['JSON schema & accuracy scoring', 'enforced', 'enforced'],
        ['Recorded draft method', 'none', 'exact worker registry ID'],
      ];
      rows.forEach((row, i) => {
        const y = -125 + i * 86;
        const isHdr = i === 0;
        nodes.push(
          glassCell(0, y, 1520, 72, isHdr ? ROLE.prefill : ROLE.radix, {
            fill: isHdr ? '#10213d' : '#0d1628',
            glow: isHdr ? 8 : 3,
          }),
          txt(row[0], -710, y, 26, isHdr ? ROLE.prefill : COSMOS.ink, 'mono', 'left'),
          txt(row[1], 110, y, 26, isHdr ? ROLE.prefill : COSMOS.muted, 'mono'),
          txt(row[2], 510, y, 26, isHdr ? ROLE.decode : ROLE.decode, 'mono'),
        );
      });
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 292, { radius: 6, color: ROLE.spec }),
      txt(
        st >= 4
          ? 'Guide tables (Llama 3.1 8B on H100) do not replace replaying your own ticket workload.'
          : st >= 1
            ? 'Automatic tuning can select incompatible widths; verify method flags explicitly.'
            : 'Inspect the worker registry before enabling any speculative method in production.',
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
    ['sg-method-registry-beat-0', 0],
    ['sg-method-registry-beat-1', 1],
    ['sg-method-ngram', 2],
    ['sg-method-eagle', 3],
    ['sg-method-registry-beat-2', 4],
  ]);
}
