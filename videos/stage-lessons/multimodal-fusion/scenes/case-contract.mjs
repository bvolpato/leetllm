// Scene 02: case-contract: Case C17 immutable artifacts, auth receipt, and 20 QPS / p95 < 3s latency envelope.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function caseContract(s, c) {
  const showSources = s.value(0);
  const showReceipt = s.value(0);
  const showSlo = s.value(0);

  const bgAura = aura(0, -10, 760, '#162d5428', '#26184424');
  const title = heroTitle(['Case C17 Contract:', 'Separate Sources & Receipts'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const src = showSources.value;
    const rcp = showReceipt.value;
    const slo = showSlo.value;

    const nodes = [
      // Left column: Immutable multimodal artifacts with distinct IDs & times
      txt('SEPARATE SOURCE IDS', -615, -245, 26, ROLE.vision, 'mono', 'center').opacity(alpha),
      chipPill('D17 Deploy  14:02', -615, -160, {
        w: 440,
        h: 72,
        color: ROLE.text,
        size: 28,
        opacity: alpha,
      }),
      chipPill('I17 Chart  ~14:03', -615, -60, {
        w: 440,
        h: 72,
        color: ROLE.vision,
        size: 28,
        opacity: alpha,
      }),
      chipPill('T17 Bridge  14:22', -615, 40, {
        w: 440,
        h: 72,
        color: src > 0.3 ? ROLE.gold : ROLE.audio,
        fill: src > 0.3 ? '#2c2210' : '#10182d',
        size: 28,
        glow: src > 0.3 ? 14 : 6,
        opacity: alpha,
      }),
      txt(
        src > 0.3 ? '14:22 = when spoken (not event time!)' : 'Keep chart, deploy & audio separate',
        -615,
        125,
        26,
        src > 0.3 ? ROLE.gold : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      // Arrows from sources to Case C17 Receipt
      arrow([-380, -160], [-210, -85], { stroke: ROLE.text, width: 2.8, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * rcp),
      ),
      arrow([-380, -60], [-210, -60], { stroke: ROLE.vision, width: 2.8, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * rcp),
      ),
      arrow([-380, 40], [-210, -35], { stroke: ROLE.audio, width: 2.8, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * rcp),
      ),

      // Center: Authenticated Case C17 Receipt
      txt('CASE RECEIPT (IDEMPOTENT)', 45, -245, 26, ROLE.bridge, 'mono', 'center').opacity(alpha),
      rect(490, 290, {
        fill: '#0e152a',
        stroke: rcp > 0.3 ? ROLE.bridge : '#2e3f69',
        width: rcp > 0.3 ? 3 : 2,
        radius: 14,
      })
        .at(45, -55)
        .glow(rcp > 0.3 ? 10 : 0, ROLE.bridge)
        .opacity(alpha * (0.65 + 0.35 * rcp)),
      txt('Auth Tenant + Artifact ACL', 45, -150, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha * (0.55 + 0.45 * rcp),
      ),
      txt('Per-modality state + versions', 45, -90, 26, ROLE.vision, 'mono', 'center').opacity(
        alpha * (0.55 + 0.45 * rcp),
      ),
      txt('Spans + regions cited', 45, -30, 26, ROLE.ok, 'mono', 'center').opacity(
        alpha * (0.55 + 0.45 * rcp),
      ),
      txt('Idempotency key bound', 45, 30, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha * (0.55 + 0.45 * rcp),
      ),

      // Right: Four outcome verdicts
      txt('ANSWER OUTCOMES', 610, -245, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      arrow([305, -55], [405, -55], { stroke: ROLE.ok, width: 3, head: 12 }).opacity(
        alpha * (0.5 + 0.5 * rcp),
      ),
      chipPill('grounded', 610, -155, {
        w: 360,
        h: 58,
        color: ROLE.ok,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * rcp),
      }),
      chipPill('partial', 610, -80, {
        w: 360,
        h: 58,
        color: ROLE.gold,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * rcp),
      }),
      chipPill('abstained', 610, -5, {
        w: 360,
        h: 58,
        color: ROLE.audio,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * rcp),
      }),
      chipPill('review', 610, 70, {
        w: 360,
        h: 58,
        color: ROLE.warn,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * rcp),
      }),

      // Bottom: End-to-end SLO timer (Accept -> Evidence Check, 20 QPS, p95 < 3s)
      txt(
        'END-TO-END TIMER: 20 QPS  |  P95 < 3.0s  (INCLUDES QUEUES + EVIDENCE CHECK)',
        -855,
        225,
        26,
        slo > 0.3 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * slo)),
      lumBar(-855, 290, 260 + 1040 * slo, 36, slo > 0.3 ? ROLE.gold : ROLE.text, {
        opacity: alpha * (0.55 + 0.45 * slo),
        maxTrackW: 1300,
      }),
      txt('Accept', -855, 345, 26, ROLE.vision, 'mono', 'left').opacity(alpha),
      txt('Queue + Encode + Decode', -240, 345, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Evidence Check', 445, 345, 26, ROLE.ok, 'mono', 'right').opacity(alpha),
      chipPill('Async Audio / Video', 675, 290, {
        w: 350,
        h: 64,
        color: ROLE.audio,
        size: 26,
        opacity: alpha * (0.52 + 0.48 * slo),
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-case-contract-0', (d) => s.play(showSources.to(1, { duration: d })));
  playCue(s, c, 'mm-case-contract-1', (d) => s.play(showReceipt.to(1, { duration: d })));
  playCue(s, c, 'mm-case-contract-2', (d) => s.play(showSlo.to(1, { duration: d })));
}
