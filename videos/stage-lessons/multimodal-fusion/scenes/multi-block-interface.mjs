// Scene 07: multi-block-interface: MPnP intermediate vision taps -> late decoder K/V insertion, backward path depth.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function multiBlockInterface(s, c) {
  const showTaps = s.value(0);
  const showShortPath = s.value(0);
  const showScope = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c2a', '#29184a26');
  const title = heroTitle(['Separate Encoder Depth', 'from Decoder Insertion Depth'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.bridge,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const tp = showTaps.value;
    const sp = showShortPath.value;
    const sc = showScope.value;

    const visBlocks = ['V1', 'V2 (tap)', 'V3', 'V4 (tap)', 'V5', 'V6 (tap)'];
    const decBlocks = [
      'L1 (frozen)',
      'L2 (frozen)',
      'L3 (frozen)',
      'L4 (+K/V)',
      'L5 (+K/V)',
      'L6 (+K/V)',
    ];

    const nodes = [
      txt('VISION ENCODER TAPS', -675, -245, 26, ROLE.vision, 'mono', 'center').opacity(alpha),
      txt('K/V ALIGNERS', -195, -245, 26, ROLE.bridge, 'mono', 'center').opacity(alpha),
      txt('DECODER INSERTION DEPTH', 420, -245, 26, ROLE.text, 'mono', 'center').opacity(alpha),
    ];

    visBlocks.forEach((lbl, i) => {
      const y = -175 + i * 74;
      const tapped = i % 2 === 1;
      nodes.push(
        chipPill(lbl, -675, y, {
          w: 280,
          h: 56,
          color: tapped && tp > 0.3 ? ROLE.vision : '#32466e',
          fill: tapped && tp > 0.3 ? '#0e283c' : '#0f172b',
          size: 26,
          glow: tapped && tp > 0.3 ? 10 : 3,
          opacity: alpha,
        }),
      );
      if (tapped) {
        nodes.push(
          arrow([-520, y], [-340, -10 + (i - 3) * 32], {
            stroke: ROLE.vision,
            width: 2.6,
            head: 10,
          }).opacity(alpha * (0.48 + 0.52 * tp)),
        );
      }
    });

    // Center K/V Aligner bank
    rect(280, 260, {
      fill: tp > 0.3 ? '#211842' : '#10182d',
      stroke: tp > 0.3 ? ROLE.bridge : '#364a74',
      width: tp > 0.3 ? 3 : 2,
      radius: 14,
    })
      .at(-195, -10)
      .glow(tp > 0.3 ? 12 : 0, ROLE.bridge)
      .opacity(alpha);
    nodes.push(
      txt('Collected', -195, -62, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('K / V Rail', -195, -12, 30, ROLE.bridge, 'mono', 'center').opacity(alpha),
      txt('per-block w_l', -195, 42, 26, ROLE.gold, 'mono', 'center').opacity(
        alpha * (0.55 + 0.45 * sp),
      ),
    );

    // Right: Decoder blocks L1..L6
    decBlocks.forEach((lbl, i) => {
      const y = -175 + i * 74;
      const isL4 = i === 3;
      const inserted = i >= 3 && !(isL4 && sp > 0.5);
      const col = inserted ? ROLE.ok : isL4 && sp > 0.5 ? ROLE.warn : '#384c76';
      nodes.push(
        chipPill(isL4 && sp > 0.5 ? 'L4 (omitted -> shorter grad)' : lbl, 420, y, {
          w: 520,
          h: 56,
          color: col,
          fill: inserted ? '#0f2d24' : '#0f172b',
          size: 26,
          glow: inserted ? 10 : 3,
          opacity: alpha,
        }),
      );
      if (inserted) {
        nodes.push(
          arrow([-40, -10 + (i - 4) * 40], [145, y], {
            stroke: ROLE.ok,
            width: 2.8,
            head: 11,
          }).opacity(alpha * (0.48 + 0.52 * Math.max(tp, sp))),
        );
      }
    });

    // Bottom scope & denominator note
    nodes.push(
      txt(
        sc > 0.3
          ? 'OPT / BLOOMZ mobile adaptation != inference speedup; shared-softmax != Flamingo gate'
          : sp > 0.3
            ? 'Shorter backward path for late taps; earlier frozen blocks still run forward'
            : 'MPnP taps intermediate vision blocks and injects K/V into selected late decoder blocks',
        0,
        320,
        26,
        sc > 0.3 ? ROLE.gold : sp > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-multi-block-interface-0', (d) => s.play(showTaps.to(1, { duration: d })));
  playCue(s, c, 'mm-multi-block-interface-1', (d) => s.play(showShortPath.to(1, { duration: d })));
  playCue(s, c, 'mm-multi-block-interface-2', (d) => s.play(showScope.to(1, { duration: d })));
}
