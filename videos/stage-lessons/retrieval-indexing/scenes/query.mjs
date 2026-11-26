// Scene 3: Query terms traverse only their lists (OR merge vs AND intersection & work)
import {
  COSMOS,
  POSTINGS,
  QUERY_INTERSECTION,
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

export default function query(s, c) {
  const phase = s.value(0);
  const showMake = s.value(0);
  const showMerge = s.value(0);
  const showWork = s.value(0);

  const bgAura = aura(0, 10, 660, '#12335e26', '#2b1b5214');
  const title = heroTitle(['Query Terms Traverse', 'Only Their Lists'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'CANDIDATE TRAVERSAL · OR UNION vs AND INTERSECTION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sm = showMake.value;
    const sg = showMerge.value;
    const sw = showWork.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const makeLen = POSTINGS.make.length;
    const soupLen = POSTINGS.soup.length;

    const nodes = [
      // Left: two query term posting lists
      txt('TOUCHED POSTING LISTS', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-575, -100, 560, 108, sm > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10223b',
        glow: sm > 0.3 ? 9 * pulse : 3,
      }),
      txt('make ->', -825, -100, 27, COSMOS.cyan, 'mono', 'left'),
      txt(`[${POSTINGS.make.join(', ')}] (len ${makeLen})`, -510, -100, 26, COSMOS.emerald, 'mono'),

      glassCell(-575, 55, 560, 108, sg > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#201c11',
        glow: sg > 0.3 ? 9 * pulse : 3,
      }),
      txt('soup ->', -825, 55, 27, COSMOS.gold, 'mono', 'left'),
      txt(`[${POSTINGS.soup.join(', ')}] (len ${soupLen})`, -495, 55, 26, COSMOS.gold, 'mono'),

      // Excluded paraphrase d2
      glassCell(-575, 212, 560, 96, COSMOS.rose, { fill: '#26111a', glow: 6 }),
      txt('d2 (paraphrase): unreachable by either list', -575, 214, 26, COSMOS.rose, 'sans'),

      // Merging arcs to right side
      glowingArc([-285, -100], [50, -100], -22, { color: COSMOS.cyan, width: 3.6 }),
      glowingArc([-285, 55], [50, -70], 18, {
        color: COSMOS.gold,
        width: 3.6,
        opacity: Math.max(0.5, sg),
      }),
      glowingArc([-285, 55], [50, 68], 22, {
        color: COSMOS.emerald,
        width: 3.6,
        opacity: Math.max(0.5, sg),
      }),

      // Right: OR vs AND results + Traversal work meter
      txt('ROUTING MODES', 80, -205, 26, COSMOS.emerald, 'mono', 'left'),
      glassCell(445, -100, 740, 108, sg > 0.4 ? COSMOS.gold : COSMOS.muted, {
        fill: sg > 0.4 ? '#1e1c12' : '#12182b',
        glow: sg > 0.4 ? 9 * pulse : 3,
      }),
      txt('OR UNION:', 105, -100, 28, COSMOS.gold, 'mono', 'left'),
      txt('visits [ d1, d4 ]', 540, -100, 32, COSMOS.ink, 'mono'),

      glassCell(445, 55, 740, 108, sg > 0.4 ? COSMOS.emerald : COSMOS.muted, {
        fill: sg > 0.4 ? '#0e2824' : '#12182b',
        glow: sg > 0.4 ? 9 * pulse : 3,
      }),
      txt('AND INTERSECT:', 105, 55, 28, COSMOS.emerald, 'mono', 'left'),
      txt(`keeps [ ${QUERY_INTERSECTION.join(', ')} ]`, 560, 55, 32, COSMOS.emerald, 'mono'),

      glassCell(445, 212, 740, 108, sw > 0.4 ? COSMOS.cyan : COSMOS.muted, {
        fill: sw > 0.4 ? '#0f233b' : '#12182b',
        glow: sw > 0.4 ? 9 * pulse : 3,
      }),
      txt('LIST WORK:', 105, 192, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `${makeLen} + ${soupLen} = ${makeLen + soupLen} postings scanned`,
        535,
        192,
        28,
        COSMOS.ink,
        'mono',
      ),
      txt('Common terms still span long lists before skipping', 445, 236, 26, COSMOS.muted, 'sans'),

      glowDot(-840, 355, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Inverted traversal skips non-matching docs, not dense common-term lists',
        -812,
        357,
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

  c.on('query-make', () => s.play(showMake.to(1, { duration: 0.45 })));
  c.on('query-beat-2-focus-1', () => s.play(showMerge.to(1, { duration: 0.5 })));
  c.on('query-beat-3-focus-1', () =>
    s.play(showWork.to(1, { duration: remainDuration(c, 'query-beat-3-focus-1', 0.45) })),
  );
}
