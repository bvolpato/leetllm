import { C, mix, smooth, format } from './studio.mjs';
import {
  choices,
  samples,
  manualSearch,
  listSize,
  validationCount,
  accepted,
  roles,
  large,
  fullSearch,
  small,
  requestCap,
  tokenLoad,
  rollback,
} from './examples.mjs';

export function teacher(p) {
  const { beat, cue, page, lab, mono, txt, title, stamp, edge } = p;
  p.background();
  if (beat === 1 || (beat === 2 && !cue(2, 'What if the grader'))) {
    title('Inside an accepted trace', 65, 114);
    page(68, 202, 1460, 488);
    lab('POLICY', 110, 268);
    mono(rollback.recordId + '  /  roll back payment-tests', 340, 268, 37);
    edge(111, 305, 1359);
    lab('STEP 1', 110, 384);
    txt('“Deployment is covered.”', 341, 384, 45, C.ink, 'Serif');
    if (cue(1, 'Its final reply')) {
      lab('FINAL PAIR', 110, 505);
      mono('ABSTAIN   /   ""', 341, 505, 45);
    }
    if (cue(1, 'The unsupported first step')) {
      stamp('1 / 1', 1228, 449, 190, C.teal);
      lab('Unsupported by policy', 970, 384, C.rust, 28);
    }
    if (beat === 2)
      txt('Collection can stop once the demo slots fill.', 73, 771, 35, C.ivory, 'Serif');
    return;
  }
  if (beat <= 5) {
    title('The bootstrap gate in DSPy 3.4.0', 70, 113);
    const probe = beat >= 4;
    const noMetric = !!cue(4, 'Remove the metric altogether');
    const strict = !!cue(4, 'Try a threshold of one');
    const threshold = strict ? 1 : 0;
    const judged = noMetric
      ? p.end(4)
      : strict
        ? cue(4, 'The same scores')
        : cue(4, 'Those examples');
    const results = accepted([0.5, 0.5], threshold, !noMetric);
    page(71, 195, 1452, 493);
    lab(probe ? 'TWO SUCCESSFUL TEACHER RUNS' : 'PYTHON SCORE TRUTHINESS', 110, 259);
    const values = probe ? ['Rollback', 'Deployment'] : ['0.5', '−0.2', 'NaN'];
    values.forEach((v, i) => {
      const y = 352 + i * 107;
      mono(v, 112, y, 42);
      if (probe) mono(noMetric ? 'unscored' : '0.5', 537, y, 40);
      if ((probe && judged) || beat === 3)
        p.stamp(
          probe ? (results[i] ? 'ADMIT' : 'REJECT') : 'TRUTHY',
          1070,
          y - 52,
          278,
          probe && !results[i] ? C.rust : C.teal,
        );
    });
    if (probe) {
      lab(noMetric ? 'NO METRIC' : strict ? 'SCORE ≥ 1' : 'THRESHOLD 0  /  bool(score)', 110, 614);
      mono((judged ? results.filter(Boolean).length : '?') + ' of 2 enter', 956, 617, 37);
    } else txt('Unset or zero threshold uses the truth value.', 112, 638, 30);
    return;
  }
  const ix = Math.min(beat - 6, 2);
  const name =
    ix === 0 && cue(6, 'COPRO searches') ? 'COPRO' : ['BootstrapRS', 'MIPROv2', 'GEPA'][ix];
  title(name, 67, 118, 70);
  if (name === 'GEPA') {
    page(66, 175, 1468, 504);
    lab('METRIC ADAPTER', 104, 236);
    mono('gold, pred, trace, pred_name, pred_trace', 104, 313, 42);
    edge(105, 351, 1370);
    lab('RECORDED STEP', 106, 416);
    txt('“Deployment is covered.”', 106, 480, 42, C.ink, 'Serif');
    if (beat === 9) {
      lab('FEEDBACK', 796, 416);
      txt('“Check which target the approval names.”', 796, 480, 32);
      p.arrow(480, 550, 790, 550);
      txt('Propose an instruction', 799, 570, 34);
      txt('Evaluate the revision on development cases.', 105, 636, 30, C.teal);
    } else txt('Identify the predictor that made the unsupported claim.', 105, 613, 32);
  } else {
    const blocks =
      name === 'BootstrapRS'
        ? [
            ['Demo set 1', 'Rollback'],
            ['Demo set 2', 'Rollback + abstention'],
          ]
        : name === 'COPRO'
          ? [
              ['Instruction', 'Check action and target'],
              ['Output prefix', 'Route:'],
            ]
          : [
              ['Instruction', 'Check action and target'],
              ['Demo set', 'Rollback + abstention'],
            ];
    blocks.forEach(([field, v], i) => {
      const x = 70 + 745 * i;
      page(x, 215, 695, 344);
      lab(field, x + 37, 287);
      title(v, x + 37, 401, 44, C.ink);
    });
    txt(
      name === 'BootstrapRS'
        ? 'Evaluate different subsets on development cases.'
        : name === 'COPRO'
          ? 'Use earlier scores to propose new wording. trainset supplies evaluation cases.'
          : 'Optuna TPE samples joint instruction and demonstration choices.',
      73,
      690,
      34,
      C.ivory,
    );
  }
}

export function configure(p) {
  const { beat, cue, title, lab, mono, txt, page, rect, line, edge } = p;
  p.background();
  const batchSetting = 'minibatch=' + (manualSearch.minibatch ? 'True' : 'False');
  if (beat <= 2) {
    title('Manual MIPROv2 search', 65, 112);
    page(70, 191, 1457, 467);
    lab('CONSTRUCTOR', 111, 267);
    mono('auto=None, num_candidates=4', 433, 267, 38);
    edge(111, 307, 1370);
    lab('COMPILE', 111, 391);
    if (beat === 1 && cue(1, 'Leave the trial count out')) {
      mono(batchSetting, 433, 391, 39);
      mono('num_trials missing', 433, 465, 35, C.rust);
      if (p.end(1)) p.stamp('REJECT', 1137, 407, 255, C.rust);
    } else mono('num_trials=' + manualSearch.num_trials + ', ' + batchSetting, 433, 391, 39);
    if (beat === 2) {
      lab('INSTRUCTION-ONLY CANDIDATES', 112, 474);
      mono('student demos: 0', 112, 539);
      mono('both demo limits: 0', 783, 539);
      txt('Existing demos survive copying. Start with empty slots.', 112, 602, 33);
      txt('Proposer and task model may share a configuration.', 75, 763, 35, C.ivory);
    } else txt('Manual trials require a count at compile time.', 113, 551, 36);
    return;
  }
  if (beat <= 4) {
    title('One complete program per square', 66, 103);
    const gx = 247,
      gy = 244,
      sz = 74,
      lit = !!cue(4, 'Twelve trials');
    lab('PREDICTOR 1', gx, 162, C.mint);
    lab('PREDICTOR 2', 57, 211, C.mint, 21);
    choices.forEach((choice, i) => {
      mono(choice, gx + i * sz + 32, 221, 28, C.ivory, 'center');
      mono(choice, gx - 22, gy + i * sz + 46, 28, C.ivory, 'right');
      choices.forEach((_, j) => {
        const index = i * 6 + j,
          selected = lit ? samples.includes(index) : index === 14 && cue(3, 'Pick a column');
        rect(gx + j * sz, gy + i * sz, sz - 5, sz - 5, selected ? C.yellow : '#506f73');
        if (selected) p.dot(gx + j * sz + 34, gy + i * sz + 34, 8, C.ink);
      });
    });
    lab('PER PREDICTOR', 819, 255, C.mint);
    txt('3 instructions', 816, 331, 51, C.ivory, 'Serif');
    txt('× 2 demo sets', 816, 404, 51, C.ivory, 'Serif');
    if (cue(3, 'and six for the second')) mono('6 choices on each axis', 819, 489, 35, C.ivory);
    if (cue(4, 'Twelve trials')) {
      mono(choices.length ** 2 + ' programs', 819, 601, 52, C.yellow);
      txt(samples.length + ' sampled in this example', 819, 663, 30, C.ivory);
      txt('Score = mean across validation cases', 819, 727, 29, C.mint);
    }
    return;
  }
  title('Ten requests, in list order', 66, 111);
  const moved = !!cue(6, 'give MIPRO that split');
  const valCount = validationCount(moved);
  const trainCount = listSize - valCount;
  for (let i = 0; i < listSize; i++) {
    const x = 65 + i * 148;
    page(x, 259, 131, 169, i < trainCount ? '#cce2d0' : C.ivory);
    mono(i + 1, x + 65, 335, 45, C.ink, 'center');
    if (i === 1 || i === 2) lab('4412', x + 33, 393, C.rust, 27);
  }
  const cut = 65 + 148 * trainCount - 8;
  line(cut, 229, cut, 460, C.orange, 5);
  lab('TRAIN  /  ' + trainCount, 66, 494, C.mint);
  lab('VALIDATION  /  ' + valCount, cut + 29, 494, C.ivory);
  if (cue(6, 'With minibatching off'))
    mono(batchSetting + '   /   ' + valCount + ' cases per trial', cut + 29, 550, 29, C.mint);
  txt('2   Roll back the tests.', 75, 603, 36, C.ivory, 'Serif');
  txt('3   Undo the test release.', 75, 672, 36, C.ivory, 'Serif');
  txt(
    moved ? 'Explicit split keeps approval-4412 together.' : 'Both wordings cite approval-4412.',
    721,
    649,
    33,
    C.yellow,
  );
  if (cue(6, 'Reserve fresh policies'))
    txt('Reserve unseen policy families for the final test.', 77, 778, 35, C.mint);
}
const selectedCell = { row: 19, col: 23 };
function grid(p, baseline) {
  const gx = 76,
    gy = 150,
    dx = 14.5,
    dy = 13;
  for (let row = 0; row < fullSearch.trials + Number(baseline); row++) {
    for (let col = 0; col < fullSearch.cases; col++) {
      const color =
        row === fullSearch.trials
          ? C.yellow
          : row === selectedCell.row && col === selectedCell.col
            ? C.paper
            : '#79aaa7';
      p.rect(gx + col * dx, gy + row * dy, dx - 3, dy - 3, color);
    }
  }
  return { x: gx + selectedCell.col * dx, y: gy + selectedCell.row * dy, w: dx - 3, h: dy - 3 };
}
export function budget(p) {
  const { beat, cue, title, lab, txt, mono, rect, page, line } = p;
  p.background();
  if (beat === 1 || beat === 2) {
    const base = !!cue(1, 'the default program');
    const zoom = smooth(cue(2, 'Zoom into one square', 1.3));
    title('Full evaluations', 67, 91, 51);
    const cell = grid(p, base);
    if (zoom === 0) {
      lab(fullSearch.trials + ' TRIALS  ×  ' + fullSearch.cases + ' CASES', 72, 746, C.mint);
      lab('CANDIDATE EXECUTIONS', 912, 208, C.mint);
      if (cue(1, 'MIPRO also'))
        mono(format(fullSearch.trials * fullSearch.cases), 910, 281, 72, C.ivory);
      if (base) {
        lab('DEFAULT PROGRAM', 912, 389, C.yellow);
        mono('+ ' + fullSearch.cases, 910, 460, 65, C.ivory);
      }
      if (cue(1, 'Minibatches')) {
        p.edge(910, 531, 534, C.sage);
        mono(format(large.executions), 910, 627, 80, C.ivory);
      }
    }
    if (zoom > 0) {
      const x = mix(cell.x, 48, zoom),
        y = mix(cell.y, 118, zoom);
      const w = mix(cell.w, 1502, zoom),
        h = mix(cell.h, 654, zoom);
      page(x, y, w, h);
      p.ctx.save();
      p.ctx.translate(x, y);
      p.ctx.scale(w / 1502, h / 654);
      p.ctx.translate(-48, -118);
      if (zoom > 0.75) {
        lab('ONE EXECUTION', 95, 187);
        mono(
          'trial ' + (selectedCell.row + 1) + '  /  case ' + (selectedCell.col + 1),
          473,
          187,
          30,
        );
      }
      p.edge(96, 219, 1398);
      const starts = [
        cue(2, 'The first predictor', 0.65),
        cue(2, 'The second predictor', 0.65),
        cue(2, 'A model-backed judge', 0.65),
      ];
      roles.forEach((role, i) => {
        const x = 143 + 466 * i,
          y = 389;
        p.dot(x + 76, y, 55, null, C.rule);
        if (i < 2) line(x + 132, y, x + 466 + 17, y, C.rule, 3);
        if (starts[i] === 1) {
          p.dot(x + 76, y, 50, i === 2 ? '#d5b478' : '#abcdbd');
          mono(i + 1, x + 76, y + 16, 46, C.ink, 'center');
          txt(role, x, y + 117, 38, C.ink, 'Serif');
          lab(['Check evidence', 'Propose route', 'Score reply'][i], x, y + 167);
          if (i < 2 && starts[i + 1] > 0) p.arrow(x + 136, y, x + 136 + 351 * starts[i + 1], y);
        }
      });
      if (cue(2, 'Trace those three')) {
        mono(
          format(large.executions) + ' executions × ' + roles.length + ' requests each',
          100,
          672,
          45,
        );
        txt('One answer per call   /   cache off   /   no retries', 102, 732, 26, C.teal);
      }
      p.ctx.restore();
    }
    return;
  }
  if (beat === 3) {
    const retry = !!cue(3, 'The total rises'),
      reset = !!cue(3, 'Start again'),
      hit = !reset && !!cue(3, 'The total drops');
    const delta = retry ? 1 : hit ? -1 : 0;
    title('Request ledger', 66, 104);
    page(67, 164, 1463, 579);
    lab('EXECUTIONS', 108, 231);
    lab('REQUESTS PER EXECUTION', 541, 231);
    mono(format(large.executions), 109, 334, 75);
    mono('× ' + large.roles, 542, 334, 75);
    p.edge(109, 377, 1365);
    txt('One answer per call', 110, 437, 29);
    txt(
      retry
        ? 'One extra attempt  (+1)'
        : hit
          ? 'One cache hit  (−1)'
          : 'Cache off   /   no retries',
      110,
      499,
      34,
      delta ? C.rust : C.teal,
    );
    if (cue(3, 'Teacher and proposal')) {
      lab('MODEL REQUESTS', 883, 444);
      mono(format(large.requests + delta), 879, 574, 94);
    }
    txt('Teacher and proposer work is additional.', 111, 669, 34, C.ink, 'Serif');
    return;
  }
  title('The cost of a longer prompt', 64, 106);
  page(67, 180, 1466, 512);
  lab('LOGICAL INPUT', 109, 243);
  if (beat === 4) {
    txt('Existing prompt', 111, 358, 41, C.ink, 'Serif');
    rect(461, 302, 427, 72, C.blue);
    if (cue(4, 'longer demonstrations')) {
      rect(888, 302, 354, 72, C.teal);
      lab('Added demos', 917, 350, C.paper, 26);
    }
    txt('The host enforces spend and latency caps.', 111, 515, 40);
    txt('A timed-out attempt can still be billed.', 111, 596, 31);
  } else {
    mono('+' + format(tokenLoad.added), 108, 362, 77);
    txt('tokens per request', 111, 419, 33);
    mono('× ' + tokenLoad.rps, 619, 362, 77);
    txt('requests per second', 625, 419, 33);
    if (cue(5, 'To price it')) {
      p.edge(109, 472, 1351);
      mono('+' + format(tokenLoad.added * tokenLoad.rps), 108, 587, 74, C.teal);
      txt('logical input tokens / second', 642, 580, 38);
    }
    txt(
      beat === 6
        ? 'Measure time to first token on the serving system.'
        : 'Price actual input, cached input and output by role.',
      81,
      771,
      37,
      C.ivory,
      'Serif',
    );
  }
}
