// Scene 06: Which path did the loader exercise? Fresh-process matrix on CC 12.0: Build A, Build B, B-no-PTX + cuobjdump/nvdisasm.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function actualLoaderCases(s, c) {
  const revA = s.value(0);
  const revAF = s.value(0);
  const revBF = s.value(0);
  const revBD = s.value(0);
  const revBM = s.value(0);
  const showTools = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61c', '#ff6b8b16');
  const title = heroTitle(['Which Path Did the', 'Loader Exercise?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ir,
    eyebrow: 'CAPTURED FRESH-PROCESS MATRIX · CC 12.0',
  });

  const live = guardedDynamic(1, () => {
    const rows = [
      {
        pkg: 'Build A (sm_120 + PTX)',
        mode: 'Normal & Native-only',
        res: revA.value > 0.5 ? 'PASS (5 shapes)' : 'testing...',
        col: revA.value > 0.5 ? ROLE.cubin : COSMOS.dim,
      },
      {
        pkg: 'Build A (sm_120 + PTX)',
        mode: 'Force PTX (no cache)',
        res: revAF.value > 0.5 ? 'PASS (driver JIT ok)' : 'pending',
        col: revAF.value > 0.5 ? ROLE.cubin : COSMOS.dim,
      },
      {
        pkg: 'Build B (sm_90 + PTX)',
        mode: 'Force PTX',
        res: revBF.value > 0.5 ? 'PASS (JIT fallback)' : 'pending',
        col: revBF.value > 0.5 ? ROLE.ptx : COSMOS.dim,
      },
      {
        pkg: 'Build B (sm_90 + PTX)',
        mode: 'Disable PTX JIT',
        res: revBD.value > 0.5 ? 'ERR: PTX JIT disabled' : 'pending',
        col: revBD.value > 0.5 ? ROLE.fail : COSMOS.dim,
      },
      {
        pkg: 'Build B (PTX removed)',
        mode: 'Normal mode',
        res: revBM.value > 0.5 ? 'ERR: no kernel image' : 'pending',
        col: revBM.value > 0.5 ? ROLE.fail : COSMOS.dim,
      },
    ];

    const nodes = [
      txt('PACKAGE', -620, -210, 26, COSMOS.muted, 'mono'),
      txt('FRESH-PROCESS MODE', -80, -210, 26, COSMOS.muted, 'mono'),
      txt('OBSERVED OUTCOME', 490, -210, 26, COSMOS.muted, 'mono'),
    ];

    rows.forEach((r, idx) => {
      const y = -135 + idx * 96;
      const lit = r.col !== COSMOS.dim;
      nodes.push(
        glassCell(-620, y, 470, 74, lit ? ROLE.ir : COSMOS.dim, {
          fill: '#0e192e',
          glow: lit ? 5 : 0,
        }),
        txt(r.pkg, -620, y, 26, COSMOS.ink, 'mono'),

        glassCell(-80, y, 450, 74, lit ? COSMOS.gold : COSMOS.dim, {
          fill: '#181a28',
          glow: lit ? 4 : 0,
        }),
        txt(r.mode, -80, y, 26, COSMOS.muted, 'mono'),

        glassCell(490, y, 540, 74, r.col, {
          fill: r.col === ROLE.fail ? '#2b101b' : r.col === ROLE.cubin ? '#0d2823' : '#121828',
          glow: lit ? 9 : 0,
        }),
        txt(r.res, 490, y, 26, r.col, 'mono'),
      );
    });

    if (showTools.value > 0.02) {
      nodes.push(
        txt(
          'cuobjdump extracts cubin from host binary → nvdisasm inspects extracted cubin',
          0,
          388,
          28,
          ROLE.ir,
          'mono',
        )
          .glow(6, ROLE.ir)
          .opacity(showTools.value),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.after('target-branches', () =>
    s.play(revA.to(1, { duration: remainDuration(c, 'target-branches', 0.4) })),
  );
  c.after('forced-target-ptx', () =>
    s.play(revAF.to(1, { duration: remainDuration(c, 'forced-target-ptx', 0.4) })),
  );
  c.after('hopper-ptx', () =>
    s.play(revBF.to(1, { duration: remainDuration(c, 'hopper-ptx', 0.4) })),
  );
  c.after('disabled-jit-error', () =>
    s.play(revBD.to(1, { duration: remainDuration(c, 'disabled-jit-error', 0.4) })),
  );
  c.after('missing-image-error', () =>
    s.play(revBM.to(1, { duration: remainDuration(c, 'missing-image-error', 0.4) })),
  );
  c.on('extract-cubin', () =>
    s.play(showTools.to(1, { duration: remainDuration(c, 'extract-cubin', 0.45) })),
  );
}
