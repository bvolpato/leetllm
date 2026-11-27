// Scene 4: Follow a path, then fetch its sources (2-hop walk Lena -> book:river -> Willow Press + admission check)
import {
  COSMOS,
  RECORDS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
  walk,
} from '../parts.mjs';

export default function walkEvidence(s, c) {
  const showHop1 = s.value(0);
  const showHop2 = s.value(0);
  const showAdmit = s.value(0);
  const showCaution = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Follow a Path, Then', 'Fetch Its Sources'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'PROVENANCE TRAVERSAL · COLLECT SOURCE RECORDS & VERIFY ACCESS/VERSION',
  });

  const walked = walk('person:lena');

  const live = guardedDynamic(s.value(1), () => {
    const h1 = showHop1.value;
    const h2 = showHop2.value;
    const ad = showAdmit.value;
    const ct = showCaution.value;

    const nodes = [
      // Top: 2-hop cursor traversal Lena -> book:river -> Willow Press
      glassCell(-635, -124, 380, 118, COSMOS.cyan, { fill: '#10203a', glow: 6 }),
      txt('person:lena', -635, -138, 26, COSMOS.cyan, 'mono'),
      txt('START', -635, -96, 26, COSMOS.gold, 'mono'),

      line([-435, -124], [-220, -124], {
        stroke: h1 > 0.3 ? COSMOS.emerald : COSMOS.muted,
        width: 4.5,
      }).glow(h1 > 0.3 ? 9 : 0, COSMOS.emerald),
      txt('wrote', -328, -156, 26, COSMOS.emerald, 'mono'),

      glassCell(-15, -124, 380, 118, h1 > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: h1 > 0.3 ? 8 : 2,
      }),
      txt('book:river', -15, -138, 26, COSMOS.emerald, 'mono'),
      txt('HOP 1', -15, -96, 26, COSMOS.ink, 'mono'),

      line([185, -124], [400, -124], {
        stroke: h2 > 0.3 ? COSMOS.gold : COSMOS.muted,
        width: 4.5,
      }).glow(h2 > 0.3 ? 9 : 0, COSMOS.gold),
      txt('pub_by', 292, -156, 26, COSMOS.gold, 'mono'),

      glassCell(605, -124, 390, 118, h2 > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: h2 > 0.3 ? 9 : 2,
      }),
      txt('publisher:willow', 605, -138, 26, COSMOS.gold, 'mono'),
      txt('HOP 2', 605, -96, 26, COSMOS.ink, 'mono'),

      // Bottom left: Admitted evidence set (check access + version + provenance)
      glassCell(-445, 134, 810, 218, ad > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: ad > 0.3 ? 9 : 2,
      }),
      txt(
        `ADMITTED (${walked.sources.length}/2): access=OK, current`,
        -815,
        66,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        `A (v${RECORDS.author.version}): "${RECORDS.author.text}"`,
        -815,
        116,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        `B (v${RECORDS.publisher.version}): "${RECORDS.publisher.text}"`,
        -815,
        158,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Answer names Willow Press & cites BOTH A and B',
        -815,
        202,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      // Bottom right: Path is a retrieval lead, not automatic proof
      glassCell(465, 134, 790, 218, ct > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231c10',
        glow: ct > 0.3 ? 8 : 2,
      }),
      txt('A SHORT PATH IS ONLY A RETRIEVAL LEAD', 100, 66, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        '· Meaning depends on relation types & text support',
        100,
        116,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Shared topic != authorship, ownership, causation',
        100,
        158,
        26,
        COSMOS.rose,
        'sans',
        'left',
      ),
      txt(
        '· Always read cited sentences before answering',
        100,
        202,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Check access, version, and provenance on every hop before admitting passages into context',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('walk-evidence-b1-1', () => s.play(showHop1.to(0.5, { duration: 0.3 })));
  c.on('walk-evidence-walk-author', () => s.play(showHop1.to(1, { duration: 0.35 })));
  c.on('walk-evidence-walk-publisher', () => s.play(showHop2.to(0.7, { duration: 0.35 })));
  c.on('walk-evidence-b1-2', () => s.play(showHop2.to(1, { duration: 0.3 })));
  c.on('walk-evidence-b2-1', () => s.play(showAdmit.to(0.4, { duration: 0.3 })));
  c.on('walk-evidence-admit-evidence', () => s.play(showAdmit.to(0.75, { duration: 0.3 })));
  c.on('walk-evidence-publisher-answer', () => s.play(showAdmit.to(1, { duration: 0.35 })));
  c.on('walk-evidence-b3-1', () =>
    s.play(showCaution.to(1, { duration: remainDuration(c, 'walk-evidence-b3-1', 0.45) })),
  );
}
