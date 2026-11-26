// Scene 05: Select a compatible image before launching work: 3 explicit loader decision branches (Native -> PTX JIT -> Missing).
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
  remainDuration,
  resolve,
  runPhase,
  txt,
} from '../parts.mjs';

export default function loader(s, c) {
  const phase = s.value(0);
  // branch: 0=native, 1=ptx, 2=first-compile, 3=missing
  const branch = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['Select a Compatible', 'Image First'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.ptx,
    eyebrow: 'CUDA DRIVER IMAGE SELECTION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const br = Math.round(branch.value);
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const hasNative = br === 0;
    const hasPtx = br === 1 || br === 2;
    const verdict = resolve(hasNative, hasPtx);
    const verdictCol = hasNative ? ROLE.cubin : hasPtx ? ROLE.ptx : ROLE.fail;

    const nodes = [
      // Decision node 1: Compatible Native Cubin?
      glassCell(-540, -105, 440, 118, hasNative ? ROLE.cubin : ROLE.warn, {
        fill: hasNative ? '#0d2924' : '#261b10',
        glow: hasNative ? 11 * pulse : 5,
      }),
      txt('1. COMPATIBLE NATIVE?', -540, -132, 26, COSMOS.muted, 'mono'),
      txt(
        hasNative ? 'YES → sm_120 cubin' : 'NO compatible cubin',
        -540,
        -82,
        28,
        hasNative ? ROLE.cubin : ROLE.warn,
        'mono',
      ),

      // Decision node 2: Usable PTX + Driver ISA?
      glassCell(-540, 120, 440, 118, hasPtx ? ROLE.ptx : br === 3 ? ROLE.fail : COSMOS.dim, {
        fill: hasPtx ? '#262010' : br === 3 ? '#2c101b' : '#0c1220',
        glow: hasPtx ? 11 * pulse : br === 3 ? 9 : 0,
      }),
      txt('2. USABLE PTX + DRIVER?', -540, 92, 26, COSMOS.muted, 'mono'),
      txt(
        hasPtx ? 'YES → Driver JIT compile' : br === 3 ? 'NO usable PTX' : 'skipped (native won)',
        -540,
        144,
        28,
        hasPtx ? ROLE.ptx : br === 3 ? ROLE.fail : COSMOS.dim,
        'mono',
      ),

      // Connector between step 1 and step 2
      glowingArc([-540, -44], [-540, 58], 0, {
        color: hasNative ? COSMOS.dim : ROLE.ptx,
        width: 3.4,
        opacity: hasNative ? 0.35 : 0.9,
      }),

      // Right: Outcome & First-Request Cost panel
      glassCell(320, -105, 580, 138, verdictCol, {
        fill: hasNative ? '#0c2722' : hasPtx ? '#241e10' : '#2e101c',
        glow: 12 * pulse,
      }),
      txt('LOADER VERDICT', 320, -142, 26, COSMOS.muted, 'mono'),
      txt(verdict, 320, -86, 44, verdictCol, 'mono').glow(7, verdictCol),

      glassCell(320, 120, 580, 138, br === 2 ? ROLE.cubin : br === 3 ? ROLE.fail : ROLE.ir, {
        fill: '#0e192d',
        glow: 6,
      }),
      txt(
        br === 2 ? 'FIRST REQUEST COST' : br === 3 ? 'FAILURE BOUNDARY' : 'SEPARATE PROCESS TESTS',
        320,
        82,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(
        br === 2
          ? 'Driver JIT adds cold latency'
          : br === 3
            ? 'Stops before kernel launch'
            : hasNative
              ? 'Skips PTX compilation'
              : 'Checks arch + PTX ISA',
        320,
        138,
        30,
        br === 3 ? ROLE.fail : COSMOS.ink,
        'sans',
      ),

      glowingArc([-316, hasNative ? -105 : 120], [26, -105], -30, {
        color: verdictCol,
        width: 4.0,
        opacity: 0.9,
      }),
    ];

    const u = (p * 0.7) % 1;
    nodes.push(
      glowDot(
        -316 + u * 342,
        (hasNative ? -105 : 120) * (1 - u) - 105 * u - Math.sin(u * Math.PI) * 15,
        {
          radius: 7,
          color: verdictCol,
        },
      ),
      txt(
        br === 3
          ? 'No kernel counters exist yet · inspect fatbinary & separate compile/load/launch'
          : 'Test native-only and forced-PTX in fresh processes',
        0,
        355,
        28,
        br === 3 ? ROLE.fail : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('loader-native-path', () =>
    s.play(branch.to(0, { duration: remainDuration(c, 'loader-native-path', 0.35) })),
  );
  c.on('loader-ptx-path', () =>
    s.play(branch.to(1, { duration: remainDuration(c, 'loader-ptx-path', 0.4) })),
  );
  c.on('loader-first-request-work', () =>
    s.play(branch.to(2, { duration: remainDuration(c, 'loader-first-request-work', 0.4) })),
  );
  c.on('loader-missing-images', () =>
    s.play(branch.to(3, { duration: remainDuration(c, 'loader-missing-images', 0.45) })),
  );
}
