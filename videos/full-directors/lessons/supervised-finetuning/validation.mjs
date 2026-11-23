import { C, after, key, proofLine } from './printshop.mjs';
import {
  sftResume,
  momentum,
  SFT_CHECKPOINTS,
  sftCheckpointGate,
  finale,
  restoreDrill,
  ignored,
} from './examples.mjs';
import { labelView } from './demonstration.mjs';

export function restart(p, k) {
  const b = k.beat.beatIndex;
  const sgd = b >= 4;
  p.heading(
    sgd ? 'Momentum SGD   /   learning rate 0.1' : 'AdamW   /   learning rate 0.1, decay 0',
    'Restart from the same weight',
  );
  const saved = sgd ? 0.8 : 0.9,
    savedInput = sgd ? 'v = 2' : 'm = 0.2    v = 0.004    step 1';
  if (b === 0) {
    p.note('First gradient  +2', 145, 325);
    const x = (v) => 250 + 12000 * (v - 0.89);
    p.line(x(0.89), 574, x(1.012), 574, C.line, 5);
    const reveal = after(k, 0, 'to about point nine', 0.8);
    p.dot(x(1), 574, 19, reveal ? C.faint : C.gold);
    p.number('1.000', x(1), 510, 52, reveal ? C.faint : C.gold, 'center');
    if (reveal > 0) {
      p.ctx.save();
      p.ctx.globalAlpha = reveal;
      p.arrow(x(1) - 25, 574, x(saved), 574, C.gold);
      p.dot(x(saved), 574, 19, C.gold);
      p.number(saved.toFixed(3), x(saved), 510, 52, C.gold, 'center');
      p.ctx.restore();
    }
    if (reveal === 1) {
      p.note('Saved Adam state', 149, 790);
      p.number(savedInput, 627, 796, 49, C.mint);
    }
    return;
  }
  const result = sgd
    ? after(k, 5, 'the next gradient of one')
    : after(k, 2, 'In the fresh branch');
  const fresh = sgd ? after(k, 5, 'Reset the velocity') : after(k, 2, 'Adam corrects both moments');
  const showRule = !sgd && after(k, 1, 'To update the first moment');
  const showDirection = !sgd && after(k, 1, 'With zero decay');
  const X = sgd ? (v) => 690 + (v - 0.48) * 2900 : (v) => 680 + (v - 0.85) * 6200;
  p.note(
    sgd
      ? 'Next gradient  +1     /     velocity = 0.9 × previous velocity + gradient'
      : 'Next gradient  −1     /     β₁ = 0.9, β₂ = 0.999',
    146,
    sgd ? 330 : 277,
  );
  if (showRule) p.txt('New m = 0.9 × old m + 0.1 × gradient', 143, 352, 48, C.cream);
  if (showDirection) p.note('A positive first moment lowers the weight. A negative one raises it.', 145, 408);
  const history = [savedInput, sgd ? 'v = 0' : 'm = 0    v = 0    step 0'];
  [true, false].forEach((restored, j) => {
    const y = 509 + j * 244,
      c = restored ? C.mint : C.gold;
    p.txt(restored ? 'Restore history' : 'Reset history', 143, y - 20, 49, c, 'Serif');
    p.txt(history[j], 145, y + 36, 30, C.faint, 'Mono', 'left', 468);
    const active = restored ? result : fresh;
    const step = sgd ? momentum(saved, restored ? 2 : 0, 1) : sftResume(restored);
    const value = active ? step.weight : saved;
    p.line(663, y, 1753, y, C.line, 4);
    p.dot(X(saved), y, 14, C.faint);
    if (active) p.arrow(X(saved), y, X(value), y, c, 7);
    p.dot(X(value), y, 13, c);
    p.number(value.toFixed(3), X(value), y - 42, 50, c, 'center');
    p.note(
      active ? (sgd ? 'new velocity  ' + step.velocity.toFixed(1) : 'updated weight') : 'saved weight',
      X(value) - 73,
      y + 63,
      c,
    );
    if (showRule) {
      const showMoment = after(k, 2, restored ? 'That positive moment' : 'That negative moment');
      const expression = '0.9 × ' + (restored ? '0.2' : '0') + ' + 0.1 × (−1)';
      const signed = (step.m < 0 ? '−' : '+') + Math.abs(step.m).toFixed(2);
      p.number(expression + (showMoment ? ' = ' + signed : ''), 663, y + 124, 40, c);
    }
  });
  if (b === 3) p.note('Fresh Adam step   /   corrected first moment −1, second moment 1', 143, 944);
  if (sgd) p.note('weight = saved weight − 0.1 × new velocity', 145, 944);
}
export function restore(p, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    p.heading('Checkpoint contents', 'What travels with the weights?');
    const training = after(k, 0, 'To resume training');
    function folder(x, title, entries, tint) {
      p.box(x, 320, 310, 62, tint, 15);
      p.sheet(x, 359, 757, 535, tint);
      p.txt(title, x + 38, 449, 57, C.ink, 'Serif');
      entries.forEach((v, i) => {
        p.line(x + 37, 488 + i * 72, x + 704, 488 + i * 72, '#9fa79a', 2);
        p.txt(v, x + 41, 538 + i * 72, 34, C.ink);
      });
    }
    folder(
      124,
      'Serve the assistant',
      ['Weights and architecture', 'Tokenizer and template', 'Adapter config + exact base revision'],
      C.paper,
    );
    if (training)
      folder(
        1028,
        'Continue training',
        [
          'Optimizer moments and counters',
          'Schedule and global step',
          'Sampler position and RNG state',
          ...(b
            ? ['Recipe, data and evaluation manifests', 'Best metric and optional loss scaler']
            : []),
        ],
        C.blue,
      );
    return;
  }
  if (b === 2) {
    p.heading('Sampler restore', 'Resume the saved shuffle');
    p.note('Recorded order', 137, 335);
    const resume = after(k, 2, 'Restore the cursor');
    const xs = p.rail(['C', 'A', 'B'], {
      y: 411,
      x: 148,
      w: 1584,
      h: 168,
      fontsize: 87,
      colors: [C.paper, resume ? C.mint : C.paper, C.paper],
    });
    p.note('already used', xs[0] - 80, 668);
    if (resume) {
      p.arrow(xs[1], 803, xs[1], 598);
      p.txt('Next batch', xs[1], 896, 60, C.mint, 'Serif', 'center');
    } else p.txt('Which item comes next?', 142, 875, 60, C.gold, 'Serif');
    return;
  }
  p.heading('Restore drill', 'Compare the very next update');
  const names = ['next batch', 'rate', 'loss', 'gradient', 'new weight'];
  const xs = names.map((_, i) => 490 + i * 275);
  const reset = after(k, 3, 'Reset just the velocity');
  const data = [restoreDrill(true), restoreDrill(!reset)];
  p.note('Uninterrupted', 143, 448, C.mint);
  p.note(reset ? 'Velocity reset' : 'Restored', 143, 687, reset ? C.coral : C.blue);
  [421, 660].forEach((y, r) => {
    p.line(485, y, 1605, y, r ? C.blue : C.mint, 5);
    names.forEach((v, i) => {
      const color = r && reset && i === 4 ? C.coral : r ? C.blue : C.mint;
      p.dot(xs[i], y, 15, color);
      if (!r) p.txt(v, xs[i], y - 62, 36, C.cream, 'Sans', 'center');
      p.number(data[r][i], xs[i], y + 81, 43, color, 'center');
      if (r) p.line(xs[i], 525, xs[i], 638, C.line, 2, [6, 7]);
    });
  });
  p.txt(
    b === 4
      ? 'Mid-window save   /   include partial gradients and microbatch cursor.'
      : 'Checkpoint   /   weight 0.8, velocity 2, momentum 0.9',
    139,
    899,
    48,
    C.cream,
    'Serif',
  );
}
export function memory(p, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    p.heading('Pilot run', 'Which test exercises the export?');
    p.rows(
      [
        ['Trainer evaluation', 'score supplied targets'],
        ['Reloaded serving model', 'generate from request'],
      ],
      138,
      371,
      1640,
      170,
    );
    p.note(
      'Use a small fixture to test example boundaries, even when the full model requires sharding.',
      142,
      877,
    );
    return;
  }
  const stage = after(k, 1, 'stage one') + after(k, 1, 'Stage two') + after(k, 1, 'Stage three');
  p.heading(
    'Memory on one worker',
    stage ? 'ZeRO stage ' + stage + '   /   four workers' : 'What has to fit during training?',
  );
  const labels = ['Weights', 'Gradients', 'Optimizer', 'Activations', 'Buffers'];
  const training = after(k, 0, 'add gradients');
  labels.forEach((v, i) => {
    const x = 158 + 329 * i,
      shard = i < 3 && stage >= 3 - i;
    const blocks = shard ? 1 : 4;
    const color = i < 3 ? C.blue : C.gold;
    if (i === 0 || training) for (let j = 0; j < blocks; j++) p.box(x, 711 - 73 * j, 237, 60, color, 5);
    p.line(x - 10, 790, x + 244, 790, C.line, 4);
    p.txt(v, x + 113, 852, 43, C.cream, 'Sans', 'center');
    if (shard) p.number('¼ share', x + 113, 686, 33, C.mint, 'center');
  });
  p.note('Each stack is relative to its own unsharded allocation. Measure the actual peak.', 153, 968);
}

export function evaluation(p, k) {
  p.heading('Unseen validation incident', '“My service key is 21 days old.”');
  p.note('Policy   /   over 14 days, open a rotation ticket for security review', 138, 303, C.gold);
  p.note('Teacher-forced track', 140, 450, C.blue);
  p.rail(['open'], { x: 660, y: 373, w: 365, h: 108, colors: [C.blue], fontsize: 55 });
  p.arrow(1062, 430, 1181, 430, C.blue);
  p.txt('score “ticket”', 1220, 447, 54, C.blue, 'Serif');
  p.line(141, 547, 1774, 547, C.line, 3);
  p.note('Freely generated track', 139, 677, C.gold);
  const word = after(k, 1, 'the first word is wait'),
    rest = after(k, 1, 'the reply continues');
  p.rail([word ? 'wait' : '…'], {
    x: 660,
    y: 601,
    w: 365,
    h: 108,
    colors: [word ? C.gold : C.slate],
    ink: [word ? C.ink : C.cream],
    fontsize: 55,
  });
  if (rest) {
    p.arrow(1062, 658, 1181, 658, C.gold);
    p.txt('“until next month.”', 1220, 678, 54, C.gold, 'Serif');
  }
  if (rest) proofLine(p, 'Generated action', 'Defers review   /   policy fails', 867, C.coral);
  if (k.beat.beatIndex === 2)
    p.note(
      'Grade format separately. Include ordinary requests to detect unnecessary tickets and refusals.',
      143,
      974,
    );
}
export function checkpoint(p, k) {
  const raised = after(k, 2, 'rises to one hundred percent');
  const floor = raised ? 1 : 0.98;
  const verdict = raised
    ? after(k, 3, 'Only step four hundred qualifies')
    : after(k, 1, 'Step six hundred wins');
  const best = sftCheckpointGate(SFT_CHECKPOINTS, floor);
  p.heading('Generated validation results', 'Which checkpoint earns the next test?');
  p.note(
    'First require valid format ≥ ' + Math.round(floor * 100) + '%. Then maximize policy pass rate.',
    140,
    302,
    C.gold,
  );
  const xs = [190, 552, 892, 1238, 1537],
    heads = ['Step', 'Format', 'Policy pass', 'Ref. loss', 'Decision'];
  heads.forEach((h, i) => p.note(h, xs[i], 419, C.faint));
  SFT_CHECKPOINTS.forEach((row, i) => {
    const y = 510 + i * 122,
      selected = verdict && row.step === best?.step,
      under = row.format < floor;
    const c = selected ? C.mint : C.cream;
    p.line(140, y - 55, 1784, y - 55, C.line, 2);
    if (selected) p.box(132, y - 26, 10, 51, C.mint, 3);
    [
      row.step,
      Math.round(row.format * 100) + '%',
      Math.round(row.policy * 100) + '%',
      row.loss.toFixed(2),
    ].forEach((v, j) => p.number(v, xs[j], y + 10, 47, c));
    if (verdict)
      p.txt(
        selected ? 'Select' : under ? 'Below floor' : 'Eligible',
        xs[4],
        y + 8,
        37,
        selected ? C.mint : under ? C.coral : C.faint,
      );
  });
  if (raised) p.note('At the earlier 98% floor, step 600 won.', 141, 869);
  else p.note('Tie on policy? Use lower reference loss, then earlier step.', 141, 869);
  if (verdict) p.txt('Selected step  ' + best.step, 1781, 966, 56, C.mint, 'Serif', 'right');
}
export function practice(p, k) {
  const b = k.beat.beatIndex;
  if (b >= 4) {
    p.note('Held-out request   /   reloaded export', 125, 106, C.gold);
    key(p, 235, 364, 2.2);
    p.number('22 days', 166, 538, 65, C.gold);
    p.sheet(670, 220, 1118, 394);
    p.note('USER', 719, 294, C.green);
    p.txt('My service key is 22 days old.', 719, 403, 61, C.ink, 'Serif', 'left', 1020);
    p.txt('Can I still use it?', 719, 500, 61, C.ink, 'Serif');
    p.line(137, 699, 1783, 699, C.line, 3);
    p.note('ASSISTANT', 145, 768);
    p.txt('Awaiting the model’s own reply…', 594, 821, 59, C.cream, 'Serif');
    p.note('Grade the ticket, the approval decision and the end of the turn.', 595, 932);
    return;
  }
  const slide = after(k, 1, 'Move the third target', 0.8);
  const fixed = after(k, 1, 'Restore end');
  const f = finale(!!fixed);
  p.heading('Final batch inspection   /   key age 19 days', 'Follow three predictions to their targets');
  const colors = f.tokens.map((v, i) => (i === 8 ? C.blue : C.paper));
  const tc = f.labels.map((v, i) => (i === 8 && v !== ignored ? C.coral : undefined));
  const links = f.links.map((l, i) => ({ ...l, color: i === 2 && !fixed ? C.coral : C.gold }));
  const count = f.links.length;
  p.note('T102-style demonstration', 132, 281);
  p.note('Next incident', 1593, 281, C.blue);
  labelView(p, {
    tokens: f.tokens,
    labels: f.labels,
    links,
    colors,
    targetColors: tc,
    inputY: 365,
    lowerY: 582,
    fontsize: 33,
  });
  const edge = 130 + (1660 * 8) / 9;
  p.line(edge, 290, edge, 727, C.blue, 4, [8, 8]);
  const selector = 130 + ((8.5 - (fixed ? 1 : 0.85 * slide)) * 1660) / 9;
  p.poly(
    [
      [selector, 703],
      [selector - 13, 726],
      [selector + 13, 726],
    ],
    C.gold,
  );
  p.note('Active targets', 132, 810);
  p.number(count, 148, 921, 105, C.mint);
  if (b < 2) {
    const l = f.links.at(-1);
    if (fixed) {
      p.txt('Third pair', 535, 811, 36, C.faint);
      p.txt(f.tokens[l.from] + '  →  ' + f.tokens[l.to], 535, 912, 71, C.mint, 'Serif');
    } else p.txt('Which two labels would you change?', 535, 904, 58, C.cream, 'Serif');
  } else {
    const old = finale(false);
    p.note('Supplied probabilities', 457, 801);
    p.number('Old    ' + old.probabilities.map((v) => v.toFixed(2)).join('   '), 459, 865, 41, C.coral);
    p.number('Fixed  ' + f.probabilities.map((v) => v.toFixed(2)).join('   '), 459, 946, 41, C.mint);
    if (b === 3) {
      p.note('Mean −ln(p)', 1407, 798);
      p.number(old.mean.toFixed(3), 1406, 865, 48, C.coral);
      p.number(f.mean.toFixed(3), 1406, 946, 48, C.mint);
    }
  }
}
