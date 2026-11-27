// Scene 1: Who published Lena's book? (Opening entity-ID disambiguation + orbiting 3D knowledge constellation)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeKnowledgeConstellation3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const showBook = s.value(0);
  const showPark = s.value(0);
  const showChoose = s.value(0);
  const showPub = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Who Published', "Lena's Book?"], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'GRAPHRAG · TYPED ENTITY IDS & MULTI-HOP EVIDENCE TRAVERSAL',
  });

  const graph3d = makeKnowledgeConstellation3D(555, -20, phase, 'intro');

  const live = guardedDynamic(s.value(1), () => {
    const sb = showBook.value;
    const sp = showPark.value;
    const sc = showChoose.value;
    const pub = showPub.value;

    const nodes = [
      // Left: Record A (Lena's card) -> Two candidates sharing name "River Walk"
      glassCell(-405, -148, 920, 124, COSMOS.cyan, { fill: '#10203a', glow: 6 }),
      txt('RECORD A · LIBRARY CARD (person:lena)', -835, -180, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '"Lena wrote River Walk." -> ref: book:river',
        -835,
        -132,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      // Candidate 1: Book record (strictly withheld publisher until subject-intro-publisher!)
      glassCell(
        -640,
        24,
        450,
        156,
        sc > 0.4 ? COSMOS.emerald : sb > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: sc > 0.4 ? '#0e2824' : '#181e34',
          glow: sc > 0.4 ? 10 : 3,
        },
      ),
      txt('BOOK: "River Walk"', -835, -22, 26, COSMOS.emerald, 'mono', 'left'),
      txt('ID: book:river', -835, 22, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        pub > 0.4 ? 'Publisher: Willow Press' : 'Publisher: [closed]',
        -835,
        64,
        26,
        pub > 0.4 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),

      // Candidate 2: Park record (same surface name, different typed ID!)
      glassCell(-170, 24, 450, 156, sp > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#24121c',
        glow: sp > 0.3 && sc < 0.4 ? 7 : 2,
      }),
      txt('PARK: "River Walk"', -365, -22, 26, COSMOS.rose, 'mono', 'left'),
      txt('ID: place:river', -365, 22, 26, COSMOS.amber, 'mono', 'left'),
      txt('Different type -> separate!', -365, 64, 26, COSMOS.muted, 'sans', 'left'),

      // Bottom prompt / verdict strip (strict c.after withholding!)
      glassCell(-405, 206, 920, 128, pub > 0.4 ? COSMOS.emerald : COSMOS.gold, {
        fill: pub > 0.4 ? '#0e2824' : '#231c10',
        glow: pub > 0.4 ? 9 : 3,
      }),
      txt(
        pub > 0.4
          ? '2-HOP PATH: A (Lena->book:river) + B (Willow Press)'
          : sc > 0.4
            ? 'MATCHED ID: book:river -> Opening record B...'
            : 'WHICH CATALOGUE ID MATCHES LENA’S CARD?  ?',
        -835,
        178,
        26,
        pub > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Store typed relations so search fetches both source records',
        -835,
        226,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right 3D caption
      txt('3D KNOWLEDGE CONSTELLATION', 555, -252, 26, COSMOS.emerald, 'mono'),
      txt('Typed entities + community summaries', 555, 258, 26, COSMOS.gold, 'mono'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Matching typed IDs disambiguates shared names and links separate records into one evidence chain',
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

  s.add(bgAura, title, graph3d.view, live);
  runPhase(s, c, phase, 14);
  graph3d.orbit(s, c);

  c.on('subject-intro-book-entry', () => s.play(showBook.to(1, { duration: 0.35 })));
  c.on('subject-intro-park-entry', () => s.play(showPark.to(1, { duration: 0.35 })));
  c.on('subject-intro-which-record', () => s.play(showBook.to(1, { duration: 0.25 })));
  c.after('subject-intro-choose-book', () => s.play(showChoose.to(1, { duration: 0.4 })));
  c.on('subject-intro-open', () => s.play(showChoose.to(1, { duration: 0.25 })));
  c.after('subject-intro-publisher', () =>
    s.play(showPub.to(1, { duration: remainDuration(c, 'subject-intro-publisher', 0.45) })),
  );
}
