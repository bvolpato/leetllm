// Scene 14: transfers: 7.6 GB @ 500 GB/s = 15.2 ms vs 5.6 GB @ 500 (11.2 ms) + 2.0 GB @ 25 GB/s PCIe (80.0 ms) = 91.2 ms!
import {
  COSMOS,
  ROLE,
  STREAM_DEV,
  STREAM_MIX,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function transfers(s, c) {
  const showSplit = s.value(0);
  const showDevLeg = s.value(0);
  const showHostLeg = s.value(0);
  const revealTotal = s.value(0); // strictly withheld until AFTER serial-total!

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Timing Bytes Across the Link:', 'All-Device vs Split PCIe Bandwidth'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.work,
  });

  const devMs = STREAM_DEV.total * 1000; // 15.2 ms
  const mixDevMs = STREAM_MIX.spans[0].seconds * 1000; // 11.2 ms
  const mixHostMs = STREAM_MIX.spans[1].seconds * 1000; // 80.0 ms
  const mixTotMs = STREAM_MIX.total * 1000; // 91.2 ms

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sp = showSplit.value;
    const dl = showDevLeg.value;
    const hl = showHostLeg.value;
    const tot = revealTotal.value;

    const barX = -460;
    const maxW = 900;
    const maxMs = 100;
    const px = maxW / maxMs;

    const nodes = [
      txt(
        '100 ms SERIAL TRANSFER RULER (7.6 GB TOTAL WEIGHTS PER DECODE STEP)',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      // Row 1: All-device 7.6 GB @ 500 GB/s = 15.2 ms
      txt('All-Device (7.6 GB)', -855, -100, 28, ROLE.weights, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, devMs * px, 44, ROLE.weights, { opacity: alpha, maxTrackW: maxW }),
      txt(
        `${devMs.toFixed(1)} ms`,
        barX + devMs * px + 26,
        -100,
        32,
        ROLE.weights,
        'mono',
        'left',
      ).opacity(alpha),

      // Row 2: Mixed 5.6 GB @ 500 GB/s + 2.0 GB @ 25 GB/s (withheld until device-leg / host-leg!)
      txt('Mixed (5.6 + 2.0 GB)', -855, 45, 28, ROLE.work, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * sp),
      ),
      rect(maxW, 44, { fill: '#12192e', stroke: '#253358', width: 1.5, radius: 6 })
        .at(barX + maxW * 0.5, 45)
        .opacity(alpha * 0.65),
      rect(dl > 0.3 ? mixDevMs * px : 12, 44, { fill: ROLE.weights, stroke: null, radius: 5 })
        .at(barX + (dl > 0.3 ? mixDevMs * px * 0.5 : 6), 45)
        .opacity(alpha * (dl > 0.3 ? 1 : 0.35)),
      rect(hl > 0.3 ? mixHostMs * px : 12, 44, { fill: ROLE.work, stroke: null, radius: 5 })
        .at(barX + mixDevMs * px + (hl > 0.3 ? mixHostMs * px * 0.5 : 6), 45)
        .glow(hl > 0.3 ? 10 : 0, ROLE.work)
        .opacity(alpha * (hl > 0.3 ? 1 : 0.25)),
      txt(
        tot > 0.4
          ? `${mixTotMs.toFixed(1)} ms  (6x SLOWER!)`
          : hl > 0.3
            ? '+80.0 ms host leg'
            : '? ms (predict)',
        barX + maxW + 24,
        45,
        28,
        tot > 0.4 ? ROLE.work : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        tot > 0.4
          ? '5.6 GB on GPU = 11.2 ms; just 2.0 GB over 25 GB/s PCIe = 80.0 ms! Trace activation vs weight traffic.'
          : hl > 0.3
            ? '2.0 GB over 25 GB/s PCIe takes 80.0 ms (7x longer than the 11.2 ms GPU leg)!'
            : 'With 5.6 GB @ 500 GB/s and 2.0 GB @ 25 GB/s, which leg takes longer?',
        0,
        235,
        28,
        tot > 0.4 || hl > 0.3 ? ROLE.work : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'weight-payload', (d) => s.play(showSplit.to(0, { duration: d })));
  playCue(s, c, 'resident-read', (d) => s.play(showSplit.to(0, { duration: d })));
  playCue(s, c, 'split-bytes', (d) => s.play(showSplit.to(1, { duration: d })));
  playCue(s, c, 'ask-leg', (d) => s.play(showSplit.to(1, { duration: d })));
  // Strict prediction withholding: reveal 11.2ms, 80ms, 91.2ms only in Beat 3 cues!
  playCue(s, c, 'device-leg', (d) => s.play(showDevLeg.to(1, { duration: d })));
  playCue(s, c, 'host-leg', (d) => s.play(showHostLeg.to(1, { duration: d })));
  playCue(s, c, 'serial-total', (d) => s.play(revealTotal.to(1, { duration: d })), { after: true });
  playCue(s, c, 'trace-bytes', (d) => s.play(revealTotal.to(1, { duration: d })));
}
