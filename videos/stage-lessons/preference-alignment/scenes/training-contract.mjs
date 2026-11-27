// Scene 23: A pair-loss evaluation is a different measurement from new answers (Offline DPO config vs Live blind generation eval)
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function trainingContract(s, c) {
  const phase = s.value(0);
  const sCfg = s.value(0);
  const sAudit = s.value(0);
  const sStored = s.value(0);
  const sGen = s.value(0);

  const bgAura = aura(0, 20, 620, '#14385c26', '#123e3622');
  const title = heroTitle(['Pair-Loss Evaluation Differs', 'From Judging New Answers'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'DPO TRAINING CONTRACT · STORED PAIR METRICS vs FRESH BLIND GENERATIONS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const cf = Math.max(0.75, sCfg.value);
    const au = sAudit.value;
    const st = sStored.value;
    const gn = sGen.value;

    const nodes = [
      // LEFT LANE: Offline Training & Pair-Loss Eval
      glassCell(-445, 25, 790, 446, st > 0.2 ? COSMOS.cyan : COSMOS.blue, {
        fill: '#0e192e',
        glow: cf > 0.5 ? 7 : 4,
      }),
      txt('1. PREPARED PAIR TRAINING & EVAL', -445, -148, 28, COSMOS.cyan, 'mono'),

      glassCell(-445, -56, 730, 92, COSMOS.cyan, { fill: '#10243d', glow: 4, opacity: cf }),
      txt('beta=0.1 · lr=5e-6 · max_len=2048 · 10 steps', -445, -54, 26, COSMOS.ink, 'mono'),

      glassCell(-445, 58, 710, 92, au > 0.2 ? COSMOS.gold : COSMOS.dim, {
        fill: '#181c2e',
        glow: au > 0.2 ? 8 * pulse : 3,
      }),
      txt('Audit collated counts, frozen ref, precision & VRAM', -445, 60, 26, COSMOS.gold, 'sans'),

      glassCell(-445, 172, 710, 92, COSMOS.blue, { fill: '#121d36', glow: 5 }),
      txt('Scores FIXED replies already in each eval row', -445, 174, 26, COSMOS.cyan, 'sans'),

      // Center artifact handoff arrow (saved weights + tokenizer)
      line([-42, 25], [42, 25], { stroke: COSMOS.gold, width: 4 }),

      // RIGHT LANE: Independent Generation & Blind Human Eval
      glassCell(445, 25, 790, 446, gn > 0.2 ? COSMOS.emerald : COSMOS.dim, {
        fill: gn > 0.2 ? '#0d2420' : '#111626',
        glow: gn > 0.2 ? 10 * pulse : 4,
      }),
      txt(
        '2. INDEPENDENT NEW-ANSWER EVAL',
        445,
        -148,
        28,
        gn > 0.2 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),

      glassCell(445, -56, 710, 92, au > 0.2 ? COSMOS.emerald : COSMOS.dim, {
        fill: '#0e2624',
        glow: au > 0.2 ? 7 : 3,
      }),
      txt('Save UPDATED WEIGHTS + SFT TOKENIZER together', 445, -54, 26, COSMOS.ink, 'sans'),

      glassCell(445, 58, 710, 92, gn > 0.2 ? COSMOS.emerald : COSMOS.dim, {
        fill: '#102824',
        glow: gn > 0.2 ? 9 * pulse : 3,
      }),
      txt('Sample FRESH replies from both checkpoints', 445, 60, 26, COSMOS.emerald, 'sans'),

      glassCell(445, 172, 710, 92, gn > 0.2 ? COSMOS.gold : COSMOS.dim, {
        fill: '#221c0e',
        glow: gn > 0.2 ? 9 * pulse : 3,
      }),
      txt(
        'Independent blind reviewers · same rubric & decoding',
        445,
        174,
        26,
        COSMOS.gold,
        'sans',
      ),

      // Bottom summary
      txt(
        gn > 0.3
          ? 'Stored pair loss measures ranking of old text; blind human eval measures real generation preference'
          : 'Inspect every collated pair and artifact before interpreting any DPO training curve',
        0,
        366,
        28,
        gn > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('training-contract-b0', () =>
    s.play(sCfg.to(1, { duration: remainDuration(c, 'training-contract-b0', 0.5) })),
  );
  c.on('training-contract-b1', () =>
    s.play(sAudit.to(1, { duration: remainDuration(c, 'training-contract-b1', 0.55) })),
  );
  c.on('training-contract-b2', () =>
    s.play(sStored.to(1, { duration: remainDuration(c, 'training-contract-b2', 0.5) })),
  );
  c.on('pa-training-generation', () =>
    s.play(sGen.to(1, { duration: remainDuration(c, 'pa-training-generation', 0.6) })),
  );
}
