// Scene 19: kernel-path: Fused W4A16 (0.5 MB read) vs standalone dequant (0.5 + 2.0 write + 2.0 read) -> predict extra? -> AFTER kernel-path-build-2 reveal +4.0 MB (4.5 MB total, 1.38x slowdown!).
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function kernelPath(s, c) {
  const showUnfused = s.value(0);
  const revealExtra = s.value(0); // strictly withheld until AFTER kernel-path-build-2!
  const showAscend = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Fused vs Unfused W4A16 Kernels:', 'Memory Traffic Decides Speed'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.err,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const unf = showUnfused.value;
    const rev = revealExtra.value;
    const asc = showAscend.value;

    const barX = -460;
    const maxW = 860;
    const px = maxW / 5.0;

    const nodes = [
      txt(
        '1,000,000 FOUR-BIT WEIGHTS = 0.5 MB CODES  (16-BIT RECONSTRUCTED = 2.0 MB)',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // Path 1: Fused W4A16
      txt('Fused W4A16', -855, -95, 28, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, -95, 0.5 * px, 46, ROLE.ok, { opacity: alpha, maxTrackW: maxW }),
      txt(
        '0.5 MB read (unpack in regs!)',
        barX + maxW + 24,
        -95,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),

      // Path 2: Unfused dequant -> HBM -> GEMM
      txt('Standalone Dequant', -855, 55, 28, ROLE.err, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * unf),
      ),
      lumBar(barX, 55, rev > 0.35 ? 4.5 * px : 0.5 * px, 46, rev > 0.35 ? ROLE.err : ROLE.gold, {
        opacity: alpha * (0.48 + 0.52 * unf),
        maxTrackW: maxW,
      }),
      txt(
        rev > 0.35 ? '4.5 MB (+4.0 MB extra!)' : '0.5 + 2.0 write + 2.0 read = ?',
        barX + maxW + 24,
        55,
        26,
        rev > 0.35 ? ROLE.err : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill(
        asc > 0.35
          ? 'Unfused HBM round-trip moves 9x more bytes (4.5 vs 0.5 MB) and can run slower than FP16!'
          : rev > 0.35
            ? '+4.0 MB extra traffic (2.0 MB write + 2.0 MB read back) for the exact same multiply!'
            : 'Writing 2 MB of FP16 weights to HBM and reading them back adds how much extra traffic?',
        0,
        235,
        {
          w: 1620,
          h: 78,
          color: rev > 0.35 ? ROLE.err : ROLE.gold,
          fill: rev > 0.35 ? '#321420' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'kernel-path-build-0', (d) => s.play(showUnfused.to(0, { duration: d })));
  playCue(s, c, 'kernel-path-build-1', (d) => s.play(showUnfused.to(0.6, { duration: d })));
  playCue(s, c, 'weight-readback', (d) => s.play(showUnfused.to(1, { duration: d })));
  // Strict prediction withholding: reveal +4.0 MB extra only after kernel-path-build-2!
  playCue(s, c, 'kernel-path-build-2', (d) => s.play(revealExtra.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'ascend-result', (d) => s.play(showAscend.to(1, { duration: d })));
}
