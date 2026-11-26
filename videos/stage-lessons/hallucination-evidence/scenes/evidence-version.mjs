// Scene 6: Bind each claim to the admitted snapshot (Source ID, version, field comparison, freshness)
import {
  COSMOS,
  EVIDENCE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function evidenceVersion(s, c) {
  const phase = s.value(0);
  const showResolve = s.value(0);
  const showCompare = s.value(0);
  const showEta = s.value(0);
  const showFresh = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Bind Each Claim to', 'the Admitted Snapshot'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'CITATION RESOLUTION · SOURCE ID + SNAPSHOT VERSION + FIELD CHECK',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sr = showResolve.value;
    const sc = showCompare.value;
    const se = showEta.value;
    const sf = showFresh.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // 3-step binding chain across the canvas
      glassCell(-575, -60, 520, 230, sr > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sr > 0.3 ? 9 * pulse : 3,
      }),
      txt('1. RESOLVE CITATION', -575, -134, 26, COSMOS.cyan, 'mono'),
      txt(`sourceId: ${EVIDENCE.sourceId}`, -575, -76, 26, COSMOS.ink, 'mono'),
      txt('version: 2026-05-27T10:00Z', -575, -34, 26, COSMOS.gold, 'mono'),
      txt('Must match admitted snap', -575, 16, 26, COSMOS.muted, 'sans'),

      glowingArc([-305, -60], [-200, -60], -18, { color: COSMOS.cyan, width: 3.6 }),

      glassCell(40, -60, 460, 230, sc > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sc > 0.3 ? 9 * pulse : 3,
      }),
      txt('2. CHECK FIELD VALUE', 40, -134, 26, COSMOS.emerald, 'mono'),
      txt('service == embedding-api', 40, -76, 26, COSMOS.emerald, 'mono'),
      txt('event_time == 08:14 UTC', 40, -34, 26, COSMOS.emerald, 'mono'),
      txt('eta -> field absent!', 40, 16, 26, se > 0.3 ? COSMOS.rose : COSMOS.amber, 'mono'),

      glowingArc([280, -60], [380, -60], -18, { color: COSMOS.gold, width: 3.6 }),

      glassCell(620, -60, 460, 230, sf > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231e10',
        glow: sf > 0.3 ? 9 * pulse : 3,
      }),
      txt('3. ADMISSION GATE', 620, -134, 26, COSMOS.gold, 'mono'),
      txt('Time-scoped snapshot', 620, -76, 26, COSMOS.ink, 'sans'),
      txt('Check freshness + auth', 620, -34, 26, COSMOS.amber, 'sans'),
      txt('BEFORE claim checking', 620, 16, 26, COSMOS.emerald, 'mono'),

      // Bottom highlight box: Right citation != Supported claim
      glassCell(0, 185, 1660, 140, se > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: se > 0.3 ? '#26111a' : '#11182c',
        glow: se > 0.3 ? 8 * pulse : 2,
      }),
      txt('CITATION DECORATION TRAP', -800, 152, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        'The ETA claim cites the exact right incident & version, yet no recovery_eta field exists inside it!',
        -800,
        202,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glowDot(-840, 345, { radius: 6, color: COSMOS.cyan }),
      txt(
        'A citation proves nothing unless the cited snapshot actually supports the nearby sentence',
        -812,
        347,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('resolve-version', () => s.play(showResolve.to(1, { duration: 0.45 })));
  c.on('compare-field', () => s.play(showCompare.to(1, { duration: 0.45 })));
  c.on('citation-eta', () => s.play(showEta.to(1, { duration: 0.45 })));
  c.on('fresh-snapshot', () =>
    s.play(showFresh.to(1, { duration: remainDuration(c, 'fresh-snapshot', 0.45) })),
  );
}
