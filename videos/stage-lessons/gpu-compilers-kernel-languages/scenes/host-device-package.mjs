// Scene 03: Keep the host path separate from each device image: nvcc split -> fatbinary -> ptxas -> ELF cubin & PTX headers.
import {
  COSMOS,
  ROLE,
  aura,
  buildLoweringConduit3d,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function hostDevicePackage(s, c) {
  const stageCursor = s.value(0);
  const phase = s.value(0);
  const split = s.value(0);
  const packed = s.value(0);
  const assembled = s.value(0);
  const disasm = s.value(0);
  const header = s.value(0);

  const bgAura = aura(420, 20, 520, '#60a5fa20', '#6ee7b718');
  const { view: conduit3d } = buildLoweringConduit3d(stageCursor, phase, {
    x: 440,
    y: 25,
    unit: 94,
  });

  const title = heroTitle(['Host Path &', 'Device Fatbinary'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.host,
    eyebrow: 'NVCC PACKAGING · ELF CUBIN & PTX',
  });

  const live = guardedDynamic(1, () => {
    const sp = split.value;
    const pk = packed.value;
    const as = assembled.value;
    const di = disasm.value;
    const hd = header.value;

    const nodes = [
      txt('3D COMPILATION PIPELINE', 440, -405, 26, ROLE.ir, 'mono').glow(5, ROLE.ir),
      txt('NVVM IR → PTX → ptxas → ELF cubin (SASS view)', 440, 420, 26, COSMOS.muted, 'sans'),

      // Source box
      glassCell(-735, -135, 240, 86, ROLE.host, { fill: '#101f3b', glow: 8 }),
      txt('vector_add.cu', -735, -135, 26, COSMOS.ink, 'mono'),

      // Host C++ lane
      glassCell(-335, -186, 390, 82, sp > 0.5 ? ROLE.host : COSMOS.dim, {
        fill: '#101e36',
        glow: sp > 0.5 ? 7 : 0,
      }),
      txt('CPU: main() → C++ obj', -335, -186, 26, ROLE.host, 'mono'),

      // Device lane
      glassCell(-335, -80, 390, 82, sp > 0.5 ? ROLE.ptx : COSMOS.dim, {
        fill: '#241e11',
        glow: sp > 0.5 ? 8 : 0,
      }),
      txt('GPU: NVVM → compute_90', -335, -80, 26, ROLE.ptx, 'mono'),
    ];

    if (sp > 0.2) {
      nodes.push(
        glowingArc([-612, -148], [-534, -186], -10, {
          color: ROLE.host,
          width: 3.0,
          opacity: 0.85 * sp,
        }),
        glowingArc([-612, -122], [-534, -80], 10, {
          color: ROLE.ptx,
          width: 3.0,
          opacity: 0.85 * sp,
        }),
      );
    }

    // Fatbinary bundle
    if (pk > 0.02) {
      nodes.push(
        glassCell(-510, 76, 680, 108, ROLE.cubin, {
          fill: '#0d2424',
          glow: 9,
          opacity: pk,
        }),
        txt('FATBINARY IN HOST OBJECT', -510, 48, 26, ROLE.cubin, 'mono').opacity(pk),
        txt('sm_90 cubin (native) + compute_90 PTX', -510, 96, 26, COSMOS.ink, 'mono').opacity(pk),
      );
    }

    // ptxas / SASS / PTX Header readouts
    if (as > 0.02) {
      nodes.push(
        txt(
          di > 0.5
            ? 'ptxas → ELF cubin · SASS = human-readable disassembly'
            : 'ptxas allocates physical registers → ELF cubin',
          -855,
          215,
          26,
          ROLE.cubin,
          'mono',
          'left',
        ).opacity(as),
      );
    }

    if (hd > 0.02) {
      nodes.push(
        glassCell(-510, 325, 680, 114, ROLE.ptx, { fill: '#221c10', glow: 9, opacity: hd }),
        txt('.version 9.2   (driver PTX ISA support)', -510, 298, 26, COSMOS.gold, 'mono').opacity(
          hd,
        ),
        txt('.target sm_90  (a / f narrows compat)', -510, 348, 26, ROLE.ptx, 'mono').opacity(hd),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, conduit3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, conduit3d, { theta: -0.2, phi: 0.92 });

  c.on('split-host-device', () => {
    s.play(split.to(1, { duration: remainDuration(c, 'split-host-device', 0.45) }));
    s.play(stageCursor.to(1, { duration: remainDuration(c, 'split-host-device', 0.45) }));
  });
  c.on('package-images', () => {
    s.play(packed.to(1, { duration: remainDuration(c, 'package-images', 0.45) }));
    s.play(stageCursor.to(2, { duration: remainDuration(c, 'package-images', 0.45) }));
  });
  c.on('assemble-target', () => {
    s.play(assembled.to(1, { duration: remainDuration(c, 'assemble-target', 0.45) }));
    s.play(stageCursor.to(3, { duration: remainDuration(c, 'assemble-target', 0.45) }));
  });
  c.on('disassemble-view', () =>
    s.play(disasm.to(1, { duration: remainDuration(c, 'disassemble-view', 0.45) })),
  );
  c.on('ptx-driver-version', () =>
    s.play(header.to(1, { duration: remainDuration(c, 'ptx-driver-version', 0.45) })),
  );
}
