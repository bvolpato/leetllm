import { C, mix, smooth } from './studio.mjs';
import { envelope } from './envelope.mjs';
import {
  zip,
  copies,
  grade,
  rollback,
  deploy,
  wrong,
  pairScore,
  rows,
  demoLabels,
  boot,
  accepted,
  paymentCase,
  billingCase,
} from './examples.mjs';

export function postal(p) {
  const { ctx, cue, rect, lab, mono, txt, page, line, dot, title } = p;
  p.background();
  const showB = cue(1, 'Prompt B asks', 0.85);
  const exact = cue(2, 'switch to exact text');
  const scored = exact ? cue(3, 'Look straight down') : cue(2, 'The missing zero');
  const values = grade(exact);
  const x = 145;
  const comeOut = smooth(Math.min(1, p.clock.seconds / 1.5));
  [1, 0].forEach((i) => {
    if (i && !showB) return;
    const y = i ? mix(276, 587, smooth(showB)) : mix(282, 408, comeOut);
    page(x, y, 932, 154);
    rect(x, y, 86, 154, i ? C.blue : C.rust);
    txt(i ? 'B' : 'A', x + 43, y + 96, 60, C.ivory, 'Serif', 'center');
    lab(i ? 'Copy all five digits' : 'Return a number', x + 112, y + 42, C.ink, 27);
    const digits = copies[i].padStart(5, ' ');
    for (let k = 0; k < 5; k++) {
      const dx = x + (145 + k * 68) * 1.15;
      mono(digits[k], dx, y + 124, 72, C.ink, 'center');
      line(dx - 32, y + 134, dx + 32, y + 134, C.rule, 3);
    }
    if (scored) {
      const ink = values[i] ? C.teal : C.rust;
      dot(x + 793, y + 77, 55, null, ink);
      mono(values[i], x + 793, y + 86, 48, ink, 'center');
      txt('point', x + 793, y + 112, 21, ink, 'Sans', 'center');
    }
  });
  ctx.save();
  ctx.translate(x, 53);
  ctx.scale(1.15, 1.15);
  envelope(ctx, { city: 'Cambridge, MA', zip });
  ctx.restore();
  if (cue(1, 'The grader reads')) {
    line(1134, 460, 1494, 460, C.muted);
    lab('GRADING RULE', 1134, 436, C.mint);
    title(exact ? 'Exact text' : 'Numeric', 1134, 530, 52);
    txt(exact ? 'Compare characters' : 'Compare values', 1134, 582, 30, C.ivory);
    if (!scored) txt('Award each point', 1134, 682, 33, C.yellow, 'Serif');
  }
}

// The two lines on each slip correspond to the same action and target fields.
export function permits(
  p,
  { billing = false, deploying = true, x = 64, y = 70, w = 700, heading = 'Admitted record' },
) {
  const { page, rect, lab, mono, txt, edge } = p;
  const policy = billing ? billingCase : paymentCase;
  const request = deploying ? policy.requested : policy.allowed;
  page(x, y, w, 247, C.ivory);
  rect(x, y, 12, 247, C.teal);
  lab(heading, x + 36, y + 44);
  mono(policy.recordId, x + 36, y + 98, 41);
  edge(x + 36, y + 122, w - 72);
  lab('PERMITS', x + 36, y + 178);
  txt(policy.allowed[0], x + 175, y + 178, 37);
  mono(policy.allowed[1], x + 175, y + 222, 34);
  const ry = y + 278;
  page(x, ry, w, 161, '#dce5df');
  rect(x, ry, 12, 161, C.blue);
  lab('ENGINEER ASKS', x + 36, ry + 45, C.blue);
  txt(request[0], x + 36, ry + 107, 40);
  mono(request[1], x + 235, ry + 107, 34);
}
export function pair(p, x, y, w, name, value, color = C.teal) {
  p.lab(name, x, y, color, 24);
  p.edge(x, y + 15, w);
  p.mono(value?.route ?? '?', x, y + 68, 38, C.ink);
  p.mono(value ? value.recordId || '""' : '?', x + w * 0.4, y + 68, 32, C.ink);
}
export function program(p) {
  const { cue, beat, page, lab, title, txt, mono, edge } = p;
  p.background();
  permits(p, {});
  page(809, 70, 724, 594);
  lab('DeployAnswerer', 847, 124);
  title('RouteAnswer', 847, 204, 55, C.ink);
  edge(847, 239, 640);
  lab('INPUTS', 847, 291);
  mono('question, evidence', 847, 348, 34);
  lab('OUTPUT FIELDS', 847, 430);
  mono('route', 847, 474, 30);
  mono('record_id', 1127, 474, 30);
  const known = p.end(1);
  mono(known ? deploy.route : '?', 847, 548, 40);
  mono(known ? '""' : '?', 1127, 548, 40);
  if (known) lab('Reviewed label', 847, 615);
  if (beat === 2) {
    lab('INSTRUCTION', 84, 597, C.mint);
    txt('Cite a record that supports the request.', 84, 646, 32, C.ivory);
    if (cue(2, 'A demonstration')) {
      lab('WORKED EXAMPLE', 84, 715, C.mint);
      mono('rollback → SERVE / approval-4412', 84, 762, 31, C.ivory);
    }
    if (cue(2, 'The host still')) txt('Host checks authorization', 849, 741, 34, C.yellow, 'Serif');
  }
}
export function metric(p) {
  const { cue, end, page, lab, stamp, txt } = p;
  const fixed = cue(2, 'Both fields now match');
  const change = cue(2, 'Now keep the reply');
  const gold = change ? deploy : rollback,
    reply = fixed ? rollback : wrong;
  const score = pairScore(gold, reply);
  const known = change ? end(2) : fixed ? cue(2, 'Leave that point') : cue(2, 'The route agrees');
  p.background();
  permits(p, { deploying: !!change, w: 655 });
  page(765, 70, 774, 639);
  lab('EXACT PAIR METRIC', 809, 128);
  p.lab('ROUTE', 809, 208, C.blue);
  p.lab('RECORD ID', 1100, 208, C.blue);
  pair(p, 809, 276, 680, 'Reviewed label', gold);
  pair(p, 809, 428, 680, 'Assistant’s reply', reply, C.blue);
  if (known) stamp(score + ' / 1', 809, 591, 192, score ? C.teal : C.rust);
  else txt('Score?', 809, 633, 42, C.ink, 'Serif');
  if (cue(3, 'several valid records'))
    txt('Multiple valid IDs? Score against the reviewed set.', 81, 740, 36, C.ivory, 'Serif');
}
export function splits(p) {
  const { cue, lab, title, txt, mono, rect, page, poly } = p;
  const newCase = cue(2, 'Look at the request', 0.7),
    move = smooth(cue(3, 'Keep it in training', 1.2));
  p.background();
  title('One home for each policy family', 63, 109);
  const files = ['Training', 'Development', 'Held-out test'];
  const subtitles = ['Build demonstrations', 'Choose a prompt', 'Test a frozen choice'];
  const folderX = (i) => 65 + i * 499;
  files.forEach((name, i) => {
    const x = folderX(i),
      y = 222;
    poly(
      [
        [x, y + 30],
        [x, y],
        [x + 247, y],
        [x + 279, y + 30],
        [x + 449, y + 30],
        [x + 449, 728],
        [x, 728],
      ],
      '#ab8561',
    );
    page(x + 16, y + 53, 416, 261, C.paper);
    lab('POLICY FAMILY', x + 36, y + 100);
    mono(rows[[0, 2, 3][i]].family, x + 36, y + 146, 35);
    mono(i === 0 ? 'req-001  /  req-002' : rows[i + 1].id, x + 36, y + 193, 26);
    rect(x, 559, 449, 166, '#dbbc82');
    title(name, x + 22, 621, 44, C.ink);
    txt(subtitles[i], x + 22, 677, 27);
  });
  if (newCase) {
    const x = mix(folderX(2) + 18, folderX(0) + 18, move);
    const y = mix(427, 437, newCase) - 300 * Math.sin(Math.PI * move);
    page(x, y, 412, 118, '#fae2ae');
    lab(rows.at(-1).id, x + 18, y + 40, C.rust);
    mono(rows.at(-1).family, x + 18, y + 92, 32);
  }
  if (cue(3, 'different family IDs'))
    txt('Different IDs can still describe the same policy.', 64, 811, 35, C.ivory, 'Serif');
}
function slot(p, x, y, w, label, datum) {
  p.rect(x, y, w, 89, datum ? C.ivory : '#29444b');
  p.line(x, y + 88, x + w, y + 88, datum ? C.rule : C.sage, 2);
  p.lab(label, x + 18, y + 31, datum ? C.teal : C.sage, 20);
  if (datum) p.mono(datum.route + '  ' + (datum.recordId || '""'), x + 18, y + 69, 29, C.ink);
}
export function labeled(p) {
  const { beat, cue, title, mono, txt, lab } = p;
  p.background();
  if (beat <= 2) {
    permits(p, { deploying: false, w: 700 });
    p.page(816, 70, 703, 553);
    lab('DummyLM  /  DSPy 3.4.0', 851, 124);
    pair(p, 851, 221, 625, 'Local model proposal', rollback);
    if (cue(1, 'Chain of Thought')) {
      lab('ChainOfThought adds a field', 851, 374);
      mono('reasoning', 851, 440, 40);
      if (beat === 2) txt('“The approval covers the rollback.”', 851, 523, 32);
    }
    if (cue(1, 'The host checks'))
      txt(
        'Check action, target and ID against the admitted record.',
        68,
        740,
        37,
        C.ivory,
        'Serif',
      );
    return;
  }
  title('LabeledFewShot', 69, 104);
  const attached = smooth(cue(3, 'The copy gets two', 0.9));
  const added = attached === 1;
  [0, 1].forEach((i) => {
    const x = 74 + i * 743,
      demos = i && added ? demoLabels : [];
    p.page(x, 177, 693, 464, i ? '#dce8d9' : C.paper);
    lab(i ? 'COMPILED COPY' : 'ORIGINAL STUDENT', x + 36, 235);
    mono(
      i && attached > 0 && !added ? 'Copying labels…' : demos.length + ' demonstrations',
      x + 36,
      315,
      39,
    );
    slot(p, x + 33, 360, 628, demos.length ? 'Rollback' : 'Empty', demos[0]);
    slot(p, x + 33, 467, 628, demos.length ? 'Deployment' : 'Empty', demos[1]);
  });
  if (attached > 0 && attached < 1) {
    const y = mix(682, 467, attached);
    slot(p, 850, y, 628, 'Training label', demoLabels[1]);
    slot(p, 850, y - 107, 628, 'Training label', demoLabels[0]);
  }
  if (beat === 4) {
    mono('0 model calls', 79, 755, 43, C.mint);
    mono('0 scores computed', 824, 755, 43, C.mint);
  }
}
export function bootstrap(p) {
  const { cue, beat, lab, mono, txt, page, stamp } = p;
  const second = beat >= 3;
  const trace = boot[Number(second)];
  const scored = second ? cue(4, 'so its trace is discarded') : cue(1, 'At a threshold');
  const kept = accepted(
    boot.map((t) => t.score),
    1,
  );
  p.background();
  p.title('Teacher trace', 64, 103);
  page(64, 164, 730, 506);
  lab('TRAINING QUESTION', 102, 221);
  txt(
    second ? 'Deploy payment-service?' : 'Roll back payment-tests?',
    102,
    286,
    43,
    C.ink,
    'Serif',
  );
  pair(p, 102, 360, 646, 'Reviewed label', trace.gold);
  pair(p, 102, 510, 646, 'Teacher reply', trace.reply, C.blue);
  lab('ACCEPT IF SCORE ≥ 1', 861, 211, C.mint);
  if (scored) mono(trace.score + ' / 1', 862, 286, 56, C.ivory);
  if (second && scored && !kept[1]) stamp('DISCARD', 1133, 230, 236, C.orange);
  const inserted = cue(2, 'accepted trace', 0.8);
  lab('COMPILED PREDICTOR', 863, 407, C.mint);
  slot(
    p,
    862,
    442,
    650,
    inserted === 1 ? 'Rollback  /  accepted trace' : 'Empty',
    inserted === 1 && kept[0] ? boot[0].reply : null,
  );
  slot(p, 862, 554, 650, 'Empty');
  if (inserted > 0 && inserted < 1) {
    const t = smooth(inserted);
    slot(p, mix(102, 862, t), mix(533, 442, t), 650, 'Copy predictor step', boot[0].reply);
  }
  if (cue(4, 'Two teacher replies'))
    txt('2 teacher replies   /   1 demo in copy   /   0 in student', 69, 759, 39, C.ivory, 'Serif');
}
