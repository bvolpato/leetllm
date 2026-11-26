// Scene 2: Give relationships direction and type (Directed triples with per-edge receipts + GNN message mean 0.4 & 0.8 -> 0.6)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function triples(s, c) {
  const phase = s.value(0);
  const showDir = s.value(0);
  const showRec = s.value(0);
  const showFail = s.value(0);
  const showGnn = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Give Relationships', 'Direction and Type'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'DIRECTED TRIPLES · PER-EDGE RECEIPTS · EXTRACTION RISKS · GNN MEAN',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sd = showDir.value;
    const sr = showRec.value;
    const sf = showFail.value;
    const sg = showGnn.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Top: Directed triple chain with per-edge source receipts
      glassCell(-635, -118, 410, 134, sd > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sd > 0.3 ? 8 : 2,
      }),
      txt('PERSON', -635, -148, 26, COSMOS.cyan, 'mono'),
      txt('Lena', -635, -100, 32, COSMOS.ink, 'sans'),

      line([-420, -118], [-225, -118], { stroke: COSMOS.emerald, width: 4.5 }).glow(
        8,
        COSMOS.emerald,
      ),
      txt('wrote ->', -322, -152, 26, COSMOS.emerald, 'mono'),
      txt(sr > 0.3 ? '[src: A]' : 'directed', -322, -84, 26, COSMOS.gold, 'mono'),

      glassCell(-10, -118, 410, 134, sd > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sd > 0.3 ? 8 : 2,
      }),
      txt('BOOK', -10, -148, 26, COSMOS.emerald, 'mono'),
      txt('River Walk', -10, -100, 32, COSMOS.ink, 'sans'),

      line([205, -118], [400, -118], { stroke: COSMOS.gold, width: 4.5 }).glow(8, COSMOS.gold),
      txt('pub_by ->', 302, -152, 26, COSMOS.gold, 'mono'),
      txt(sr > 0.3 ? '[src: B]' : 'directed', 302, -84, 26, COSMOS.gold, 'mono'),

      glassCell(620, -118, 420, 134, sd > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: sd > 0.3 ? 8 : 2,
      }),
      txt('PUBLISHER', 620, -148, 26, COSMOS.gold, 'mono'),
      txt('Willow Press', 620, -100, 32, COSMOS.ink, 'sans'),

      // Bottom left: Extraction failure modes (omit, reverse, invent)
      glassCell(-445, 134, 810, 218, sf > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sf > 0.3 ? '#26111a' : '#12182b',
        glow: sf > 0.3 ? 9 * pulse : 2,
      }),
      txt('EXTRACTION RISKS (SCHEMA != TRUTH)', -815, 68, 26, COSMOS.rose, 'mono', 'left'),
      txt('· Omit a real link present in the text', -815, 114, 26, COSMOS.ink, 'sans', 'left'),
      txt('· Reverse direction (changes meaning!)', -815, 154, 26, COSMOS.amber, 'sans', 'left'),
      txt(
        '· Invent unsupported claim (valid JSON != supported)',
        -815,
        194,
        26,
        COSMOS.rose,
        'sans',
        'left',
      ),

      // Bottom right: GraphRAG retrieval vs GNN learned message passing (mean(0.4, 0.8) = 0.6)
      glassCell(465, 134, 790, 218, sg > 0.3 ? COSMOS.violet : COSMOS.muted, {
        fill: '#181430',
        glow: sg > 0.3 ? 9 * pulse : 2,
      }),
      txt('GRAPHRAG LINKS VS GNN MESSAGE PASSING', 100, 68, 26, COSMOS.violet, 'mono', 'left'),
      txt(
        'GraphRAG: follow arrow -> fetch sentence A/B',
        100,
        114,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt('GNN neighbors [0.4, 0.8] -> mean = 0.6', 100, 158, 28, COSMOS.gold, 'mono', 'left'),
      txt(
        'Learned message passing can help rank search hits',
        100,
        198,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Preserve direction and per-edge source receipts so every hop traces back to exact text',
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
  runPhase(s, c, phase, 14);

  c.on('triples-b1-1', () => s.play(showDir.to(0.4, { duration: 0.3 })));
  c.on('triples-b1-2', () => s.play(showDir.to(0.6, { duration: 0.3 })));
  c.on('triples-typed-person', () => s.play(showDir.to(0.7, { duration: 0.25 })));
  c.on('triples-typed-book', () => s.play(showDir.to(0.8, { duration: 0.25 })));
  c.on('triples-typed-publisher', () => s.play(showDir.to(0.85, { duration: 0.25 })));
  c.on('triples-edge-wrote', () => s.play(showDir.to(0.9, { duration: 0.25 })));
  c.on('triples-edge-published', () => s.play(showDir.to(0.95, { duration: 0.25 })));
  c.on('triples-reverse-edge', () => s.play(showDir.to(1, { duration: 0.3 })));
  c.on('triples-b2-1', () => s.play(showRec.to(0.5, { duration: 0.3 })));
  c.on('triples-receipt-a', () => s.play(showRec.to(0.8, { duration: 0.3 })));
  c.on('triples-receipt-b', () => s.play(showRec.to(1, { duration: 0.3 })));
  c.on('triples-b3-1', () => s.play(showFail.to(0.4, { duration: 0.3 })));
  c.on('triples-omit-edge', () => s.play(showFail.to(0.65, { duration: 0.3 })));
  c.on('triples-reverse-failure', () => s.play(showFail.to(0.85, { duration: 0.3 })));
  c.on('triples-invent-edge', () => s.play(showFail.to(1, { duration: 0.3 })));
  c.on('triples-core-4', () => s.play(showGnn.to(0.4, { duration: 0.3 })));
  c.on('triples-gather-messages', () => s.play(showGnn.to(0.7, { duration: 0.3 })));
  c.on('triples-messages-mean', () =>
    s.play(showGnn.to(1, { duration: remainDuration(c, 'triples-messages-mean', 0.45) })),
  );
}
