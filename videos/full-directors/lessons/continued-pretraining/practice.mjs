import { FRESH_CHECKPOINTS } from '../../../films/continued-pretraining/fixtures.mjs';
import { mixtureReduction, selectedPackage } from '../../../films/continued-pretraining/model.mjs';
import {
  C,
  base,
  beat,
  cue,
  rect,
  line,
  text,
  mono,
  serif,
  chip,
  heading,
  arrow,
  sheet,
} from './studio.mjs';
import { ledger } from './evaluation.mjs';
import { recipe } from './field.mjs';

export function adapterPath(B) {
  const x = 2,
    W = 3,
    A = 1;
  return { base: W * x, adapter: B * A * x, sum: W * x + B * A * x };
}
export function parameters(g, k) {
  base(g);
  const b = beat(k);
  if (b >= 5) {
    const pkg = selectedPackage();
    heading(g, 'SAVED CHECKPOINT   /   ' + pkg.checkpoint, 'What do we need to resume this run?');
    sheet(g, 111, 319, 828, 584);
    sheet(g, 981, 319, 828, 584);
    serif(g, 'Rebuild the comparison', 149, 405, 55, C.sea);
    serif(g, 'Continue the run', 1021, 405, 55, C.clay);
    const left = [
      'Model weights + configuration',
      'Tokenizer   ' + pkg.tokenizer,
      'Corpus manifest   ' + pkg.manifest.join(', '),
      'SHA-256   ' + pkg.corpusHash.slice(0, 12) + '…',
      'Evaluation protocol + token counts',
    ];
    const right = [
      'Optimizer moments',
      'm   [' + pkg.optimizer.m.join(', ') + ']',
      'v   [' + pkg.optimizer.v.join(', ') + ']',
      'Scheduler step + RNG states',
      'Domain and replay loader cursors',
    ];
    left.forEach((s, i) => text(g, s, 150, 501 + i * 80, 37));
    if (cue(k, 5, 'To resume exactly')) right.forEach((s, i) => text(g, s, 1022, 501 + i * 80, 37));
    return;
  }
  if (b >= 3) {
    heading(g, 'TRAINING STAGES', 'Which signal did each stage use?');
    const histories =
      b === 3
        ? [['Code Llama Instruct', 'Code text', 'Instruction examples']]
        : [
            ['Code Llama Instruct', 'Code text', 'Instruction examples'],
            ['Llama 3 code expert', 'CPT → SFT → DPO', 'Annotations + synthetic data'],
          ];
    histories.forEach(([name, a, c], i) => {
      const y = 321 + i * 260;
      serif(g, name, 116, y + 66, 48);
      chip(g, a, 653, y, 440, 104, C.pale);
      arrow(g, 1110, y + 54, 1210, y + 54);
      chip(g, c, 1235, y, 575, 104, C.sun, C.ink, 37);
    });
    text(g, 'Choose the objective, then select trainable parameters.', 115, 952, 44, C.sea);
    return;
  }
  heading(g, 'LOW-RANK ADAPTATION', 'Where can the update go?');
  mono(g, 'Input  x', 122, 547, 57);
  arrow(g, 406, 519, 644, 369, C.sea);
  arrow(g, 406, 519, 644, 674, C.clay);
  chip(g, 'Frozen base   W₀x', 657, 314, 580, 110, C.pale);
  chip(g, 'Adapter   B(Ax)', 657, 630, 580, 110, C.rose);
  arrow(g, 1253, 366, 1456, 509, C.sea);
  arrow(g, 1253, 684, 1456, 527, C.clay);
  serif(g, 'Sum', 1491, 552, 87);
  text(g, 'QLoRA stores the frozen base in quantized form.', 110, 878, 45, C.sea);
  if (b === 2) {
    const B = 0.5 * cue(k, 2, 'moves B from zero', 1.2),
      v = adapterPath(B);
    mono(g, 'x = 2', 125, 622, 34, C.muted);
    mono(g, '3 × 2 = ' + v.base, 677, 495, 39, C.sea);
    mono(g, 'B = ' + B.toFixed(2) + '    A = 1', 677, 803, 36, C.clay);
    mono(
      g,
      v.base + ' + ' + v.adapter.toFixed(2) + ' = ' + v.sum.toFixed(2),
      1450,
      650,
      38,
      C.ink,
      'left',
      355,
    );
    text(g, 'The frozen base still contributes six.', 111, 955, 37, C.muted);
  }
}

export const practiceBatch = mixtureReduction(4, 2, 3, 1);
export function weighting(k) {
  const equalBlocks = cue(k, 3, 'Replay jumps to a third') && !cue(k, 3, 'Restore equal weight');
  const { blockShare, targetShare, blockGradient, pooledGradient } = practiceBatch;
  return {
    equalBlocks,
    share: equalBlocks ? blockShare : targetShare,
    gradient: equalBlocks ? blockGradient : pooledGradient,
    domainWeight: equalBlocks ? 1 / 18 : 1 / 14,
    replayWeight: equalBlocks ? 1 / 6 : 1 / 14,
  };
}
export const sampleReplies = [
  {
    reply: ['Wait exactly one second.', 'Reuse the same idempotency token.'],
    jitter: false,
    sameToken: true,
  },
  {
    reply: ['Randomize the retry delay.', 'Reuse the same idempotency token.'],
    jitter: true,
    sameToken: true,
  },
];
export function practice(g, k) {
  base(g);
  const b = beat(k);
  if (b <= 3) {
    heading(g, 'FRESH WINDOW   /   SHARED LOGIT ZERO', 'Which targets get a vote?');
    const v = weighting(k),
      answered = cue(k, 2, 'Replay gets one seventh');
    let col = 0;
    for (let b = 0; b < 6; b++) {
      const replay = b >= 4,
        n = replay ? 1 : 3,
        x = 110 + col * 112 + b * 18;
      mono(g, (replay ? 'R' : 'F') + (replay ? b - 3 : b + 1), x, 369, 35, replay ? C.clay : C.sea);
      const height = answered ? 1550 * (replay ? v.replayWeight : v.domainWeight) : 82;
      for (let i = 0; i < n; i++)
        rect(g, x + i * 112, 680 - height, 96, height, replay ? C.clay : C.sea, 5);
      line(g, x, 704, x + n * 112 - 14, 704, C.ink, 3);
      col += n;
    }
    text(g, 'Field target  −0.5', 114, 797, 40, C.sea);
    text(g, 'Replay target  +0.5', 1807, 797, 40, C.clay, 'Sans', 'right');
    if (answered) {
      mono(
        g,
        (v.equalBlocks ? 'Equal block means' : 'Equal targets') +
          '     Replay ' +
          (v.equalBlocks ? '2/6' : '2/14'),
        114,
        891,
        41,
      );
      if (cue(k, 2, 'Divide by fourteen'))
        mono(
          g,
          'Mean gradient  ' + (v.equalBlocks ? '−1/6' : '−5/14') + '  ≈  ' + v.gradient.toFixed(3),
          114,
          972,
          40,
        );
    } else text(g, 'Pool the targets. What share belongs to replay?', 110, 945, 47);
    return;
  }
  if (b <= 7) {
    heading(
      g,
      'FRESH CHECKPOINTS    /    BASE GENERAL PPL 18',
      'Which candidate earns the reserved incidents?',
    );
    ledger(g, k, {
      rows: FRESH_CHECKPOINTS,
      base: 18,
      budget: 1,
      domain: [18, 19.35],
      showCeiling: cue(k, 4, 'allowed rise is one'),
      visible: 3 * cue(k, 4, 'Here are three candidates'),
      gated: cue(k, 6, 'B crosses the ceiling'),
      ranked: cue(k, 7, 'Choose C'),
    });
    return;
  }
  if (b === 8) {
    heading(
      g,
      'RESERVED INCIDENT    /    AUTH_TIMEOUT',
      'Both assistants receive the same runbook',
    );
    return recipe(g, 'Base', 'Checkpoint C');
  }
  heading(
    g,
    'RESERVED INCIDENT   /   EXAMPLE REPLIES',
    'Which replies meet both runbook requirements?',
  );
  sampleReplies.forEach((r, i) => {
    const x = 106 + i * 913;
    sheet(g, x, 309, 803, 543);
    mono(g, 'Reply ' + (i + 1), x + 34, 383, 37, C.sea);
    r.reply.forEach((s, j) => serif(g, s, x + 34, 493 + j * 74, 43, C.ink, 'left', 742));
    line(g, x + 34, 622, x + 757, 622, C.rule, 2);
    const token = cue(k, 10, 'Both replies reuse the token'),
      jitter = cue(k, 10, 'Only the second one');
    text(g, 'Reuse token', x + 34, 695, 36);
    mono(
      g,
      token ? (r.sameToken ? 'PASS' : 'MISS') : '?',
      x + 729,
      695,
      38,
      token ? C.forest : C.muted,
      'right',
    );
    text(g, 'Jittered retry', x + 34, 786, 36);
    mono(
      g,
      jitter ? (r.jitter ? 'PASS' : 'MISS') : '?',
      x + 729,
      786,
      38,
      jitter ? (r.jitter ? C.forest : C.clay) : C.muted,
      'right',
    );
  });
  if (cue(k, 10, 'Score both assistants this way'))
    text(
      g,
      'Compare scores across reserved cases, then check retained abilities.',
      111,
      964,
      42,
      C.sea,
    );
}
