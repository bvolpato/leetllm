// Scene 03: Which CUDA version did you check? Three stack layers, two Python envs, and physical-to-logical GPU remapping.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function stackContract(s, c) {
  const showPart1 = s.value(1);
  const driverLit = s.value(0);
  const compilerLit = s.value(0);
  const buildLit = s.value(0);

  const showPart2 = s.value(0);
  const envNone = s.value(0);
  const envUnavail = s.value(0);

  const showPart3 = s.value(0);
  const remapProg = s.value(0);

  const bgAura = aura(120, 0, 560, '#60a5fa22', '#5ce1e614');

  const title = heroTitle(['Three CUDA Layers,', 'One Machine'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.blue,
    eyebrow: 'CUDA STACK · DRIVER · COMPILER · BUILD',
  });

  // Part 1: Driver / UMD vs nvcc vs PyTorch build
  const part1 = guardedDynamic(showPart1, (a) => {
    const layers = [
      {
        title: 'DRIVER / UMD CAPABILITY',
        cmd: 'nvidia-smi',
        desc: 'Newest CUDA version the driver supports',
        color: COSMOS.gold,
        lit: driverLit.value,
      },
      {
        title: 'LOCAL TOOLKIT COMPILER',
        cmd: 'nvcc --version',
        desc: 'Compiler for extensions or source builds',
        color: COSMOS.cyan,
        lit: compilerLit.value,
      },
      {
        title: 'PREBUILT PYTORCH PACKAGE',
        cmd: 'torch.version.cuda',
        desc: 'CUDA runtime bundled with this wheel',
        color: COSMOS.emerald,
        lit: buildLit.value,
      },
    ];

    const nodes = [];
    layers.forEach((layer, i) => {
      const cy = -130 + i * 205;
      const active = layer.lit > 0.5;
      const stroke = active ? layer.color : COSMOS.rule;
      nodes.push(
        glassCell(0, cy, 1680, 152, stroke, {
          fill: active ? '#111b30' : '#0b101d',
          glow: active ? 9 : 0,
          opacity: a,
        }),
        txt(
          layer.title,
          -790,
          cy - 34,
          26,
          active ? layer.color : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt(layer.cmd, -790, cy + 26, 36, active ? COSMOS.ink : COSMOS.dim, 'mono', 'left').opacity(
          a,
        ),
        txt(
          active ? layer.desc : 'awaiting check...',
          80,
          cy + 8,
          30,
          active ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ).opacity(a),
      );
    });
    return group(...nodes);
  });

  // Part 2: Two Python environments failing is_available() for opposite reasons
  const part2 = guardedDynamic(showPart2, (a) => {
    const n1 = envNone.value;
    const n2 = envUnavail.value;
    const nodes = [
      txt(
        'TWO PYTHON ENVIRONMENTS ON ONE HOST',
        -855,
        -210,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      // Env A: CPU-only PyTorch
      glassCell(-440, 45, 790, 390, n1 > 0.5 ? COSMOS.rose : COSMOS.rule, {
        fill: '#141224',
        glow: n1 > 0.5 ? 9 : 0,
        opacity: a,
      }),
      txt('ENVIRONMENT A · CPU-ONLY WHEEL', -790, -95, 26, COSMOS.rose, 'mono', 'left').opacity(a),
      txt('torch.version.cuda  ->  None', -790, -15, 32, COSMOS.rose, 'mono', 'left').opacity(
        n1 * a,
      ),
      txt('torch.cuda.is_available() -> False', -790, 60, 28, COSMOS.muted, 'mono', 'left').opacity(
        a,
      ),
      txt(
        'Built without CUDA: install a CUDA wheel',
        -790,
        155,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(n1 * a),

      // Env B: CUDA build present, still unavailable
      glassCell(440, 45, 790, 390, n2 > 0.5 ? COSMOS.gold : COSMOS.rule, {
        fill: '#111828',
        glow: n2 > 0.5 ? 9 : 0,
        opacity: a,
      }),
      txt('ENVIRONMENT B · CUDA BUILD PRESENT', 90, -95, 26, COSMOS.gold, 'mono', 'left').opacity(
        a,
      ),
      txt(
        `torch.version.cuda  ->  ${n2 > 0.5 ? '12.x' : '?'}`,
        90,
        -15,
        32,
        n2 > 0.5 ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      txt('torch.cuda.is_available() -> False', 90, 60, 28, COSMOS.muted, 'mono', 'left').opacity(
        a,
      ),
      txt(
        n2 > 0.5
          ? 'Check driver · container · device visibility'
          : 'Same False result, different root cause',
        90,
        155,
        28,
        n2 > 0.5 ? COSMOS.gold : COSMOS.dim,
        'sans',
        'left',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Part 3: Physical GPU 3 -> logical cuda:0 inside the process
  const part3 = guardedDynamic(showPart3, (a) => {
    const rp = remapProg.value;
    const nodes = [
      txt('HOST PHYSICAL GPUS (0..3)', -855, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
    ];
    for (let i = 0; i < 4; i++) {
      const cx = -615 + i * 410;
      const isSelected = i === 3;
      nodes.push(
        glassCell(cx, -90, 340, 128, isSelected ? COSMOS.gold : COSMOS.rule, {
          fill: isSelected ? '#211c12' : '#0d1322',
          glow: isSelected ? 10 : 0,
          opacity: a,
        }),
        txt(
          `Physical GPU ${i}`,
          cx,
          -114,
          30,
          isSelected ? COSMOS.gold : COSMOS.dim,
          'mono',
        ).opacity(a),
        txt(
          isSelected ? 'exposed to process' : 'hidden from process',
          cx,
          -62,
          26,
          isSelected ? COSMOS.ink : COSMOS.dim,
          'sans',
        ).opacity(a),
      );
    }

    // Conduit from Physical GPU 3 down to Process box
    nodes.push(
      glowingArc([615, -22], [0, 130], -10, {
        color: COSMOS.gold,
        width: 4,
        opacity: Math.max(0.25, rp) * a,
      }),
    );
    if (rp > 0.05 && rp < 0.98) {
      nodes.push(
        glowDot(615 - 615 * rp, -22 + 152 * rp, {
          radius: 8,
          color: COSMOS.gold,
          glow: 12,
          opacity: a,
        }),
      );
    }

    nodes.push(
      glassCell(0, 235, 920, 198, rp > 0.7 ? COSMOS.emerald : COSMOS.blue, {
        fill: '#0e1d27',
        glow: rp > 0.7 ? 10 : 6,
        opacity: a,
      }),
      txt('INSIDE THIS PROCESS', 0, 175, 26, COSMOS.blue, 'mono').opacity(a),
      txt('cuda:0', 0, 245, 58, COSMOS.emerald, 'mono')
        .glow(8, COSMOS.emerald)
        .opacity(rp * a),
      txt(
        'Check device name · compute capability · build targets · test output',
        0,
        385,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3);

  c.on('stack-driver', () => s.play(driverLit.to(1, { duration: 0.45 })));
  c.on('stack-compiler', () => s.play(compilerLit.to(1, { duration: 0.45 })));
  c.on('stack-build', () => s.play(buildLit.to(1, { duration: 0.45 })));

  c.on('stack-no-build', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(envNone.to(1, { duration: 0.35 }), 0.25),
      ),
    );
  });
  c.on('stack-unavailable', () => s.play(envUnavail.to(1, { duration: 0.45 })));

  c.on('stack-logical', () => {
    s.play(
      par(
        showPart2.to(0, { duration: 0.2 }),
        delay(showPart3.to(1, { duration: 0.25 }), 0.22),
        delay(remapProg.to(1, { duration: remainDuration(c, 'stack-logical', 0.85) }), 0.25),
      ),
    );
  });
}
