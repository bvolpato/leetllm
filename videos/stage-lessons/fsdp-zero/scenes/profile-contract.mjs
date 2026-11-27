// Scene 22: Diagnose the first failing lifetime boundary: OOM @ init 95GB vs bwd 88GB; mismatched gather rank hang; 9ms clock vs 12ms double-count.
import {
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

export default function profileContract(s, c) {
  const showAttempt2 = s.value(0);
  const showHang = s.value(0);
  const showClock = s.value(0);
  const showNine = s.value(0);
  const showTwelve = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b1c', '#5ce1e618');
  const title = heroTitle(['Diagnose the First', 'Failing Boundary'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'OOM LIFETIME · COLLECTIVE HANG · OVERLAPPED CLOCK',
  });

  const live = guardedDynamic(1, () => {
    const a2 = showAttempt2.value;
    const hg = showHang.value;
    const cl = showClock.value;
    const n9 = showNine.value;
    const n12 = showTwelve.value;

    const nodes = [
      // Top-left: Two OOM boundaries
      glassCell(-440, -130, 740, 178, ROLE.bad, { fill: '#26111c', glow: 8 }),
      txt('1. WHERE DID OOM HIT ON 80 GB CARD?', -440, -182, 26, ROLE.bad, 'mono'),
      txt(
        'Attempt A: 95 GB at INIT → materialize on meta device',
        -440,
        -126,
        26,
        COSMOS.ink,
        'sans',
      ),
      txt(
        a2 > 0.5
          ? 'Attempt B: 88 GB at BWD → inspect W + Act + full G'
          : 'Attempt B: init & fwd fit...',
        -440,
        -74,
        26,
        a2 > 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),

      // Top-right: Collective Hang (Block 1 vs Block 2 mismatch)
      glassCell(440, -130, 740, 178, hg > 0.5 ? ROLE.warn : COSMOS.dim, {
        fill: '#231911',
        glow: hg > 0.5 ? 9 : 2,
      }),
      txt('2. COLLECTIVE HANG DIAGNOSIS', 440, -182, 26, ROLE.warn, 'mono'),
      txt(
        hg > 0.5 ? 'Rank 0: Block 1 ≠ Rank 1: Block 2!' : 'Both ranks gather Block 0 cleanly',
        440,
        -126,
        26,
        hg > 0.5 ? ROLE.bad : COSMOS.ink,
        'mono',
      ),
      txt(
        'Enable dump-on-timeout + trace buffer · read 1st error',
        440,
        -74,
        26,
        COSMOS.muted,
        'sans',
      ),

      // Bottom: Overlapped Step Clock (1 ms data + 6 ms compute [3 ms comm inside] + 2 ms ckpt = 9 ms, NOT 12 ms!)
      txt('3. OVERLAPPED STEP CLOCK (DON’T DOUBLE-COUNT COMM!)', 0, 26, 26, ROLE.comm, 'mono'),
    ];

    // ms [0..9] -> x in [-660, 240] (100 px/ms)
    const cx = (ms) => -660 + ms * 100;
    if (cl > 0.02) {
      nodes.push(
        rect(96, 66, { fill: '#12294a', stroke: ROLE.weights, width: 2.5, radius: 8 })
          .at((cx(0) + cx(1)) * 0.5, 115)
          .opacity(cl),
        txt('1', (cx(0) + cx(1)) * 0.5, 115, 26, ROLE.weights, 'mono').opacity(cl),

        rect(594, 66, { fill: '#0d2b24', stroke: ROLE.good, width: 2.5, radius: 8 })
          .at((cx(1) + cx(7)) * 0.5, 115)
          .opacity(cl),
        txt('Compute: 6 ms', (cx(1) + cx(7)) * 0.5, 115, 28, ROLE.good, 'mono').opacity(cl),

        rect(194, 66, { fill: '#261e10', stroke: COSMOS.gold, width: 2.5, radius: 8 })
          .at((cx(7) + cx(9)) * 0.5, 115)
          .opacity(cl),
        txt('Ckpt: 2', (cx(7) + cx(9)) * 0.5, 115, 26, COSMOS.gold, 'mono').opacity(cl),

        // Overlapped collective bar underneath compute [2..5] = 3 ms
        rect(294, 54, { fill: '#0e2838', stroke: ROLE.comm, width: 2.6, radius: 8 })
          .at((cx(2) + cx(5)) * 0.5, 204)
          .glow(8, ROLE.comm)
          .opacity(cl),
        txt('Comm: 3 ms', (cx(2) + cx(5)) * 0.5, 204, 26, ROLE.comm, 'mono').opacity(cl),
      );
    }

    // Right clock verdict
    nodes.push(
      glassCell(560, 155, 550, 148, n9 > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: '#0e1d2c',
        glow: n9 > 0.5 ? 9 : 2,
      }),
      txt(n9 > 0.5 ? 'ELAPSED CLOCK: 9 ms' : 'WAIT FOR TRACE...', 560, 122, 32, ROLE.good, 'mono'),
      txt(
        n12 > 0.5 ? 'Sum = 12 ms (double-counts 3ms)' : '1 data + 6 compute + 2 ckpt',
        560,
        182,
        26,
        n12 > 0.5 ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('second-attempt', () => s.play(showAttempt2.to(1, { duration: 0.4 })));
  c.on('mismatched-blocks', () => s.play(showHang.to(1, { duration: 0.45 })));
  c.on('trace-clock', () => s.play(showClock.to(1, { duration: 0.45 })));
  c.on('elapsed-step', () => s.play(showNine.to(1, { duration: 0.4 })));
  c.on('double-count', () => s.play(showTwelve.to(1, { duration: 0.4 })));
}
