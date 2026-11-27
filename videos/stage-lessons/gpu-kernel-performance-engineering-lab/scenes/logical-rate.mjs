// Scene 07: Normalize time by the unchanged work
// Two logical 4096x4096x4 B planes -> 134,217,728 B (128 MiB) / 0.000250 s = 536.9 GB/s effective rate
// Separate from physical DRAM counter!
import {
  COSMOS,
  LOGICAL_BYTES,
  LOGICAL_MIB,
  ROLE,
  WORKSHEET_GBS,
  WORKSHEET_MS,
  WORKSHEET_SEC,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function logicalRate(s, c) {
  const showRW = s.value(0);
  const showBytes = s.value(0);
  const showMiB = s.value(0);
  const showTime = s.value(0);
  const showSec = s.value(0);
  const showRate = s.value(0);
  const showWorksheet = s.value(0);
  const showCounter = s.value(0);
  const showCopy = s.value(0);

  const bgAura = aura(0, 0, 650, '#5ce1e61c', '#6ee7b716');
  const title = heroTitle(['Normalize Time by', 'Unchanged Work'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'EFFECTIVE GB/s · WORKLOAD METRIC',
  });

  const eq = glowTex(
    String.raw`\text{effective GB/s} = \frac{2 N^2 \cdot 4}{\text{time (s)} \cdot 10^9}`,
    { x: 355, y: -355, size: 38, color: ROLE.gold, glow: 6 },
  );

  const live = guardedDynamic(1, () => {
    const rw = showRW.value;
    const bt = showBytes.value;
    const mb = showMiB.value;
    const tm = showTime.value;
    const sc = showSec.value;
    const rt = showRate.value;
    const ws = showWorksheet.value;
    const ct = showCounter.value;
    const cp = showCopy.value;

    const nodes = [
      // Left: Read plane (64 MiB)
      glassCell(-470, -100, 620, 210, rw > 0.3 ? ROLE.input : COSMOS.rule, {
        fill: '#0f1c36',
        glow: rw > 0.3 ? 8 : 2,
      }),
      txt('ONE LOGICAL READ', -470, -158, 28, ROLE.input, 'mono'),
      txt('4096 × 4096 × 4 B', -470, -96, 36, COSMOS.ink, 'mono'),
      txt('67,108,864 B · 64 MiB', -470, -34, 26, COSMOS.muted, 'mono'),

      // Plus symbol & glowing connector well above the plus sign
      txt('+', 0, -90, 48, ROLE.gold, 'mono').glow(6, ROLE.gold),
      glowingArc([-155, -165], [155, -165], -48, {
        color: ROLE.gold,
        width: 3.2,
        opacity: 0.7 * (0.3 + 0.7 * bt),
      }),

      // Right: Write plane (64 MiB)
      glassCell(470, -100, 620, 210, rw > 0.3 ? ROLE.output : COSMOS.rule, {
        fill: '#0d2336',
        glow: rw > 0.3 ? 8 : 2,
      }),
      txt('ONE LOGICAL WRITE', 470, -158, 28, ROLE.output, 'mono'),
      txt('4096 × 4096 × 4 B', 470, -96, 36, COSMOS.ink, 'mono'),
      txt('67,108,864 B · 64 MiB', 470, -34, 26, COSMOS.muted, 'mono'),
    ];

    // Step 1: Total bytes & MiB
    nodes.push(
      glassCell(-470, 128, 620, 130, bt > 0.3 ? ROLE.gold : COSMOS.rule, {
        fill: '#1e1a12',
        glow: bt > 0.3 ? 8 : 2,
      }),
      txt('TOTAL LOGICAL VOLUME', -470, 96, 26, ROLE.gold, 'mono'),
      txt(
        bt > 0.3
          ? `${LOGICAL_BYTES.toLocaleString('en-US')} B${mb > 0.3 ? ` (${LOGICAL_MIB} MiB)` : ''}`
          : '8 B / float × N²',
        -470,
        152,
        28,
        COSMOS.ink,
        'mono',
      ),
    );

    // Step 2: Worksheet time -> seconds
    nodes.push(
      glassCell(470, 128, 620, 130, tm > 0.3 ? ROLE.output : COSMOS.rule, {
        fill: '#0d2233',
        glow: tm > 0.3 ? 8 : 2,
      }),
      txt(
        ws > 0.3 ? 'WORKSHEET INPUT (NOT MEASURED)' : 'ELAPSED TIME PER LAUNCH',
        470,
        96,
        26,
        ws > 0.3 ? ROLE.warn : ROLE.output,
        'mono',
      ),
      txt(
        tm > 0.3
          ? `${WORKSHEET_MS.toFixed(3)} ms${sc > 0.3 ? ` = ${WORKSHEET_SEC.toFixed(6)} s` : ''}`
          : 'Convert ms → s before dividing',
        470,
        152,
        28,
        COSMOS.ink,
        'mono',
      ),
    );

    // Step 3: Effective rate vs Physical DRAM counter
    if (rt > 0.02) {
      nodes.push(
        txt(
          `Effective rate = ${WORKSHEET_GBS.toFixed(1)} GB/s (decimal 10⁹ B/s)`,
          0,
          268,
          38,
          ROLE.good,
          'mono',
        )
          .glow(8, ROLE.good)
          .opacity(rt),
      );
    } else {
      nodes.push(txt('Divide logical bytes by elapsed seconds', 0, 268, 32, COSMOS.muted, 'sans'));
    }

    // Bottom separation reminder
    let footerMsg = 'Logical work stays fixed across cache hits and extra store sectors';
    let footerCol = COSMOS.muted;
    if (cp > 0.3) {
      footerMsg = 'Copy moves the same 128 MiB logical volume, but computes a different output';
      footerCol = ROLE.input;
    } else if (ct > 0.3) {
      footerMsg = 'Physical DRAM traffic & % peak bandwidth require hardware counters (empty here)';
      footerCol = ROLE.warn;
    }
    nodes.push(txt(footerMsg, 0, 365, 28, footerCol, 'sans'));

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('gpu-logical-rate-readwrite', () =>
    s.play(showRW.to(1, { duration: remainDuration(c, 'gpu-logical-rate-readwrite', 0.45) })),
  );
  c.on('gpu-logical-rate-bytes', () =>
    s.play(showBytes.to(1, { duration: remainDuration(c, 'gpu-logical-rate-bytes', 0.45) })),
  );
  c.on('gpu-logical-rate-mebibytes', () =>
    s.play(showMiB.to(1, { duration: remainDuration(c, 'gpu-logical-rate-mebibytes', 0.4) })),
  );
  c.on('gpu-logical-rate-time', () =>
    s.play(showTime.to(1, { duration: remainDuration(c, 'gpu-logical-rate-time', 0.45) })),
  );
  c.on('gpu-logical-rate-seconds', () =>
    s.play(showSec.to(1, { duration: remainDuration(c, 'gpu-logical-rate-seconds', 0.4) })),
  );
  c.after('gpu-logical-rate-rate', () =>
    s.play(showRate.to(1, { duration: remainAfterDuration(c, 'gpu-logical-rate-rate', 0.45) })),
  );
  c.on('gpu-logical-rate-worksheet', () =>
    s.play(
      showWorksheet.to(1, { duration: remainDuration(c, 'gpu-logical-rate-worksheet', 0.45) }),
    ),
  );
  c.on('gpu-logical-rate-counter', () =>
    s.play(showCounter.to(1, { duration: remainDuration(c, 'gpu-logical-rate-counter', 0.45) })),
  );
  c.on('gpu-logical-rate-copy', () =>
    s.play(showCopy.to(1, { duration: remainDuration(c, 'gpu-logical-rate-copy', 0.45) })),
  );
}
