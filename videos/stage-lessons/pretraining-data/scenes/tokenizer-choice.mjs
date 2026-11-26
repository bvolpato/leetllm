// Scene 17: Count both the token stream and its vocabulary rows: 3D V x d embedding slabs, 3 tokenizer families, and frozen shard contract.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  photonStream,
  prism3d,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tokenizerChoice(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const matrixOn = s.value(0);

  const showPart2 = s.value(0);
  const algoOn = s.value(0);

  const showPart3 = s.value(0);
  const freezeOn = s.value(0);
  const spaceOn = s.value(0);

  // 3D Input V x d and Output V x d vocabulary slabs
  const vocab3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.0,
    unit: 110,
    focus: [0, 0, 0.2],
  }).at(390, 20);

  vocab3d.add(
    ...prism3d(-2.5, -1.2, -1.2, 1.8, 2.4, 2.4, '#142a57', COSMOS.blue, 0.72),
    ...prism3d(0.7, -1.2, -1.2, 1.8, 2.4, 2.4, '#0d2c3a', COSMOS.cyan, 0.72),
  );

  const bgAura = aura(390, 20, 500, '#19326b2a', '#5ce1e614');

  const eqStorage = glowTex(
    String.raw`\text{Untied storage} = 2 \times V \times d \times \text{bytes}`,
    {
      x: -440,
      y: 165,
      size: 40,
      color: COSMOS.gold,
    },
  );

  const part1Live = guardedDynamic(showPart1, (a) => {
    const mx = matrixOn.value;
    const nodes = [
      heroTitle(['Vocabulary Size', '& Matrix Cost'], {
        x: -855,
        y: -430,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'TOKENIZATION · INPUT & LM-HEAD EMBEDDINGS',
      }).opacity(a),

      txt('3D EMBEDDING & LM-HEAD SLABS (V x d)', 390, -395, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('Blue: Input V x d  ·  Cyan: Output V x d', 390, 415, 26, COSMOS.muted, 'mono').opacity(
        a,
      ),

      txt('EACH DENSE VOCABULARY MATRIX', -855, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('V rows x d width', -855, -95, 48, COSMOS.blue, 'mono', 'left')
        .glow(6, COSMOS.blue)
        .opacity(a),
      txt(
        'Larger V compresses sequence length but grows input & output tables',
        -855,
        -10,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),
      txt(
        'Weight tying shares one V x d table and halves vocabulary storage',
        -855,
        305,
        28,
        COSMOS.emerald,
        'sans',
        'left',
      ).opacity((0.35 + 0.65 * mx) * a),
    ];
    return group(...nodes);
  });

  // Part 2: Three tokenizer families (Byte-level BPE, WordPiece, Unigram)
  const part2Live = guardedDynamic(showPart2, (a) => {
    const al = algoOn.value;
    const fams = [
      {
        name: 'Byte-level BPE',
        step1: '256 UTF-8 byte seeds',
        step2: 'Merge frequent adjacent pairs',
        color: COSMOS.blue,
        x: -570,
      },
      {
        name: 'WordPiece',
        step1: 'Learned subword vocab',
        step2: 'Greedy longest-match split',
        color: COSMOS.cyan,
        x: 0,
      },
      {
        name: 'Unigram',
        step1: 'Fit piece probabilities',
        step2: 'Prune low-value candidates',
        color: COSMOS.violet,
        x: 570,
      },
    ];

    const nodes = [
      txt(
        'TOKENIZER FAMILIES · SENTENCEPIECE SUPPORTS BPE & UNIGRAM',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Three Segmentation Algorithms', -855, -350, 54, COSMOS.ink, 'serif', 'left').opacity(a),
    ];

    fams.forEach((f) => {
      nodes.push(
        glassCell(f.x, -40, 510, 290, f.color, { fill: '#10182d', glow: 8, opacity: a }),
        txt(f.name, f.x, -125, 36, f.color, 'serif').opacity(a),
        txt(f.step1, f.x, -38, 28, COSMOS.ink, 'sans').opacity(a),
        txt(f.step2, f.x, 38, 28, COSMOS.muted, 'sans').opacity(a),
      );
    });

    if (al > 0.02) {
      nodes.push(
        glassCell(0, 245, 1180, 108, COSMOS.gold, { fill: '#1a1822', glow: 9, opacity: al * a }),
        txt(
          'Pre-tokenization sets allowed merge boundaries',
          0,
          247,
          32,
          COSMOS.gold,
          'sans',
        ).opacity(al * a),
      );
    }

    return group(...nodes);
  });

  // Part 3: Frozen tokenizer contract + leading-space token (" word")
  const part3Live = guardedDynamic(showPart3, (a) => {
    const fr = freezeOn.value;
    const sp = spaceOn.value;
    const ph = phase.value;
    const fields = ['Normalization', 'Merge ranks', 'Revision hash', 'Special IDs'];

    const nodes = [
      txt(
        'FREEZE BEFORE WRITING TRAINING SHARDS',
        -855,
        -425,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Shard IDs Bind to Tokenizer Revision',
        -855,
        -350,
        50,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),
    ];

    fields.forEach((f, i) => {
      const fx = -615 + i * 410;
      nodes.push(
        glassCell(fx, -120, 365, 118, COSMOS.cyan, {
          fill: '#0f1c30',
          glow: 4 + fr * 6,
          opacity: a,
        }),
        txt(f, fx, -118, 30, COSMOS.cyan, 'mono').opacity(a),
        ...photonStream([fx, -58], [0, 70], 20, ph + i * 0.5, {
          color: COSMOS.emerald,
          count: 2,
          opacity: fr * a,
        }),
      );
    });

    const frOp = (0.48 + 0.52 * fr) * a;
    const spOp = (0.48 + 0.52 * sp) * a;
    nodes.push(
      glassCell(0, 118, 1220, 96, fr > 0.3 ? COSMOS.emerald : '#34496e', {
        fill: '#0e2422',
        glow: fr > 0.3 ? 9 : 3,
        opacity: frOp,
      }),
      txt(
        'FROZEN CONTRACT -> IMMUTABLE SHARD TOKEN IDs',
        0,
        120,
        32,
        fr > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(frOp),
      glassCell(-360, 295, 220, 96, sp > 0.3 ? COSMOS.gold : '#3a4a70', {
        fill: '#241e12',
        glow: sp > 0.3 ? 9 : 2,
        opacity: spOp,
      }),
      txt('"·word"', -360, 297, 36, sp > 0.3 ? COSMOS.gold : COSMOS.muted, 'mono').opacity(spOp),
      txt(
        'Leading space attached inside piece (tiktoken)',
        -195,
        297,
        30,
        sp > 0.3 ? COSMOS.ink : COSMOS.muted,
        'sans',
        'left',
      ).opacity(spOp),
      txt(
        'Measure compression on code & target languages (Llama 3: 3.17 -> 3.94 chars/tok)',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(spOp),
    );

    return group(...nodes);
  });

  s.add(bgAura, vocab3d, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 14);
  orbitScene(
    s,
    c,
    vocab3d,
    { theta: -0.22, phi: 0.94 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - c.beats[1].start + 0.4) },
  );

  c.on('pt-tokenizer-choice-matrix', () =>
    s.play(matrixOn.to(1, { duration: remainDuration(c, 'pt-tokenizer-choice-matrix', 0.6) })),
  );
  c.show('pt-tokenizer-choice-matrix', eqStorage, { fade: 0.35 });

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide(1, [vocab3d, eqStorage], { fade: 0.2 });

  c.on('pt-tokenizer-choice-algorithms', () =>
    s.play(algoOn.to(1, { duration: remainDuration(c, 'pt-tokenizer-choice-algorithms', 0.6) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-tokenizer-choice-freeze', () =>
    s.play(freezeOn.to(1, { duration: remainDuration(c, 'pt-tokenizer-choice-freeze', 0.6) })),
  );
  c.on('pt-tokenizer-choice-space', () =>
    s.play(spaceOn.to(1, { duration: remainDuration(c, 'pt-tokenizer-choice-space', 0.6) })),
  );
}
