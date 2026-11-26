// Scene 11: What supports the next sentence? (Self-RAG reflection token families)
import {
  COSMOS,
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

export default function selfRagTokens(s, c) {
  const phase = s.value(0);
  const showRetrieve = s.value(0);
  const showRel = s.value(0);
  const showWrite = s.value(0);
  const showSup = s.value(0);
  const showUse = s.value(0);
  const showTrained = s.value(0);

  const bgAura = aura(0, 10, 720, '#10345c26', '#281a5218');
  const title = heroTitle(['What Supports the', 'Next Sentence?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.violet,
    eyebrow: 'SELF-RAG · INLINE REFLECTION TOKENS DURING DECODING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sRet = showRetrieve.value;
    const sRel = showRel.value;
    const sWrt = showWrite.value;
    const sSup = showSup.value;
    const sUse = showUse.value;
    const sTrn = showTrained.value;
    const pulse = 0.74 + 0.26 * Math.sin(p * 3.8);

    const fetched = sRet > 0.5;
    const relevant = sRel > 0.4;
    const written = sWrt > 0.4;
    const supported = sSup > 0.5;
    const utility = sUse > 0.5;
    const trained = sTrn > 0.4;

    const nodes = [
      // Left-main flow: Question -> Source E1 -> Candidate Segment
      txt('AUTOREGRESSIVE SELF-RAG STEP', -855, -214, 26, COSMOS.cyan, 'mono', 'left'),

      // Step 1: Question & Retrieve gate
      glassCell(-295, -124, 1120, 116, fetched ? COSMOS.gold : COSMOS.blue, {
        fill: '#10203a',
        glow: fetched ? 8 : 3,
      }),
      txt(
        'Question: "Can we increase throughput for launch week?"',
        -830,
        -152,
        27,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        fetched ? '[Retrieve = Yes]' : '[Retrieve = ?]',
        -830,
        -100,
        30,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt('No = skip   ·   Continue = reuse', -450, -100, 26, COSMOS.muted, 'sans', 'left'),

      // Step 2: Retrieved Passage E1 + ISREL
      glassCell(-295, 34, 1120, 146, relevant ? COSMOS.cyan : fetched ? COSMOS.blue : COSMOS.dim, {
        fill: relevant ? '#0f2338' : '#11182c',
        glow: relevant ? 9 * pulse : 2,
      }),
      txt('SOURCE E1 (RETRIEVED PASSAGE)', -830, -12, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        fetched
          ? '"Temporary quota increases require approval. Keep exponential backoff enabled."'
          : 'Waiting for retrieval decision...',
        -830,
        36,
        26,
        fetched ? COSMOS.ink : COSMOS.dim,
        'sans',
        'left',
      ),
      txt(
        relevant ? '[ISREL = Relevant]' : '[ISREL = pending]',
        -830,
        82,
        28,
        relevant ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'left',
      ),

      // Step 3: Candidate Segment + ISSUP + ISUSE
      glassCell(
        -295,
        206,
        1120,
        152,
        supported ? COSMOS.emerald : written ? COSMOS.violet : COSMOS.dim,
        {
          fill: supported ? '#0d2723' : '#11182c',
          glow: supported ? 9 * pulse : 2,
        },
      ),
      txt('GENERATED SEGMENT', -830, 156, 26, COSMOS.violet, 'mono', 'left'),
      txt(
        written ? '"Request approval for a temporary increase."' : 'Next sentence pending...',
        -830,
        204,
        28,
        written ? COSMOS.ink : COSMOS.dim,
        'sans',
        'left',
      ),
      txt(
        supported ? '[ISSUP = Fully Supported]' : '[ISSUP = ?]',
        -830,
        254,
        28,
        supported ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        utility ? '[ISUSE = 4 / 5]' : '[ISUSE = ?]',
        -290,
        254,
        28,
        utility ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),

      // Right column: 4 Reflection Token Families dial stack
      txt('4 REFLECTION FAMILIES', 345, -214, 26, COSMOS.violet, 'mono', 'left'),
    ];

    const families = [
      { tag: '1. Retrieve', val: fetched ? 'Yes' : '?', col: COSMOS.gold, active: fetched },
      { tag: '2. ISREL', val: relevant ? 'Relevant' : '?', col: COSMOS.cyan, active: relevant },
      { tag: '3. ISSUP', val: supported ? 'Fully' : '?', col: COSMOS.emerald, active: supported },
      { tag: '4. ISUSE', val: utility ? '4 / 5' : '?', col: COSMOS.violet, active: utility },
    ];

    families.forEach((f, idx) => {
      const y = -126 + idx * 108;
      nodes.push(
        glassCell(590, y, 510, 86, f.active ? f.col : COSMOS.dim, {
          fill: f.active ? '#122238' : '#101729',
          glow: f.active ? 8 : 2,
          radius: 10,
        }),
        txt(f.tag, 360, y + 2, 28, f.active ? f.col : COSMOS.muted, 'mono', 'left'),
        txt(f.val, 820, y + 2, 28, f.active ? COSMOS.ink : COSMOS.dim, 'mono', 'right'),
      );
      if (idx < 3) {
        nodes.push(
          glowingArc([590, y + 43], [590, y + 65], 0, {
            color: f.active ? f.col : COSMOS.dim,
            width: 3,
            opacity: f.active ? 0.85 : 0.3,
            glow: 6,
          }),
        );
      }
    });

    const bottomCol = trained ? COSMOS.violet : supported ? COSMOS.emerald : COSMOS.gold;
    const bottomMsg = trained
      ? 'Trained Self-RAG predicts tokens inline; calling a separate LLM is a prompted critique loop'
      : 'Check predicted reflection tokens directly against the source wording in E1';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.after('reflection-retrieve', () => s.play(showRetrieve.to(1, { duration: 0.45 })));
  c.on('reflection-relevance', () => s.play(showRel.to(1, { duration: 0.4 })));
  c.on('reflection-write', () => s.play(showWrite.to(1, { duration: 0.4 })));
  c.on('reflection-families', () => s.play(showSup.to(1, { duration: 0.45 })));
  c.on('reflection-utility', () => s.play(showUse.to(1, { duration: 0.45 })));
  c.on('reflection-trained', () =>
    s.play(showTrained.to(1, { duration: remainDuration(c, 'reflection-trained', 0.45) })),
  );
}
