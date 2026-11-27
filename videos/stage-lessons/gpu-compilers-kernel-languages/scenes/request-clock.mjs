// Scene 14: What did the first request pay for? NVRTC/nvJitLink producers + 78 ms PTX JIT cold clock vs 18 ms native clock.
import {
  COLD_NATIVE,
  COLD_PTX,
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function requestClock(s, c) {
  const showNvrtc = s.value(0);
  const showLink = s.value(0);
  const ptxPhase = s.value(0); // 1=init(10), 2=load(5), 3=jit(60), 4=pub(2), 5=launch(1), 6=total(78)
  const showNative = s.value(0);
  const showWarm = s.value(0);

  const bgAura = aura(0, 20, 640, '#ffd1661c', '#6ee7b718');
  const title = heroTitle(['What Did the First', 'Request Pay For?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'COLD-START CLOCK · 78 ms vs 18 ms',
  });

  // Map ms in [0, 80] -> x in [-540, 580] (14 px / ms)
  const mx = (ms) => -540 + ms * 14;

  const live = guardedDynamic(1, () => {
    const nv = showNvrtc.value;
    const lk = showLink.value;
    const pp = ptxPhase.value;
    const sn = showNative.value;
    const sw = showWarm.value;

    const nodes = [
      // Top producers bar
      glassCell(-370, -182, 660, 74, nv > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0e1d34',
        glow: nv > 0.5 ? 7 : 2,
      }),
      txt('NVRTC → PTX / cubin / LTO IR / Tile IR', -370, -182, 26, ROLE.ir, 'mono'),
      glassCell(380, -182, 660, 74, lk > 0.5 ? ROLE.triton : COSMOS.dim, {
        fill: '#191432',
        glow: lk > 0.5 ? 7 : 2,
      }),
      txt('nvJitLink → links device IR into cubin', 380, -182, 26, ROLE.triton, 'mono'),

      // Track 1: PTX Fallback Cold Clock (78 ms)
      txt('PTX JIT PATH', -720, -45, 28, ROLE.ptx, 'mono'),
    ];

    const colors = [ROLE.host, ROLE.ir, ROLE.warn, ROLE.triton, ROLE.cubin];
    COLD_PTX.forEach((seg, idx) => {
      if (pp < idx + 0.5) return;
      const x0 = mx(seg.start);
      const x1 = mx(seg.end);
      const w = Math.max(22, x1 - x0 - 4);
      const cx = (x0 + x1) * 0.5;
      const col = colors[idx];
      nodes.push(
        rect(w, 72, { fill: '#161f34', stroke: col, width: 2.6, radius: 8 })
          .at(cx, -45)
          .glow(7, col),
      );
      if (w >= 260) {
        nodes.push(txt(`${seg.id} (${seg.duration}ms)`, cx, -45, 26, col, 'mono'));
      }
    });

    if (pp >= 5.5) {
      nodes.push(
        txt('78 ms', 690, -45, 42, ROLE.warn, 'mono').glow(8, ROLE.warn),
        txt('init 10 + load 5 + JIT 60 + pub 2 + launch 1', 10, 24, 26, COSMOS.muted, 'mono'),
      );
    }

    // Track 2: Compatible Native Image Clock (18 ms)
    nodes.push(txt('NATIVE PATH', -720, 128, 28, ROLE.cubin, 'mono'));
    if (sn > 0.02) {
      const natCols = [ROLE.host, ROLE.ir, ROLE.triton, ROLE.cubin];
      COLD_NATIVE.forEach((seg, idx) => {
        const x0 = mx(seg.start);
        const x1 = mx(seg.end);
        const w = Math.max(22, x1 - x0 - 4);
        const cx = (x0 + x1) * 0.5;
        nodes.push(
          rect(w, 72, { fill: '#0e2824', stroke: natCols[idx], width: 2.6, radius: 8 })
            .at(cx, 128)
            .glow(8, natCols[idx])
            .opacity(sn),
        );
      });
      nodes.push(
        txt('18 ms (skips 60 ms PTX JIT!)', 110, 128, 32, ROLE.cubin, 'mono', 'left')
          .glow(7, ROLE.cubin)
          .opacity(sn),
      );
    } else {
      nodes.push(txt('waiting for native replay...', -540, 128, 26, COSMOS.dim, 'mono', 'left'));
    }

    // Warm benchmark separation footer
    if (sw > 0.02) {
      nodes.push(
        glassCell(0, 290, 1540, 112, ROLE.ir, { fill: '#0e1b30', glow: 8, opacity: sw }),
        txt('SEPARATE COLD & WARM CLOCKS', 0, 264, 26, ROLE.ir, 'mono').opacity(sw),
        txt(
          'Fresh process cold trace (cache + loader mode)  |  Warmed synced GPU interval',
          0,
          314,
          26,
          COSMOS.ink,
          'mono',
        ).opacity(sw),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('compiler-producers', () =>
    s.play(showNvrtc.to(1, { duration: remainDuration(c, 'compiler-producers', 0.4) })),
  );
  c.on('link-cubin', () =>
    s.play(showLink.to(1, { duration: remainDuration(c, 'link-cubin', 0.4) })),
  );
  c.on('cold-init', () => s.play(ptxPhase.to(1, { duration: 0.35 })));
  c.on('cold-load', () => s.play(ptxPhase.to(2, { duration: 0.35 })));
  c.on('cold-jit', () => s.play(ptxPhase.to(3, { duration: 0.45 })));
  c.on('cold-publish', () => s.play(ptxPhase.to(4, { duration: 0.35 })));
  c.on('cold-launch', () => s.play(ptxPhase.to(5, { duration: 0.35 })));
  c.after('cold-total', () => s.play(ptxPhase.to(6, { duration: 0.4 })));
  c.after('native-omit', () =>
    s.play(showNative.to(1, { duration: remainDuration(c, 'native-omit', 0.5) })),
  );
  c.on('separate-warm', () =>
    s.play(showWarm.to(1, { duration: remainDuration(c, 'separate-warm', 0.45) })),
  );
}
