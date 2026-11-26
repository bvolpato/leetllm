// Scene 15: transfer-comparison: Peak 1008 GB/s (7.5 ms vs 85.6 ms = ~11x), full host 304 ms, storage @ 5 GB/s = 1520 ms!
import {
  COSMOS,
  ROLE,
  STREAM_DISK,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function transferComparison(s, c) {
  const showPeak = s.value(0);
  const showHost = s.value(0);
  const showDisk = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Serial Transfer Floors:', 'VRAM vs PCIe vs NVMe Storage'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.work,
  });

  const diskMs = STREAM_DISK.total * 1000; // 1520 ms

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pk = showPeak.value;
    const hs = showHost.value;
    const dk = showDisk.value;
    const barX = -420;
    const maxW = 920;

    const rows = [
      { label: 'All-VRAM @ 1008 GB/s', ms: 7.54, text: '7.5 ms (1x)', col: ROLE.ok, op: 1 },
      {
        label: 'Mixed (5.6G+2G PCIe)',
        ms: 85.56,
        text: '85.6 ms (~11x!)',
        col: ROLE.gold,
        op: 0.45 + 0.55 * pk,
      },
      {
        label: 'All-Host @ 25 GB/s',
        ms: 304,
        text: '304 ms',
        col: ROLE.amber,
        op: 0.45 + 0.55 * hs,
      },
      {
        label: 'NVMe Disk @ 5 GB/s',
        ms: diskMs,
        text: '1,520 ms (>1.5 s!)',
        col: ROLE.work,
        op: 0.45 + 0.55 * dk,
      },
    ];

    const nodes = [
      txt(
        'LOG-SCALE SERIAL DATA MOVEMENT FOR 7.6 GB WEIGHTS (LOWER = FASTER)',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    rows.forEach((r, i) => {
      const y = -125 + i * 100;
      const op = alpha * r.op;
      const frac = Math.log10(r.ms) / Math.log10(2000);
      nodes.push(
        txt(r.label, -855, y, 26, r.col, 'mono', 'left').opacity(op),
        lumBar(barX, y, Math.max(24, frac * maxW), 38, r.col, { opacity: op, maxTrackW: maxW }),
        txt(r.text, barX + maxW + 24, y, 28, r.col, 'mono', 'left').opacity(op),
      );
    });

    nodes.push(
      txt(
        'Faster GPU VRAM makes the fixed 80 ms host leg dominate (~11x penalty); always time real requests',
        0,
        295,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'peak-bandwidth', (d) => s.play(showPeak.to(0.6, { duration: d })));
  playCue(s, c, 'compare-floors', (d) => s.play(showPeak.to(1, { duration: d })));
  playCue(s, c, 'all-host', (d) => s.play(showHost.to(1, { duration: d })));
  playCue(s, c, 'read-file', (d) => s.play(showDisk.to(1, { duration: d })));
}
