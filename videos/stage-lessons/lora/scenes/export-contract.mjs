// Scene 29: Save the adapter before unloading its path: Save standalone -> merge_and_unload mutates base -> 2x2 [[2,1],[5,2]] parity -> QLoRA BF16 export re-eval.
import {
  COSMOS,
  EXAMPLE,
  FWD_SCALE2,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  matrixGrid,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function exportContract(s, c) {
  const phase = s.value(0);
  const step1 = s.value(0);
  const savedFirst = s.value(0);
  const mutatedBase = s.value(0);
  const step2 = s.value(0);
  const parityOut = s.value(0);
  const step3 = s.value(0);
  const reeval = s.value(0);

  const bgAura = aura(0, 10, 620, '#6ee7b71e', '#ffd16618');
  const title = heroTitle(['Save the Adapter', 'Before Merging'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'EXPORT & RE-EVALUATION CONTRACT',
  });

  const live = guardedDynamic(1, () => {
    const s1 = Math.max(step1.value, savedFirst.value);
    const mut = mutatedBase.value;
    const pOut = parityOut.value;
    const s3 = step3.value;
    const re = reeval.value;

    const nodes = [
      // Top workflow pipeline: 3 stages
      glassCell(-580, -135, 480, 185, s1 > 0.2 ? COSMOS.gold : COSMOS.blue, {
        fill: '#1e1a11',
        glow: s1 > 0.2 ? 10 : 4,
      }),
      txt('1. SAVE STANDALONE FIRST', -580, -190, 26, COSMOS.gold, 'mono'),
      txt('model.save_pretrained()', -580, -130, 28, COSMOS.ink, 'mono'),
      txt('Preserves rollback + clean base ID', -580, -78, 26, COSMOS.muted, 'sans'),

      arrow([-328, -135], [-248, -135], { stroke: COSMOS.gold, width: 4.5, tip: 13 }),

      glassCell(0, -135, 480, 185, mut > 0.2 ? COSMOS.amber : COSMOS.cyan, {
        fill: '#231a12',
        glow: mut > 0.2 ? 10 : 4,
      }),
      txt('2. MERGE & UNLOAD', 0, -190, 26, COSMOS.amber, 'mono'),
      txt('dense = merge_and_unload()', 0, -130, 28, COSMOS.ink, 'mono'),
      txt('Mutates wrapped base in place', 0, -78, 26, COSMOS.amber, 'sans'),

      arrow([252, -135], [332, -135], { stroke: COSMOS.emerald, width: 4.5, tip: 13 }),

      glassCell(580, -135, 480, 185, pOut > 0.2 ? COSMOS.emerald : COSMOS.blue, {
        fill: '#0e2528',
        glow: pOut > 0.2 ? 10 : 4,
      }),
      txt('3. EVAL PARITY CHECK', 580, -190, 26, COSMOS.emerald, 'mono'),
      txt('dropout off · float tol', 580, -130, 28, COSMOS.ink, 'mono'),
      txt(
        pOut > 0.3 ? 'Dense matches [5, 12]' : 'Compare dense vs adapter',
        580,
        -78,
        26,
        COSMOS.emerald,
        'sans',
      ),

      // Bottom-left: Exact 2x2 verification check
      glassCell(-445, 185, 810, 315, step2.value > 0.2 ? COSMOS.cyan : '#334268', {
        fill: '#10192e',
        glow: pOut > 0.2 ? 9 : 4,
      }),
      txt('EXACT 2×2 MERGED CHECK', -445, 62, 26, COSMOS.cyan, 'mono'),
      matrixGrid(FWD_SCALE2.merged, -650, 182, {
        cellW: 94,
        cellH: 72,
        color: COSMOS.emerald,
        fontSize: 32,
      }),
      txt(`× [${EXAMPLE.x.join(', ')}]ᵀ`, -405, 182, 30, COSMOS.ink, 'mono'),
      txt(
        pOut > 0.3 ? `= [${FWD_SCALE2.output.join(', ')}]ᵀ` : '= ?',
        -185,
        182,
        34,
        pOut > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).glow(pOut > 0.3 ? 7 : 0, COSMOS.emerald),
      txt('Matches base [4, 10] + correction [1, 2]', -445, 316, 26, COSMOS.muted, 'sans'),

      // Bottom-right: QLoRA -> BF16 reload divergence warning
      glassCell(445, 185, 810, 315, re > 0.2 ? COSMOS.rose : s3 > 0.2 ? COSMOS.gold : '#334268', {
        fill: s3 > 0.2 ? '#231420' : '#11182c',
        glow: re > 0.2 ? 10 : 4,
      }),
      txt('QUANTIZED BASE -> BF16 EXPORT', 445, 68, 26, COSMOS.rose, 'mono'),
      glowDot(80, 142, { radius: 6, color: COSMOS.rose }),
      txt('4-bit training base != BF16 export base', 110, 142, 28, COSMOS.ink, 'sans', 'left'),
      glowDot(80, 206, { radius: 6, color: COSMOS.gold }),
      txt('Re-evaluate merged BF16 export separately', 110, 206, 28, COSMOS.gold, 'sans', 'left'),
      glowDot(80, 270, { radius: 6, color: COSMOS.cyan }),
      txt('Re-evaluate any re-quantized export too', 110, 270, 28, COSMOS.cyan, 'sans', 'left'),
      txt(
        'Resume training from training checkpoint, not merged export',
        445,
        322,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('export-contract-1', () => s.play(step1.to(1, { duration: 0.35 })));
  c.on('export-save', () => s.play(savedFirst.to(1, { duration: 0.4 })));
  c.on('export-mutate', () => s.play(mutatedBase.to(1, { duration: 0.4 })));
  c.on('export-contract-2', () => s.play(step2.to(1, { duration: 0.35 })));
  c.on('export-output', () => s.play(parityOut.to(1, { duration: 0.45 })));
  c.on('export-contract-3', () => s.play(step3.to(1, { duration: 0.4 })));
  c.on('export-reevaluate', () =>
    s.play(reeval.to(1, { duration: remainDuration(c, 'export-reevaluate', 0.45) })),
  );
}
