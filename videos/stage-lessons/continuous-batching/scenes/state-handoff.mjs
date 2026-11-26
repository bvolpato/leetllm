// Scene 17: state-handoff: Disaggregated prefill -> KV + sampled ID 201 -> decode; 0.25 GiB link times; early (80/65) vs buffered (135/10).
import {
  COSMOS,
  HANDOFF,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function stateHandoff(s, c) {
  const view1Vis = s.value(1); // Disaggregated worker handoff + 0.25 GiB link times
  const view2Vis = s.value(0); // Early (80ms / 65ms gap) vs Buffered (135ms / 10ms gap)
  const handoffStep = s.value(0);
  const showBuffer = s.value(0);
  const revealVerdict = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a183022');
  const title = heroTitle(['Disaggregated Prefill-Decode:', 'Exposed Handoff Latency'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.d,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const hs = Math.round(handoffStep.value);
    const nodes = [
      txt(
        'PREFILL WORKER -> KV STATE + SAMPLED ID 201 -> DECODE WORKER',
        -855,
        -215,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('Prefill: pos 0..2 -> sample 201', -535, -100, {
        w: 620,
        h: 82,
        color: ROLE.prefill,
        size: 28,
        glow: 8,
        opacity: alpha,
      }),
      arrow([-210, -100], [-65, -100], { stroke: ROLE.d, width: 4, head: 14 }).opacity(alpha),
      chipPill('Decode: consume 201 @ pos 3', 310, -100, {
        w: 690,
        h: 82,
        color: hs >= 2 ? ROLE.ok : COSMOS.rule,
        size: 28,
        glow: hs >= 2 ? 10 : 0,
        opacity: alpha * (hs >= 1 ? 1 : 0.45),
      }),

      // 0.25 GiB transfer times at 50 GiB/s, 25 Gbps, 10 Gbps
      txt(
        '0.25 GiB KV PAYLOAD IDEAL TRANSFER TIME (BEFORE OVERHEAD)',
        -855,
        45,
        26,
        ROLE.d,
        'mono',
        'left',
      ).opacity(alpha * (hs >= 3 ? 1 : 0.35)),
      chipPill('50 GiB/s NVLink: ~5 ms', -570, 145, {
        w: 500,
        h: 74,
        color: hs >= 3 ? ROLE.ok : COSMOS.rule,
        size: 26,
        opacity: alpha * (hs >= 3 ? 1 : 0.35),
      }),
      chipPill('25 Gbps Eth: ~86 ms', 0, 145, {
        w: 480,
        h: 74,
        color: hs >= 3 ? ROLE.d : COSMOS.rule,
        size: 26,
        opacity: alpha * (hs >= 3 ? 1 : 0.35),
      }),
      chipPill('10 Gbps Eth: ~215 ms', 570, 145, {
        w: 500,
        h: 74,
        color: hs >= 3 ? ROLE.warn : COSMOS.rule,
        size: 26,
        opacity: alpha * (hs >= 3 ? 1 : 0.35),
      }),
    ];
    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const buf = showBuffer.value;
    const rev = revealVerdict.value;
    const barX = -420;
    const maxW = 860;
    const maxMs = 160;

    const nodes = [
      txt(
        'LIMITS: TTFT <= 90 ms  AND  GAP <= 30 ms  (TOK 2 AT 145 ms)',
        -855,
        -220,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Early Send', -855, -105, 30, ROLE.a, 'mono', 'left').opacity(alpha),
      lumBar(barX, -105, (HANDOFF.early.ttft / maxMs) * maxW, 36, ROLE.ok, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(
        `TTFT ${HANDOFF.early.ttft}ms | Gap ${HANDOFF.early.gap}ms`,
        barX + maxW + 24,
        -105,
        26,
        rev > 0.4 ? ROLE.warn : ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Buffered Send', -855, 20, 30, ROLE.d, 'mono', 'left').opacity(
        alpha * (0.35 + 0.65 * buf),
      ),
      lumBar(barX, 20, (HANDOFF.buffered.ttft / maxMs) * maxW, 36, ROLE.d, {
        opacity: alpha * (0.35 + 0.65 * buf),
        maxTrackW: maxW,
      }),
      txt(
        buf > 0.3
          ? `TTFT ${HANDOFF.buffered.ttft}ms | Gap ${HANDOFF.buffered.gap}ms`
          : 'hold until ready',
        barX + maxW + 24,
        20,
        26,
        rev > 0.4 ? ROLE.warn : ROLE.d,
        'mono',
        'left',
      ).opacity(alpha * (0.35 + 0.65 * buf)),

      txt(
        rev > 0.4
          ? 'BOTH miss 1 limit! Early fails gap (65 > 30ms); Buffered fails TTFT (135 > 90ms). Cut queue/handoff!'
          : buf > 0.3
            ? 'Buffering keeps token 2 at 145 ms: which deadline did token 1 cross?'
            : '20ms prefill Q + 60ms prefill = 80ms; + 40ms handoff + 15ms decode Q + 10ms step = 145ms',
        0,
        220,
        28,
        rev > 0.4 ? ROLE.warn : ROLE.d,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'handoff-sampled', (d) => s.play(handoffStep.to(1, { duration: d })));
  playCue(s, c, 'state-handoff-b1', (d) => s.play(handoffStep.to(1, { duration: d })));
  playCue(s, c, 'handoff-consume', (d) => s.play(handoffStep.to(2, { duration: d })));
  playCue(s, c, 'state-handoff-b2', (d) => s.play(handoffStep.to(3, { duration: d })));
  playCue(s, c, 'state-handoff-b3', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'handoff-second', (d) => s.play(showBuffer.to(0.1, { duration: d })));
  playCue(s, c, 'handoff-buffer', (d) => s.play(showBuffer.to(1, { duration: d })));
  // Strict prediction withholding: reveal dual-miss verdict only after handoff-verdict!
  playCue(s, c, 'handoff-verdict', (d) => s.play(revealVerdict.to(1, { duration: d })), {
    after: true,
  });
}
