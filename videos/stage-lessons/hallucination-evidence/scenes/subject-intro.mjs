// Scene 1: Embedding API status page (Opening: which timestamp can we post?)
import {
  COSMOS,
  EVIDENCE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeEntailmentGraph3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const showDraft = s.value(0);
  const showEvent = s.value(0);
  const showLink = s.value(0);
  const showGap = s.value(0);
  const showDrop = s.value(0);

  const bgAura = aura(0, 10, 680, '#12365c28', '#291c5216');
  const title = heroTitle(['Embedding API', 'Status Page'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.gold,
    eyebrow: `HALLUCINATION & EVIDENCE · ${EVIDENCE.sourceId.toUpperCase()}`,
  });

  const { view: stage3d, orbit: orbit3d } = makeEntailmentGraph3D(535, -15, phase, 'intro');

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sd = showDraft.value;
    const se = showEvent.value;
    const sl = showLink.value;
    const sg = showGap.value;
    const sDrop = showDrop.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('3D CLAIM-EVIDENCE ENTAILMENT GRAPH', 535, -330, 26, COSMOS.cyan, 'mono'),
      txt(
        sDrop > 0.4
          ? 'Drop unsupported ETA; keep verified failover time'
          : 'Runbook fields (left) vs draft claims (right)',
        535,
        292,
        26,
        sDrop > 0.4 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),

      // Left top: Draft update with two clocks
      txt('DRAFT STATUS UPDATE (2 TIMESTAMPS)', -855, -205, 26, COSMOS.gold, 'mono', 'left'),
      glassCell(-440, -108, 830, 118, sd > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#1b1810',
        glow: sd > 0.3 ? 8 * pulse : 3,
      }),
      txt(
        'Failover completed: May 26 at 08:14 UTC',
        -825,
        -134,
        27,
        sl > 0.4 ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        sDrop > 0.4 ? '[DROPPED] Recovery ETA: 14:30 UTC' : 'Full recovery expected by 14:30 UTC',
        -825,
        -86,
        27,
        sg > 0.4 ? COSMOS.rose : COSMOS.amber,
        'mono',
        'left',
      ),

      // Left middle: Admitted runbook snapshot
      txt('ADMITTED RUNBOOK SNAPSHOT', -855, 6, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-440, 128, 830, 178, se > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: se > 0.3 ? 8 : 3,
      }),
      txt(`service:     ${EVIDENCE.facts.service}`, -825, 70, 26, COSMOS.ink, 'mono', 'left'),
      txt(`status:      ${EVIDENCE.facts.status}`, -825, 108, 26, COSMOS.cyan, 'mono', 'left'),
      txt(`last_event:  ${EVIDENCE.facts.last_event}`, -825, 146, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        `event_time:  ${EVIDENCE.facts.last_event_at}   |   eta: (NONE!)`,
        -825,
        184,
        26,
        sg > 0.4 ? COSMOS.rose : COSMOS.emerald,
        'mono',
        'left',
      ),

      // Left bottom verdict (strictly withheld before sl!)
      glassCell(-440, 274, 830, 74, sl > 0.4 ? COSMOS.emerald : COSMOS.gold, {
        fill: sl > 0.4 ? '#0e2824' : '#181e34',
        glow: sl > 0.4 ? 8 * pulse : 3,
      }),
      txt(
        sDrop > 0.4
          ? 'POST: 08:14 UTC  |  DROP: 14:30 UTC (ungrounded)'
          : sl > 0.4
            ? 'POST: 08:14 UTC (verified in runbook)'
            : 'WHICH TIME CAN WE POST?  08:14  or  14:30  ?',
        -440,
        276,
        26,
        sl > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),

      glowDot(-840, 368, { radius: 6, color: sDrop > 0.4 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        sDrop > 0.4
          ? 'Fluent timestamps can sound plausible while lacking any field in the admitted record'
          : 'Compare every factual claim in the draft against the admitted runbook fields',
        -812,
        370,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 14);
  orbit3d(s, c);

  c.on('draft-clock', () => s.play(showDraft.to(1, { duration: 0.45 })));
  c.on('event-clock', () => s.play(showEvent.to(1, { duration: 0.45 })));
  c.after('event-link', () => s.play(showLink.to(1, { duration: 0.45 })));
  c.on('estimate-gap', () => s.play(showGap.to(1, { duration: 0.45 })));
  c.on('remove-estimate', () =>
    s.play(showDrop.to(1, { duration: remainDuration(c, 'remove-estimate', 0.45) })),
  );
}
