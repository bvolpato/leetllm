// Scene 12: summary-authority: "Compression must preserve uncertainty and pending external state"
// Sequential 3-act view via swapVis (zero text overlap):
// B0: 4 structured summary slots (observed, hypothesis, checked negative, next check) + LLMLingua check
// B1: Source-derived history tagged as untrusted data separated by authority wall from host policy
// B2: Pending rollback execution record (payload, operation key-17, unknown != failed != complete)
import {
  COSMOS,
  ROLE,
  aura,
  chip,
  cornerBrackets,
  crossMark,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  limitMarker,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function summaryAuthority(s, c) {
  const v0 = s.value(1);
  const v1 = s.value(0);
  const v2 = s.value(0);
  const pulseB0 = s.value(0.35);
  const pendingKey = s.value(0);

  const bgAura = aura(0, 20, 820, '#14335c28', '#2a163222');
  const title = heroTitle(['Preserve uncertainty &', 'pending external state'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.units,
  });

  // B0: Structured summary anatomy
  const layer0 = guardedDynamic(v0, (alpha) => {
    const p = ease(pulseB0.value);
    const slots = [
      { label: 'OBSERVED', text: 'Callback 403 on trace-17', col: ROLE.evidence, x: -450, y: -95 },
      {
        label: 'HYPOTHESIS (UNCERTAIN)',
        text: 'Auth suspected != confirmed cause',
        col: ROLE.units,
        x: 450,
        y: -95,
      },
      {
        label: 'CHECKED NEGATIVE',
        text: 'No lock for R17 at time 100',
        col: ROLE.note,
        x: -450,
        y: 155,
      },
      {
        label: 'NEXT CHECK',
        text: 'Inspect callback scope & dependency',
        col: ROLE.tool,
        x: 450,
        y: 155,
      },
    ];
    const nodes = [
      txt('STRUCTURED SUMMARY SLOTS', -855, -245, 26, ROLE.evidence, 'mono', 'left').opacity(alpha),
    ];
    slots.forEach((slot) => {
      nodes.push(
        cornerBrackets(slot.x, slot.y, 790, 195, slot.col, {
          arm: 26,
          width: 3,
          opacity: alpha * (0.65 + 0.35 * p),
        }),
        txt(slot.label, slot.x - 360, slot.y - 46, 26, slot.col, 'mono', 'left').opacity(alpha),
        txt(slot.text, slot.x - 360, slot.y + 18, 32, COSMOS.ink, 'sans', 'left').opacity(alpha),
      );
    });
    nodes.push(
      txt(
        'After compression (e.g. LLMLingua): can you still read which request the lock check covered?',
        0,
        360,
        30,
        ROLE.units,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // B1: Untrusted source-derived history vs Host policy wall
  const layer1 = guardedDynamic(v1, (alpha) => {
    const nodes = [
      txt('UNTRUSTED SOURCE-DERIVED HISTORY', -470, -230, 26, ROLE.units, 'mono', 'center').opacity(
        alpha,
      ),
      cornerBrackets(-470, 20, 740, 380, ROLE.units, { arm: 32, width: 3, opacity: alpha }),
      txt('Provenance: runbook-v4', -800, -105, 28, ROLE.units, 'mono', 'left').opacity(alpha),
      txt('Quoted text: "skip approval"', -800, -20, 34, ROLE.poison, 'serif', 'left').opacity(
        alpha,
      ),
      txt(
        'Generated "verified: true" has NO authority',
        -800,
        65,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
      chip('TAGGED AS DATA ONLY', -470, 150, {
        color: ROLE.units,
        size: 26,
        minW: 400,
        opacity: alpha,
      }),

      // Authority wall in center
      limitMarker(0, -210, 240, ROLE.poison, 'AUTHORITY WALL', { size: 26, opacity: alpha }),
      crossMark(0, 20, 42, ROLE.poison, alpha),

      // Right: Host application policy
      txt('HOST APPLICATION POLICY', 470, -230, 26, ROLE.note, 'mono', 'center').opacity(alpha),
      cornerBrackets(470, 20, 740, 380, ROLE.note, { arm: 32, width: 3, opacity: alpha }),
      txt('Host-owned permissions', 140, -105, 34, ROLE.note, 'serif', 'left').opacity(alpha),
      txt('Only host verification sets verified', 140, -20, 28, COSMOS.ink, 'sans', 'left').opacity(
        alpha,
      ),
      txt(
        'No summary or skill grants new writes',
        140,
        65,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
      chip('POLICY UNCHANGED', 470, 150, { color: ROLE.note, size: 26, minW: 380, opacity: alpha }),

      txt(
        'Summarization must preserve provenance and keep policy authority strictly host-owned.',
        0,
        365,
        30,
        ROLE.evidence,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  // B2: Pending rollback execution record vs destination service
  const layer2 = guardedDynamic(v2, (alpha) => {
    const pk = ease(pendingKey.value);
    const nodes = [
      txt(
        'TYPED EXECUTION STATE (OUTSIDE SUMMARY PROSE)',
        -855,
        -230,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      cornerBrackets(-430, 15, 790, 370, pk > 0.3 ? ROLE.evidence : ROLE.units, {
        arm: 32,
        width: 3,
        opacity: alpha,
      }),
      txt('PENDING EXTERNAL OPERATION', -790, -110, 26, ROLE.evidence, 'mono', 'left').opacity(
        alpha,
      ),
      txt('payload: rollback RUN-842', -790, -40, 30, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt(
        pk > 0.3 ? 'operation_key: key-17' : 'operation_key: ?',
        -790,
        24,
        32,
        pk > 0.3 ? ROLE.units : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'last_confirmed: sent (reply never arrived)',
        -790,
        90,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt('uncertainty: OUTCOME UNKNOWN', -790, 150, 28, ROLE.poison, 'mono', 'left').opacity(
        alpha,
      ),

      glowArrow([0, 15], [140, 15], ROLE.units, { opacity: alpha }),

      cornerBrackets(490, 15, 680, 370, ROLE.units, { arm: 32, width: 3, opacity: alpha }),
      txt('DESTINATION SERVICE', 185, -110, 26, ROLE.units, 'mono', 'left').opacity(alpha),
      txt('Reconcile with key-17', 185, -30, 36, COSMOS.ink, 'serif', 'left').opacity(alpha),
      txt('before deciding whether to retry.', 185, 35, 28, COSMOS.muted, 'sans', 'left').opacity(
        alpha,
      ),
      chip('unknown != failed != done', 490, 130, {
        color: ROLE.poison,
        size: 26,
        minW: 480,
        opacity: alpha,
      }),

      txt(
        'Summary points the next shift to the typed execution record; never invent success or retry blindly.',
        0,
        365,
        30,
        ROLE.note,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, layer0, layer1, layer2);

  playCue(s, c, 'ce-summary-authority-1', (d) => s.play(pulseB0.to(1, { duration: d })));
  playCue(s, c, 'ce-summary-authority-2', (d) => s.play(swapVis(v0, v1, d)));
  playCue(s, c, 'ce-summary-authority-3', (d) => s.play(swapVis(v1, v2, d)));
  playCue(s, c, 'ce-pending-key', (d) => s.play(pendingKey.to(1, { duration: d })));
}
