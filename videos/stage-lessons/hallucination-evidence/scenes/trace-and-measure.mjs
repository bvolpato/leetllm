// Scene 18: Where did this request first fail? (3 trace signatures + false accept vs false reject)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function traceAndMeasure(s, c) {
  const phase = s.value(0);
  const showMissing = s.value(0);
  const showEta = s.value(0);
  const showVary = s.value(0);
  const showErrors = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['Where Did This Request', 'First Fail?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.amber,
    eyebrow: 'REQUEST TRACE TRIAGE · ADMISSION vs GENERATION vs STABILITY · ERROR AUDIT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sm = showMissing.value;
    const se = showEta.value;
    const sv = showVary.value;
    const sErr = showErrors.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const traces = [
      {
        cx: -575,
        title: '1. NO SNAPSHOT',
        root: 'EVIDENCE ADMISSION',
        detail: 'Draft cites runbook, trace empty',
        fix: 'Check feed, auth & citation',
        col: COSMOS.rose,
        hi: sm > 0.3,
      },
      {
        cx: 0,
        title: '2. INVENTED ETA',
        root: 'CLAIM GENERATION',
        detail: 'Snapshot arrived; ETA unbacked',
        fix: 'Log version, verdict & sent text',
        col: COSMOS.amber,
        hi: se > 0.3,
      },
      {
        cx: 575,
        title: '3. SAMPLES DRIFT',
        root: 'GENERATION STABILITY',
        detail: 'Draft passes; alternatives split',
        fix: 'Save prompt, temp & versions',
        col: COSMOS.cyan,
        hi: sv > 0.3,
      },
    ];

    const nodes = [];
    traces.forEach((tr) => {
      nodes.push(
        glassCell(tr.cx, -62, 535, 260, tr.hi ? tr.col : COSMOS.muted, {
          fill: tr.hi ? '#141f38' : '#101629',
          glow: tr.hi ? 10 * pulse : 3,
        }),
        txt(tr.title, tr.cx, -148, 28, tr.col, 'mono'),
        txt(tr.root, tr.cx, -104, 26, COSMOS.gold, 'mono'),
        txt(tr.detail, tr.cx, -42, 26, COSMOS.ink, 'sans'),
        txt(tr.fix, tr.cx, 12, 26, COSMOS.emerald, 'sans'),
      );
    });

    // Bottom: Human review confusion matrix (False Accept vs False Reject)
    nodes.push(
      glassCell(-445, 200, 810, 168, sErr > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sErr > 0.3 ? 9 * pulse : 2,
      }),
      txt('FALSE ACCEPT (LEAK)', -820, 152, 26, COSMOS.rose, 'mono', 'left'),
      txt('Shipping an ETA absent from the runbook', -820, 198, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'Directly harms reader trust & on-call safety',
        -820,
        238,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(455, 200, 810, 168, sErr > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: sErr > 0.3 ? 9 * pulse : 2,
      }),
      txt('FALSE REJECT (OVER-BLOCK)', 80, 152, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        'Blocking "finished" when record says "completed"',
        80,
        198,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Track both + coverage & usefulness; protect logs',
        80,
        238,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Protect sensitive incident replay artifacts and limit retention while keeping full diagnostic traceability',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('missing-trace', () => s.play(showMissing.to(1, { duration: 0.45 })));
  c.on('eta-trace', () => s.play(showEta.to(1, { duration: 0.45 })));
  c.on('vary-trace', () => s.play(showVary.to(1, { duration: 0.45 })));
  c.on('review-errors', () =>
    s.play(showErrors.to(1, { duration: remainDuration(c, 'review-errors', 0.45) })),
  );
}
